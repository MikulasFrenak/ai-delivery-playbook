---
name: verification
level: 3 - Software Delivery Lifecycle
status: documented
---

# Verification

**Purpose:** Confirm the implementation actually behaves as intended in a running environment — not just that it type-checks or that a test suite is green.

**Entry criteria:** Implementation stage complete — code written, lint/type-check/unit/component tests passing.

**Exit criteria:** The golden path and relevant edge cases have been observed working in a live/dev environment; anything caught here is fixed before moving to Release.

**Skills used:**
- [`verify-browser`](../skills/verify-browser.md) — drives the running app via Chrome DevTools MCP: console errors, DOM inspection, network calls, screenshots
- [`self-healing-selectors`](../skills/self-healing-selectors.md) — run when selector drift after UI changes is a recurring source of broken E2E tests at this stage, not on every pass through Verification; see [`docs/test-maintenance.md`](../docs/test-maintenance.md) for the architecture and for why this addresses only part of overall test flakiness

Automated tests (unit/component) are technically run inside `implement-task` Steps 7–8, but that's a prerequisite check, not this stage — Verification is about actually exercising the feature the way a user would, which automated tests don't fully substitute for.

**Artifacts:** Verification notes (what was checked and how), screenshots where DOM inspection wasn't sufficient.
