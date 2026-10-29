# AIPB-18 — mcp-check skill + docs/mcp-governance.md

**Ticket:** self-assigned (solo repo, no external tracker — see AGENTS.md "Ticket IDs for solo/no-tracker projects")
**Type:** Chore

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

## Plan

- [x] Create **`docs/mcp-governance.md`** — Scope tiers (read-only / write scoped / write destructive) + a per-server assessment table for all 10 servers in `docs/mcp-servers.md`, grounded in each one's actual documented tool surface, not its product category. Cross-linked both directions with `docs/mcp-servers.md`'s intro.
- [x] Author `skills/mcp-check.md` — frontmatter (`disable-model-invocation: true`), Guardrails, 7-step Workflow: identify server + use → check governance doc first → determine actual tier from real tool list → match scope to actual need → decide approval mechanism per tier → record the decision → confirm.
- [x] Register in the three mandatory places: `skills/mcp-check.md` itself, `architecture.md`'s Level 1 list, `AGENTS.md`'s skills table. Also cross-linked from `AGENTS.md`'s existing MCP Invocation Policy section (connection-time scope vs. per-call invocation are related but separate decisions).
- [x] Added two terms to `docs/vocabulary.md`: **Scope tier** and **Blast radius** (the latter already recurred informally in `workflows/design-system-update.md` with no formal definition — worth fixing while touching this area).
- [x] Reconciled `PLAN.md` via `/plan-update`.
- [x] Ran a `/public-repo-check`-style grep across every new/changed file for secrets, tokens, personal info, and org-specific identifiers — clean. The one match (the deployed skill-server's `.workers.dev` URL in `docs/mcp-servers.md`) is pre-existing, already-public, and intentional (AIPB-12), not a new leak.

---

## Files to Touch

| File | Change |
|---|---|
| `docs/mcp-governance.md` | new file — scope & least-privilege reference |
| `docs/mcp-servers.md` | add a one-line cross-link to the new governance doc |
| `skills/mcp-check.md` | new skill file |
| `architecture.md` | add `mcp-check` to Level 1 skills list |
| `AGENTS.md` | add row to "Skills in this playbook" table |
| `docs/vocabulary.md` | add new terms only if they recur beyond this doc |
| `PLAN.md` | reconcile via `/plan-update` after landing |

No `workflows/*.md` changes needed — confirmed by grep against all three existing workflows; only `design-system-update.md` mentions MCP at all (Figma), and none model a "new project setup" sequence this would plug into.

---

## Open Questions

_(none open right now — naming and doc-split resolved 2026-09-05)_

---

## Architecture Notes

- This task file was drafted in a separate sandboxed session (a read-only GitHub clone, no push access) during the research/design conversation, then re-created here against the real local repo — every factual claim above was independently re-verified against this actual working tree (line counts, next free ID, workflow grep, existing-file check) rather than trusted as-is, per this repo's own "an agent's own verified claim is not verification" rule. One correction made in that process: the "~12 agents" stat is Salesforce's, not Anthropic's own report as the original draft implied — fixed above.
