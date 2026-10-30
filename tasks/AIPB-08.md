# AIPB-08 — Retire "Capability" for "Skill"; frame agents as teammates

**Ticket:** self-assigned (no tracker)
**Type:** Chore
**Status:** done — [PR #12](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/12), closed 2026-07-15
**Source:** reconstructed on 2026-10-29 from PR #12's two commits (the PR has no description) — not written at the time; no acceptance criteria were recorded
**Related:** [AIPB-03](./AIPB-03.md) (reverses its "Capabilities" label), [AIPB-04](./AIPB-04.md), [AIPB-07](./AIPB-07.md)

---

## What & Why

One concept, one name. AIPB-03 had introduced "Capability" as a pitch-level label for Level 1 while the mechanism stayed "skill", so the repo carried two words for one thing. The audience is technical, and "skill" matches Claude Code's real `skills/` mechanism, so the label went back to "skill" everywhere. The same pass framed agents as working *as part of* the team, not instead of it.

## What was built

"Skill" now appears everywhere: the architecture diagram, `AGENTS.md` tables and prose, README, CONTRIBUTING, `CLAUDE.md`, `generate-agents-md` and `future-considerations`. `docs/vocabulary.md` merged its two rows into one Skill entry recording the rename and why. The README and the `AGENTS.md` Skills section say humans and agents collaborate on the result and every workflow ends at a human checkpoint. A new branching rule says fixes to unmerged work land on the same branch, not a new one.

## Architecture Notes

- The same PR carried an unrelated second commit: watchdog/observer lessons from real Family Trails and portfolio bugs (load watchdogs count only visible time, transient vs hard failure split, stable watchdog callbacks, observers re-scanning on locale/route re-keying). They are now `AGENTS.md`'s "Watchdogs, observers & postponed rendering" section.
