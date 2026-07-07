# AIPB-04 — Add a vocabulary doc and fix task/ticket terminology drift

**Ticket:** (invented for a feature-delivery dry run — same pattern as AIPB-01/02/03)
**Type:** Chore

---

## What & Why

Found via a user question, not a formal review this time: `create-task.md`'s Step 1 heading says "Get the **Task ID**," while every other skill (`implement-task`, `pr-update`, `commit`) says "Ticket ID." Root cause: the earlier `TASK-ID` → `TICKET-ID` cleanup (during AIPB-02) was a hyphenated-token find/replace and silently skipped the two-word phrase "Task ID." Patching the 5 instances alone wouldn't prevent the same drift next time someone writes a skill — a glossary that defines the canonical term once, checkably, is the actual fix.

## Plan

- [x] Add `docs/vocabulary.md` — canonical terms: **Ticket** vs **Task file**, **Package root**, **Capability** vs **Skill** (from AIPB-03's rename), the Level 1–4 names, and the 4 branch types. Each entry: the term, its placeholder token if it has one, and what NOT to call it.
- [x] Fix the 5 "task ID" instances: `create-task.md` (Step 1 heading + 3 more) and `implement-task.md` (1 instance) → "ticket ID," consistent with every other skill.
- [x] Register `docs/vocabulary.md` in `CLAUDE.md`'s Repo Layout table (`docs/` row's Purpose column).
- [x] Add a checklist item to `CONTRIBUTING.md`'s "Adding a new skill" section: use the terms in `docs/vocabulary.md` consistently.

## Files to Touch

| File | Change |
|---|---|
| `docs/vocabulary.md` | New — canonical terminology reference |
| `skills/create-task.md` | Fix 4 "task ID" instances → "ticket ID" |
| `skills/implement-task.md` | Fix 1 "task ID" instance → "ticket ID" |
| `CLAUDE.md` | Register vocabulary.md in Repo Layout table |
| `CONTRIBUTING.md` | Add vocabulary-consistency checklist item |
| `examples/AIPB-04.md` | New — worked example for this ticket (added mid-implementation, per the now-standard practice from AIPB-01/02/03) |

## Open Questions

- None.

## Architecture Notes

Deliberately not touching the `create-task` skill *name*, the `skills/create-task.md` filename, or the `.tasks/` folder name — "task" is the correct word for the artifact this skill produces (a task *file*), distinct from "ticket" (the tracker item). The bug was specifically the identifier ("Task ID" vs "Ticket ID"), not the broader vocabulary.

Related but separate: AIPB-05 will handle actually *enforcing* the task-file lifecycle (stale-file detection in `create-task`, and fixing `commit`'s Step 5 to always push a dedicated follow-up commit after opening a PR). Not folded in here — this ticket is terminology only.
