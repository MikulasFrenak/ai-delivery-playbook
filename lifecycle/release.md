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

**In practice:** "existing CI/CD" isn't hypothetical. The personal projects this playbook has run on deploy through one of two real shapes:

- **The host's Git integration** (family-trails-eu, review-spa, ZenSmash): GitHub Actions for cross-repo sync steps, Cloudflare's own Git build for the deploy. See `mcp-server/remote/README.md` for the build-config gotcha that shows up in that flow.
- **A deploy from GitHub Actions after the checks**, with a testing deploy per PR at its own address: this repo's MCP server since AIPB-26 ([`docs/ci.md`](../docs/ci.md)), and the project traced in [`examples/AIPB-24.md`](../examples/AIPB-24.md).

[`/github-actions-setup`](../skills/github-actions-setup.md) sets up the second, and says when to keep the first.

This repo's own `mcp-server/` is the other side of "these are real projects, not a showcase" — it's what turns "documented skill" into "skill any of those other projects can actually pull and run at runtime," and review-spa/family-trails-eu both connect to it live rather than each carrying their own copy of `skills/*.md`. See `mcp-server/README.md` and `tasks/AIPB-13.md` for what changed once a second, independent agent session actually exercised that path.

**Artifacts:** Merged PR/MR, closed or updated ticket.
