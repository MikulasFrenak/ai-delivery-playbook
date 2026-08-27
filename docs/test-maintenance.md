# Test Maintenance — Self-Healing Selectors & Flakiness Reduction

A testing-infrastructure extension example, per this playbook's own framing: the structure (skills → workflows → lifecycle) is stack-agnostic, and this doc is what filling that structure in for E2E/UI test maintenance looks like, the same way [`docs/sla-framework.md`](./sla-framework.md) is for reliability. It plugs into [`lifecycle/verification.md`](../lifecycle/verification.md) and extends `AGENTS.md`'s own "Testing Infrastructure" template section.

This is the theory, vocabulary, and citations. The scaffolding process described below is also implemented as a runnable skill — [`/self-healing-selectors`](../skills/self-healing-selectors.md) — that walks the same steps against a real target repo rather than leaving it as prose someone has to remember to apply.

---

## Size the problem correctly first

Selector breakage is the visible, easy-to-demo part of test maintenance, but it isn't the majority of it. Industry analyses of large test suites put the breakdown roughly as:

- **~28%** of flaky-test failures trace to DOM/selector changes (brittle CSS paths, renamed classes, restructured containers)
- **~45%** trace to async/timing issues (race conditions, elements present but not yet interactable)
- **~20%** trace to concurrency/resource contention
- the remainder splits across test-order dependencies, environment differences, and non-deterministic logic

A "self-healing" story that only fixes selectors is solving the smaller half of the problem. Selector healing and timing healing are genuinely separate mechanisms (see below) — naming that split explicitly, rather than folding everything into one "AI fixes flaky tests" pitch, is itself a useful signal that the design accounts for what AI is and isn't good at here.

## Selector healing — the architecture

The approach doesn't depend on Playwright, Cypress, or Selenium specifically — it depends on being able to (a) capture a lightweight description of an element when a locator resolves successfully, and (b) compare that against a fresh DOM snapshot when it fails to resolve. Every mainstream browser-automation tool can do both.

1. **Fingerprint on the last successful run.** Capture role, visible text, `aria-label`, tag name, a short structural path, and 1–2 sibling text snippets — not the whole DOM. Role and visible text tend to survive a redesign; a raw CSS path or `nth-child` index is usually the first thing to break, which is exactly why relying on it alone is fragile.
2. **Detect the failure** (timeout / strict-mode violation / element-not-found) and intercept before it propagates to a red test.
3. **Generate candidates** from the current DOM that share enough surface area with the stored fingerprint to be plausible matches.
4. **Score candidates.** Either an LLM call (reasons about *why* two elements are probably the same thing after a change, not just surface similarity) or a deterministic tree-diff algorithm — both are real, shipping approaches (see Prior art below), and a project can pick either or run both and compare.
5. **Threshold decision — the part that makes this trustworthy, not just functional:**
   - **High confidence:** auto-patch the locator, re-run just that one assertion to confirm, record the change with a clear audit trail (a diff, a PR comment, a log entry) — never silently on a shared branch with no trace.
   - **Low/medium confidence:** don't touch the test. Report the top candidates and the reasoning to a human instead. A test that stays red is a known problem; a test that silently starts checking the wrong element is an unknown one — worse than the flaky test it replaced, because it hides a real regression instead of surfacing one.
6. **CI integration.** A failed E2E test gets one pass through the healer before the pipeline is marked red. Only if the healer can't find a confident match does the build actually fail — the goal is a pipeline that fails on product regressions, not on a `<div>` becoming a `<section>`.

## Prior art (this isn't a new idea)

