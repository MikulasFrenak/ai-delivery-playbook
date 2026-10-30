# AIPB-19 — Document worktree-isolated parallel agents, run live first

**Ticket:** self-assigned (no tracker)
**Type:** Chore
**Status:** done — [PR #42](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/42), closed 2026-09-06
**Source:** reconstructed on 2026-10-29 from PR #42 and its commit — not written at the time; no acceptance criteria were recorded
**Worked example:** [examples/AIPB-19.md](../examples/AIPB-19.md)

---

## What & Why

The PR's title states the approach: run the pattern live before documenting it. What it documents is agents doing real writes in parallel, each in its own git worktree.

## What was built

Two background agents ran in separate worktrees on independent, file-disjoint tasks. One was a `CONTRIBUTING.md` addition, which became PR #41. The other was a repo-wide link-integrity audit, which correctly found nothing and made no commit. A "Worktree-Isolated Parallel Agents" subsection in `AGENTS.md` now covers the independence test, briefing agents on what's out of scope and why, review before merge, and honest null results. A matching `docs/vocabulary.md` entry distinguishes it from verification fan-out.

## Architecture Notes

- An honest null result beats a manufactured commit: an empty branch made "to look productive" would have been worse than reporting nothing found.
- The run surfaced an unrelated bug: `.gitignore` never excluded `.claude/worktrees/` or `.claude/settings.local.json`. It was fixed separately in #40.
