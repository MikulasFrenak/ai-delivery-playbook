# ai-delivery-playbook — Plan

*Public playbook of skills/workflows/lifecycle docs for AI-assisted delivery. Current focus: keep the skill set grounded in real usage (this repo dogfoods its own conventions — self-assigned `AIPB-NN` IDs, `trivial/`/`chore/`/`feature/` branches, no speculative features) rather than growing it ahead of a concrete need.*

## Status

- 17 skills documented in [`skills/`](./skills/), all tool-agnostic in [`AGENTS.md`](./AGENTS.md) with `CLAUDE.md` as a thin import shim.
- Remote MCP server (`ai-delivery-playbook.mikulas-frenak.workers.dev`) is live on Cloudflare Workers, serving `search_skills`/`get_skill` — confirmed via `curl` and a real Claude Code CLI connection (AIPB-12).
- [`/agent-eval`](./skills/agent-eval.md) landed (AIPB-15/16), wired into the skill-change and vocabulary docs. [`evals/`](./evals/) exists but has **no scorecards yet** — by the skill's own guardrail, it only applies once a skill has real usage history, and none has been run against it yet.
- [`/branch-cleanup`](./skills/branch-cleanup.md) made genuinely host-agnostic (not GitHub-only) and is now the most-exercised skill in practice this cycle.
- [`/plan-update`](./skills/plan-update.md) added — resolves the "does PLAN.md need a dedicated skill" question below by existing. Registered in `AGENTS.md`'s skills table and `architecture.md`'s Level 1 list (the latter was already stale — missing `design-brief`/`diagram`/`postmortem`/`test-scaffold` too — fixed at the same time). Wired into `create-task` (Step 7) and `implement-task` (Step 11) as one-line references, same "documented checkpoint, not auto-invoke" pattern `agent-eval` used in `CONTRIBUTING.md`.
- Reference docs (`docs/mcp-servers.md`, `docs/deployment.md`, `docs/error-handling.md`, `docs/sla-framework.md`, `docs/eval-framework.md`, `docs/vocabulary.md`, `docs/adoption.md`, `docs/future-considerations.md`) are current as of AIPB-16.
- This file itself is new (2026-08-23) — `PLAN.md` was documented as a template in `AGENTS.md` but this repo hadn't adopted it for itself yet.

## Next up

- Pick a first real `/agent-eval` candidate once a skill has enough usage history to build a golden set against — `branch-cleanup` or `commit` are the closest given actual session usage so far.

## Open questions / decisions needed

*(none open right now — the PLAN.md-skill question above resolved by shipping `/plan-update`)*

## Parked (noted, not active)

See [`docs/future-considerations.md`](./docs/future-considerations.md) — the existing home for ideas raised and deliberately deferred (5th "Reference Architectures" level, a Principles/constitution doc, wrapping individual skills as typed MCP tools). Not duplicated here; that doc is the durable record and already follows the same "not a roadmap promise" framing this section would use.

## Decision points

- **Reference-architecture level (docs/future-considerations.md):** revisit once a second real adoption in a different stack exists — not before.
- **`/agent-eval` golden sets:** build one only once a skill has real usage history behind it, per the skill's own guardrail — not on day one for any new skill.

## Sources

None — this file reflects this repo's own git history and current file state, not external research.
