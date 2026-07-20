# AI Delivery Playbook — Agent Guide

This file serves two purposes:

1. It's the agent guide for working **in this repo** (the playbook itself) — for any AI coding tool (Claude Code, Codex, Copilot, Cursor, Aider, Ollama-driven agents, etc).
2. It's a **template** of cross-cutting conventions to copy into your own project's `AGENTS.md`. Sections marked *Example* show a real pattern distilled from a production adoption — replace the specifics with your own stack, tooling, and package names.

This playbook is built with **frontend and mobile delivery** in mind, but designed to be technology- and tool-agnostic and extensible — that's why the examples throughout lean on components, views, screens, and design tokens rather than backend services, even though the underlying structure (skills → workflows → lifecycle) generalizes to any stack. Extending it to a backend or infra skill (e.g. `verify-mobile`, `verify-ios`, `deploy-kubernetes`) means following the same shape, not inventing a new one.

Every skill below assumes an `AGENTS.md` exists at the repo root and, for monorepos, at each package root — read these before exploring code or writing a plan. Keep this file (and per-package equivalents) accurate for that reason, not just as documentation.

If you're using Claude Code specifically, also read `CLAUDE.md` — it's a thin file that imports this one and adds Claude Code-only mechanics (skill invocation, `.claude/settings.json` handling) on top.

---

## Repo Layout

| Path | Level | Purpose |
|---|---|---|
| `skills/` | 1 — Skills | One `<name>.md` per skill. Written as Claude Code skills today (invoked as `/<name>`) — see "Skills" below for how other tools use the same content |
| `workflows/` | 2 — Workflows | Multi-skill sequences for a delivery scenario |
| `lifecycle/` | 3 — Software Delivery Lifecycle | Stage-level docs (Requirements → Release) |
| `examples/` | 4 — Worked Examples | Real traces of a workflow run end to end |
| `docs/` | Reference | Setup and tooling docs (e.g. `mcp-servers.md`, `vocabulary.md`, `future-considerations.md`) |

See [`architecture.md`](./architecture.md) for how these levels relate.

---

## Package Map *(template)*

For a monorepo, list every package that has its own `AGENTS.md` with package-specific overrides and gotchas — always read it before touching code there. Packages **without** an `AGENTS.md` follow the root conventions without exception.

| Package | AGENTS.md | Notes |
|---|---|---|
| `apps/web` | [AGENTS.md](../apps/web/AGENTS.md) | e.g. API client wiring, state pattern, legacy migration status |
| `apps/mobile` | [AGENTS.md](../apps/mobile/AGENTS.md) | e.g. React Native — native module usage, platform-specific (`.ios.tsx`/`.android.tsx`) file conventions |
| `packages/<name>` | [AGENTS.md](../packages/<name>/AGENTS.md) | e.g. shared component library, design tokens, framework constraints |

For active-development packages worth flagging separately (new routes, in-flight migrations), keep a second small table with the ticket/epic that introduced them.

---

## Branching & Commits *(template)*

```
feature/TICKET-ID/short-kebab-desc   # new functionality
bugfix/TICKET-ID/short-kebab-desc    # broken behaviour / failing tests
chore/TICKET-ID/short-kebab-desc     # ticketed, non-feature work: deps, refactor, config
trivial/short-kebab-desc             # tooling, docs, config (no ticket)
```

**One working branch until merge.** Fixes and follow-ups to work that hasn't merged yet land on the *same* branch as new commits — don't open a new branch per fix. Parallel branches over the same files just manufacture merge conflicts. A new branch starts only for independent work, after the previous one merges.

`chore/` vs `trivial/`: both cover non-feature, non-bugfix work — the difference is whether it's tracked by a ticket. If it has a ticket (matches the `create-task` skill's Chore template), it's `chore/`. If it's small enough that filing a ticket would be overhead, it's `trivial/`.

Commit format:

```
TICKET-ID - Summary (imperative, max 72 chars)   # feature/, bugfix/, or chore/ branches
TRIVIAL - Summary (imperative, max 72 chars)     # trivial/ branches

- What changed and why
- Non-obvious decisions
- Files affected if not obvious
```

Adapt to your own team's actual policy, but decide and document explicitly:
- Which branch(es) can never be committed to directly
- Whether commits carry a `Co-Authored-By` trailer or not
- Whether `AGENTS.md`/`CLAUDE.md`-only changes go on their own branch type (keeps doc updates decoupled from long-lived feature branches)
- PR merge strategy (squash vs merge commit) and whether the source branch auto-deletes

