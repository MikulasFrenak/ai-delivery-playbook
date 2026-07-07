---
name: architecture
level: 3 - Software Delivery Lifecycle
status: documented
---

# Architecture

**Purpose:** Decide *how* a ticket will be solved before writing production code — pick an approach, understand which parts of the system it touches, and get explicit sign-off on direction. This is a decision, not a document — the point is the agreement, not the artifact.

**Entry criteria:** A ticket with testable acceptance criteria exists (output of Requirements).

**Exit criteria:** A chosen approach is recorded and the user has explicitly agreed to it — nobody starts writing code on an unconfirmed approach.

**Skills used:**
- [`create-task`](../skills/create-task.md) Step 4 and [`implement-task`](../skills/implement-task.md) Step 1b both bake in the same research-and-present-options step: search for current best practices, present 2–3 approaches with trade-offs, recommend one, wait for go-ahead.
- [`analyze-story`](../skills/analyze-story.md) — for Story-sized tickets, this is where the real architectural decisions get made: the Event Model diagram, the backend/FE split, and the splittability assessment are all decisions about *how* the system will be shaped, not just what it should do. Its output (`analysis.md` + `event-model.drawio`) is this stage's artifact for a Story, produced before any subtasks are created.

**Gap:** for a plain Task (not a Story), this playbook has no standalone architecture-decision skill — the research step embedded in `create-task`/`implement-task` is what covers this stage instead, and it doesn't produce a durable artifact beyond the task file. If a project needs to preserve architecture decisions beyond that (e.g. an ADR log), that's a skill this playbook doesn't have yet.

**Artifacts:** For a Story — `analysis.md` + `event-model.drawio` (from `analyze-story`). For a Task — the chosen approach recorded in the task file's Architecture Notes section; optionally a standalone ADR if the project keeps one.
