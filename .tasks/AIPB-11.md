# AIPB-11 — MCP server exposing this playbook's skills (research + plan)

**Ticket:** (personal backlog item, no external tracker — see `money-save/PLAN.md` "Own MCP server" and `docs/future-considerations.md`)
**Type:** Chore — research/planning only, no implementation yet

---

## What & Why

`docs/future-considerations.md` already captures the pitch and the honest "not now" reasoning. This ticket goes one layer deeper: actual prior-art research on how servers like this are built elsewhere, so the eventual v1 (whenever its start trigger fires) doesn't have to invent the shape from scratch.

The pitch, restated: wrap this repo's `skills/*.md` so any MCP-compatible agent can pull them live instead of a human copying files into `.claude/skills/`. Point a client's own Claude Code/Cursor session at the server and the methodology is right there — a stronger consulting demo than a repo walkthrough, and a stronger review-spa artifact than a case-study writeup.

---

## How It Will Look (Architecture)

Two real patterns found in the wild — recommending the first for v1.

### Option A — Content-serving server (recommended)

Two generic tools, not one tool per skill:

- `search_skills(query)` → matching skill names + descriptions
- `get_skill(skill_id)` → the full skill markdown, frontmatter included

The calling agent's own model reads and follows the fetched skill exactly as if it had cloned this repo — nothing moves server-side, no logic gets reimplemented as a function. This is the exact shape documented at agensi.io's guide to building MCP skill servers, and it's what Agensi's own commercial skill marketplace runs at scale (2,000+ skills, live catalog, same two-tool contract).

This resolves 2 of the 4 blockers logged in `future-considerations.md`:
- **"Skills aren't deterministic functions"** — stops being a blocker, because they never become functions. They stay agent-read markdown, just fetched over the wire instead of from a local clone.
- **"Some skills depend on another already-connected MCP"** (`design-brief` → Figma, `verify-browser` → chrome-devtools) — also resolves, because the *calling client* executes the skill in its own already-configured session. My server hands back instructions, never proxies Figma/chrome-devtools credentials or calls.

The other 2 blockers stand: no real second consumer yet, and the human-in-the-loop property still needs deliberate protection (see Usability below for how Option A actually keeps this, arguably better than the current copy-paste-a-file model).

### Option B — MCP "prompts" primitive

MCP's spec has a third primitive built for exactly this: **prompts** — reusable, user-controlled templates, distinct from **tools** (model-controlled function calls) and **resources** (read-only data). A `prompts/list` + `prompts/get` pair would expose each skill as a selectable, arg-templated prompt the user explicitly picks — which mirrors this repo's own `disable-model-invocation: true` / "only run when user explicitly types `/skill-name`" rule almost exactly, since prompts are spec'd as user-controlled, not something a model reaches for unprompted.

Caveat: multiple 2026 sources independently call prompts "the least-used, most underrated" of the three primitives — client support is inconsistent today. Worth prototyping later, but Option A is the safer bet now since every MCP client implements `tools`.

Both options are a thin serving layer over the existing `skills/*.md` files — not a rewrite of the skills themselves.

---

## How It Will Help

- **Consulting demo, not a slide.** A prospective client's own Claude Code/Cursor session can `search_skills("code review")` and `get_skill("design-brief")` without cloning anything — live proof for the AI-agent-consulting positioning already in `money-save/PLAN.md`.
- **review-spa's AI Delivery Playbook case study** goes from "here's a repo" to "here's a thing you can connect to right now" — a materially stronger portfolio artifact than a link to GitHub.
- **Matches intent already in this repo.** `AGENTS.md`/`CLAUDE.md` are already split so skills read tool-agnostically across Codex, Copilot, Cursor, Aider. Serving them over MCP is the natural continuation of that, not a new direction.
- **Zero rewrite risk.** Reuses 100% of existing skill content — this is a delivery-channel change, not a content change.

---

## Usability

- **Setup mirrors every other entry already in `docs/mcp-servers.md`** — a single `.mcp.json` line:
  ```json
  { "mcpServers": { "ai-delivery-playbook": { "url": "https://<hosted-url>/mcp" } } }
  ```
  or local `stdio` for early prototyping, per the official MCP reference skill's own guidance (prototype local stdio first, upgrade to remote HTTP once ready to distribute).
- **No auth needed.** The skill catalog is already public in this repo (`public-repo-check` discipline already applies) — this sidesteps the OAuth/token concerns that dominate every other entry in `mcp-servers.md`. Auth for individual skills (Figma, Jira, etc.) stays exactly where it already lives: in the calling client's own separate MCP connections, never in this server.
- **Tool-agnostic by construction** — any MCP client works (Claude Code, Cursor, Codex, Copilot, Gemini CLI), because they all speak the same `tools/list` + `tools/call` wire format. Matches this repo's README claim that skills are "read natively by Codex, Copilot, Cursor, Aider and most other agents" — this would make that claim literally true over the wire, not just true of the file format.

---

## Prior Art / Research Notes

