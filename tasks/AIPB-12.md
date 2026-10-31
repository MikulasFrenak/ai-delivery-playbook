# AIPB-12 — Remote (Cloudflare Workers) transport for the skill server

**Ticket:** (personal backlog item, no external tracker — follow-up to AIPB-11, now merged)
**Type:** Chore
**Status:** done — [PR #20](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/20), closed 2026-07-24 (also #18, #19)
**Source:** restored from git history and closed out in [AIPB-22](./AIPB-22.md)
**Updated by:** [AIPB-13](./AIPB-13.md), [AIPB-26](./AIPB-26.md)

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
   - Couldn't run `wrangler dev`/`wrangler deploy` to test this end to end. Verified instead via `mcp-server/remote/test.js`, which imports `worker.js`'s actual exported `fetch` handler and drives it with real Web-standard `Request` objects (Node 18+ has `fetch`/`Request`/`Response` as globals — the same Web Fetch API surface Workers implement) — genuinely exercises the real code path, just not inside Cloudflare's actual runtime. **Deployment and a live cross-network test are still outstanding** — see What was built below.

**Deliberately not shared as a common module with `server.js`:** that file is CommonJS (Node), this one is an ES module (Workers) reading from a build-time array instead of `fs`. Bridging module systems without being able to test the bundling/interop felt like more risk than the ~40 lines of duplicated tool logic are worth. Flagged explicitly rather than silently duplicated.

---

## What was built

`mcp-server/remote/`: a zero-dependency Cloudflare Worker (`worker.js`, stateless Streamable HTTP on `POST /mcp`, CORS for browser clients), `build.js` baking `skills/*.md` into a gitignored `skills-data.js`, and a `test.js` driving the real `fetch` handler. It deploys through Cloudflare's Git integration on every push to `main`. The first deploy failed until the dashboard's Root directory was set to `mcp-server/remote` with build command `node build.js`. It was verified live at `https://ai-delivery-playbook.mikulas-frenak.workers.dev/mcp` with `curl` and with a real Claude Code CLI connection. Shipped across [#18](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/18) (built, not deployed), [#19](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/19) (deployed) and [#20](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/20) (real client verified).

---

## Open Questions

- Commit `skills-data.js` or regenerate on every deploy? **Regenerate** — it's gitignored and built by `node build.js` in the deploy pipeline.
- Auth? **None** — the catalog is public. Not revisited since.
- Custom domain vs `*.workers.dev`? **`*.workers.dev`**, as leaned.
