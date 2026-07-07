# Worked Example: AIPB-02 — Polish create-task.md from external review

**Trigger:** An external review of [`skills/create-task.md`](../skills/create-task.md) flagged 4 items. Rather than acting on the review text at face value, each claim was checked against the actual file first.

**Workflow:** [`feature-delivery`](../workflows/feature-delivery.md), Task/chore path.

## Trace

1. **Verification before agreement** — not a formal skill step, but the same discipline `create-task`/`implement-task` apply to research: don't act on an unverified claim. One review item ("the Task Type table renders as plain text") turned out to be false — the source table was scanned byte-by-byte and found to be valid GFM with no column-count mismatches. It was a viewer artifact, not a file defect, so it wasn't touched. While investigating the renumbering item, a genuine latent bug surfaced that the review hadn't even flagged: Step 3 referenced "Step 6" for template selection, which was wrong under the numbering at the time.
2. **[`create-task`](../skills/create-task.md)** — wrote `.tasks/AIPB-02.md` (Chore template) scoping exactly 3 agreed changes and explicitly recording the 1 skipped item and why, so a future pass wouldn't re-investigate the same non-issue.
3. **[`implement-task`](../skills/implement-task.md)** — added an Inputs/Output section, renumbered `Step 3b` → `Step 4` (cascading the rest), added a Guardrails section restating existing confirmation rules, and updated the 2 places elsewhere in the repo that cited the old step numbers by name (`lifecycle/architecture.md`, `workflows/design-system-update.md`). Before considering the work done, ran a repo-wide verification sweep: broken-link checker, table-integrity checker, and a grep for any remaining stale step references — all three came back clean.
4. **[`commit`](../skills/commit.md)** — Step 2.5's staging check matched the task file's Files to Touch table exactly this time: 4 files, nothing extra. Contrast with AIPB-01, where the same check caught real scope drift.
5. **Push + PR** — `gh` was already authenticated from AIPB-01, so this step was immediate.

**Outcome:** [PR #3](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/3), later merged.

## What this run actually validated

Verification is cheap relative to the bugs it catches. A quick byte-level check disproved one claim outright, and a repo-wide grep for cross-references — done as due diligence, not because anyone asked — caught a stale reference that would otherwise have shipped silently. Neither check took long; skipping them would have looked identical right up until someone hit the wrong step number.