- **MCP's own docs run the inverse pattern** — agent skills used to help *build* MCP servers ([modelcontextprotocol.io/docs/develop/build-with-agent-skills](https://modelcontextprotocol.io/docs/develop/build-with-agent-skills), the `anthropics/claude-plugins-official` `mcp-server-dev` plugin). Confirms "skills" is a first-class, actively maintained MCP-ecosystem concept, not a Claude-Code-only convention — the shape we'd be building is well-trodden, not novel.
- **agensi.io's skill marketplace** runs Option A's exact `search_skills`/`get_skill` shape commercially. Their skill-search-quality note applies directly to us: start with keyword/name+description matching (we have ~13 skills — no need for embeddings at this scale; revisit only if the catalog grows a lot).
- **[github.com/microsoft/skills](https://github.com/microsoft/skills)** — a public Microsoft repo combining Skills + MCP servers + Custom Agents + `AGENTS.md` for SDKs. Real large-org precedent for this repo's exact shape (skills + MCP + `AGENTS.md` together). Worth a closer read before implementation to see how they split skill-content-serving from other MCP tools, if at all.
- **MCP "prompts" primitive** (Option B) is real spec but under-implemented client-side per multiple independent 2026 sources — noted for the record, not disqualifying, just why Option A is the safer v1.

---

## Plan (once actually started — not now)

- [x] Confirm the start trigger from `future-considerations.md` has actually fired: a real second consumer (your own Claude Code session on a different machine/project connecting to this server, or a real client engagement) — not a speculative build. **Resolved by explicit decision:** built on direct instruction rather than waiting for an external trigger — noted here rather than pretending the originally-planned trigger fired.
- [x] Prototype Option A locally: stdio MCP server, two tools (`search_skills`, `get_skill`), backed directly by `skills/*.md` on disk — no database. Built in `mcp-server/server.js`, zero npm dependencies (hand-rolled JSON-RPC 2.0 over stdio, since npm/pip registries are unreachable in this sandbox — see `mcp-server/README.md`).
- [~] Test against a fresh Claude Code session with this repo NOT cloned — **partially done.** `mcp-server/test.js` spawns the real server as a subprocess and drives it over genuine stdio JSON-RPC (`initialize` → `notifications/initialized` → `tools/list` → `tools/call`, happy paths + error paths), all passing (13 skills served). What's still unverified: an actual *separate* agent session, different machine, repo not cloned — this sandbox can't spin that up. Do that check before relying on this for a real client demo (see `mcp-server/README.md` → Known limits).
- [ ] If that works, evaluate remote HTTP hosting (Cloudflare Workers is the MCP reference skill's own recommended default) for a public, zero-install demo URL.
- [ ] Revisit Option B (prompts primitive) only if a specific client you actually use doesn't support tool-based skill selection well, or once prompts support is more consistent across clients.

---

## Delivery Note

When this actually gets picked up, `/implement-task` mostly fits as-is — Steps 0, 1, 1b, 2, 4, 6, 7, 8, 9, 10, 11 apply cleanly (this is a single-repo project, so `<package-root>` is just the repo root, no monorepo detection needed). The one soft spot: Step 5 is templated around QA selectors, i18n, feature flags, and component/view wiring — none of which apply to a two-tool stdio server. Run it anyway, just skip 5a–5d/5f as not-applicable and treat 5e/5g loosely ("write the server module" / "wire it into the entrypoint"). Not worth generalizing `implement-task` for a "build a standalone tool" path preemptively — same bar as everything else here: this ticket would be the *first* instance of that shape, not a second one to generalize from.

## Open Questions

- Public catalog or gated? Current lean: public, same bar as the rest of this repo — but confirm before hosting remotely, since a queryable public MCP URL is a slightly different exposure than a public git repo (machine-queryable at will, not just human-readable).
- Same repo (e.g. a `/mcp-server` subdirectory) or a separate repo? Leaning same repo — it's a serving layer over content that already lives here, and a separate repo risks sync drift between two copies of the skill content.

---

## Files to Touch

| File | Change |
|---|---|
| `mcp-server/server.js` | New — the MCP stdio server, zero deps |
| `mcp-server/test.js` | New — smoke test, real subprocess + stdio JSON-RPC |
| `mcp-server/README.md` | New — setup + known limits |
| `mcp-server/doc.md` | New — `code-doc`-style documentation (adapted for a non-frontend module) |
| `docs/mcp-servers.md` | New section registering this server (the first entry documenting a server this repo *provides*, not consumes) |
| `README.md` | One line pointing at `mcp-server/README.md` |
| `architecture.md` | Note that Level 1 skills are also servable over MCP |
| `docs/future-considerations.md` | Already updated in the prior session with the search_skills/get_skill research |

---

**Status: v1 prototype built, not yet remotely hosted or verified against a separate live agent session.** Local stdio works end to end per `test.js`. Remaining before calling this "done": a real cross-session verification, and a decision on remote hosting. See `mcp-server/README.md` → Known limits.
