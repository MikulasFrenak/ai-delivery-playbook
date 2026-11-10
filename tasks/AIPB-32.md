# AIPB-32 — /perf-check: measure every page the same way, against a budget or an SLO

**Ticket:** self-assigned (solo repo, no external tracker — see AGENTS.md "Ticket IDs for solo/no-tracker projects")
**Type:** Feature
**Status:** done — [PR #59](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/59), closed 2026-11-10
**Source:** written at the time
**Related:** `/define-slo` (turns "it must be fast" into an SLI and a target; it came in a `TRIVIAL` commit, so it has no task file to link). [AIPB-27](./AIPB-27.md) — native mobile is the same "not yet proven" gap there. [AIPB-26](./AIPB-26.md) — this repo's CI, the model for a performance gate

---

## What & Why

The playbook can turn a vague "it has to be fast" into a measurable target (`/define-slo`, with server-side examples), but nothing measures a page against that target, and nothing covers a mobile app at all. The ask, 2026-11-10: a skill that runs the same measurement on every page of a site, so the result can be compared with the design's targets and the SLOs, and reused on client projects.

The first real run was on the author's own portfolio site: mobile scored 54 while desktop scored 99, the cause was a 1.7 MB image plus render-blocking fonts, and the JavaScript was small. A skill that reports only a score would have missed that. This one reads the causes.

The constitution's principle IV says a pattern runs live before it is written up as a skill. The measurement half has: pinned Lighthouse, mobile and desktop, several runs, median, on two live sites of different stacks. The CI gate and real-visitor data have not, and the skill and its doc say so, per step. The first live pass of both is the portfolio repo's follow-up ticket; a later ticket here updates the labels after it.

## Acceptance Criteria

- [x] `skills/perf-check.md`: frontmatter per `CONTRIBUTING.md`; Inputs, Output, Guardrails; a workflow from scope to report: confirm scope and permission, build the page list, pin the method, run, summarise by median, compare with the budget, read the causes, state the field-data status, write the report
- [x] Guardrails written from what the live run showed or what the sources say: never run against sites the user doesn't own or isn't allowed to test; a page that calls a metered third-party API (maps, payments) is run once or not at all; never run two reports at once on one machine; budgets are never invented; a lab score is not a field result
- [x] `docs/web-performance.md`, paired with the skill: Core Web Vitals thresholds from their primary source, lab versus field, how a performance ask maps to `/define-slo`'s SLI, target and window, the method and why it is pinned, a worked example from the live run, and a proven / not-yet-proven table
- [x] The commands in the skill ran for real in this ticket (pinned Lighthouse, mobile ×3 and desktop ×1 per page, the summary script on real output), and the doc's worked example uses that output
- [x] Registered: `AGENTS.md` skills table, `architecture.md` Level 1 list, `lifecycle/verification.md`; `/define-slo` points to it for web page speed
- [x] `tasks/README.md` row, `PLAN.md` status; `check-docs.mjs` passes; added lines scanned for leaks

## What was built

`/perf-check`, a ten-step procedure with a pinned method and the run and summary commands inline, and the paired
`docs/web-performance.md` with thresholds, lab versus field, the mapping to `/define-slo`, a worked example and a
proven / not-yet-proven table. The commands ran on two live sites first. Registered in `AGENTS.md`, `architecture.md`
and `lifecycle/verification.md`, with a pointer from `/define-slo`.

## Open Questions

Still open; **moved to `PLAN.md`** → Open questions, since it needs a live run and not a decision here.

- How should a native mobile app be measured (startup time, dropped frames, binary size)? Needs a live run on a real app, as `docs/mobile-agent-loop.md` says for driving the UI. Not decided here.

## Architecture Notes

- Lighthouse's version is pinned in the skill because its scoring weights have changed between versions (its own scoring page says so), so scores from different versions don't compare.
- The skill measures, compares and reports. It changes nothing in the site under test, and a fix is a ticket of its own.
