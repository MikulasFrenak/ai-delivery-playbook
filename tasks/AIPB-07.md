# AIPB-07 — Split CLAUDE.md into tool-agnostic AGENTS.md + Claude-only shim

**Ticket:** self-assigned (no tracker)
**Type:** Chore
**Status:** done — [PR #8](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/8), closed 2026-07-12
**Source:** reconstructed on 2026-10-29 from PR #8 and its commit — not written at the time; no acceptance criteria were recorded
**Updated by:** [AIPB-08](./AIPB-08.md)

---

## What & Why

`CLAUDE.md` held every convention, but most agents other than Claude Code (Codex, Copilot, Cursor, Windsurf, Aider, Zed, Jules, VS Code, JetBrains Junie) read `AGENTS.md` natively, not `CLAUDE.md`. Claude Code doesn't read `AGENTS.md` natively. So the conventions belonged in `AGENTS.md`, with `CLAUDE.md` shrunk to an import plus only what is genuinely Claude-only. This also resolved two items parked in `docs/future-considerations.md` by AIPB-06: the tool-agnostic reframing and the README "open framework" rewrite.

## What was built

`AGENTS.md` became the cross-tool source of truth, and `CLAUDE.md` became `@AGENTS.md` plus `.claude/settings.json` handling and the skill-invocation policy. A new `/generate-agents-md` skill makes the split repeatable; it was applied to review-spa and zensmash as real second and third uses. A new `.github/workflows/notify-review-spa.yml` dispatches a `source-updated` event to review-spa on pushes to `main`, so its case-study stats can refresh.

## Architecture Notes

- The skill files themselves stayed Claude-Code-coupled (slash commands, `disable-model-invocation`): there was no second implementation of those mechanics to generalize from yet.
- `notify-review-spa.yml` needs a `REPO_SYNC_TOKEN` secret (a fine-grained PAT scoped to review-spa) to fire; the PR's test plan left that unticked.
