---
name: implementation
level: 3 - Software Delivery Lifecycle
status: documented
---

# Implementation

**Purpose:** Turn the agreed plan and approach into working code, following this repo's own conventions (see `CLAUDE.md`).

**Entry criteria:** A task file exists with a plan and files-to-touch (Requirements), and an approach has been explicitly agreed (Architecture).

**Exit criteria:** Code is written, lints/type-checks/tests pass, and it's documented.

**Skills used:**
- [`implement-task`](../skills/implement-task.md) — the primary, end-to-end skill for this stage: implementation, quality checks, tests, and commit
- [`code-doc`](../skills/code-doc.md) — runs inside `implement-task` Step 9 to create/update the relevant `doc.md`
- [`public-repo-check`](../skills/public-repo-check.md) — relevant here if the repo is public and the new code might introduce a secret, UUID, or org-specific name

**Artifacts:** Code changes, `doc.md`, updated task file with completed items and any architecture decisions discovered mid-implementation.

---

**Difference from `implement-task` the skill:** this file describes the *stage* — its purpose, entry/exit criteria, and which skills serve it. `implement-task` is the *tool* — the actual runnable workflow that does the work. Level 3 docs describe the "what/when" of the lifecycle; Level 1 skills are the "how."
