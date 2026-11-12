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

## Unattended runs: the allowlist is the approval

The tiers above assume a person is there: in an interactive session a write (scoped) call is confirmed per call. A cloud agent, a headless run and a scheduled job have no one to ask. Some clients then run every tool on the allowlist without a prompt (GitHub's cloud agent documents this for the MCP tools in a repository's configuration). So in an unattended run **an allowlist entry is a pre-approved call**, and the scope tier decides what may be on the list:

| Scope tier | On an unattended allowlist? |
|---|---|
| **Read-only** | Yes, by tool name. A wildcard only if the whole server is read-only and its tool list was read |
| **Write (scoped)** | Only a tool the run's own task needs, named, and behind a gate that is not a prompt (below). Otherwise leave it off and let a person do the write step |
| **Write (destructive)** | Never |

Three rules:

1. **Name the tools, don't use a wildcard.** A server update that adds a tool must not add a permission.
2. **Gate with something that runs without a person**: a deny rule, or a pre-tool-use hook, a script the client runs before each tool call that can allow, deny or change it. Keep the script in the repo and review it like code.
3. **Find out what the client remembers.** Some clients save approvals per project folder and reuse them in later sessions, including unattended ones, so a run started with a narrow allow list can still run more than that list.

What has been run and what has not (one client, 2026-11-12):

| Claim | Status |
|---|---|
| A pre-tool-use hook denied `git push` although the same invocation explicitly allowed it; the agent reported the denial and did not look for a way round | Proven, one client (GitHub Copilot CLI 1.0.109, macOS) |
| A deny flag for a command beat a saved approval for the same command | Proven, same client |
| Approvals saved for the project folder were reused by a later non-interactive run: a run allowed only one command family also ran another | Proven, same client |
| An error in a command hook denies the call, a timeout lets it through | Not yet proven: from the vendor's documentation. Keep hooks fast and don't count on a timeout to block |
| A cloud agent runs allowlisted MCP tools without asking; secrets need a fixed name prefix; remote servers that need OAuth are not supported; for code review every tool must be marked read-only by its server | Not yet proven: from the vendor's documentation, no cloud run was done |
| The same hook works in other clients | Not yet proven: the vendor documents Claude-style matchers for hooks, nothing was tested |

Where each client reads its MCP configuration (all from documentation, not tested here):

| Client | Where | Note |
|---|---|---|
| Claude Code | project `.mcp.json` | as in [`docs/mcp-servers.md`](./mcp-servers.md) |
| GitHub Copilot CLI | user `~/.copilot/mcp-config.json`; project `.mcp.json` or `.github/mcp.json` | the project entry wins when names clash |
| VS Code | `.vscode/mcp.json` | |
| GitHub cloud agent and code review | repository settings, a JSON `mcpServers` object | one configuration shared by both; each server has a `tools` list |

## What this doesn't replace

This table is a starting default, not a substitute for reading what a specific server's actual tool list does before connecting it — a server's product category (e.g. "observability") doesn't fully predict its blast radius (e.g. trigger management inside an otherwise read-heavy tool). Run [`/mcp-check`](../skills/mcp-check.md) against a server you're about to add for the first time on a project, even if it's already listed above, since a new version of that server (or a different vendor in the same category) can expose different tools than the ones assessed here.

---

## Sources

- [Salesforce 2026 Connectivity Benchmark — cited via industry coverage](https://www.barchart.com/story/news/1163379/belitsoft-report-2026-ai-agent-trends-enterprises-run-12-ai-agents-on-average-but-half-work-alone)
- [Cequence & EMA Research, Aug 2026 — AI agent over-provisioning](https://www.globenewswire.com/news-release/2026/08/31/3353329/0/en/new-cequence-ema-research-94-of-enterprises-trust-their-ai-agents-aren-t-over-provisioned-only-33-actually-enforce-it.html)
- [GitHub Docs — Configure MCP servers for your repository](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/extend-cloud-agent-with-mcp)
- [GitHub Docs — Copilot hooks reference](https://docs.github.com/en/copilot/reference/hooks-reference)
- [GitHub Docs — Copilot CLI configuration directory](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference)
- [GitHub Docs — Configuring GitHub Copilot CLI (tool permissions)](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/configure-copilot-cli)
