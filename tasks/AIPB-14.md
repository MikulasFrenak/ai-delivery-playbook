# AIPB-14 — Make branch-cleanup and pr-update genuinely host-agnostic

**Ticket:** self-assigned (no tracker)
**Type:** Chore
**Status:** done — [PR #26](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/26), closed 2026-07-24
**Source:** reconstructed on 2026-10-29 from PR #26's commit (the PR has no description, and the commit was prefixed `CHORE -` rather than the ticket ID) — not written at the time; no acceptance criteria were recorded
**Updated by:** [AIPB-23](./AIPB-23.md) — `/branch-cleanup` Step 8, a report-only task-file status check using the same host detection

---

## What & Why

Both skills read as if GitHub, GitLab, Azure DevOps and Bitbucket were a closed list, even though the mechanism they use (query whatever CLI or API the host exposes) already generalizes past those four.

## What was built

`pr-update.md` Step 2 gained an "anything else" row (self-hosted Gitea/Gogs/Forgejo, sourcehut, a private GitLab CE instance without "gitlab" in its hostname) with guidance to drive its REST API the way the Bitbucket row does. `branch-cleanup.md` Step 1 got the same fix, plus a third case: a repo with no remote at all.

## Architecture Notes

- With no remote, `git branch --merged` alone is fully trustworthy rather than a degraded fallback. No host can have squash-merged anything through its web UI, so every merge went through local git and ordinary ancestry checking sees the whole picture.
- PR #26 also carried an unrelated commit removing AIPB-05's never-implemented task file.
