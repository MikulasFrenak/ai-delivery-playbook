# ai-delivery-playbook — Plan

*Public playbook of skills/workflows/lifecycle docs for AI-assisted delivery. Current focus: keep the skill set grounded in real usage (this repo dogfoods its own conventions — self-assigned `AIPB-NN` IDs, `trivial/`/`chore/`/`feature/` branches, no speculative features) rather than growing it ahead of a concrete need.*

## Status

- 20 skills documented in [`skills/`](./skills/), all tool-agnostic in [`AGENTS.md`](./AGENTS.md) with `CLAUDE.md` as a thin import shim.
- Remote MCP server (`ai-delivery-playbook.mikulas-frenak.workers.dev`) is live on Cloudflare Workers, serving `search_skills`/`get_skill` — confirmed via `curl` and a real Claude Code CLI connection (AIPB-12).
- [`/agent-eval`](./skills/agent-eval.md) landed (AIPB-15/16), wired into the skill-change and vocabulary docs. **First real scorecard now exists** — [`evals/branch-cleanup.md`](./evals/branch-cleanup.md), 20 real cases (19 confirmed-merged, 1 open-PR-leave-alone), 20/20 baseline, via the MCP server's `get_skill` since the local `/agent-eval` slash command wasn't resolving in this session (file itself checked fine — cause not confirmed, a CLI restart is the likely fix). Coverage gap stated plainly in the scorecard itself: the "delete" path is thoroughly verified, "no PR found" and "host unavailable" have zero real cases yet — extend when they occur for real, don't invent them.
- [`/branch-cleanup`](./skills/branch-cleanup.md) made genuinely host-agnostic (not GitHub-only) and is now the most-exercised skill in practice this cycle.
- [`/plan-update`](./skills/plan-update.md) added — resolves the "does PLAN.md need a dedicated skill" question below by existing. Registered in `AGENTS.md`'s skills table and `architecture.md`'s Level 1 list (the latter was already stale — missing `design-brief`/`diagram`/`postmortem`/`test-scaffold` too — fixed at the same time). Wired into `create-task` (Step 7) and `implement-task` (Step 11) as one-line references, same "documented checkpoint, not auto-invoke" pattern `agent-eval` used in `CONTRIBUTING.md`.
- [`/self-healing-selectors`](./skills/self-healing-selectors.md) added (AIPB-17), paired with [`docs/test-maintenance.md`](./docs/test-maintenance.md) — same doc/skill pairing pattern as `define-slo`/`docs/sla-framework.md`. Generalized from an external draft with all job-application-specific content stripped; core claims (Healwright, the ~28%/~65% selector-vs-timing flakiness split, Spotify's quarantine result) spot-checked via web search before landing. Registered in all three mandatory places plus `lifecycle/verification.md` and `docs/vocabulary.md`.
- [`/mcp-check`](./skills/mcp-check.md) added (AIPB-18), paired with a new [`docs/mcp-governance.md`](./docs/mcp-governance.md) — closes a real gap `docs/mcp-servers.md` had (how to connect a server, but nothing on what it should be allowed to do). Caught and fixed a genuine under-disclosure while writing it: the Cloudflare Developer Platform connector's own docs undersold that it exposes real delete operations on KV/R2/D1/Hyperdrive, not just read/list — now called out explicitly in both docs. This task was drafted end-to-end in a separate sandboxed session first (research, options, naming) — every factual claim was independently re-verified against the real repo before landing here, and one mis-attributed stat (credited to Anthropic's own report instead of Salesforce's) was corrected in the process.
- **Worktree-isolated parallel agents** run for real for the first time (AIPB-19) — two independent background agents (a `CONTRIBUTING.md` addition, a repo-wide link-integrity audit) in separate git worktrees, briefed not to touch each other's files. Both returned honest results: one real commit, one correctly-empty "found nothing" result. Surfaced a real, unrelated bug in the process — `.gitignore` never excluded `.claude/worktrees/` or `.claude/settings.local.json` — fixed separately. Documented in `AGENTS.md`'s Agent Orchestration section and traced in `examples/AIPB-19.md`.
- [`/security-check`](./skills/security-check.md) added (AIPB-20), paired with a new [`docs/security.md`](./docs/security.md) — same doc/skill pairing pattern as `define-slo`/`sla-framework.md`, and integrated into `lifecycle/requirements.md` the same way (a paragraph, not a hard call from inside `create-task.md`). Content grounded in OWASP Top 10:2025, verified via web search rather than assumed from training memory — the list changed meaningfully from the 2021 version (two new categories, a reordering). Explicitly distinguished from Claude Code's built-in `/security-review` (planning-time trigger questions vs. diff-time vulnerability scan) throughout.
- Reference docs (`docs/mcp-servers.md`, `docs/mcp-governance.md`, `docs/deployment.md`, `docs/error-handling.md`, `docs/sla-framework.md`, `docs/test-maintenance.md`, `docs/security.md`, `docs/eval-framework.md`, `docs/vocabulary.md`, `docs/adoption.md`, `docs/future-considerations.md`) are current as of AIPB-20.
- This file itself is new (2026-08-23) — `PLAN.md` was documented as a template in `AGENTS.md` but this repo hadn't adopted it for itself yet.

## Next up

- **Spec-driven development (SDD) as the default working style.** The playbook is already most of the way to SDD under different names; the work is naming it, plus one real model change. Mapping to Spec Kit's stages (sources below):

  | SDD stage | Already here |
  |---|---|
  | Constitution | `AGENTS.md` conventions + the parked Principles doc in `docs/future-considerations.md` — SDD is the real trigger to finally write it |
  | Specify | `/analyze-story`, `lifecycle/requirements.md`; `/define-slo`, `/security-check` for non-functional requirements |
  | Clarify | "Research Before Implementing" + Open questions |
  | Plan | `/create-task`, `/design-brief`, `/diagram` |
  | Tasks | `/analyze-story` subtasks, the task file's plan |
  | Implement | `/implement-task` |
  | Verify / analyze | `/verify-browser`, `/test-scaffold`, `/security-check`, `/review-pr`, `/agent-eval` |
  | Living docs | `/code-doc`, `/plan-update` |

  **The model change: task files stop being deleted and become durable records** — moving the playbook from "spec-first" to "spec-anchored" in Böckeler's terms (the spec survives the task and is edited as behavior evolves). Deletion only existed because `doc.md` lived next to the task and seemed to duplicate it; the split resolves that — `doc.md` = how the code works *now*, task file = *why* a change happened (a lightweight decision record). `examples/AIPB-03.md` already showed the deletion rule was fragile in practice (AIPB-01/02 lingered because no follow-up commit re-triggered `/commit`'s check).

  What a task file keeps after merge:
  - **Keep as-is:** Goal / What & Why, Acceptance Criteria (the spec part), Architecture Notes; for bugfixes, Expected vs Actual and Reproduction Steps
  - **Rewrite at close-out:** Open Questions → answered or moved to `PLAN.md`; Root Cause Hypothesis → confirmed root cause; Implementation Plan → 2–3 lines on what was actually built
  - **Drop at close-out:** Files to Touch (`git log -- <file>` is authoritative), Changes table (lives in the PR description)
  - **Add:** a header with status (`open`/`done`), PR link, merge date, and an `Updated by: TICKET-ID` line whenever a later ticket changes the same behavior — those links are what make the task files a spec trail rather than a pile

  Touchpoints when this is picked up (candidate `AIPB-22`): `skills/commit.md` (delete rule, lines ~56–65, 104–105, 171–172 → close-out), `skills/create-task.md` (status header in all three templates), `skills/implement-task.md` (close-out step), `AGENTS.md` (Task file lifecycle table; the "deleted once merged" mentions in the ticket-ID and `PLAN.md` sections and the `evals/` row), `evals/README.md`, `skills/agent-eval.md`, and the `.tasks/` link-exception noted in `examples/AIPB-19.md`.

  **Decided (2026-10-29):**
  - SDD is the default way of working from now on — in this repo and in projects that adopt it — not a separate course or product.
  - Task files move from hidden `<package-root>/.tasks/` to a visible `<package-root>/tasks/`, since they're now permanent and meant to be read. Add `tasks/` to the touchpoints above (every `.tasks/` path reference in skills, `AGENTS.md`, `evals/README.md`, `examples/`).
  - This repo publishes its own durable task files (gated by `/public-repo-check`). Nothing new is exposed: every past task file was already pushed here and is readable in history.
  - Every AIPB ID gets a task file. The 6 deleted ones (AIPB-01, 02, 05, 11, 12, 13) are restored from git history and the 2 still present (18, 20) are closed out. The 13 IDs that never had one are reconstructed from their PRs and commits, and marked as reconstructed so they aren't mistaken for specs written at the time. AIPB-05 (which enforced deletion) is marked superseded by AIPB-22.
  - A `tasks/README.md` index lists every ID with its PR and any `examples/` trace.
  - Order: convention change first (rename, skills, `AGENTS.md`), then the restore/reconstruct, all in AIPB-22, whose own task file is the first written under the new rules.

