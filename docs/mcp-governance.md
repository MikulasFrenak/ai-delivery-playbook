# MCP Governance — Scope & Least Privilege

[`docs/mcp-servers.md`](./mcp-servers.md) documents *how to connect* each server. This doc answers a different question: *what should it be allowed to do once connected* — which is a real, live gap industry-wide, not a speculative concern:

- **Salesforce's 2026 Connectivity Benchmark**: the average org runs ~12 AI agents (heading to ~20 by 2027), and roughly half of them operate with no cross-agent governance at all.
- **Cequence & EMA research (Aug 2026)**: 94% of enterprise IT/security leaders believe their AI agents aren't over-provisioned — but only 33% actually enforce least-privilege access. The other two-thirds run on broad standing permissions that are rarely or never reviewed.

The scaffolding process below is also implemented as a runnable skill — [`/mcp-check`](../skills/mcp-check.md) — that walks through this decision against a real server before it gets added to `.mcp.json`, rather than leaving it as a table someone has to remember to consult.

---

## Scope tiers

| Tier | Meaning | Approve how |
|---|---|---|
| **Read-only** | Can only fetch/query data — no create, edit, comment, toggle, or delete capability reaches an external system | Safe to leave enabled by default once auth is set up |
| **Write (scoped)** | Can create or modify a specific, bounded kind of record (a ticket, a comment, a task) — reversible, and confined to the tool's own domain | Enable by default only where a skill's own workflow explicitly needs it (e.g. `create-task`'s ticket-filing step); confirm the specific action per call, not blanket-approve the server |
| **Write (destructive)** | Can delete, disable, or irreversibly change something outside this repo — production feature flags, cloud infrastructure resources, another system's data | Never blanket-approve. Every call needs an explicit human confirmation in the moment, regardless of what the client's auto-approve settings otherwise allow |

## Per-server assessment

Grounded in what each server's own tool surface actually does, per `docs/mcp-servers.md` — not assumed from the product name.

| Server | Scope tier | Justification / blast radius |
|---|---|---|
| **AI Delivery Playbook Skill Server** (this repo's own) | Read-only | Serves static `skills/*.md` content over MCP — no write path exists in the server's own design. Negligible blast radius even if fully exposed. |
| **Figma MCP** (local or remote) | Read-only | Both options expose design-inspection tools only, per this repo's own docs — no edit-the-design capability. Blast radius if a token leaks: exposure of design files, not corruption of them. |
| **Observability MCP** (e.g. Honeycomb) | Read-only, unless a query explicitly needs trigger management | "Queries, datasets, triggers, SLOs" — querying data is read-only; **creating or editing a trigger is write (scoped)**, since it changes what pages a human or fires an automated action. Treat trigger-management calls as a separate, explicitly-confirmed action, not bundled into the default "let it query" approval. |
| **Issue Tracker MCP — Cloud** (e.g. Atlassian) | Read-only by default; write (scoped) for ticket creation/comments | Fetching ticket context (what `create-task` needs) is read-only. Creating a ticket or posting a comment is write (scoped) — `create-task`'s own Guardrails already require explicit user confirmation of the drafted summary before filing one; this doc generalizes that same rule to any write call this server exposes, not just ticket creation. |
| **Issue Tracker / Wiki MCP — On-Premise** (e.g. Jira DC / Confluence DC) | Same as cloud, plus a credential-handling note | Same read/write split as above. The added risk here is the credential itself: a PAT is a standing token, not an OAuth grant revocable by logging out — request the narrowest scope the issuer's token UI allows, and rotate it if a machine it's stored on is ever compromised. |
| **Feature Flag MCP** (e.g. Flagsmith) | Write (destructive) | Toggling a flag changes real production behavior for real users immediately — the highest blast radius in this list next to the cloud-platform delete operations below. Never auto-approve a toggle call; confirm the specific flag and the specific target environment (not just "which project") every time. |
| **Whiteboard MCP** (e.g. Miro) | Read-only | This repo's own docs already state it explicitly: "gives Claude direct **read** access to boards." No write path documented — nothing further to gate here. |
| **Cloud Platform MCP** (e.g. Cloudflare Developer Platform) | Read-only for inspection; write (destructive) for resource lifecycle calls | The connector's own tool surface includes real delete/create operations (KV namespace, R2 bucket, D1 database, Hyperdrive config) alongside its read/list tools — see `docs/mcp-servers.md`'s own "This isn't read-only" callout. Listing/inspecting Workers or checking a deployment's `modified_on` is read-only and safe to leave enabled; any `*_delete` or resource-creation call is write (destructive) and needs an explicit per-call confirmation — a deleted KV namespace or D1 database is real data loss, not a reversible mistake. |
| **Chrome DevTools MCP** | Write (scoped), confined to a local debug session | Can navigate, click, and fill forms in the attached Chrome instance, not just observe — but that instance is a disposable debug profile on `127.0.0.1:9222` the developer explicitly launched, not a shared or production browser. Blast radius is confined to that local session; the existing security note (never expose the port on `0.0.0.0`) is the actual control that matters here. |
| **Code Quality MCP** (e.g. SonarQube) | Read-only | Queries existing issues; fixing them happens by editing code directly, not through a write call this server exposes. |

## What this doesn't replace

This table is a starting default, not a substitute for reading what a specific server's actual tool list does before connecting it — a server's product category (e.g. "observability") doesn't fully predict its blast radius (e.g. trigger management inside an otherwise read-heavy tool). Run [`/mcp-check`](../skills/mcp-check.md) against a server you're about to add for the first time on a project, even if it's already listed above, since a new version of that server (or a different vendor in the same category) can expose different tools than the ones assessed here.

---

## Sources

- [Salesforce 2026 Connectivity Benchmark — cited via industry coverage](https://www.barchart.com/story/news/1163379/belitsoft-report-2026-ai-agent-trends-enterprises-run-12-ai-agents-on-average-but-half-work-alone)
- [Cequence & EMA Research, Aug 2026 — AI agent over-provisioning](https://www.globenewswire.com/news-release/2026/08/31/3353329/0/en/new-cequence-ema-research-94-of-enterprises-trust-their-ai-agents-aren-t-over-provisioned-only-33-actually-enforce-it.html)
