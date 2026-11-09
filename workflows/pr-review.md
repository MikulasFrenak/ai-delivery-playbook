---
name: pr-review
level: 2 - Workflow
status: documented
uses_skills: [review-pr, review-comment-style, pr-update]
---

# pr-review

**Trigger:** A PR/MR is ready for review, or new commits landed on one that was already reviewed.

**Principle:** Review should cost the least human time that does not raise reverts or incidents. Automated checks and the first review round catch routine mistakes, so a person's attention goes to what only a person can judge. Revert and incident rates are the guardrail: if they rise, time was not saved, only moved.

**Sequence:**

1. **Before the PR:** the author runs the repo's own checks (tests, lint, types, build) and shows the output instead of saying it is done. For AI-written changes, the author is the person who directed the agent, and counts as a reviewer of it.
2. **Required CI** runs and blocks the merge when red. A review does not re-do what CI already proves.
3. [`review-pr`](../skills/review-pr.md) (with [`review-comment-style`](../skills/review-comment-style.md)) — a read-only review that returns verified findings, a verdict and paste-ready drafts. Depth follows risk (see below).
4. **A person decides.** They post or edit the drafts and pick the verdict. A bot or agent verdict never fills a required human approval.
5. **The author answers every finding:** fixes it, or resolves the thread with a reason. [`pr-update`](../skills/pr-update.md) keeps the description in sync with follow-up commits.
6. **Re-review** with `review-pr` (its "Re-review" section): only the delta since the last reviewed SHA, earlier findings checked against the code, nothing re-raised, a class of bug reported once with all its instances.
7. **Approval names a commit.** New commits, especially agent pushes and hand-resolved merges, need a fresh check before the approval is trusted again.

**Risk sets the depth, not size:**

| Risk | Examples | Review |
|---|---|---|
| Low | Docs, copy, additive changes behind a flag | Read-through and hygiene checks; one person, or none if the repo allows it |
| Medium | Ordinary product changes | Full `review-pr`; one person |
| High | CI and deploy workflows, auth, payments, installers and updaters, migrations, code that sets a pattern others copy | Full `review-pr` with mechanical checks, and a person who reads the evidence; two people where the repo requires it |

Let the repo's owners list the paths that always need a person (CODEOWNERS and branch protection do this), and start strict before loosening.

**Convergence:** count rounds. After the third round that still finds something new, stop fixing line by line and reconsider the approach with the author. Most late findings are old code, not new bugs, so a late finding in code that was already in the first round is recorded as a review miss.

**Feedback loop:** when a review misses something or a comment is wrong, fix it at the source, in the skill, the repo's own review instructions, or a lint rule, not by repeating the comment on the next PR. See "What to measure for a review skill" in [`eval-framework`](../docs/eval-framework.md).

**Exit criteria:** every finding fixed or closed with a reason, CI green, the required approvals given on the final commit, PR/MR merged.
