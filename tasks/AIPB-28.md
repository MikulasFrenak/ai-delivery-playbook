# AIPB-28 — Review rounds that converge: re-review, pre-existing findings, depth by risk

**Ticket:** self-assigned (solo repo, no external tracker — see AGENTS.md "Ticket IDs for solo/no-tracker projects")
**Type:** Chore
**Status:** open
**Source:** reconstructed on 2026-11-09 from its commit `1711013` (made in an earlier session, pushed as `trivial/review-pr-learnings`) and the source it cites; the ticket was added at PR time, promoted from `TRIVIAL` because the change alters how two skills behave and adds a workflow
**Related:** [AIPB-21](./AIPB-21.md) and [AIPB-25](./AIPB-25.md) — earlier specs of `/review-pr` and `/review-comment-style`; both carry `Updated by: AIPB-28`. [AIPB-15](./AIPB-15.md) — `docs/eval-framework.md`, which gains a section. [AIPB-24](./AIPB-24.md) — the CI AI review written to `review-pr`'s rules

---

## What & Why

`/review-pr` treated every round of a PR as a first review. It avoided repeating comments someone else had posted, but nothing scoped a later round to the new commits, capped the rounds, separated problems the PR didn't introduce from ones it did, or tied an approval to a commit. Depth followed size ("no test run for a docs-only change"), not risk.

The Claude Code team's write-up on its own code review ([How the Claude Code team does code review](https://claude.dev/blog/solving-code-review-at-anthropic/), claude.dev blog, 2026-10-15) reports these failure modes and what fixed them. One PR ran more than fifty rounds overnight, and about 59% of what the reviewer kept flagging had been there since its first pass. The fixes were a round cap, delta-only re-review, a bug class reported once, no repeat findings, and a bot verdict that never counts as a person's approval. The source was checked on 2026-11-09: the page exists and supports each of those points.

## Acceptance Criteria

Written after the change, and checked against it rather than planned before it.

- [ ] `/review-pr` has a Re-review section: review only the delta since the last reviewed SHA, check earlier findings against the code (Fixed / Not fixed / Answered), don't re-raise, report a class of bug once with all its instances, call a late finding in old code a review miss, suggest reconsidering the approach after the third round with new findings, and treat new commits as invalidating an approval
- [ ] `/review-pr` checks whether a problem is pre-existing against the base, sets depth by risk, records the head SHA it reviewed, and says a bot or agent verdict never fills a required human approval
- [ ] `/review-comment-style` has a `[Pre-existing]` tag that is never `[Must]`, a count line, a cap of three nits, and the reviewed SHA and round in the summary
- [ ] New `workflows/pr-review.md` ties the two skills into rounds, with a risk table, a convergence rule and exit criteria; linked from `workflows/feature-delivery.md` and `architecture.md`, and `AGENTS.md`'s `/review-pr` row mentions re-review
- [ ] `docs/eval-framework.md` says what to measure for a review skill, citing the source
- [ ] `node .github/scripts/check-docs.mjs` and `/public-repo-check` pass

## Plan

The content is already done in `1711013`. This ticket adds the task file, the `Updated by` links on AIPB-21 and AIPB-25, and the `tasks/README.md` row, and opens the PR from a branch named for the ticket.

## Open Questions

- This repo's own CI review (`.github/workflows/claude-review.yml`) has its own copy of the review rules in its prompt, written to `review-pr`'s rules per AIPB-24. It doesn't have the new ones (`[Pre-existing]`, the count line, the nit cap, re-review of the delta). Neither, probably, does the AI-review template in `/github-actions-setup` that adopters copy. Bring both in line, or point the prompt at the skill file instead of copying its rules?

## Architecture Notes

- The round cap is three, as in the source. After that the reviewer says so and suggests reconsidering the approach; it doesn't stop reviewing.
- A pre-existing problem never blocks and never counts against the author. It is still reported, in its own list, because the reviewer did find it.
- Depth by risk names CI and deploy workflows, auth, payments, installers, migrations and code that sets a pattern. Those get every line read and the mechanical checks, whatever their size.
