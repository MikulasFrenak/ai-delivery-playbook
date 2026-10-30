# AIPB-17 — Add self-healing-selectors skill + test-maintenance doc

**Ticket:** self-assigned (no tracker)
**Type:** Chore
**Status:** done — [PR #36](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/36), closed 2026-08-27
**Source:** reconstructed on 2026-10-29 from PR #36 and its commits — not written at the time; no acceptance criteria were recorded

---

## What & Why

The PR frames the problem as selector drift after UI changes breaking E2E tests, and positions selector healing against the other, larger causes of flaky tests rather than as a cure-all.

## What was built

`skills/self-healing-selectors.md` scaffolds DOM-fingerprint-based selector healing into a Playwright, Cypress or Selenium suite: LLM or deterministic candidate scoring, a confidence threshold, and a human-review fallback, wired into CI. It is paired with `docs/test-maintenance.md` (architecture and vocabulary, same pattern as `define-slo`/`sla-framework.md`). It was registered in `AGENTS.md`, `architecture.md`, `lifecycle/verification.md` and `docs/vocabulary.md` (5 new terms).

## Architecture Notes

- Cited prior art and figures (Healenium, Healwright; roughly 28% of flaky-test causes selector-related vs 65% timing/concurrency; Spotify's 4.5% → 0.4% quarantine result) were spot-checked by web search before landing. The doc's own point stands: selector healing addresses only a minority of flakiness.
- Generalized from an external draft, with everything specific to its original context stripped and checked by grep before committing.
