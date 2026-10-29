# AIPB-15 — Add agent-eval skill: golden-set scoring for skill judgment calls

**Ticket:** self-assigned (no tracker)
**Type:** Feature
**Status:** done — [PR #34](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/34), closed 2026-08-23
**Source:** reconstructed on 2026-10-29 from PR #34 and its commit — not written at the time; no acceptance criteria were recorded
**Updated by:** [AIPB-16](./AIPB-16.md), [AIPB-22](./AIPB-22.md)

---

## What & Why

Skill changes were judged by spot-checks. There was no measured way to know whether a change to a skill made one of its judgment calls better or worse. A golden set and rubric per judgment call turns "seems fine" into a score that a change must not regress.

## What was built

`skills/agent-eval.md` builds a golden set and rubric for one specific judgment call a skill makes, scores the current implementation, and gates a pending change on the score not regressing. It mirrors `define-slo`'s shape. It is paired with a new `docs/eval-framework.md` (golden set, rubric, score, baseline, regression; cites OpenAI Evals and Anthropic's "Building Effective Agents"). A new `evals/` directory holds the durable scorecards. It was registered in `AGENTS.md` and `architecture.md`.

## Architecture Notes

- Not a day-one skill: it needs real usage history to build a golden set from. Run it after a skill has had real runs, ideally after a known wrong call or before changing a skill that already has a scorecard.
- Scorecards live in `evals/`, not in task files, because score history only means something if it survives past the ticket that created it. At the time, task files were deleted on merge; since AIPB-22 they are kept too, but a scorecard still belongs to a skill and spans many tickets.
