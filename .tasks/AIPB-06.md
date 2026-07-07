# AIPB-06 — Label the level relationships; capture the rest as backlog

**Ticket:** (invented for a feature-delivery dry run — same pattern as AIPB-01–05)
**Type:** Chore

---

## What & Why

A second external review (8.5/10) proposed several ideas, but its own closing lines said to stop redesigning and go back to polishing capabilities. Took that literally: implementing only the smallest, lowest-risk item (labeling the relationships between architecture levels), and capturing everything else the reviewer themselves flagged as deferred ("not now, maybe v0.3," "one thing I'd add later," "eventually") in a backlog note instead of building it now.

## Plan

- [x] Update `architecture.md`'s diagram: replace the plain `↓` arrows between levels with labeled relationships (Capabilities → *combined into* → Workflows → *executed during* → Software Delivery Lifecycle → *demonstrated by* → Worked Examples). Also labeled Prerequisites → *required by* → Capabilities for consistency, though the reviewer didn't ask for that one specifically.
- [x] Add `docs/future-considerations.md` capturing, as explicitly-deferred ideas (not commitments): Reference Architectures, a Principles/"constitution" doc, reframing "Capability" as tool-agnostic, and the README "open framework" identity rewrite.
- [x] Register the new doc in `CLAUDE.md`'s Repo Layout table (`docs/` row).

## Files to Touch

| File | Change |
|---|---|
| `architecture.md` | Label the arrows between levels |
| `docs/future-considerations.md` | New — captures deferred ideas from this review |
| `CLAUDE.md` | Register the new doc |
| `examples/AIPB-06.md` | New — worked example |

## Open Questions

- None — everything genuinely open-ended from the review is captured in `docs/future-considerations.md` rather than left as an open question here.

## Architecture Notes

Deliberately not implementing: Reference Architectures, a Principles doc, or any rewrite toward tool-agnostic capability framing. The review itself called these out as deferred, and none of them are a "real problem" surfacing from actual use — the standard this playbook has held to since AIPB-02 for justifying a change.
