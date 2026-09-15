# Eval scorecard — branch-cleanup

## Judgment call evaluated

Given a local branch and its host (GitHub) PR state, classify it as one of: **confirmed-merged** (safe to delete), **open PR** (leave alone), **no PR/MR found** (leave alone, flag as possible unpushed work), or **host unavailable** (fall back to `git branch --merged` alone, mark unverified). This is the classification in `skills/branch-cleanup.md` Step 4, cross-checked in Step 3 against the cheap `git branch --merged` pass first.

**Why now:** not a known wrong call — none has been observed. This is the "periodic check for a high-frequency skill" trigger from `agent-eval`'s own Step 1: `branch-cleanup` is the most-exercised skill in this repo's practice per `PLAN.md`'s own Status line, so it's due a real baseline before it's ever gated on one.

## Rubric

Exact-match. For each branch: does the classification actually applied match the independently-verifiable correct answer (GitHub's own PR state via `gh pr view`/`gh pr list`, corroborated where applicable by `git branch -d` succeeding without needing `-D`)?

## Golden set

20 real cases, all from this repo's own actual `branch-cleanup` usage across one working session (2026-09-05 to 2026-09-15) — no invented examples. Sourced from this session's real tool invocations and cross-checked against `gh pr list --state all` (the authoritative source, not conversational memory) before being recorded here.

| # | Branch | Correct classification | Ground truth | Actually classified | Correct? |
|---|---|---|---|---|---|
| 1 | `trivial/branch-cleanup-skill` | Delete | PR #22, #23 merged | Delete | ✅ |
| 2 | `trivial/remove-completed-aipb12-task-file` | Delete | PR #21 merged | Delete | ✅ |
| 3 | `chore/AIPB-13/fix-setup-doc-and-task-file` | Delete | PR #25 merged | Delete | ✅ |
| 4 | `chore/AIPB-13/get-skill-fetch-and-follow` | Delete | PR #24 merged | Delete | ✅ |
| 5 | `chore/AIPB-14/host-agnostic-branch-skills` | Delete | PR #26 merged | Delete | ✅ |
| 6 | `trivial/release-doc-real-cicd-and-mcp-proof` | Delete | PR #27 merged | Delete | ✅ |
| 7 | `trivial/pr-update-create-if-missing` | Delete | PR #31 merged | Delete | ✅ |
| 8 | `trivial/solo-project-ticket-ids-and-plan` | Delete | PR #32 merged | Delete | ✅ |
| 9 | `trivial/cloudflare-mcp-docs` | Delete | PR #33 merged | Delete | ✅ |
| 10 | `feature/AIPB-15/agent-eval-skill` | Delete | PR #34 merged | Delete | ✅ |
| 11 | `feature/AIPB-16/wire-agent-eval-into-contributing` | Delete | PR #35 merged | Delete | ✅ |
| 12 | `chore/AIPB-17/self-healing-selectors-skill` | Delete | PR #36 merged | Delete | ✅ |
| 13 | `chore/AIPB-18/mcp-check-skill` | Delete | PR #37 merged | Delete | ✅ |
| 14 | `trivial/personal-tooling-log-not-a-fit` | Delete | PR #38 merged | Delete | ✅ |
| 15 | `trivial/gitignore-claude-local-state` | Delete | PR #40 merged | Delete | ✅ |
| 16 | `trivial/contributing-skill-doc-pairing` | Delete | PR #41 merged; caught via the cheap `--merged main` pass (Step 3), not a host query | Delete | ✅ |
| 17 | `worktree-agent-abeb7c898a6cb2008` | Delete | Never had its own PR — its content landed via #41; caught via `--merged main` directly | Delete | ✅ |
| 18 | `chore/AIPB-19/worktree-parallel-agents` | Delete | PR #42 merged | Delete | ✅ |
| 19 | `chore/AIPB-20/security-check-skill` | Delete | PR #43 merged | Delete | ✅ |
| 20 | `trivial/register-ai-review-prefix` | **Leave alone** (open PR) | PR #39 open at the time (`createdAt` 06:47, `closedAt` 06:50 the same morning) | Leave alone | ✅ |

**Coverage gap, stated plainly per this skill's own Step 8 requirement:** 19 of 20 real cases are "confirmed-merged → delete." Only one real "leave alone" case exists (#20), and it wasn't reached through a literal `branch-cleanup` invocation in the moment — it's a real historical PR state reasoned through post-hoc, not a live run. **Zero real cases exist for "no PR/MR found" or "host unavailable."** This 20/20 score is real and not invented, but it verifies the *delete* path far more thoroughly than the *leave-alone* paths — say so explicitly rather than letting a clean score imply uniform confidence.

## Score history

| Date | Score | Baseline before | Regression? | Notes |
|---|---|---|---|---|
| 2026-09-15 | 20/20 (100%) | — (first run) | — | Initial baseline. Every "delete" case corroborated two independent ways: `gh pr view`/`gh pr list` confirmed merged, and `git branch -d` (not `-D`) succeeded without git's own ancestry check ever needing an override. |

## Regression threshold

100% — but see the coverage-gap note above. A future run that regresses on a *delete* classification is a real problem; a future run that finally exercises a real "no PR found" or "host unavailable" case and gets it wrong wouldn't lower this number today, since none exists in the set yet. Extend the golden set with those cases the first time they occur for real, per this skill's own Guardrail against inventing them.

## Accepted trade-offs (if any)

None yet.
