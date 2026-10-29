# AIPB-01 — Add a CONTRIBUTING.md for skill authoring

**Ticket:** (invented for a feature-delivery dry run — no tracker connected in this session)
**Type:** Chore
**Status:** done — [PR #1](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/1), closed 2026-07-07
**Source:** restored from git history and closed out in [AIPB-22](./AIPB-22.md)
**Updated by:** [AIPB-07](./AIPB-07.md), [AIPB-08](./AIPB-08.md), [AIPB-16](./AIPB-16.md)

---

## What & Why

Contributors adding a new skill to this playbook currently have to reverse-engineer the pattern from existing skills and this session's history. There's no single doc that says: here's the frontmatter convention, here's how to anonymize a skill sourced from a real project, here's where you have to register it (three places, easy to miss one).

## What was built

`CONTRIBUTING.md`: how to propose a change, the skill-authoring checklist (frontmatter convention, anonymizing a skill sourced from a real project, running `public-repo-check`, the three places a new skill must be registered), and how to fold a new skill into a workflow or lifecycle doc. The planned `README.md` pointer shipped in the separate scaffold PR (#2), because it sat in the same working-tree hunk as an unrelated edit.

## Architecture Notes

This is a docs-only chore on the playbook's own repo root — there's no package, component, or app here, so most of `implement-task`'s per-package steps (QA selectors, state store, i18n, feature flags) don't apply. That's expected: `implement-task` explicitly says to drop irrelevant steps rather than force them.
