# AIPB-06 — Label the level relationships; capture the rest as backlog

**Ticket:** (invented for a feature-delivery dry run — same pattern as AIPB-01–05)
**Type:** Chore
**Status:** done — [PR #7](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/7), closed 2026-07-07
**Source:** restored from git history and closed out in [AIPB-22](./AIPB-22.md)
**Updated by:** [AIPB-07](./AIPB-07.md), [AIPB-08](./AIPB-08.md), [AIPB-11](./AIPB-11.md)

---

## What & Why

A second external review (8.5/10) proposed several ideas, but its own closing lines said to stop redesigning and go back to polishing capabilities. Took that literally: implementing only the smallest, lowest-risk item (labeling the relationships between architecture levels), and capturing everything else the reviewer themselves flagged as deferred ("not now, maybe v0.3," "one thing I'd add later," "eventually") in a backlog note instead of building it now.

## What was built

The arrows in `architecture.md` got labels (Capabilities → *combined into* → Workflows → *executed during* → Software Delivery Lifecycle → *demonstrated by* → Worked Examples, plus Prerequisites → *required by*). A new `docs/future-considerations.md` records the four deferred ideas, each with why: Reference Architectures, a Principles doc, the tool-agnostic reframing, and the README identity rewrite.

## Architecture Notes

Deliberately not implementing: Reference Architectures, a Principles doc, or any rewrite toward tool-agnostic capability framing. The review itself called these out as deferred, and none of them are a "real problem" surfacing from actual use — the standard this playbook has held to since AIPB-02 for justifying a change.

*At close-out (2026-10-29):* the tool-agnostic reframing and README rewrite were resolved by AIPB-07, and the MCP-server idea added to the same doc by AIPB-11. The Principles doc is still parked, and is now the planned "constitution" for spec-driven development (see `PLAN.md`).
