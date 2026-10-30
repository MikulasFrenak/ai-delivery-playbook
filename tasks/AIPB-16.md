# AIPB-16 — Wire agent-eval into the contribution flow; adopt PLAN.md with /plan-update

**Ticket:** self-assigned (no tracker)
**Type:** Feature
**Status:** done — [PR #35](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/35), closed 2026-08-23
**Source:** reconstructed on 2026-10-29 from PR #35's two commits (the PR has no description) — not written at the time; no acceptance criteria were recorded
**Related:** [AIPB-15](./AIPB-15.md)
**Updated by:** [AIPB-22](./AIPB-22.md)

---

## What & Why

`/agent-eval` existed as a standalone skill, but nothing in the contribution flow triggered it. Separately, `PLAN.md` was templated in `AGENTS.md` but this repo had never adopted one for itself.

## What was built

`CONTRIBUTING.md` gained a "Changing an existing skill" section requiring an `/agent-eval` re-run before a PR when the skill already has a scorecard. `docs/vocabulary.md` gained Golden set, Rubric, Eval score, Baseline and Regression. The repo adopted its own root `PLAN.md`, and a new `skills/plan-update.md` reconciles it against real repo state (it edits only, never commits). `/plan-update` is wired into `create-task` (Step 7) and `implement-task` (Step 11) as documented checkpoints, not auto-invoked.

## Architecture Notes

- Registering `plan-update` in `architecture.md`'s Level 1 list showed that list was already stale: `design-brief`, `diagram`, `postmortem` and `test-scaffold` were missing. The whole list was fixed in the same pass.
- `mcp-server/README.md`'s stale "13 skills" claim was corrected to 17.
