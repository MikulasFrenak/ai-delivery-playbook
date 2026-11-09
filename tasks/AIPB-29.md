# AIPB-29 — Constitution: the principles every plan and PR is checked against

**Ticket:** self-assigned (solo repo, no external tracker — see AGENTS.md "Ticket IDs for solo/no-tracker projects")
**Type:** Chore
**Status:** done — [PR #56](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/56), closed 2026-11-09
**Source:** written at the time
**Related:** [AIPB-06](./AIPB-06.md) parked the Principles doc; [AIPB-22](./AIPB-22.md) made SDD the working style and wrote `/create-task` Step 5; [AIPB-21](./AIPB-21.md) wrote `/review-pr`'s Step 4. Each carries `Updated by: AIPB-29`

---

## What & Why

Spec-driven development is this playbook's working style since AIPB-22, and its first stage, the constitution, was the one piece still missing. GitHub Spec Kit (v1.3.3, checked 2026-11-09) runs `/speckit.constitution` once per project: a short set of numbered principles, each with must-rules and a rationale, plus governance. Its plan template has a "Constitution Check" gate, so a plan that breaks a principle has to change.

The Principles doc was parked in AIPB-06 because a constitution written before real use "risks describing principles that don't actually hold up". After 28 tickets that risk is gone: each principle here is a rule this repo already follows and something already enforces — a CI check, a skill step, or an `AGENTS.md` rule. The doc writes down what holds, rather than adding new rules.

Decided 2026-11-09 with the user: seven principles, at the repo root as `CONSTITUTION.md`. A section in `AGENTS.md` would get lost in a file that is also a template; adopting Spec Kit itself would tie the playbook to one tool and duplicate skills it already has.

## Acceptance Criteria

- [x] `CONSTITUTION.md` has seven principles. Each has must-rules, a rationale and where it is enforced, and every enforcement it claims is true today
- [x] Governance: where it sits relative to `AGENTS.md`, how it is amended (own ticket and PR), versioning, and how compliance is checked; a version line with ratified and last-amended dates
- [x] `/create-task` checks the plan against the constitution, if the repo has one; `/review-pr` treats breaking a principle's must-rule as `[Must]`
- [x] `AGENTS.md` lists `CONSTITUTION.md` in the Repo Layout and has a short template section for adopters; `docs/vocabulary.md` has the term
- [x] `docs/future-considerations.md`'s parked Principles doc points to the constitution; `PLAN.md`'s SDD mapping uses Spec Kit's current command names (re-checked against its repo and docs) and lists the stages it doesn't map yet
- [x] `node .github/scripts/check-docs.mjs` and `/public-repo-check` pass

## What was built

`CONSTITUTION.md` with seven principles, each with must-rules, a rationale and what enforces it today, plus governance
(authority over `AGENTS.md`, amendments as their own ticket, SemVer, v1.0.0). `/create-task` checks a plan against it and
`/review-pr` a PR. It's registered in `AGENTS.md` with a template section for adopters, in `docs/vocabulary.md` and in
`docs/future-considerations.md`. `PLAN.md`'s SDD mapping now uses Spec Kit's current command names.

## Open Questions

Still open; **moved to `PLAN.md`** → Open questions, merged with AIPB-28's question about the same file.

- Should the CI review (`claude-review.yml`) check PRs against the constitution too? It has its own copy of the review rules — the same question AIPB-28 parked in `PLAN.md`; answer both together.

## Architecture Notes

- From the parked list, "observable" and "incremental adoption" are left out. Nothing enforces them yet, and principle IV says not to write down what isn't real.
- A conflict between a plan and a principle is solved by changing the plan. Changing the principle is an amendment, with its own ticket. This follows Spec Kit's rule that violations are fixed in the spec or plan, not by watering the principle down.
- This PR breaks principle VII on day one. It was opened while #55 (AIPB-28) was still open, and both touch `tasks/README.md` and `PLAN.md`, so it is stacked on #55's branch rather than started from `main`; #55 merges first. Same as #46/#47 in AIPB-22. The constitution doesn't get a stacking exception for it: an exception would be a new rule, and an amendment is its own ticket.
