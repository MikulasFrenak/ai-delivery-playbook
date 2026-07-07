# AIPB-01 — Add a CONTRIBUTING.md for skill authoring

**Ticket:** (invented for a feature-delivery dry run — no tracker connected in this session)
**Type:** Chore

---

## What & Why

Contributors adding a new skill to this playbook currently have to reverse-engineer the pattern from existing skills and this session's history. There's no single doc that says: here's the frontmatter convention, here's how to anonymize a skill sourced from a real project, here's where you have to register it (three places, easy to miss one).

## Plan

- [x] Research approach — recommend a short CONTRIBUTING.md that links to `CLAUDE.md` for conventions it already owns, rather than duplicating them (see chosen approach above)
- [x] Confirm the exact registration points a new skill needs (`skills/`, `architecture.md`'s Level 1 list, `CLAUDE.md`'s skills table)
- [x] Write `CONTRIBUTING.md` with: how to propose a change, the skill-authoring checklist, a pointer to `public-repo-check` before publishing
- [x] Link `CONTRIBUTING.md` from `README.md`

## Files to Touch

| File | Change |
|---|---|
| `CONTRIBUTING.md` | new — skill-authoring guide and general contribution flow |
| `README.md` | add a one-line pointer to `CONTRIBUTING.md` |

## Architecture Notes

This is a docs-only chore on the playbook's own repo root — there's no package, component, or app here, so most of `implement-task`'s per-package steps (QA selectors, state store, i18n, feature flags) don't apply. That's expected: `implement-task` explicitly says to drop irrelevant steps rather than force them.
