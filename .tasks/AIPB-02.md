# AIPB-02 — Polish create-task.md from external review

**Ticket:** (invented for a feature-delivery dry run — same pattern as AIPB-01)
**Type:** Chore

---

## What & Why

An external review of `skills/create-task.md` flagged 4 items. After checking each against the actual file, 3 are real and worth doing; 1 (Markdown table rendering) was a viewer artifact, not a source defect — the table is valid GFM, confirmed by scanning every table in the file for column-count mismatches. Not touching that one.

## Plan

- [x] Add an Inputs/Outputs section near the top — scoped to `create-task` only for now
- [x] Renumber `Step 3b` → `Step 4` and cascade (old 4→5, 5→6, 6→7). `Step 1a` stays lettered — it's a genuine conditional branch, unlike `3b`
- [x] Fix the stale "template to use in Step 6" reference in (old) Step 3 — confirmed it now correctly points at "Write the Task File" after the renumbering shifted that step to Step 6
- [x] Update the two repo-wide cross-references to `create-task`'s step numbers: `lifecycle/architecture.md` ("Step 3b" → "Step 4") and `workflows/design-system-update.md` ("Step 4 (Explore the Codebase)" → "Step 5 (Explore the Codebase)")
- [x] Add a "Guardrails" section — restates existing behavior (Step 1's overwrite-confirmation, Step 1a's ticket-creation-confirmation, the planning-only scope from the frontmatter) as a scannable list, not new behavior

## Files to Touch

| File | Change |
|---|---|
| `skills/create-task.md` | Inputs/Outputs section, step renumbering, Guardrails section |
| `lifecycle/architecture.md` | Update stale step-number reference |
| `workflows/design-system-update.md` | Update stale step-number reference |

## Open Questions

- Should Inputs/Outputs become a standard section across all 8 skills? Deferred — not deciding that here. Not adding a meta-note inside `create-task.md` either, since that would be noise for someone actually running the skill; raising it directly in the PR/report instead.

## Architecture Notes

Skipping item 1 (table rendering) entirely — verified against raw file bytes, no defect present. Recorded here so a future pass doesn't waste time re-investigating the same non-issue.
