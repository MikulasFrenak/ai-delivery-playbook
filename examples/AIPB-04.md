# Worked Example: AIPB-04 — Vocabulary doc + terminology fix

**Trigger:** A one-line user question — "tasks and tickets, are we misaligned or is this correct?" — not a formal review.

**Workflow:** [`feature-delivery`](../workflows/feature-delivery.md), Task/chore path.

## Trace

1. **Verify before answering** — same discipline as every prior run: grepped the repo for "Task ID" vs "Ticket ID" instead of guessing. Found a real, narrow bug: `create-task.md`'s Step 1 heading and 3 other spots still said "Task ID," while every other skill said "Ticket ID." Root cause identified: the `TASK-ID` → `TICKET-ID` cleanup during AIPB-02 was a hyphenated-token find/replace, so the two-word phrase "Task ID" silently survived it.
2. **Scope decision** — patching the 5 lines would have fixed the symptom, not the cause. Proposed a `docs/vocabulary.md` glossary instead, scoped as its own ticket (separate from the then-proposed stale-task-file-check work, which became AIPB-05) since they're different concerns: one is terminology, the other is lifecycle enforcement.
3. **[`create-task`](../skills/create-task.md)** — wrote `.tasks/AIPB-04.md`, explicitly recording what was deliberately *not* touched (the `create-task` skill name and `.tasks/` folder name are correct as-is — "task" is the right word for the artifact, "ticket" for the tracker item; the bug was specifically the identifier, not the vocabulary).
4. **[`implement-task`](../skills/implement-task.md)** — wrote `docs/vocabulary.md`, fixed the 5 instances, registered the new doc in `CLAUDE.md`'s Repo Layout table, and added a checklist item to `CONTRIBUTING.md` pointing future skill authors at it. Ran the same verification sweep as prior runs (link check, table integrity, case-insensitive re-grep for the original bug) — clean.
5. **[`commit`](../skills/commit.md)** — a mid-conversation process question surfaced during this same exchange: should the task-file deletion after opening a PR be its *own* commit? Answered yes (it's not just tidy — the deletion can't happen in the same commit that creates the PR, since no PR exists yet at that commit). That answer became part of AIPB-05's scope rather than retrofitted here.

**Outcome:** see the PR linked from this ticket's history once opened.

## What this run actually validated

The fix for a terminology bug isn't more terminology fixes — it's a single source of truth that makes the *next* drift checkable instead of accidental. Also: a good process question asked mid-task ("should this be a separate commit?") is worth answering and scoping into a future ticket immediately, rather than either ignoring it or scope-creeping the current one to absorb it.
