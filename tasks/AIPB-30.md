# AIPB-30 — CI review follows the review skills and the constitution, read from the base branch

**Ticket:** self-assigned (solo repo, no external tracker — see AGENTS.md "Ticket IDs for solo/no-tracker projects")
**Type:** Chore
**Status:** done — [PR #57](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/57), closed 2026-11-09
**Source:** written at the time
**Related:** [AIPB-24](./AIPB-24.md) wrote `/github-actions-setup`'s AI-review template and [AIPB-26](./AIPB-26.md) this repo's `claude-review.yml` — both carry `Updated by: AIPB-30`. [AIPB-28](./AIPB-28.md) and [AIPB-29](./AIPB-29.md) parked the question this answers
**Updated by:** [AIPB-31](./AIPB-31.md) — the re-review range is taken only from the workflow's own summary

---

## What & Why

The CI review (`claude-review.yml`) and the AI-review template in `/github-actions-setup` each keep their own summary of `review-pr`'s rules. AIPB-28 changed those rules (re-review of the delta, `[Pre-existing]`, the count line, the nit cap, the reviewed SHA) and AIPB-29 added the constitution check, and neither copy has them. The copies drift because they are copies.

The obvious fix, telling the bot to read `skills/review-pr.md`, has a catch: the job checks out the PR, so a PR that edits `review-pr.md` or `CONSTITUTION.md` would be reviewed by its own edited rules. Decided 2026-11-09 (option 3 of three): the bot reads the rules from the **base branch** with `git show origin/<base>:<path>`. It follows what is merged, never what the PR proposes. The prompt keeps only what is specific to CI, plus a short fallback for repos without the skills.

## Acceptance Criteria

- [x] `claude-review.yml`'s prompt reads `review-pr.md`, `review-comment-style.md`, `CONSTITUTION.md`, `AGENTS.md` and `CONTRIBUTING.md` from the base branch, never from the checkout, and reviews changes to those files as content under the base rules
- [x] The prompt keeps the CI differences inline: it posts (the skills say never post), runs no tests, never approves or requests changes, and treats a constitution break as `[Must]` naming the principle
- [x] A label re-run is a re-review: it finds the last summary's reviewed SHA and reviews only the delta; with no SHA, or one no longer in history, it reviews the whole PR
- [x] The summary follows `review-comment-style`: count line, reviewed SHA (round and range on a re-review), `[Pre-existing]` section, at most three nits
- [x] `--allowedTools` adds `git blame` and `git merge-base`, both read-only, for the pre-existing check
- [x] `/github-actions-setup` Step 5 describes the same shape for adopters, with the old inline rules as the fallback when a repo has no review skill
- [x] `docs/ci.md` says where the rules come from and how a re-run works; `PLAN.md`'s open question is closed
- [x] Workflow YAML parses; `check-docs.mjs` and `/public-repo-check` pass

## What was built

`claude-review.yml` reads `review-pr`, `review-comment-style`, `CONSTITUTION.md`, `AGENTS.md` and `CONTRIBUTING.md` from
the base branch and follows them, with the CI differences inline. A label re-run reviews only the delta since the last
summary's reviewed SHA. `git blame` and `git merge-base` are allowed for the pre-existing check. `/github-actions-setup`
Step 5 gives adopters the same shape, with the old rules as the fallback, and `docs/ci.md` explains it.

## Open Questions

Still open; **moved to `PLAN.md`** → Open questions. Every criterion above was checked statically, on the files; none of them shows the prompt works in a real run.

- Verifying it needs one real run: add the `claude-review` label to this PR. Each run is a paid session, so that's the user's call.

## Architecture Notes

- Reading from the base branch doesn't stop a PR from editing the workflow file itself. A same-repo `pull_request` run uses the PR's own copy of the workflow, which is GitHub's behavior and not something a prompt can change. That edit is visible in the diff, `.github/` is high-risk under `workflows/pr-review.md`, and CODEOWNERS or branch protection is the guard. Fork PRs never get the review (no secrets, and the job's `if`).
- Re-review depends on the SHA the previous summary names, so reviews posted before this change trigger a full review once.
