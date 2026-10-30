---
name: release
level: 3 - Software Delivery Lifecycle
status: documented
---

# Release

**Purpose:** Get the verified change into the hands of users — merged, and visible to reviewers and stakeholders with an accurate description of what changed.

**Entry criteria:** Change is implemented and verified.

**Exit criteria:** PR is merged, the ticket is updated/closed, and the task file is closed out with its PR linked (see the Task file lifecycle in `AGENTS.md`).

**Skills used:**
- [`commit`](../skills/commit.md) — generates the commit message, runs the quality gate, creates the commit, and creates or triggers the PR/MR update
- [`pr-update`](../skills/pr-update.md) — keeps the PR/MR description's changes table and Testing section in sync with later commits on the same branch
- [`github-actions-setup`](../skills/github-actions-setup.md) — sets up the GitHub Actions that gate and ship a merge: a check on every PR, PR hygiene (description, tests, ticket ID), and a deploy on merge that ships only the checked build. It's a one-time setup per repo, not a per-ticket step

**Gap:** merging the PR/MR stays a human decision, and the playbook has no rollout/rollback skill yet. [`github-actions-setup`](../skills/github-actions-setup.md) automates the deploy *after* a merge on GitHub (checks first, then the checked build). It doesn't decide *how* a change reaches users: staged rollout, feature-flag lifecycle, rollback. [`docs/deployment.md`](../docs/deployment.md) writes down the shape of a deploy setup and the decisions it forces, but a doc isn't a skill, and those decisions still happen outside one.

**In practice:** "existing CI/CD" isn't hypothetical — every personal project this playbook has actually run on (family-trails-eu, review-spa, this repo, and ZenSmash) deploys through the same real pipeline shape: GitHub Actions for cross-repo sync/build steps, Cloudflare Workers' own Git integration for the deploy itself (push to `main` → build → live, no manual `wrangler deploy` in the common case — see `mcp-server/remote/README.md` for the one build-config gotcha that shows up in that flow, twice now, once for production and once for PR previews). None of that lives in a skill yet, which is exactly the Gap above — but the absence of a skill isn't the same as the absence of practice.

This repo's own `mcp-server/` is the other side of "these are real projects, not a showcase" — it's what turns "documented skill" into "skill any of those other projects can actually pull and run at runtime," and review-spa/family-trails-eu both connect to it live rather than each carrying their own copy of `skills/*.md`. See `mcp-server/README.md` and `tasks/AIPB-13.md` for what changed once a second, independent agent session actually exercised that path.

**Artifacts:** Merged PR/MR, closed or updated ticket.
