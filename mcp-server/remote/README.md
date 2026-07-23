# ai-delivery-playbook skill server — remote (Cloudflare Workers)

The remote counterpart to [`../server.js`](../server.js) (local stdio): same two tools, `search_skills` and `get_skill`, same skill content — but reachable over the internet instead of requiring the repo cloned locally. See [`../../.tasks/AIPB-12.md`](../../.tasks/AIPB-12.md) for the design decisions and current status.

**Status: built and verified locally, not yet deployed.** Deploying needs a Cloudflare account and `wrangler` — both outside what this was built with (no npm/Cloudflare network access in that sandbox). The steps below are what deploying it looks like; they haven't been run yet.

## Why this exists

`server.js` needs the repo cloned + Node installed on whoever's connecting. This is the "add one URL, zero setup" version — a client on a call, or a stranger visiting the portfolio, can connect without cloning anything.

## How it differs from `server.js`

- **Transport:** MCP Streamable HTTP (`POST /mcp`) instead of stdio. Stateless — no SSE, no session IDs, since neither tool needs server-initiated messages.
- **Skill content:** baked into `skills-data.js` at build time instead of read from disk per-request — Cloudflare Workers have no filesystem access at runtime. Run `node build.js` to (re)generate it from `../../skills/*.md`; it's gitignored (fully derived, regenerate rather than commit and risk drift).
- **Zero dependencies**, same as `server.js` — hand-rolled JSON-RPC over HTTP rather than the MCP SDK, for the same reason (no npm registry access when this was built).
- **Not sharing tool logic with `server.js` as a common module** — different module systems (CommonJS vs. ES module) and no way to test the bundling interop in the sandbox this was built in. The ~40 lines of tool logic are duplicated on purpose; see `worker.js`'s header comment.

## Deploy it

```bash
node build.js          # generates skills-data.js from ../../skills/*.md
npx wrangler deploy    # needs a Cloudflare account; prompts to log in on first run
```

Deploys to `https://ai-delivery-playbook-mcp.<your-subdomain>.workers.dev/mcp` (name comes from `wrangler.toml`). Re-run `node build.js` before every deploy if `skills/*.md` changed since the last one.

## Verify it

```bash
node test.js
```

Imports `worker.js`'s actual exported `fetch` handler and drives it with real Web-standard `Request` objects (Node 18+ has `fetch`/`Request`/`Response` as globals — the same Web Fetch API surface Workers implement). This exercises the real request-handling code path — JSON-RPC parsing, all four MCP methods, both tools' happy and error paths, CORS preflight, wrong method/path, malformed JSON — without needing `wrangler dev` or a live deploy.

**What this does NOT verify:** that the deployed Worker is actually reachable and behaves the same inside Cloudflare's real runtime, or that a real MCP client (Claude Code, Cursor) can connect to the live URL end to end. Do that check after deploying — connect a client to the `*.workers.dev` URL and ask it a real question, the same way AIPB-11's stdio version was verified.

## Connect a client to it once deployed

Same shape as any other remote MCP server in [`../../docs/mcp-servers.md`](../../docs/mcp-servers.md) — `type: "http"` instead of a local `command`:

```json
{
  "mcpServers": {
    "ai-delivery-playbook": {
      "type": "http",
      "url": "https://ai-delivery-playbook-mcp.<your-subdomain>.workers.dev/mcp"
    }
  }
}
```

Update [`../setup.md`](../setup.md) with the real URL once deployed — right now it only documents the local stdio path.
