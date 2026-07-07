# Worked Example: AIPB-01 — Add CONTRIBUTING.md

A real `feature-delivery` run, not a hypothetical. Ticket ID was invented for the dry run (no issue tracker was connected in this session) — everything after that is what actually happened.

**Trigger:** A chore — add a `CONTRIBUTING.md` documenting how to add a new skill to this playbook.

**Workflow:** [`feature-delivery`](../workflows/feature-delivery.md), Task path (no Story to decompose, so `analyze-story` was skipped per the workflow's own branch point).

## Trace

1. **[`create-task`](../skills/create-task.md)** — no tracker connected, so the ticket content was supplied directly instead of fetched. The research step (Step 4 today, "Step 3b" at the time) surfaced 3 structural options for the doc; recommended one (cross-reference `CLAUDE.md` instead of duplicating its conventions) rather than picking arbitrarily. Explored the actual repo to confirm the 3 real registration points a new skill needs. Wrote `.tasks/AIPB-01.md` using the Chore template.
2. **[`implement-task`](../skills/implement-task.md)** — package root was the repo root itself (single-repo, not a monorepo). Design-reading, architecture-decision, and most per-package sub-steps (QA selectors, state, i18n, flags) were genuinely N/A for a docs-only chore — dropped rather than forced, per the skill's own "drop what doesn't apply" rule. Wrote `CONTRIBUTING.md` and linked it from `README.md`.
3. **[`verify-browser`](../skills/verify-browser.md)** — skipped. No running app to verify; a docs-only repo has nothing to point a browser at.
4. **[`commit`](../skills/commit.md)** — this is where the run got interesting. Step 2.5 ("Announce What Will Be Staged") surfaced that the working tree held far more than AIPB-01's scope — an entire prior session's worth of unrelated playbook-scaffolding work was sitting uncommitted alongside it. That triggered a real human-in-the-loop decision (not a scripted one): bundle everything into one commit, or keep them honestly separate? The user chose separate. Result: two commits, two branches (`chore/AIPB-01/add-contributing-guide` and `trivial/scaffold-ai-delivery-playbook`), each traceable to what it actually contains.
5. **[`public-repo-check`](../skills/public-repo-check.md)** — ran for real (it's read-only and safe to always run). Clean.
6. **[`pr-update`](../skills/pr-update.md)** — not run; no follow-up commits landed on the branch.
7. **Push + PR** — required installing and authenticating the `gh` CLI first (another real human step: browser-based OAuth login, which can't be completed by an agent). Once authenticated, both branches were pushed and both PRs opened in one pass.

**Outcome:** [PR #1](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/1) (AIPB-01) and [PR #2](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/2) (the separated scaffold work), both later merged.

## What this run actually validated

Not "the skills produce files" — that's the easy part. The valuable signal was that `commit`'s Step 2.5 staging announcement did its job: it caught scope creep *before* it became bad git history, and routed the decision to a human instead of silently guessing. That's the mechanism working as designed, on a real (if self-inflicted) messy working tree.