- **Release ≠ deploy** — `lifecycle/release.md` currently defines Release as "PR merged, ticket closed" with no rollout/rollback/flag-lifecycle content; feature flags exist only as an `implement-task` implementation mechanic (register + on/off check), not a release strategy. Candidate next ticket after AIPB-20: a `create-task` addition (or a `release-plan`-style skill, TBD) covering rollout/rollback decided before merge, flag lifecycle (a flag created without a removal ticket is debt), and why flags alone don't protect data (schema/API changes need expand-contract, not just a toggle) — this playbook's own mobile focus makes this sharper than it would be for web-only: a shipped app binary can't be rolled back, and old app versions keep calling the API for months.
- **Vendor-neutral "context weight" descriptor per skill** — not "use Sonnet here," which would hard-code one vendor's model names into 19+ tool-agnostic skill files, but something like "judgment-heavy, needs broad context" vs. "mechanical, narrow context once a spec exists" as a skill-frontmatter or table descriptor, so whoever's running a skill (with whatever tool/model) can decide their own delegation. Not started — needs its own real trigger before building (same AIPB-02 bar), likely a real cheap-model-delegation experiment first, same as `/agent-eval`'s "run it for real before writing the doc" precedent from AIPB-19.

## Open questions / decisions needed

*(none open — the SDD item's questions are resolved above)*

## Parked (noted, not active)

See [`docs/future-considerations.md`](./docs/future-considerations.md) — the existing home for ideas raised and deliberately deferred (5th "Reference Architectures" level, a Principles/constitution doc, wrapping individual skills as typed MCP tools). Not duplicated here; that doc is the durable record and already follows the same "not a roadmap promise" framing this section would use.

## Decision points

- **Reference-architecture level (docs/future-considerations.md):** revisit once a second real adoption in a different stack exists — not before.
- **`/agent-eval` golden sets:** build one only once a skill has real usage history behind it, per the skill's own guardrail — not on day one for any new skill. First one built for `branch-cleanup` (AIPB-20 cycle); extend its "leave alone"/"no PR found"/"host unavailable" coverage the first time a real case of each occurs, don't invent examples to fill the gap early.

## Sources

Everything except the SDD item reflects this repo's own git history and current file state. For the SDD item:
- [Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl — Birgitta Böckeler, martinfowler.com](https://www.martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) — the spec-first / spec-anchored / spec-as-source distinction
- [GitHub Spec Kit deep dive — constitution and slash commands (DEV Community)](https://dev.to/x4nent/github-spec-kit-deep-dive-spec-driven-development-the-constitution-speckit-slash-commands-1m71) and [GitHub Spec Kit practical guide (Augment Code)](https://www.augmentcode.com/guides/github-spec-kit-practical-guide-sdd-workflow) — stage names (constitution, specify, clarify, plan, tasks, implement, analyze). Third-party sources; re-check command names and current version against github.com/github/spec-kit before quoting them in the course.
