---
name: requirements
level: 3 - Engineering Lifecycle
status: documented
---

# Requirements

**Purpose:** Turn a raw idea, bug report, or business ask into a scoped, actionable ticket with acceptance criteria the team agrees are testable — before any code or architecture decisions happen.

**Entry criteria:** A need has been identified (a bug reported, a feature requested) but doesn't yet exist as a ticket with acceptance criteria.

**Exit criteria:** A ticket exists with testable acceptance criteria. For a Story-sized ticket, it's been broken into independently-shippable subtasks.

**Skills used, in order, for a Story:**
1. [`analyze-story`](../skills/analyze-story.md) Steps 1–3 and 6 — extracts the ticket's summary/AC, and turns the splittability assessment into concrete subtasks filed in the tracker. (Steps 3e–4, the event model and backend/FE split, are architectural decisions — see `lifecycle/architecture.md`.)
2. [`create-task`](../skills/create-task.md) — run once per subtask that `analyze-story` created, to produce that subtask's own implementation plan before work starts on it

**For a plain Task** (no Story to decompose first): `create-task` Step 1a files a new ticket from conversation context when none exists yet, then runs directly — there's no `analyze-story` step in this path.

**Artifacts:** Ticket(s) in the issue tracker, including subtasks for a Story; a `.tasks/TICKET-ID.md` plan per subtask/Task (see `create-task`).
