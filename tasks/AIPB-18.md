# AIPB-18 — mcp-check skill + docs/mcp-governance.md

**Ticket:** self-assigned (solo repo, no external tracker — see AGENTS.md "Ticket IDs for solo/no-tracker projects")
**Type:** Chore
**Status:** done — [PR #37](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/37), closed 2026-09-05
**Source:** written at the time; closed out in [AIPB-22](./AIPB-22.md)

---

## What & Why

`docs/mcp-servers.md` currently documents *how to connect* every MCP server this playbook assumes (auth steps, verify commands) but has zero content on *what it should be allowed to do* — no read-only vs write guidance, no blast-radius framing, no "does this need a human confirm on every call" decision. Confirmed by re-reading the actual file (441 lines) — grepped for "read-only", "least-privilege", "scope": zero matches.

2026 research backs this as a live, industry-wide gap, not a speculative concern:
- **Salesforce's 2026 Connectivity Benchmark**: the average org runs ~12 AI agents (heading to ~20 by 2027), and ~50% of them operate with no cross-agent governance at all.
- **Cequence & EMA research (Aug 2026)**: 94% of enterprise IT/security leaders believe their AI agents aren't over-provisioned — but only 33% actually enforce least-privilege access. The other two-thirds run on broad standing permissions that are rarely or never reviewed.

Chosen approach (Option C of 3 discussed and confirmed with the user) — a standalone doc plus a small human-run skill (`/mcp-check`) that walks through the scope decision *before* a new MCP server gets connected to a project — mirrors the existing skill+doc pairing pattern (`self-healing-selectors` + `docs/test-maintenance.md`).

Explicitly **not** doing (rejected alternatives, for the record):
- **Option A** (static checklist generator that just lists servers per project type) — too shallow, doesn't address governance, just a documentation shortcut.
- **Option B** (auto-inferring needed servers from repo contents) — violates this repo's own AIPB-02 bar (no speculative automation ahead of a concrete, proven need); risks confidently-wrong inference the same way `docs/mcp-servers.md` already warns about for cloud-vs-on-premise tracker mismatches.

**Naming decided (2026-09-05):** skill is `mcp-check`, doc is a new standalone `docs/mcp-governance.md` — not an extension of `docs/mcp-servers.md` (already 441 lines; the two docs answer different questions — "how do I connect this server" vs "what should it be allowed to do" — so a cross-link between them is cleaner than one doc doing both jobs).

---

## What was built

`docs/mcp-governance.md` defines three scope tiers (read-only, write scoped, write destructive) and assesses all 10 servers in `docs/mcp-servers.md` from their real tool surface. `skills/mcp-check.md` walks that decision before a server is added to `.mcp.json` and records it. Writing the assessment exposed a real under-disclosure: the Cloudflare connector's docs didn't say it exposes delete operations on KV/R2/D1/Hyperdrive. That is now called out in both docs. Two vocabulary terms were added (Scope tier, Blast radius).

---

## Open Questions

_(none open right now — naming and doc-split resolved 2026-09-05)_

---

## Architecture Notes

- This task file was drafted in a separate sandboxed session (a read-only GitHub clone, no push access) during the research/design conversation, then re-created here against the real local repo — every factual claim above was independently re-verified against this actual working tree (line counts, next free ID, workflow grep, existing-file check) rather than trusted as-is, per this repo's own "an agent's own verified claim is not verification" rule. One correction made in that process: the "~12 agents" stat is Salesforce's, not Anthropic's own report as the original draft implied — fixed above.

- No `workflows/*.md` changes were needed — confirmed by grep against all three existing workflows; only `design-system-update.md` mentions MCP at all (Figma), and none model a "new project setup" sequence this would plug into.
