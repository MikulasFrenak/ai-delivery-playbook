---
name: release
level: 3 - Software Delivery Lifecycle
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

**In practice:** "existing CI/CD" isn't hypothetical — every personal project this playbook has actually run on (family-trails-eu, review-spa, this repo, and ZenSmash) deploys through the same real pipeline shape: GitHub Actions for cross-repo sync/build steps, Cloudflare Workers' own Git integration for the deploy itself (push to `main` → build → live, no manual `wrangler deploy` in the common case — see `mcp-server/remote/README.md` for the one build-config gotcha that shows up in that flow, twice now, once for production and once for PR previews). None of that lives in a skill yet, which is exactly the Gap above — but the absence of a skill isn't the same as the absence of practice.

This repo's own `mcp-server/` is the other side of "these are real projects, not a showcase" — it's what turns "documented skill" into "skill any of those other projects can actually pull and run at runtime," and review-spa/family-trails-eu both connect to it live rather than each carrying their own copy of `skills/*.md`. See `mcp-server/README.md` and `.tasks/AIPB-13.md` for what changed once a second, independent agent session actually exercised that path.

**Artifacts:** Merged PR/MR, closed or updated ticket.
