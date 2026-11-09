# Constitution

The principles every plan and every PR in this repo is checked against. Each one is a rule this playbook already follows, written down so it's applied on purpose, not by habit. "Enforced by" says what catches a break today; where that's a person, it says so.

This is the first stage of spec-driven development (see [`PLAN.md`](./PLAN.md) → SDD). [`/create-task`](./skills/create-task.md) checks a plan against it, and [`/review-pr`](./skills/review-pr.md) checks a PR.

---

## Core principles

### I. A person decides

- Skills MUST run only when a person asks for them: every skill sets `disable-model-invocation: true`.
- Agents MUST NOT call an MCP tool unless the person asked for it, or a skill they ran documents that call.
- Agents draft; people post, approve and merge. A bot or agent verdict MUST NOT fill a required human approval.
- Every workflow MUST end at a human checkpoint.

**Rationale:** agents work as part of the team, not instead of it. The consequences of a change stay with a person, so the decision does too.
**Enforced by:** CI (`check-docs.mjs` fails a skill without the flag); `AGENTS.md` → MCP Invocation Policy; `/review-pr`'s read-only rules; [`workflows/pr-review.md`](./workflows/pr-review.md).

### II. The spec comes first and outlives the change

- Ticketed work MUST start from a task file with acceptance criteria before code.
- A task file MUST be closed out when its PR opens and MUST NOT be deleted. A later ticket that changes the same behavior links back with `Updated by` or `Superseded by`.
- A task file records why a change happened; `doc.md` describes how the code works now. Neither replaces the other.

**Rationale:** the reasons behind a change are the first thing lost and the most expensive to rebuild.
**Enforced by:** `AGENTS.md` → Task file lifecycle; `/create-task`; `/commit`'s close-out; the PR hygiene check (an `AIPB-<n>` PR needs its task file); `/branch-cleanup` Step 8.

### III. Evidence, not claims

- A finding or a "done" MUST say what was verified and how. What couldn't be checked is written as not verified, never guessed.
- Non-trivial work MUST start with research: current sources, two or three approaches, a recommendation, then agreement.
- A factual claim MUST cite its source. An agent's own "verified" is a first pass: spot-check it.
- A record written after the fact contains only what its sources state.

**Rationale:** a confident wrong answer costs more than an honest "not verified".
**Enforced by:** `AGENTS.md` → Research Before Implementing; `/review-pr`'s verified vs. not verified; the reconstructed-task-file rule; review.

### IV. Build for a real need

- A new skill, doc or check MUST answer a need that showed up in real use, not a hypothetical one.
- A pattern MUST run live before it is written up as a skill or a rule.
- An eval golden set is built only once a skill has real usage history, from real cases.
- Ideas without a real trigger go to [`docs/future-considerations.md`](./docs/future-considerations.md) or `PLAN.md` → Parked, not into the skills.

**Rationale:** speculative features describe a playbook nobody uses.
**Enforced by:** review, and the precedents: `examples/AIPB-19.md` (run live first), [`/agent-eval`](./skills/agent-eval.md)'s guardrails, `docs/future-considerations.md`.

### V. Tool-agnostic

- A skill MUST be prose any agent can follow. `skills/` is Claude Code's implementation of it, not the only one.
- Skill files MUST NOT name a vendor's models.
- `AGENTS.md` is the source of truth; tool-specific files such as `CLAUDE.md` only add that tool's mechanics.

**Rationale:** teams use different tools, and tools change faster than the way of working.
**Enforced by:** `AGENTS.md` → Skills; `CLAUDE.md` as a thin import; review.

### VI. Safe to publish

- The repo MUST NOT contain secrets, tokens, cloud or tenant IDs, internal hostnames, company or private-project names, personal paths or emails.
- A secret MUST NOT pass through chat, a file the agent writes, or shell history: the agent names it, the person stores it.
- Raw incident notes MUST NOT be committed; only the blameless post-mortem is.

**Rationale:** this repo is public, and git history keeps what a later commit removes.
**Enforced by:** [`/public-repo-check`](./skills/public-repo-check.md) before push; `AGENTS.md` → Public Repo Hygiene and its secrets rules; `.gitignore` for `*.notes.md`; the on-demand CI review (`claude-review` label) looks for leaks.

### VII. Small changes, one at a time

- Every change MUST land through a PR from its own branch; `main` takes no direct commits. PRs merge with real merge commits.
- One branch/PR open at a time; follow-ups land on that branch.
- A skill does one thing; workflows combine skills; lifecycle stages use workflows.

**Rationale:** small, serial changes are easy to review, revert and trace.
**Enforced by:** `AGENTS.md` → Branching & Commits; the PR hygiene check (title, branch, task file); [`architecture.md`](./architecture.md)'s levels; review.

---

## Governance

- **Authority.** Where a convention in `AGENTS.md` or a skill conflicts with a principle here, the principle wins and the convention gets fixed.
- **Compliance.** `/create-task` checks a plan before work starts, and `/review-pr` checks a PR. A conflict is fixed by changing the plan or the change, not the principle.
- **Amendments.** Changing a principle is its own ticket, task file and PR. The PR bumps the version, updates "Last amended" and adds a line to the history below. The task file of an amendment links the earlier one with `Updated by`, like any other spec.
- **Versioning.** MAJOR: remove or redefine a principle. MINOR: add a principle or a must-rule. PATCH: wording only.

**Version:** 1.0.0 | **Ratified:** 2026-11-09 | **Last amended:** 2026-11-09

| Version | Date | Ticket | Change |
|---|---|---|---|
| 1.0.0 | 2026-11-09 | [AIPB-29](./tasks/AIPB-29.md) | First version: seven principles, from rules the repo already enforced |
