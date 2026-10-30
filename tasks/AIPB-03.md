# AIPB-03 — Positioning pass: Capabilities, SDLC naming, Worked Examples

**Ticket:** (invented for a feature-delivery dry run — same pattern as AIPB-01/02)
**Type:** Chore
**Status:** done — [PR #4](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/4), closed 2026-07-07
**Source:** restored from git history and closed out in [AIPB-22](./AIPB-22.md)
**Updated by:** [AIPB-07](./AIPB-07.md), [AIPB-08](./AIPB-08.md) — AIPB-08 reversed the "Capabilities" label back to "Skill"
**Worked example:** [examples/AIPB-03.md](../examples/AIPB-03.md)

---

## What & Why

An external review reframed this repo from "a Claude skills folder" to "an AI-native engineering methodology," and proposed naming/positioning changes to match. Reviewed each point against the actual files before agreeing (see conversation) — 5 of 6 are in scope here; the 6th (a v0.1.0 readiness audit of `create-task`) is a real audit, not a doc change, and is deliberately left out of this ticket.

## What was built

The Level 1 pitch label became "Capabilities" (the `skills/` mechanism kept its name), "Engineering Lifecycle" became "Software Delivery Lifecycle", and a Level 4 "Worked Examples" was added with real traces (`examples/AIPB-01.md`, `AIPB-02.md`). The README got an identity sentence, and the FE/mobile scope statement was softened to "built with frontend and mobile delivery in mind, but designed to be technology-agnostic and extensible."

## Architecture Notes

Not folding in the v0.1.0 readiness review (reviewer's item 6) — that's "is `create-task` good enough for a random engineer to use without talking to us," a real usability audit, not a rename/doc task. Natural next ticket after this one ships.

*At close-out (2026-10-29):* that readiness audit never became a ticket.
