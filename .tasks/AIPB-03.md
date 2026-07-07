# AIPB-03 — Positioning pass: Capabilities, SDLC naming, Worked Examples

**Ticket:** (invented for a feature-delivery dry run — same pattern as AIPB-01/02)
**Type:** Chore

---

## What & Why

An external review reframed this repo from "a Claude skills folder" to "an AI-native engineering methodology," and proposed naming/positioning changes to match. Reviewed each point against the actual files before agreeing (see conversation) — 5 of 6 are in scope here; the 6th (a v0.1.0 readiness audit of `create-task`) is a real audit, not a doc change, and is deliberately left out of this ticket.

## Plan

- [x] Rename the Level 1 pitch label "Atomic Skills" → "Capabilities" in `architecture.md`'s diagram and `CLAUDE.md`'s Repo Layout table. Underlying mechanism (`skills/` folder, "Skill Invocation Policy," `disable-model-invocation`, `CONTRIBUTING.md`'s skill-authoring language) left as "skill." Updated `CONTRIBUTING.md`'s cross-reference to the renamed label.
- [x] Renamed "Engineering Lifecycle" → "Software Delivery Lifecycle" in `architecture.md`, `CLAUDE.md`'s table, and all 5 `lifecycle/*.md` frontmatter `level:` fields.
- [x] Added Level 4 "Worked Examples" to `architecture.md`'s diagram and `CLAUDE.md`'s table, with real content — `examples/AIPB-01.md` and `examples/AIPB-02.md`.
- [x] Added the identity sentence to `README.md`.
- [x] Softened the FE/mobile scope statement consistently across `README.md`, `architecture.md`, and `CLAUDE.md`; also added the reviewer's extensibility examples (`verify-mobile`, `verify-ios`, `deploy-kubernetes`) as a one-line illustration in `CLAUDE.md`.

## Files to Touch

| File | Change |
|---|---|
| `architecture.md` | Rename Level 1/3 labels, add Level 4, update scope statement |
| `CLAUDE.md` | Rename Level 1/3 labels in Repo Layout table, update scope statement |
| `CONTRIBUTING.md` | Update "Atomic Skills" cross-reference |
| `lifecycle/architecture.md`, `implementation.md`, `release.md`, `requirements.md`, `verification.md` | Frontmatter `level:` field rename |
| `README.md` | Add identity sentence, update scope statement |
| `examples/AIPB-01.md`, `examples/AIPB-02.md` | New — worked-example write-ups for the new Level 4 |

## Open Questions

- None carried into this ticket — the one open question from AIPB-02 (should Inputs/Output become standard across all skills) is still unresolved but is a separate concern from this positioning pass.

## Architecture Notes

Not folding in the v0.1.0 readiness review (reviewer's item 6) — that's "is `create-task` good enough for a random engineer to use without talking to us," a real usability audit, not a rename/doc task. Natural next ticket after this one ships.
