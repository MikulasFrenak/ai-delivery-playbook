# AIPB-22 — Spec-anchored task files: keep them, close them out, move to tasks/

**Ticket:** self-assigned (see `AGENTS.md` → Ticket IDs for solo/no-tracker projects)
**Type:** Chore
**Status:** open
**Supersedes:** [AIPB-05](./AIPB-05.md)
**Related:** [AIPB-02](./AIPB-02.md), [AIPB-04](./AIPB-04.md), [AIPB-15](./AIPB-15.md), [AIPB-16](./AIPB-16.md) — earlier specs this ticket changes; each carries `Updated by: AIPB-22`

---

## What & Why

Spec-driven development is this playbook's default way of working from 2026-10-29 (see `PLAN.md`). Most SDD stages already exist here under other names; the one real gap is that task files were deleted once a PR opened, so the spec never outlived the change — "spec-first" in Böckeler's terms. This ticket makes the playbook "spec-anchored": a task file is the durable record of *why* a change happened and what it had to satisfy, while `doc.md` keeps describing how the code works *now*. Deletion only existed because the two looked like duplicates; with that split they aren't.

Task files also move from hidden `.tasks/` to visible `tasks/`, since they're now meant to be read, and every past AIPB ticket gets one — restored from git history where it existed, reconstructed from its PR and commits where it didn't (marked as such).

## Acceptance Criteria

- [x] `AGENTS.md`'s Task file lifecycle defines keep / close-out / updated-by instead of delete, and is the single place the close-out rules live
- [x] `/commit` closes out instead of deleting, including right after it creates a new PR/MR (so a ticket with no follow-up commit doesn't stay `open` — the gap AIPB-05 named)
- [x] `/create-task` templates carry `**Status:** open`, and Step 5 links earlier task files whose behavior this ticket changes
- [x] Every `.tasks/` path in current-state docs (skills, `AGENTS.md`, `docs/`, `lifecycle/`, `workflows/`, `mcp-server/`, `evals/`) reads `tasks/`; `examples/` stay verbatim as historical traces
- [x] AIPB-01…21 each have a task file in `tasks/`, closed out; reconstructed ones say so in their header
- [x] `tasks/README.md` indexes every ID with its PR and any `examples/` trace
- [x] `/public-repo-check` passes before push

## Plan

- [x] Convention: `AGENTS.md`, `commit.md`, `create-task.md`, `implement-task.md`, `plan-update.md`, `docs/vocabulary.md`, `evals/README.md`, `agent-eval.md`, `lifecycle/release.md`
- [x] Move `.tasks/` → `tasks/`, path sweep across current-state docs
- [x] Restore AIPB-01–06, 11, 12, 13 from history (03, 04 and 06 were added and deleted on their own branches, so plain `git log -- <path>` hides them; `--full-history` finds them); close out 18, 20; reconstruct 07–10, 14–17, 19, 21 from PRs and commits
- [x] `tasks/README.md` index; `PLAN.md` status
- [x] `/public-repo-check`, PR

## Open Questions

- Should `tasks/.postmortems/` lose its dot too? Kept as-is here: the rename is strictly `.tasks/` → `tasks/`, and whether raw incident notes should be visible is a separate decision.

## Architecture Notes

- The PR link can't exist in the commit that creates the PR, so `/commit` closes out in a dedicated follow-up commit right after opening a new PR/MR — the same mechanism AIPB-05 proposed for deletion, now used for close-out.
- Reconstructed task files contain only what the PR description and commit messages actually say. Where those don't state acceptance criteria, the file says so rather than inventing them.
