# AIPB-05 — Enforce the task-file lifecycle instead of relying on someone noticing

**Ticket:** (invented for a feature-delivery dry run — same pattern as AIPB-01–04)
**Type:** Chore
**Status:** superseded — never implemented; the file was removed on 2026-07-24 inside an unrelated PR ([#26](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/26))
**Source:** restored from git history and closed out in [AIPB-22](./AIPB-22.md)
**Superseded by:** [AIPB-22](./AIPB-22.md)

---

## What & Why

Two related gaps surfaced this session, both about the same root cause: the Task file lifecycle rule ("delete `.tasks/TICKET-ID.md` once a PR exists") only ever fires if something explicitly checks for it, and nothing currently does that reliably.

1. `AIPB-01.md`/`AIPB-02.md` sat stale in `.tasks/` past their PRs being merged — `/commit`'s lifecycle check only re-runs when a *new* commit lands on that ticket's branch, and neither ticket got one after its PR opened.
2. Mid-AIPB-04, we agreed the task-file deletion should always be its **own** dedicated commit after opening a PR (not bundled into the feature commit) — because the deletion literally can't happen in the same commit that creates the PR. We did this manually for AIPB-03 and AIPB-04, but nothing in `commit.md` actually requires it going forward.

This ticket fixes both: `commit.md` gets the automatic behavior for the *current* ticket, and `create-task.md` gets a defense-in-depth sweep for anything that slips through anyway (a ticket whose PR was opened without `/commit`, or from before this fix existed).

## What happened

Nothing from the plan was built. The deletion rule kept relying on someone noticing — AIPB-11, AIPB-12 and AIPB-13's task files were each removed by hand after their PRs had already merged (AIPB-13's a week later).

AIPB-22 replaced the premise rather than enforcing it: task files are no longer deleted, so there's nothing stale to sweep. It kept this ticket's one durable insight — the PR link can't exist in the commit that creates the PR, so `/commit` acts in a dedicated follow-up commit — and applied it to closing out the task file instead of deleting it.

## Open Questions

- Should the `create-task` sweep run every time, or only occasionally? **Moot** — with durable task files there's no sweep.

## Architecture Notes

Not building a scheduled/background cleanup job — everything in this playbook runs on explicit user invocation, and a stale task file is low-severity (it's inert documentation, not a security or correctness risk). The fix is about making the existing rule actually fire, not about adding urgency that isn't there.
