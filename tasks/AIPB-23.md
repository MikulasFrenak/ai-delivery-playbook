# AIPB-23 — Link post-mortems and worked examples to task files; check merge state live

**Ticket:** self-assigned (see `AGENTS.md` → Ticket IDs for solo/no-tracker projects)
**Type:** Chore
**Status:** done — [PR #48](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/48), closed 2026-10-30
**Related:** [AIPB-22](./AIPB-22.md) — left `tasks/.postmortems/` hidden and parked the question in `PLAN.md`; [AIPB-14](./AIPB-14.md) — `/branch-cleanup`'s host-agnostic spec, extended here. Both carry `Updated by: AIPB-23`

---

## What & Why

AIPB-22 made task files durable and visible but left `/postmortem`'s folder as hidden `tasks/.postmortems/`, with an open question in `PLAN.md`. Decided 2026-10-30: post-mortems are part of the product's documentation like task files, so they stay in the repo next to them and link to the bugfix ticket. Today `/postmortem` overwrites the notes file with Confluence markup, the wiki page is the only readable copy, and nothing links a task file to its incident.

Raw incident notes often hold what a committed file shouldn't: people's names, customer data, log excerpts with tokens or internal hostnames. Rewriting a committed file later doesn't remove the raw version from git history, so the notes stay local (gitignored) and only the blameless write-up is committed.

Worked examples (`examples/`) looked redundant once every ticket had a durable task file — before AIPB-22 they were the only record that survived a merge. Decided 2026-10-30 to keep them: a task file says what was decided and why, an example says how the run went and which skill caught what, and close-out drops exactly that process detail from task files. What was missing was a link between the two.

AIPB-22's close-out writes `done — PR #N` when the PR opens, so a quick check of the status lines can't tell "in review" from "merged", or catch a PR closed without merging. The merge happens on the host, where nothing writes back to the file, so the state is read live from the stored link instead of stored.

Also in this PR, to keep one open branch at a time: `mcp-server/doc.md` still said the remote server was "not yet deployed" and listed "13 small files". It has been live since AIPB-12 and redeploys on every push to `main`. Re-checked 2026-10-30 with `curl` against the live URL: 22 skills, and `/commit` with AIPB-22's close-out step. And `notify-review-spa.yml` failed from 2026-10-20 with only `curl` exit code 22 in the log: `-sf` hides GitHub's error body, the pitfall `AGENTS.md` → Cross-repo CI already warns about. The cause was `REPO_SYNC_TOKEN` (saved 2026-07-14, most likely a 90-day expiry): the re-run passed once the user replaced it on 2026-10-30.

## Acceptance Criteria

- [x] `/postmortem` writes a Markdown blameless post-mortem to `tasks/postmortems/TICKET-ID.md`, the durable copy; Confluence (or other wiki) markup becomes an optional publish step converted from it
- [x] The post-mortem is committed like a task file; only the raw scratch notes (`tasks/postmortems/TICKET-ID.notes.md`) stay out of git — `/postmortem` checks they're ignored before reading them, and `/commit` never stages them
- [x] Links run both ways: the post-mortem's `**Task:**` points to `tasks/TICKET-ID.md`, which gets a `**Postmortem:**` line; so does each corrective-action ticket, whose ID goes on its action line in the post-mortem (`/create-task` Step 5)
- [x] The skill writes roles instead of names and leaves out customer data and secrets/internal hosts from log excerpts
- [x] `workflows/bugfix.md` has an optional post-mortem step for bugs that were incidents; `AGENTS.md` (layout, skills table, Task file lifecycle), `tasks/README.md`, `.gitignore` and `PLAN.md` match
- [x] No `.postmortems` path left in current-state docs (`examples/` and AIPB-22's own text stay as written)
- [x] The six task files with a worked example carry `**Worked example:**`, and each example opens with `**Task file:**`; `AGENTS.md`, `docs/vocabulary.md` and `architecture.md` say what each holds
- [x] `/branch-cleanup` reports task files whose stored status disagrees with the live PR state (closed unmerged, missed close-out, no PR link), without touching the branch-delete decision; `AGENTS.md` says what `done` means
- [x] `mcp-server/doc.md` describes the remote server as deployed
- [x] `notify-review-spa.yml` prints GitHub's error body on failure (`curl -sS --fail-with-body`)
- [x] `/public-repo-check` passes before push

## What was built

`/postmortem` now writes the blameless post-mortem as Markdown to `tasks/postmortems/TICKET-ID.md`, keeps only the raw scratch notes (`TICKET-ID.notes.md`) out of git, links the post-mortem both ways with the task file, and publishes to the wiki only as an optional copy. `AGENTS.md`, `/create-task`, `/commit`, the bugfix workflow, `tasks/README.md`, `.gitignore` and `PLAN.md` follow it. Worked examples and their task files link each other, and examples are scoped to how a run went. `/branch-cleanup` Step 8 checks stored statuses against live PR state, report only; its dry run on this repo found 20 merged, AIPB-23 in review and AIPB-21 uncheckable (no PR). `mcp-server/doc.md` now says the remote server is deployed, and that a different machine is still untried. The notify workflow shows GitHub's error message when it fails.

## Architecture Notes

- The post-mortem takes the incident's ticket ID, the same one as the bugfix task file. One incident, one post-mortem; follow-up work links to it rather than getting its own.
- The repo copy is the source of truth; a wiki page is a copy, with its URL on the post-mortem's `**Wiki:**` line.
- The Bugfix template in `/create-task` gets no `**Postmortem:**` placeholder: most bugs aren't incidents, and `/postmortem` adds the line when one exists.
- `/create-task` Step 5's search for earlier specs found AIPB-22 here (the parked question). `/postmortem` itself came in a `TRIVIAL` commit (e002e0b) with no task file, so there was no earlier spec for the skill to link.
- Examples stay rather than being folded into task files: a trace would bloat the spec record, and most tickets don't need one. Existing examples keep their text; only the `**Task file:**` line was added, the same way `Updated by` lines are added to earlier task files.
- The merge state is read, not stored. Storing it would need a commit after every merge, and `main` takes no direct commits.
- Step 8 runs after the cleanup and never feeds back into it, so `evals/branch-cleanup.md`'s judgment call (delete or leave each branch) is unchanged. `/agent-eval` wasn't re-run for that reason; `CONTRIBUTING.md` asks for a re-run on any change to a skill with a scorecard, so run it before merging if the formal gate matters.