---

## Testing Infrastructure *(template)*

Document your actual test runner setup here (unit / component / e2e, and where each runs — locally vs CI).

**Example — cross-process bridge quirk:** if your CT setup proxies through a separate process (e.g. a remote-browser grid), callback counters incremented in Node-side test code may never reflect what happened in the real browser, because the runner's dispatch bridge and the test framework's own `mount` populate different arrays. Symptom: `expect.poll(() => callCount)` always times out in CI but the interaction visibly works.

Fix pattern — track the interaction from the browser side instead of a Node-side closure variable:

```tsx
test('calls onAction when button is clicked', async ({ mount, page }) => {
  await mount(<Component onAction={() => {}} />)

  await page.evaluate((selector) => {
    const w = window as unknown as Record<string, unknown>
    w.__actionClickFired = false
    document.addEventListener(
      'click',
      (e) => {
        if ((e.target as Element).closest(`[data-testid="${selector}"]`)) {
          w.__actionClickFired = true
        }
      },
      { capture: true, once: true }
    )
  }, 'btn-action')

  await page.getByTestId('btn-action').click()
  await page.waitForFunction('window.__actionClickFired === true')
})
```

`page.waitForFunction` with a string polls entirely in-browser — no Node-side bridge involved. `capture: true` fires before framework event delegation.

**Example — state-store hydration quirk:** if your CT test code runs in Node and your store is a client-side singleton (e.g. Zustand), calling the store's `setState` from test code mutates a Node-side module instance the mounted component never sees. Update the store from inside `page.evaluate` after mounting instead, using the store's own actions rather than raw `setState`:

```tsx
await mount(<MyComponent prop={value} />)

await page.evaluate(() => {
  const w = window as unknown as { __appStore: { getState: () => { setFlag: (v: boolean) => void } } }
  w.__appStore.getState().setFlag(false)
})
```

Expose the store on `window` only from the CT harness entry point, not from production code.

**QA selectors:** pick one attribute convention (e.g. `data-testid`) and apply it consistently. Import selectors from a shared file rather than inlining strings, so a rename is a one-file change.

**Unit tests:** run pure-function/unit tests before component tests — they're faster and catch logic bugs without spinning up a browser.

**Test file placement:** a component-level spec lives next to its component; a view/integration spec lives next to the view and is reserved for concerns that span multiple components or need shared state. Don't consolidate everything into one giant spec file.

---

## Skills

A **Skill** is a single unit of engineering behavior — "analyze a story," "implement a ticket," "verify a change in the browser." This playbook documents each one in prose (in `workflows/*.md` and `lifecycle/*.md`), so any agent can follow it by reading the doc, regardless of tool. Agents running skills work **as part of the team**, not instead of it: humans and agents collaborate on the final result, and every workflow ends at a human checkpoint.

`skills/` is **Claude Code's implementation** of these skills — one `<name>.md` per skill, invoked with a slash command (`/analyze-story`, `/create-task`, etc). It's the concrete, tested implementation this repo ships today, not the only possible one. The same skill could equally be a Cursor rule, a Codex custom prompt, an Aider convention, or just followed directly from the workflow/lifecycle prose by any agent (including a bare local model) that reads this file. If you adopt this playbook with a non-Claude tool, treat `skills/*.md` as a detailed reference implementation to translate into your tool's own mechanism — the *sequence and judgment calls* they encode are the reusable part, not the slash-command wrapper.

### MCP Invocation Policy

**Never call any MCP tool automatically.** MCP servers (issue tracker, design tool, code-quality scanner, feature-flag service, browser automation, observability, etc. — see [`docs/mcp-servers.md`](./docs/mcp-servers.md)) consume tokens and may trigger external side effects. Only invoke one when the user explicitly asks for it in the current message, or by running a skill whose own instructions document that MCP usage. Don't infer intent and call MCPs speculatively. This applies regardless of which tool is driving the agent — MCP is a cross-tool protocol, not Claude-specific.

### Skills in this playbook