- **[Healenium](https://github.com/healenium/healenium)** (open-source, Selenium/Java) — the reference production implementation. On a `NoSuchElementException`, it retrieves a stored DOM tree/attributes (persisted to PostgreSQL) and compares it to the current page via a weighted Longest Common Subsequence algorithm, generating ranked candidate locators with confidence scores. Proves the architecture holds up in production, not just in theory.
- **[Healwright](https://libraries.io/npm/healwright)** (open-source, npm) — the closest existing match to the Playwright + TypeScript shape below: wraps a Playwright page object, healing runs through an LLM (Anthropic Claude, OpenAI, Gemini, or local via Ollama). Confirms "Playwright + Node/TypeScript + LLM self-healing" is an already-functioning combination, not a hypothesis.

An LLM-scored approach tends to do better than pure tree-diffing on the "renamed the class but it's obviously the same button" case — the model can reason about intent, not just structural overlap — while a deterministic approach (no API key, no per-call cost or latency) is the better fit when a project can't or won't send DOM content to an external model.

## Timing healing (the larger, separate problem)

Async timing issues — an element existing in the DOM but not yet interactable, an animation delaying clickability, a network call that hasn't resolved — are the dominant cause of flaky failures per the breakdown above, and reports across QA organizations put a large share of automation engineers' maintenance time into exactly this category rather than new coverage.

The fix isn't "add longer sleeps" — that makes suites slower without making them correct, and it's the single most common bad habit in hand-maintained E2E suites. The healthier version:

- **Adaptive polling/backoff tied to real signals** (DOM readiness, network idle, a specific response resolving) instead of fixed `waitForTimeout` calls. Playwright already auto-waits for actionability on most interactions, so the practical opportunity is smaller for a Playwright-first codebase — but Cypress and Selenium suites lean on explicit sleeps far more often.
- **Retry-then-classify, not retry-then-ignore.** When a retry with a longer/adaptive wait makes a failing test pass, that's a signal: log it as a timing-flakiness case with a suggested concrete fix (e.g. replace `page.waitForTimeout(2000)` with `page.waitForResponse(...)` or `page.waitForSelector(..., { state: "visible" })`), the same audit-trail discipline a healed selector gets. Silently retrying and moving on hides the same signal that silently patching a selector at low confidence would.

## Test-suite optimization — the lever that needs no LLM at all

Worth naming directly, including in an AI-adoption conversation: not every maintenance-burden problem needs an agent, and knowing which ones don't is part of doing this well.

- **Quarantine, don't ignore.** [Spotify's documented approach](https://engineering.atspotify.com/2019/11/test-flakiness-methods-for-identifying-and-dealing-with-flaky-tests): move flaky tests into a separate suite that still runs and still gets tracked, but can't block merges — each quarantined test gets an assigned owner and a fix deadline. Spotify took their flaky-test rate from 4.5% to 0.4% in three months this way. The owner+deadline part is the actual mechanism; a quarantine list with no accountability just becomes a graveyard.
- **Test impact analysis.** Map changed files/modules to the tests that actually exercise them, and only run that subset on a given push/PR, running the full suite on a schedule (nightly, pre-release) instead of on every commit. This targets CI runtime rather than flakiness itself — a different lever, but the same underlying goal: make a red build mean something real.

## What the threshold + human-review split demonstrates

Worth calling out explicitly, including when pitching this externally: it shows the design accounts for the model being wrong, rather than assuming AI-assisted testing means removing human judgment from the loop. That's usually the actual concern a team has about "AI in our test suite" — not whether it can find a button, but whether it knows when *not* to guess. Same "agents draft, humans decide" property this playbook holds everywhere else (see `disable-model-invocation: true` on every skill, and the threshold/audit-trail rule above).

---

## Sources

- [Healenium (GitHub)](https://github.com/healenium/healenium)
- [Healenium — Self-Healing Library for Selenium Test Automation](https://medium.com/geekculture/healenium-self-healing-library-for-selenium-test-automation-26c2358629c5)
- [Healwright (Libraries.io / npm)](https://libraries.io/npm/healwright)
- [Spotify Engineering — Test Flakiness: Methods for Identifying and Dealing with Flaky Tests](https://engineering.atspotify.com/2019/11/test-flakiness-methods-for-identifying-and-dealing-with-flaky-tests)
