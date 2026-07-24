# AIPB-12 — Remote (Cloudflare Workers) transport for the skill server

**Ticket:** (personal backlog item, no external tracker — follow-up to AIPB-11, now merged)
**Type:** Chore

---

## What & Why

AIPB-11 shipped a local-stdio MCP server (`mcp-server/server.js`) serving `skills/*.md` — verified working across the Claude Code CLI, the VS Code extension, the Claude Desktop app, and Cowork. Its own Plan listed one remaining item: "evaluate remote HTTP hosting... for a public, zero-install demo URL." This ticket builds that.

Why it matters beyond "nice to have": local stdio requires whoever connects to it to clone this repo and have Node installed. A remote URL means anyone — a client during a call, a stranger trying the portfolio — can add one line to their MCP config with zero setup. That's the difference between "I built a tool for myself" and "here's a live thing you can use right now," which is the whole point of the review-spa/consulting angle this was built for.

---

## Approach

Cloudflare Workers, per the official MCP docs' own default recommendation for anything that should be reachable over the internet (see AIPB-11's Prior Art section). Two real constraints shaped the implementation:

1. **Workers have no filesystem access at request time.** `server.js` reads `skills/*.md` fresh via `fs` on every call — that's not available in a Worker. Solution: `mcp-server/remote/build.js` bakes the skill content into a generated `skills-data.js` module at build time (run before every deploy), not fetched per-request.
2. **No npm/wrangler access in the sandbox this was built in** (same constraint noted throughout AIPB-11). Two consequences:
   - `worker.js` is zero-dependency, hand-rolled MCP Streamable HTTP over a single `POST /mcp` endpoint — same reasoning as `server.js`'s stdio implementation, just a different transport.
   - Couldn't run `wrangler dev`/`wrangler deploy` to test this end to end. Verified instead via `mcp-server/remote/test.js`, which imports `worker.js`'s actual exported `fetch` handler and drives it with real Web-standard `Request` objects (Node 18+ has `fetch`/`Request`/`Response` as globals — the same Web Fetch API surface Workers implement) — genuinely exercises the real code path, just not inside Cloudflare's actual runtime. **Deployment and a live cross-network test are still outstanding** — see Plan below.

**Deliberately not shared as a common module with `server.js`:** that file is CommonJS (Node), this one is an ES module (Workers) reading from a build-time array instead of `fs`. Bridging module systems without being able to test the bundling/interop felt like more risk than the ~40 lines of duplicated tool logic are worth. Flagged explicitly rather than silently duplicated.

---

## Files

| File | Purpose |
|---|---|
| `mcp-server/remote/worker.js` | The Cloudflare Worker — MCP Streamable HTTP, zero deps |
| `mcp-server/remote/build.js` | Generates `skills-data.js` from `../../skills/*.md` |
| `mcp-server/remote/skills-data.js` | Generated (gitignored candidate — see Open Questions) |
| `mcp-server/remote/test.js` | Smoke test via real `fetch()`/`Request`, no wrangler needed |
| `mcp-server/remote/wrangler.toml` | Minimal Workers config |

---

## Plan

- [x] Build `worker.js` — Streamable HTTP, stateless (no SSE, no session IDs — neither tool needs server push), CORS handled for browser-based clients (AI Playground, MCP Inspector web UI).
- [x] Build `build.js` — bakes 13 skills into `skills-data.js`.
- [x] Verify via `test.js` — real `fetch()` handler, happy + error paths, CORS preflight, wrong method/path, malformed JSON. All passing.
- [x] **Deploy.** Done via Cloudflare's Git integration (dashboard → Workers → connect repo, auto-builds on push to `main`), not a manual `wrangler deploy`. First attempt failed — `wrangler` ran from the repo root, found no `wrangler.toml` (it's at `mcp-server/remote/`), and errored with "Could not detect a directory containing static files." Fixed by setting **Root directory** to `mcp-server/remote` and **Build command** to `node build.js` in the dashboard's build settings. Also renamed the Worker in `wrangler.toml` from `ai-delivery-playbook-mcp` to `ai-delivery-playbook` to match what Cloudflare had actually already named the connected project, so a future manual `wrangler deploy` targets the same service instead of creating a divergent second one.
- [x] **Live cross-network verification.** Confirmed via real `curl` calls against `https://ai-delivery-playbook.mikulas-frenak.workers.dev/mcp`: `initialize` returns the correct `serverInfo`, and `tools/call` → `search_skills("commit")` returns real skill descriptions from the deployed bundle. Not yet done: a real MCP client (Claude Code, Cursor) connecting and using it in an actual conversation, rather than raw `curl` — worth doing for full parity with AIPB-11's verification depth, but the protocol and data are now confirmed correct either way.
- [x] Updated `mcp-server/setup.md`, `mcp-server/README.md`, `mcp-server/remote/README.md`, and `docs/mcp-servers.md` with the real URL. review-spa's Work card description already mentions "servable live over MCP" (added before the deploy succeeded, as a factual-but-general claim) — could add the literal URL as a clickable link now that it's live, not yet done.

---

## Open Questions

- **Commit `skills-data.js` or regenerate on every deploy?** Leaning toward NOT committing it (add to `.gitignore`, treat like a build artifact) — it's fully derived from `skills/*.md`, and a stale committed copy that drifts from the real skill files would be worse than requiring `node build.js` before deploy. Needs a one-line note in `remote/README.md` either way so it's not a surprise.
- **Auth?** Current lean: none, same as AIPB-11's stdio version — the skill catalog is already public. Revisit only if abuse/rate-limiting becomes a real problem, not preemptively.
- **Custom domain vs. `*.workers.dev`?** Default `*.workers.dev` subdomain is fine for v1 — a custom domain is a nice-to-have, not a blocker, and this repo already decided against a custom domain for a different project (family-trails-eu) for similar low-stakes reasons.

---

## Notes

Deleted `.tasks/AIPB-11.md` as part of this ticket's first commit — its PR (#17) is merged, so per this repo's own task-file lifecycle rule (`commit.md` Step 2, `AIPB-05`) it should have been removed already. Doing it now as explicit hygiene rather than silently.
