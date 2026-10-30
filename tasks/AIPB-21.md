# AIPB-21 — Add review-pr and review-comment-style skills

**Ticket:** self-assigned (no tracker)
**Type:** Chore
**Status:** done — no PR: committed directly to `main` as `52841d7` on 2026-10-29 (also pushed as `chore/AIPB-21/review-pr-skills`), against this repo's own "every change via a PR" rule
**Source:** reconstructed on 2026-10-29 from its single commit — not written at the time; no acceptance criteria were recorded

---

## What & Why

The commit states no motivation beyond the two skills it adds.

## What was built

`skills/review-pr.md` is a read-only PR review with a verdict table, a Project-specific section to fill in per repo, and a Private overlay rule. `skills/review-comment-style.md` formats review drafts as one inline comment per finding with a severity tag, evidence and fix (optionally a suggestion block), plus a summary of Verified / Must fix / Non-blocking / Not verified. Both are registered in `AGENTS.md`, `architecture.md`, `lifecycle/verification.md` and `docs/vocabulary.md`.
