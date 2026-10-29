# AIPB-04 — Add a vocabulary doc and fix task/ticket terminology drift

**Ticket:** (invented for a feature-delivery dry run — same pattern as AIPB-01/02/03)
**Type:** Chore
**Status:** done — [PR #6](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/6), closed 2026-07-07
**Source:** restored from git history and closed out in [AIPB-22](./AIPB-22.md)
**Updated by:** [AIPB-08](./AIPB-08.md), [AIPB-22](./AIPB-22.md)

---

## What & Why

Found via a user question, not a formal review this time: `create-task.md`'s Step 1 heading says "Get the **Task ID**," while every other skill (`implement-task`, `pr-update`, `commit`) says "Ticket ID." Root cause: the earlier `TASK-ID` → `TICKET-ID` cleanup (during AIPB-02) was a hyphenated-token find/replace and silently skipped the two-word phrase "Task ID." Patching the 5 instances alone wouldn't prevent the same drift next time someone writes a skill — a glossary that defines the canonical term once, checkably, is the actual fix.

## What was built

`docs/vocabulary.md`: canonical terms (Ticket vs Task file, Package root, Capability vs Skill, the Level 1–4 names, the branch types), each with its placeholder token and what *not* to call it. The 5 "task ID" instances in `create-task.md` and `implement-task.md` became "ticket ID". The doc was registered in `CLAUDE.md` and linked from a `CONTRIBUTING.md` checklist item.

## Architecture Notes

Deliberately not touching the `create-task` skill *name*, the `skills/create-task.md` filename, or the `.tasks/` folder name — "task" is the correct word for the artifact this skill produces (a task *file*), distinct from "ticket" (the tracker item). The bug was specifically the identifier ("Task ID" vs "Ticket ID"), not the broader vocabulary.

Related but separate: AIPB-05 will handle actually *enforcing* the task-file lifecycle (stale-file detection in `create-task`, and fixing `commit`'s Step 5 to always push a dedicated follow-up commit after opening a PR). Not folded in here — this ticket is terminology only.

*At close-out (2026-10-29):* AIPB-22 kept the word "task" but dropped the dot (`.tasks/` → `tasks/`), because task files became durable and meant to be read.