| Skill | When to use |
|---|---|
| [`/analyze-story`](./skills/analyze-story.md) | Deep-analyze a Story ticket — Event Model diagram, FE/backend breakdown, splittability, create subtasks. Run this *before* `create-task` when starting from a Story |
| [`/create-task`](./skills/create-task.md) | Create `.tasks/TICKET-ID.md` from a ticket (or from one of `analyze-story`'s subtasks) — planning only, no code |
| [`/implement-task`](./skills/implement-task.md) | Full implementation flow for a ticket — reads the task file, design, implements, tests, docs, commit |
| [`/verify-browser`](./skills/verify-browser.md) | Verify a change in the live browser via Chrome DevTools MCP (web only — see the skill for the native-mobile gap) |
| [`/commit`](./skills/commit.md) | Generate a commit message from the current diff, run the quality gate, commit, and offer to create/update the PR/MR |
| [`/pr-update`](./skills/pr-update.md) | Append the last commit's changes as new rows to the open PR/MR description (GitHub, GitLab, Azure DevOps, Bitbucket) |
| [`/code-doc`](./skills/code-doc.md) | Create or update a `doc.md` for a component, module, or feature section after implementing or changing it |
| [`/public-repo-check`](./skills/public-repo-check.md) | Scan working tree + git history for secrets, UUIDs, and org-specific naming before pushing to a public remote |
| [`/generate-agents-md`](./skills/generate-agents-md.md) | Split a repo's `CLAUDE.md` into a tool-agnostic `AGENTS.md` + a thin Claude-only `CLAUDE.md` import shim, following this repo's own split |
| ... | Add your own following the same skill-doc pattern |

### Task file lifecycle

`.tasks/TICKET-ID.md` is a **living planning doc** — open with it, close by deleting it:

| State | Task file action |
|---|---|
| PR not open yet | Keep & update — ongoing work, file is active context |
| PR already open | Delete in the same commit — ticket is done |

The file's content is preserved in git history on the branch forever, so deleting it from the working tree loses nothing. Claude Code's [`/commit`](./skills/commit.md) skill enforces this automatically — it checks for an open PR/MR and stages the deletion if one exists, rather than relying on manual cleanup. Any other tool implementing the `commit` skill should follow the same rule.

### Design-tool skills

If your design tool exposes two MCP servers — one local/read (desktop app) and one remote/write (cloud, diagram/file generation) — keep that split explicit in your skill instructions, since read and write operations often need different auth and different tools. See the Figma example in [`docs/mcp-servers.md`](./docs/mcp-servers.md).

---

## Research Before Implementing

For any non-trivial task, don't start writing code immediately:

1. **Search the web** for current best practices, recent guides, and known pitfalls relevant to the problem — don't rely solely on training knowledge.
2. Identify **2–3 concrete approaches**. For each, write 1–2 sentences: what it is, its main trade-off, and when it fits.
3. State which approach you recommend and why, then compare it against this repo's own conventions and flag any conflicts.
4. **Wait for explicit go-ahead** before touching any code.

**An agent's own "verified" claim is not verification.** When an agent reports it confirmed a factual claim (a coordinate, a version number, a pricing figure) via web research, treat that as a first pass, not ground truth — a real case: an agent corrected a wrong geographic coordinate with high stated confidence, and the correction was itself wrong by several kilometers. Spot-check at least one fact from any research pass against an independent source yourself before trusting it broadly, especially before it propagates into other agents' work or gets treated as settled.

This applies to new features, architecture decisions, reviewer feedback, or anything that would meaningfully change existing behaviour. (The `create-task` and `analyze-story` skills already bake this step into their own workflow — this rule is what they're following.)

---

## Cross-Cutting Rules *(examples — replace with your stack's conventions)*

### Styling

State which one of these this project actually uses — don't leave it to be inferred file-by-file, and don't let a second approach creep in alongside it "just for one component."

**Universal, regardless of stack:**
- Never hardcode colors/spacing that a token or variable already covers; don't approximate a token with a runtime color-manipulation helper when an exact one exists
- Prefer framework/library-provided class-name or selector constants over hardcoded strings when targeting internal DOM structure
- One styling approach per component — mixing two (e.g. a utility-class component with a stray inline `style=`) is a sign something should be refactored, not a shortcut

**Per-approach gotchas:**

| Approach | Watch out for |
|---|---|
| CSS-in-JS (Emotion, styled-components, MUI `styled()`) | Avoid the framework's inline-style prop (e.g. MUI's `sx`) as a substitute for a real styled component — it defeats theming and static analysis |
| Tailwind / utility classes | Long className strings hide intent — extract a component instead of repeating the same cluster of utilities everywhere |
| CSS Modules / Sass / Less | Global selectors leak across modules without `:local`/module scoping — verify your build actually scopes them |
| Bootstrap (legacy) / global CSS | Specificity wars and `!important` creep — treat any new addition here as tech debt, not precedent for more |
| Inline `style={{...}}` / `style="..."` | No hover/focus/media-query support, no theme tokens, no static analysis or reuse — acceptable only for a one-off computed value (e.g. a measured width); never a substitute for a real styling approach |
| React Native `StyleSheet.create` / `styled-components/native` / NativeWind | No cascade and no shared global stylesheet by default — shared values (color, spacing) must come from an explicit theme/token import, not CSS custom properties; `Platform.select`/`.ios.tsx`/`.android.tsx` splits are the normal way to diverge per platform, not a special case to avoid |

### Agent Orchestration

- **Never run two agents that write to the same file(s) concurrently.** If a second research/writing task touches a file another agent might still be writing to, wait for the first to finish before starting the second — don't rely on "read current state first" instructions to the second agent as a substitute, since that only narrows the race window, it doesn't close it. A real case: launching a second data-gathering agent while a first was still appending to the same JSON file risked one agent's writes silently clobbering the other's; the fix was strictly serializing them, not making the second one "smarter."
- Background/parallel agents are for genuinely independent work (different files, different research questions) — if you're unsure whether two tasks are independent, that's a signal to serialize them.

#### Independent Verification Fan-Out (the positive counterpart)

Once implementation is done, verification steps that only *read* the code and report back — lint, type-check, unit tests, component tests, build, browser verify — don't conflict with each other the way concurrent writes do. Running them one after another by default wastes wall-clock time for no safety benefit.

- **The dependency test, before fanning anything out:** does step B need step A's *output*, or just the same starting code state? Lint/type-check/tests/build all only need the code as it currently stands — none of them consumes another's result, so none of them has to wait. A step that genuinely consumes another's output ("fix the lint errors it found, then rerun") is a real dependency, not a false one to parallelize away — don't fan those out.
- **Shell-level fan-out (default, cheap):** batch independent checks as background jobs in one agent's turn (`cmd1 & cmd2 & cmd3 & wait`) instead of running them sequentially. This is what [`/commit`](./skills/commit.md) Step 4 and [`/implement-task`](./skills/implement-task.md) Step 7 do — no extra agent needed, just don't serialize checks that don't depend on each other.
- **Agent-level fan-out (when it's diagnosis, not just execution):** if a check's output needs interpretation — why this test actually failed, what this type error means in context — and that diagnosis doesn't need another check's findings as input, it can go to a separate agent instead of one agent working through each check in turn. Worth it specifically when the checks are slow enough that overlapping wall-clock time matters, or when a cheaper/faster model is genuinely sufficient for a mechanical check (e.g. type-check output triage) while a stronger model stays on the harder diagnosis.
- **A fan-out agent reports, it doesn't fix.** Findings come back to the orchestrating agent/human to act on — a verification agent that starts independently editing shared files to "fix what it found" reintroduces the exact concurrent-write problem the rule above exists to prevent. Fan-out is for read-and-report work; writing fixes back is sequential, one agent/decision at a time.

### Responsive / Mobile UI

- Prefer a JS-level guard (e.g. a `useIsMobile()`-style hook backed by `matchMedia`) that actually branches what renders, over CSS-only responsive hiding (e.g. utility classes like `hidden sm:flex`). CSS-only hiding still mounts the hidden content — fine for pure layout, but wrong once "mobile vs. desktop" needs to be a first-class branch (different component entirely, avoided data fetch, etc.), and it's easy to reach for the CSS version by default and paint yourself into a corner.
- Keep the JS breakpoint and the CSS framework's breakpoint numerically identical (e.g. both at 640px) — a hook re-implementing "mobile" at a different pixel value than the CSS breakpoints in the same codebase will disagree with itself at the boundary.
- If you introduce this hook, also add a test-environment polyfill for `matchMedia` before you need it — jsdom does not implement it at all (throws, doesn't just report `false`), so any component test that renders something using the hook will fail until one exists.

### Watchdogs, observers & postponed rendering

- **A load watchdog must only count time the page is actually visible.** Browsers legitimately postpone work in background tabs and lazy iframes (`loading="lazy"` embeds), so a naive `setTimeout`-since-mount timer declares failure on content that was never given a chance to load. A real case: a map app's 6s `tilesloaded` watchdog fired routinely inside a portfolio's lazy iframe embed and on cold caches — "map randomly doesn't load, refresh fixes it." Arm the timer only while `document.visibilityState === "visible"` and re-arm on `visibilitychange`.
- **Split transient failures from hard failures, and give transient ones a retry path.** Auth/quota rejection (e.g. `gm_authFailure`) deserves a dead-end message; a timeout deserves a "try again" that remounts the loader. A fallback with no way back turns every false positive into a full-page failure until refresh.
- **Stabilize watchdog callbacks** (`useCallback`/refs) — an inline `onFail={() => ...}` recreated on every render silently resets the timer whenever unrelated state changes.
- **Mount-time observers must survive remounts.** A scroll-reveal `IntersectionObserver` set up once on app mount never sees elements React re-creates later — e.g. when switching locale re-keys localized lists. Symptom: freshly remounted sections stuck at `opacity: 0`. Re-run the scan whenever the re-keying dependency (locale, route, data version) changes, and scan only not-yet-revealed elements so visible content doesn't blink.

### Cross-repo CI / `repository_dispatch`

- A fine-grained PAT used for cross-repo automation must have the target repo explicitly selected under "Repository access" — scoping permissions correctly isn't enough if the repo itself isn't in the token's allowlist.
- If a CI step wraps the call in `curl -sf`, a bad token fails silently with just an opaque exit code and no response body in the log — a real case cost a manual reproduction to diagnose. Drop `-f` (or capture and print the body on failure) so the actual API error shows up in the Actions log.
- To isolate "bad token" from "bad endpoint," reproduce the exact same call with a known-good credential (e.g. your own `gh api`) — if that succeeds, the problem is specifically the stored secret.

### Cross-module navigation — example: micro-frontend architecture

- Route to other modules via a shared enum/constants file — never hardcode path strings
- If the host shell's router can rewrite history externally, read the *current* URL (e.g. `window.location.search`) rather than a possibly-stale prop passed down from routing state

### Overlays — example: micro-frontend architecture

- If the host shell wraps each module in its own stacking context, a `createPortal(..., document.body)` from inside a module can render **behind** the module's own content. Use a fixed-position element inside the module's own DOM tree instead.

### Icons

- Prefer your existing shared icon set over adding a new icon package
- Document where new icons should be added (naming convention, storage location)

### API clients

- Auto-generated API-client packages should never be hand-edited
- If both a generated client and an older local copy exist, prefer the published generated one and document the migration status

### Browser verification, issue trackers, code quality, feature flags

These are all MCP-backed in this playbook — see [`docs/mcp-servers.md`](./docs/mcp-servers.md) for setup, URLs, and troubleshooting rather than duplicating that detail here. Notable policy carried over from real usage: if your organization runs **both** a cloud and an on-premise instance of the same tool (e.g. Jira Cloud + Jira Data Center), document which ticket-prefix maps to which MCP server — the wrong one will confidently report "issue does not exist" instead of hinting you queried the wrong instance.

---

## Public Repo Hygiene

This playbook is meant to be public. If you're generalizing a skill or doc sourced from a real (private) project into this repo — or maintaining any other repo intended to go public — run [`/public-repo-check`](./skills/public-repo-check.md) before pushing.

Never commit to a public repo:
- Real secrets, tokens, API keys, or private-key material
- Cloud/tenant/resource UUIDs (e.g. an issue-tracker `cloudId`, a cloud-provider subscription ID)
- Internal hostnames or IPs other than `localhost`/`127.0.0.1`/`0.0.0.0`
- A company name, internal project codename, product/ticket-ID prefix, or any other identifier that ties this content back to a specific organization
- Personal file-system paths or personal emails

When generalizing a skill sourced from a real project — as every one in `skills/` was — the source material's specific names are the most common leak: package names, ticket-ID prefixes, internal URLs, tools tied to one org's licensing. Strip them to generic placeholders (`<your-org>`, `TICKET-ID`, `<component-library>`) the same way the existing skills do; use those files as the reference pattern for how much to anonymize, rather than deciding case-by-case.

---

## Setup

See [`docs/mcp-servers.md`](./docs/mcp-servers.md) for MCP server setup. Add your own machine-setup doc (runtime versions, package manager, auth proxy/VPN requirements, token-usage visibility) as `docs/setup.md` — that content is inherently org-specific, so it isn't templated here.
