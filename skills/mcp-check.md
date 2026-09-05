---
name: mcp-check
disable-model-invocation: true
description: Walks through the scope/least-privilege decision for an MCP server before it's added to a project — classifies it as read-only, write (scoped), or write (destructive) per docs/mcp-governance.md, and records the decision. Run before connecting a new MCP server, or auditing one already connected. NEVER auto-invoke — only run when user explicitly types /mcp-check.
---

# mcp-check — MCP Server Scope Review

## Overview

Before a new MCP server gets added to `.mcp.json` (or an existing one gets re-checked after an update), this skill walks the scope decision explicitly instead of letting a server's product category stand in for its actual capabilities — see [`docs/mcp-governance.md`](../docs/mcp-governance.md)'s own point that a category (e.g. "observability") doesn't fully predict blast radius (e.g. a trigger-management tool bundled into an otherwise read-heavy server).

This skill doesn't grant or deny a permission by itself — that still happens in the tool's own settings/permission-prompt mechanism. This skill is the judgment call that precedes flipping that switch.

---

## Guardrails

- **Never auto-approve a Write (destructive) tier call**, regardless of what a client's auto-approve settings otherwise allow — every call at that tier needs an explicit human confirmation in the moment, not a standing grant.
- **Don't assume a tier from the server's product category.** Check its actual tool list (via its own docs, or a `tools/list` call from a connected client) before classifying it — a server already assessed in `docs/mcp-governance.md` can still expose different tools in a newer version or a different vendor's implementation of the same category.
- **Don't grant a whole server broad access when only one narrow action is needed.** Check whether the client supports scoping to specific tools (e.g. an allowlist in settings) before falling back to enabling everything the server exposes.
- **Record the decision somewhere durable** (Step 5) — a scope decision made once in conversation and never written down has to be re-derived from scratch next time, defeating the point of this skill.

---

## Workflow

### Step 1: Identify the Server and Intended Use

Ask, if not already stated: _"Which MCP server, and what specific action(s) do you actually need it for?"_ A vague answer ("might be useful") is a signal to hold off connecting it at all — see `docs/mcp-servers.md`'s own advice to delete servers you don't use rather than leaving them declared "just in case."

### Step 2: Check `docs/mcp-governance.md` First

If this server (or its product category) already has an entry in the Per-server assessment table there, start from that tier — don't re-derive from scratch. Note any caveat already recorded (e.g. Cloudflare's read/write split, the on-premise-tracker PAT-handling note).

### Step 3: Determine the Actual Tier

If the server isn't listed, or the intended use touches a tool not covered by the existing entry, classify it against `docs/mcp-governance.md`'s Scope tiers table:

- **Read-only** — fetch/query only, no create/edit/comment/toggle/delete reaching an external system
- **Write (scoped)** — creates or modifies a specific, bounded, reversible kind of record
- **Write (destructive)** — can delete, disable, or irreversibly change something outside this repo

Base this on the server's real tool list, not its name — request the tool list directly (`tools/list`, or the vendor's own API reference) if the governance doc doesn't already cover the specific tool in question.

### Step 4: Match Scope to Actual Need

Compare Step 1's stated use against Step 3's tier. If the use only needs read access but the server bundles write/destructive tools in the same connection, check whether the client can scope to a subset of tools rather than approving the whole server. If it can't be narrowed, that's itself a fact worth recording in Step 5 — "connected at a broader tier than strictly needed, because the client has no per-tool scoping" is a real trade-off, not a solved problem.

### Step 5: Decide the Approval Mechanism

- **Read-only** → safe to leave enabled by default once authenticated.
- **Write (scoped)** → enable only where a specific skill's workflow explicitly needs it; confirm the specific action per call rather than blanket-approving the server (mirrors `create-task`'s own Guardrail against creating a tracker ticket without explicit confirmation of the drafted content).
- **Write (destructive)** → never blanket-approve. Every call needs an explicit human confirmation in the moment it happens, independent of any client-level "auto-approve" setting.

### Step 6: Record the Decision

- If this server-type isn't yet in `docs/mcp-governance.md`'s table, add a row (tier + one-line blast-radius justification), so the next project doesn't re-derive it.
- If it's project-specific and not worth generalizing into the shared doc (a narrower scope than the general case because this particular project's use is unusually limited), note it instead in this project's own `AGENTS.md`/`CLAUDE.md` next to where the server is declared.
- Flag explicitly whether this is a first-time connection for this project or a re-check of one already approved — a re-check after a version bump should note what changed, not just restate the original decision.

### Step 7: Confirm

Summarize for the user: the server, the tier assigned, the approval mechanism now in effect, and where the decision was recorded.
