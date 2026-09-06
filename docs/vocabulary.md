# Vocabulary

Canonical terms used throughout this playbook. When a term has a placeholder token, use that token — not a synonym — so a grep for it actually finds every usage.

This exists because terminology drift is a real, recurring failure mode here: an earlier find/replace renamed `TASK-ID` → `TICKET-ID` everywhere the hyphenated token appeared, but silently missed the two-word phrase "Task ID," leaving `create-task.md`'s own Step 1 heading inconsistent with every other skill. A glossary makes that kind of drift checkable instead of something someone has to notice by accident.

| Term | Placeholder | Definition | Don't call it |
|---|---|---|---|
| **Ticket** | `TICKET-ID` | The item in the issue tracker (Jira, Linear, GitHub Issues, etc.) that describes the work | "Task" (that's the local planning file, see below) |
| **Task file** | `.tasks/TICKET-ID.md` | The local planning artifact `create-task` produces from a ticket. Lives and dies with the ticket per the Task file lifecycle rule in `AGENTS.md` | "Ticket" (that's the tracker item this file is *about*) |
| **Package root** | `<package-root>` | The directory a skill operates in — a monorepo package/app, or the repo root for a single-repo project | "Project root" (ambiguous in a monorepo) |
| **Skill** | `/skill-name` | The single unit of engineering behavior — "analyze a story," "implement a ticket" — documented in prose so any tool can follow it, and implemented in `skills/` as Claude Code skills (files with `disable-model-invocation` frontmatter, invoked by slash command). One term at every level, Level 1 diagram included | "Capability" (retired in AIPB-08 — one concept had two names and drifted; the audience is technical, so the playbook now uses Claude Code's real term everywhere. This reverses AIPB-03, which had introduced "Capability" as a pitch-level label for non-technical readers) |
| **Workflow** | — | Level 2 — a documented sequence composing existing skills for a delivery scenario (e.g. `feature-delivery`) | "Pipeline" |
| **Lifecycle stage** | — | Level 3 — one stage of the Software Delivery Lifecycle (Requirements → Release), documented in `lifecycle/*.md` | "Phase" |
| **Worked Example** | — | Level 4 — a real, after-the-fact trace of a workflow run, in `examples/*.md`. Not hypothetical | "Playbook" (confusing — this repo is already called a playbook) |
| **Verification fan-out** | — | Running independent, read-only checks (lint, type-check, tests, build) concurrently — as parallel shell jobs, or as separate agents when a check needs real diagnosis — because none of them consumes another's output. See "Independent Verification Fan-Out" in `AGENTS.md`'s Agent Orchestration section | "Parallelization" (too generic — this is specifically about *independent, read-only* steps; don't use the term for anything that writes shared state) |
| **Worktree-isolated parallel agents** | — | Two or more agents doing genuinely independent *write* work concurrently, each in its own git worktree/branch, merged back after review. See "Worktree-Isolated Parallel Agents" in `AGENTS.md`'s Agent Orchestration section | "Verification fan-out" (fan-out is read-only checks with no merge step; this is real writes that need one) |
| **SLI** (Service Level Indicator) | — | The specific thing being measured — latency, error rate, availability. See `docs/sla-framework.md` | "SLA" or "SLO" (a measurement isn't a target, and isn't a commitment) |
| **SLO** (Service Level Objective) | — | The internal target for an SLI (e.g. "p95 < 500ms"), with headroom below the SLA so a miss is an internal alarm before it's a customer conversation | "SLA" (an SLA is the external agreement; conflating them removes the warning margin) |
| **SLA** (Service Level Agreement) | — | The external commitment, with stated consequences if missed | "SLO" (the internal target should be stricter than the external promise, not identical to it) |
| **Error budget** | — | `1 − SLO` — the amount of acceptable failure remaining in the current measurement window; spent budget means prioritize reliability work over new features | "Buffer" or "slack" (it's a specific, calculated quantity tied to an SLO and a window, not a vague margin) |
| **Golden set** | — | Real historical examples with known-correct output for one specific judgment call a skill makes. See `docs/eval-framework.md` | "Test cases" (those check code against its own logic; a golden set checks a judgment call against what a human already decided was right) |
| **Rubric** | — | How a single golden-set example is scored — exact-match, or explicit partial-credit criteria stated before scoring | — |
| **Eval score** | — | Examples scored correct ÷ total examples, from running a skill's current implementation against its golden set | "Accuracy" (too generic — a score is always relative to one stated golden set and rubric, not a general property of the skill) |
| **Baseline** (eval) | — | The last accepted eval score, that a new run gets compared against | "SLO" (a baseline is descriptive — the last accepted result — not a target set in advance) |
| **Regression** (eval) | — | A run that scores worse than baseline | — |
| **Self-healing selector** | — | A locator that gets automatically repaired when it fails to resolve, via DOM fingerprint matching plus candidate scoring against a confidence threshold. See `docs/test-maintenance.md` | "Auto-retry" (a retry re-runs the same broken locator; healing finds a new one) |
| **Fingerprint** (test) | — | A lightweight, re-identifiable description of a DOM element captured at the last passing test run — role, visible text, `aria-label`, tag, short structural path, sibling text | "Selector" (a selector is how you find an element today; a fingerprint is what lets you re-find it after that selector breaks) |
| **Confidence threshold** (test healing) | — | The score above which a healed locator auto-patches; below it, the healer reports candidates to a human instead of guessing. See `docs/test-maintenance.md` | "Pass/fail" (it's a graded score, not a binary) |
| **Quarantine** (flaky test) | — | Moving a flaky test into a separate suite that still runs and is tracked, but can't block merges, paired with an assigned owner and fix deadline | "Skip" or "disable" (those drop tracking and accountability entirely) |
| **Test impact analysis** | — | Mapping changed files/modules to the tests that actually exercise them, and running only that subset per push, with the full suite on a schedule instead | "Test sharding" (sharding splits *all* tests across runners; impact analysis narrows *which* tests run at all) |
| **Scope tier** | — | An MCP server's classification as read-only, write (scoped), or write (destructive), per `docs/mcp-governance.md` | "Permission level" (too generic — a scope tier is specifically about what an MCP server's tools can *do* to an external system, not an auth role) |
| **Blast radius** | — | What actually breaks, and how reversibly, if a capability is misused or a credential leaks — the basis for a scope tier, not a vague synonym for "risk" | "Risk" (too broad — blast radius is specifically about *consequence and reversibility*, not likelihood) |

## Branch types

See `AGENTS.md`'s Branching & Commits section for the authoritative rules — this just names them:

| Branch prefix | For |
|---|---|
| `feature/TICKET-ID/desc` | New functionality tied to a ticket |
| `bugfix/TICKET-ID/desc` | A fix tied to a ticket |
| `chore/TICKET-ID/desc` | Ticketed non-feature work (deps, refactor, config) |
| `trivial/desc` | Non-feature work with no ticket — small enough that filing one would be overhead |
