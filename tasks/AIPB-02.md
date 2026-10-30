# AIPB-02 — Polish create-task.md from external review

**Ticket:** (invented for a feature-delivery dry run — same pattern as AIPB-01)
**Type:** Chore
**Status:** done — [PR #3](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/3), closed 2026-07-07
**Source:** restored from git history and closed out in [AIPB-22](./AIPB-22.md)
**Updated by:** [AIPB-16](./AIPB-16.md), [AIPB-22](./AIPB-22.md)
**Worked example:** [examples/AIPB-02.md](../examples/AIPB-02.md)

---

## What & Why

An external review of `skills/create-task.md` flagged 4 items. After checking each against the actual file, 3 are real and worth doing; 1 (Markdown table rendering) was a viewer artifact, not a source defect — the table is valid GFM, confirmed by scanning every table in the file for column-count mismatches. Not touching that one.

## What was built

`create-task.md` got an Inputs/Output section, a Guardrails section restating its existing confirmation and planning-only rules, and step renumbering (`Step 3b` → `Step 4`, cascading; `Step 1a` stays lettered as a real conditional branch). The renumbering also fixed a stale "template in Step 6" reference. The two cross-references in `lifecycle/architecture.md` and `workflows/design-system-update.md` were updated to match.

## Open Questions

- Should Inputs/Outputs become a standard section across all skills? **Answered by practice, not by decision:** it never became a rule. As of 2026-10-29, 6 of 22 skills have an Inputs section.

## Architecture Notes

Skipping item 1 (table rendering) entirely — verified against raw file bytes, no defect present. Recorded here so a future pass doesn't waste time re-investigating the same non-issue.
