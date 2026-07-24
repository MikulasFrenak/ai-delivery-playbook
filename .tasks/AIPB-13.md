# AIPB-13 — get_skill: fetch-and-follow, not fetch-and-copy

**Ticket:** (personal backlog item, no external tracker — follow-up to AIPB-11/AIPB-12)
**Type:** Chore

---

## What & Why

A VS Code extension session, connected to the remote skill server, was asked to run `branch-cleanup` on `family-trails-eu`. Its first move was to copy the fetched skill into `.claude/skills/branch-cleanup.md` in that repo before running it — even though the whole point of serving skills over MCP is that a connected agent doesn't need the repo cloned or the file present locally at all.

Root cause: `get_skill`'s tool description said what it returns, but never said what to do with it. Without that, a calling agent falls back to Claude Code's normal skill-discovery instinct — a skill only "counts" as runnable once it's a file under `.claude/skills/` or `.claude/commands/`. That's true for the *slash-command* mechanism, but not for this server, and nothing said so.

## Fix

- `get_skill`'s `description` (in both `mcp-server/server.js` and `mcp-server/remote/worker.js`, kept in sync per their documented duplication) now states explicitly: follow the returned instructions directly, don't copy the file into the project — only do that if the user separately asks for a native `/skill-name` slash command.
- Every successful `get_skill` response is now prefixed with the same reminder, so the instruction travels with the content itself rather than living only in a tool description that may not get weighted heavily by every client/model.
- `mcp-server/doc.md` — new "Fetch-and-follow, not fetch-and-copy" section documenting the incident and the fix. Also dropped a stale "No remote hosting" TODO left over from before AIPB-12 shipped.
- `mcp-server/README.md` — one line closing the same loop for a human reader.
- `mcp-server/setup.md` — Prerequisites' "clone this repo" step was stale (still said "there's no remote endpoint to point at yet", contradicting the Remote section further down in the same file); reworded to point at the remote option first.

## Verification

- `node mcp-server/test.js` and `node mcp-server/remote/test.js` (after `node mcp-server/remote/build.js`) both still pass — substring assertions on returned content match fine with the new prefix.
- Not yet re-verified live against a fresh agent session post-fix (the original repro was in a live VS Code extension session). Worth another real test once this deploys, same shape as the original repro: ask a fresh session with no local clone to run a skill by name via the remote server, confirm it does not create any local file.

## Plan

- [x] Fix tool descriptions + response prefix in `server.js` and `worker.js`
- [x] Update `doc.md`, `README.md`, `setup.md`
- [x] Re-run both test suites
- [ ] Deploy (`node mcp-server/remote/build.js && npx wrangler deploy`, or merge to `main` and let the Git integration build it)
- [ ] Re-verify live with a fresh, repo-not-cloned session

---

## Notes

Branch: `chore/AIPB-13/get-skill-fetch-and-follow`, not yet pushed/PR'd.
