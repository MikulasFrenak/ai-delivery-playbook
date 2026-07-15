# AIPB-05 — Enforce the task-file lifecycle instead of relying on someone noticing

**Ticket:** (invented for a feature-delivery dry run — same pattern as AIPB-01–04)
**Type:** Chore

---

## What & Why

Two related gaps surfaced this session, both about the same root cause: the Task file lifecycle rule ("delete `.tasks/TICKET-ID.md` once a PR exists") only ever fires if something explicitly checks for it, and nothing currently does that reliably.

1. `AIPB-01.md`/`AIPB-02.md` sat stale in `.tasks/` past their PRs being merged — `/commit`'s lifecycle check only re-runs when a *new* commit lands on that ticket's branch, and neither ticket got one after its PR opened.
2. Mid-AIPB-04, we agreed the task-file deletion should always be its **own** dedicated commit after opening a PR (not bundled into the feature commit) — because the deletion literally can't happen in the same commit that creates the PR. We did this manually for AIPB-03 and AIPB-04, but nothing in `commit.md` actually requires it going forward.

This ticket fixes both: `commit.md` gets the automatic behavior for the *current* ticket, and `create-task.md` gets a defense-in-depth sweep for anything that slips through anyway (a ticket whose PR was opened without `/commit`, or from before this fix existed).

## Plan

- [ ] `commit.md` Step 5: when creating a **new** PR/MR, immediately follow with a dedicated commit that deletes that ticket's task file (if it exists) and push it — don't leave it to "run `/pr-update` next time." Announce it the same way Step 2.5 announces staging, not as a separate confirmation prompt (deleting *this ticket's own* file, whose work is already committed, isn't a new risk).
- [ ] `create-task.md` Step 1 (folded into the existing file-existence check, not a new numbered step — avoids another renumbering cascade): after resolving `<package-root>`, also scan `.tasks/` for *other* task files. For each, check whether a PR/MR exists for that ticket (reuse `pr-update`'s host-detection pattern). If a host CLI isn't configured, skip this check silently rather than erroring.
- [ ] Stale files found this way are **never auto-deleted** — list them with their PR status and ask for confirmation before removing anything. This differs from the `commit.md` case: those are the *current* ticket's own just-committed file; these are *other* tickets' files being noticed as a side effect of an unrelated task, so the bar for silent action is higher.
- [ ] Update `docs/vocabulary.md` if this introduces a term worth naming (e.g. "stale task file") — check once the wording is final, don't force an entry that doesn't add clarity.

## Files to Touch

| File | Change |
|---|---|
| `skills/commit.md` | Step 5: force a dedicated follow-up commit after opening a new PR |
| `skills/create-task.md` | Step 1: add the stale-file sweep for other tickets, confirm-before-delete |
| `examples/AIPB-05.md` | New — worked example, once implemented |

## Open Questions

- Should the `create-task` sweep run every time, or only occasionally (e.g. flag if it hasn't run in N tickets)? Leaning toward "every time, but cheap" since it's just a host-CLI query per stale file found — deferring the decision to implementation, where the actual cost will be visible.

## Architecture Notes

Not building a scheduled/background cleanup job — everything in this playbook runs on explicit user invocation, and a stale task file is low-severity (it's inert documentation, not a security or correctness risk). The fix is about making the existing rule actually fire, not about adding urgency that isn't there.
