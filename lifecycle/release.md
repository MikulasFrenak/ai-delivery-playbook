---
name: release
level: 3 - Engineering Lifecycle
status: documented
---

# Release

**Purpose:** Get the verified change into the hands of users — merged, and visible to reviewers and stakeholders with an accurate description of what changed.

**Entry criteria:** Change is implemented and verified.

**Exit criteria:** PR is merged, the ticket is updated/closed, and the task file is cleaned up per its lifecycle rule (see `create-task`'s Task file lifecycle note in `CLAUDE.md`).

**Skills used:**
- [`commit`](../skills/commit.md) — generates the commit message, runs the quality gate, creates the commit, and creates or triggers the PR/MR update
- [`pr-update`](../skills/pr-update.md) — keeps the PR/MR description's changes table and Testing section in sync with later commits on the same branch

**Gap:** this playbook has no merge/deploy skill yet — merging the PR/MR and any deploy step still happen manually or via this project's existing CI/CD, outside Claude Code.

**Artifacts:** Merged PR/MR, closed or updated ticket.
