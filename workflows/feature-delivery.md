---
name: feature-delivery
level: 2 - Workflow
status: documented
uses_skills: [analyze-story, create-task, implement-task, verify-browser, commit, pr-update, code-doc, public-repo-check]
---

# feature-delivery

**Trigger:** A new feature request lands — as a Story (needs decomposition) or already as a scoped Task.

**Sequence:**

1. **If it's a Story:** [`analyze-story`](../skills/analyze-story.md) — produces the Event Model, backend/FE breakdown, and files subtasks in the tracker. Skip this step entirely for a plain Task.
2. [`create-task`](../skills/create-task.md) — run once per Task (either the original ticket, or each subtask from step 1). Produces `.tasks/TICKET-ID.md` with the plan, files-to-touch, and open questions. Includes the research-and-approach step (`lifecycle/architecture.md`'s Task-level path) — don't proceed until the approach is agreed.
3. [`implement-task`](../skills/implement-task.md) — does the actual work: reads the design, implements, runs the quality gate, writes tests, and calls [`code-doc`](../skills/code-doc.md) internally to document what was built.
4. [`commit`](../skills/commit.md) — generates the commit message, re-runs the quality gate, and offers an optional [`verify-browser`](../skills/verify-browser.md) pass (Step 2.7) before creating the commit and the PR/MR (or handing off to step 5 if one already exists). For a routine feature this is skippable; see `bugfix`/`design-system-update` for when it isn't.
5. [`pr-update`](../skills/pr-update.md) — run again for any follow-up commits on the same branch (review feedback, a missed edge case), to keep the PR/MR description in sync without re-writing it by hand.
6. [`public-repo-check`](../skills/public-repo-check.md) — only if this repo is public: run before the final push if the feature touched anything that could plausibly carry a secret, UUID, or org-specific name (new config, new integration, new sample data).

**Branch point:** Step 1 is the only conditional — everything else is the same whether the feature started as a Story or a Task. A Story just means step 2 runs multiple times (once per subtask) instead of once.

**Exit criteria:** PR/MR merged, ticket(s) closed, task file(s) cleaned up per their lifecycle rule (see `create-task`'s Task file lifecycle note in `CLAUDE.md`).
