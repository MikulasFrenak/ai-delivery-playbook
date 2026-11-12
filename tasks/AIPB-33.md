# AIPB-33 — MCP governance for unattended agents: the allowlist is the approval

**Ticket:** self-assigned (solo repo, no external tracker — see AGENTS.md "Ticket IDs for solo/no-tracker projects")
**Type:** Chore
**Status:** open
**Source:** written at the time
**Related:** `docs/mcp-governance.md`, [`/mcp-check`](../skills/mcp-check.md). Constitution I (a person decides), III (evidence, not claims), IV (build for a real need)

---

## What & Why

The scope tiers in `docs/mcp-governance.md` say what a server may do, and "approve how" assumes a person is there to confirm each write call. A cloud agent, a headless run and a scheduled job have no one to ask.

Two things showed up in real use on 2026-11-12. The vendor's documentation says its cloud agent calls the MCP tools on a repository's allowlist without asking. And in a live run of one coding CLI, a pre-tool-use hook denied a command that the same invocation had explicitly allowed; a deny flag beat a saved approval; and approvals the client had saved for the project folder let a run that looked least-privilege run commands it was not given. The playbook had no answer to "what is the approval when nobody is there to give it".

This adds that answer, with a proven / not-yet-proven table so the one-client run is not read as more than it is.

---

## Plan

- [ ] `docs/mcp-governance.md`: a section "Unattended runs: the allowlist is the approval", a proven / not-yet-proven table, and a table of where each client reads MCP configuration
- [ ] `docs/vocabulary.md`: Unattended run, Tool allowlist, Pre-tool-use hook
- [ ] `tasks/README.md` row and `PLAN.md` status; `check-docs.mjs` passes; added lines scanned for leaks

---

## Files to Touch

| File | Change |
|---|---|
| `docs/mcp-governance.md` | New section and two tables; sources |
| `docs/vocabulary.md` | Three terms |
| `tasks/AIPB-33.md`, `tasks/README.md`, `PLAN.md` | This record, its index row and the status line |

## Open Questions

- Should `/mcp-check` ask "will this server run unattended?" and record the allowlist it implies? Not decided here: it changes a skill, which needs a real run of the skill first (constitution IV).
- How to gate a write tool in a cloud agent when there is no prompt? Not run; the vendor's documentation names hooks and custom agents but nothing was tested.
