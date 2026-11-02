# AIPB-27 — Document the mobile agent loop: tests, simulator and API checks from chat

**Ticket:** self-assigned (solo repo, no external tracker — see AGENTS.md "Ticket IDs for solo/no-tracker projects")
**Type:** Chore
**Status:** done — [PR #54](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/54), closed 2026-11-02
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

- [x] `docs/mobile-agent-loop.md` covers: the task loop from chat, tests/lint/types in a throwaway worktree, the simulator
      and emulator lifecycle, the network inspector, API checks from a copied request, and lessons learned.
- [x] Every step is marked **proven** (run in the session above) or **not yet proven**. Nothing unrun is written as done.
- [x] Driving the UI, a screenshot-vs-design comparison and an Android emulator run are listed as not yet proven, with what
      a future `verify-mobile` skill would need to prove each.
- [x] No names, IDs, hostnames or URLs from the source project.
- [x] The page is registered in `AGENTS.md` (Repo Layout) and linked from `lifecycle/verification.md`;
      `tasks/README.md` has the row.
- [x] `node .github/scripts/check-docs.mjs` and `/public-repo-check` pass. (Docs check locally and in CI; public-repo check as a scan of the PR's added lines — no emails, paths, IDs, tokens, hosts, URLs or foreign ticket IDs.)

## Out of scope

- The `verify-mobile` skill itself. It needs a live run of UI driving first (see AIPB-19 for how a skill gets run live
  before it lands), and a choice of driver.

## What was built

`docs/mobile-agent-loop.md`: the loop from story to PR as it ran from chat, every step marked proven or not yet proven, the
lessons from what broke, a section on reusing a project's own device-test repo, and the table of what a `verify-mobile`
skill has to run first. Registered in `AGENTS.md` and linked from `lifecycle/verification.md`.

## Open Questions

Both still open; **moved to `PLAN.md`** → Open questions, since they need a live run rather than a decision here:

- Which driver should a `verify-mobile` skill use to tap and scroll — the project's own device-test repo, or Maestro, `idb`
  or a mobile MCP server — and does the agent call it directly or trigger an existing pipeline?
- Can the agent host show the simulator's screenshot to the model for a design comparison? The file can be written and
  read; the comparison hasn't been run.
