# AIPB-23 — Keep post-mortems next to task files, linked both ways

**Ticket:** self-assigned (see `AGENTS.md` → Ticket IDs for solo/no-tracker projects)
**Type:** Chore
**Status:** open
**Related:** [AIPB-22](./AIPB-22.md) — left `tasks/.postmortems/` hidden and parked the question in `PLAN.md`; carries `Updated by: AIPB-23`

---

## What & Why

AIPB-22 made task files durable and visible but left `/postmortem`'s folder as hidden `tasks/.postmortems/`, with an open question in `PLAN.md`. Decided 2026-10-30: post-mortems are part of the product's documentation like task files, so they stay in the repo next to them and link to the bugfix ticket. Today `/postmortem` overwrites the notes file with Confluence markup, the wiki page is the only readable copy, and nothing links a task file to its incident.

Raw incident notes often hold what a committed file shouldn't: people's names, customer data, log excerpts with tokens or internal hostnames. Rewriting a committed file later doesn't remove the raw version from git history, so the notes stay local (gitignored) and only the blameless write-up is committed.

Also in this PR, to keep one open branch at a time: `mcp-server/doc.md` still said the remote server was "not yet deployed" and listed "13 small files". It has been live since AIPB-12 and redeploys on every push to `main`. Re-checked 2026-10-30 with `curl` against the live URL: 22 skills, and `/commit` with AIPB-22's close-out step.

## Acceptance Criteria

- [ ] `/postmortem` writes a Markdown blameless post-mortem to `tasks/postmortems/TICKET-ID.md`, the durable copy; Confluence (or other wiki) markup becomes an optional publish step converted from it
- [ ] Raw notes live in `tasks/postmortems/TICKET-ID.notes.md`, gitignored; `/postmortem` checks that before reading them, and `/commit` never stages them
- [ ] Links run both ways: the post-mortem's `**Task:**` points to `tasks/TICKET-ID.md`, which gets a `**Postmortem:**` line; so does each corrective-action ticket, whose ID goes on its action line in the post-mortem (`/create-task` Step 5)
- [ ] The skill writes roles instead of names and leaves out customer data and secrets/internal hosts from log excerpts
- [ ] `workflows/bugfix.md` has an optional post-mortem step for bugs that were incidents; `AGENTS.md` (layout, skills table, Task file lifecycle), `tasks/README.md`, `.gitignore` and `PLAN.md` match
- [ ] No `.postmortems` path left in current-state docs (`examples/` and AIPB-22's own text stay as written)
- [ ] `mcp-server/doc.md` describes the remote server as deployed
- [ ] `/public-repo-check` passes before push

## Plan

- `skills/postmortem.md`: notes → `tasks/postmortems/TICKET-ID.notes.md` with an ignore check; Markdown template saved as `TICKET-ID.md` with `**Task:**` / `**Wiki:**` header lines; new link step; Confluence conversion moves into the optional publish step
- `AGENTS.md`, `skills/create-task.md` (Step 5), `skills/commit.md` (files not staged), `workflows/bugfix.md`, `tasks/README.md`, `.gitignore`, `PLAN.md`
- `tasks/AIPB-22.md`: `**Updated by:** AIPB-23`
- `mcp-server/doc.md`: deployed status, file count, the verified-in-a-separate-session TODO (done per `mcp-server/README.md`)

## Files to Touch

| File | Change |
|---|---|
| `skills/postmortem.md` | new paths, Markdown output, link step, publish step |
| `AGENTS.md` | `tasks/` layout row, `/postmortem` row, Task file lifecycle paragraph |
| `skills/create-task.md` | Step 5: link corrective-action tickets to their post-mortem |
| `skills/commit.md` | never stage `*.notes.md` |
| `workflows/bugfix.md` | optional post-mortem step, exit criteria |
| `tasks/README.md`, `.gitignore`, `PLAN.md`, `tasks/AIPB-22.md` | as above |
| `mcp-server/doc.md` | stale remote status |

## Open Questions

- none

## Architecture Notes

- The post-mortem takes the incident's ticket ID, the same one as the bugfix task file. One incident, one post-mortem; follow-up work links to it rather than getting its own.
- The repo copy is the source of truth; a wiki page is a copy, with its URL on the post-mortem's `**Wiki:**` line.
- The Bugfix template in `/create-task` gets no `**Postmortem:**` placeholder: most bugs aren't incidents, and `/postmortem` adds the line when one exists.
- `/create-task` Step 5's search for earlier specs found AIPB-22 here (the parked question). `/postmortem` itself came in a `TRIVIAL` commit (e002e0b) with no task file, so there was no earlier spec for the skill to link.
