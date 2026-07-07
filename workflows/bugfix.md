---
name: bugfix
level: 2 - Workflow
status: documented
uses_skills: [create-task, implement-task, verify-browser, commit, pr-update]
---

# bugfix

**Trigger:** A bug report — broken behaviour, a failing test, a regression.

**Sequence:**

1. [`create-task`](../skills/create-task.md) — uses the Bugfix template: Problem, Reproduction Steps, Expected vs Actual, and a **Root Cause Hypothesis** based on reading the actual code path, not a guess. This step matters more for bugfixes than features — a wrong hypothesis wastes the whole implementation pass.
2. [`implement-task`](../skills/implement-task.md) — implements the fix. For a bugfix, Step 4 (Understand Architecture) is usually short — you're not choosing a new approach, you're fixing a specific broken one — but don't skip the quality gate or tests just because the change is small.
3. [`verify-browser`](../skills/verify-browser.md) — **not optional for a bugfix** the way it is for a routine feature: confirm the specific reported scenario is now fixed, and check the one or two most likely regression spots (the code path immediately around the fix).
4. [`commit`](../skills/commit.md) — same as `feature-delivery`, but expect the multi-area Changes table (from `commit` Step 3) more often here, since a bugfix commit message benefits from stating the root cause explicitly, not just "fixed X."
5. [`pr-update`](../skills/pr-update.md) — for any follow-up commits (e.g. reviewer found an edge case the fix didn't cover).

**Difference from `feature-delivery`:** no `analyze-story` (bugs aren't Stories to decompose), and `verify-browser` moves from optional to expected — a bugfix without a demonstrated repro-then-fixed check is an unverified guess.

**Exit criteria:** PR/MR merged, ticket closed, task file cleaned up. The root cause is documented in the merged commit message or PR description — not just "it works now."
