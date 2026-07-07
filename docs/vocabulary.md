# Vocabulary

Canonical terms used throughout this playbook. When a term has a placeholder token, use that token — not a synonym — so a grep for it actually finds every usage.

This exists because terminology drift is a real, recurring failure mode here: an earlier find/replace renamed `TASK-ID` → `TICKET-ID` everywhere the hyphenated token appeared, but silently missed the two-word phrase "Task ID," leaving `create-task.md`'s own Step 1 heading inconsistent with every other skill. A glossary makes that kind of drift checkable instead of something someone has to notice by accident.

| Term | Placeholder | Definition | Don't call it |
|---|---|---|---|
| **Ticket** | `TICKET-ID` | The item in the issue tracker (Jira, Linear, GitHub Issues, etc.) that describes the work | "Task" (that's the local planning file, see below) |
| **Task file** | `.tasks/TICKET-ID.md` | The local planning artifact `create-task` produces from a ticket. Lives and dies with the ticket per the Task file lifecycle rule in `CLAUDE.md` | "Ticket" (that's the tracker item this file is *about*) |
| **Package root** | `<package-root>` | The directory a skill operates in — a monorepo package/app, or the repo root for a single-repo project | "Project root" (ambiguous in a monorepo) |
| **Capability** | — | The Level 1 pitch-level label for what a skill does, used in `architecture.md`'s diagram and `CLAUDE.md`'s Repo Layout table | "Atomic Skill" (renamed in AIPB-03 — too implementation-flavored for a non-technical audience) |
| **Skill** | `/skill-name` | The actual Claude Code mechanism — a file in `skills/`, with `disable-model-invocation` frontmatter, invoked by its slash command. This is Claude Code's own real terminology; don't rebrand it as "Capability" in technical contexts (frontmatter, `CONTRIBUTING.md`'s authoring checklist, the Skill Invocation Policy) | "Capability" (that's the pitch-level label for the same thing, used only in the architecture diagram/table) |
| **Workflow** | — | Level 2 — a documented sequence composing existing skills for a delivery scenario (e.g. `feature-delivery`) | "Pipeline" |
| **Lifecycle stage** | — | Level 3 — one stage of the Software Delivery Lifecycle (Requirements → Release), documented in `lifecycle/*.md` | "Phase" |
| **Worked Example** | — | Level 4 — a real, after-the-fact trace of a workflow run, in `examples/*.md`. Not hypothetical | "Playbook" (confusing — this repo is already called a playbook) |

## Branch types

See `CLAUDE.md`'s Branching & Commits section for the authoritative rules — this just names them:

| Branch prefix | For |
|---|---|
| `feature/TICKET-ID/desc` | New functionality tied to a ticket |
| `bugfix/TICKET-ID/desc` | A fix tied to a ticket |
| `chore/TICKET-ID/desc` | Ticketed non-feature work (deps, refactor, config) |
| `trivial/desc` | Non-feature work with no ticket — small enough that filing one would be overhead |
