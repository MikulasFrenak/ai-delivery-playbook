# AIPB-27 — Document the mobile agent loop: tests, simulator and API checks from chat

**Ticket:** self-assigned (solo repo, no external tracker — see AGENTS.md "Ticket IDs for solo/no-tracker projects")
**Type:** Chore
**Status:** open
**Source:** written at the time

---

## What & Why

A mobile ticket was carried from story to PR almost entirely from an agent's chat on 2026-10-29 to 2026-11-02, in a private
React Native project: the change, tests, lint and types in a throwaway worktree, the app on an iOS simulator with a network
inspector, API checks run from the inspector's copied request, a PR review, the PR and a tracker comment. The playbook has
`/verify-browser` for web, and `AGENTS.md` names a `verify-mobile` skill only as an example of an extension. What the run
actually proved, and what it broke on, is only in that session.

The goal is a reference page that says, step by step, what an agent can already do for a mobile change from chat, how, and
what went wrong, and that separates it from what nobody has run yet: driving the app's UI and comparing it with a design.

## Acceptance Criteria

- [ ] `docs/mobile-agent-loop.md` covers: the task loop from chat, tests/lint/types in a throwaway worktree, the simulator
      and emulator lifecycle, the network inspector, API checks from a copied request, and lessons learned.
- [ ] Every step is marked **proven** (run in the session above) or **not yet proven**. Nothing unrun is written as done.
- [ ] Driving the UI, a screenshot-vs-design comparison and an Android emulator run are listed as not yet proven, with what
      a future `verify-mobile` skill would need to prove each.
- [ ] No names, IDs, hostnames or URLs from the source project.
- [ ] The page is registered in `AGENTS.md` (Repo Layout) and linked from `lifecycle/verification.md`;
      `tasks/README.md` has the row.
- [ ] `node .github/scripts/check-docs.mjs` and `/public-repo-check` pass.

## Out of scope

- The `verify-mobile` skill itself. It needs a live run of UI driving first (see AIPB-19 for how a skill gets run live
  before it lands), and a choice of driver.

## Plan

1. Write `docs/mobile-agent-loop.md` from the session's real commands and failures.
2. Register it in `AGENTS.md` and `lifecycle/verification.md`; add the row to `tasks/README.md`.
3. Run the docs check and `/public-repo-check`.

## Open Questions

- Which driver should a `verify-mobile` skill use to tap and scroll? Reuse a project's own device-test repo (a driver, an
  on-demand pipeline, an accessibility audit) or bring Maestro, `idb` or a mobile MCP server. The open question is whether the
  agent calls the driver directly or triggers an existing pipeline, and who owns the screen definition. Not decided; it needs
  a run.
- Does the agent host expose a way to open the simulator window's screenshot to the model? `xcrun simctl io booted
  screenshot` writes a file and the host's image viewer can read it, but the comparison step hasn't been run.
