# ai-delivery-playbook skill server — remote (Cloudflare Workers)

The remote counterpart to [`../server.js`](../server.js) (local stdio): same two tools, `search_skills` and `get_skill`, same skill content — but reachable over the internet instead of requiring the repo cloned locally. See [`../../.tasks/AIPB-12.md`](../../.tasks/AIPB-12.md) for the design decisions and current status.

**Status: deployed and verified live.** `https://ai-delivery-playbook.mikulas-frenak.workers.dev/mcp` — confirmed with real `curl` calls: `initialize` returns the correct `serverInfo`, `tools/call` → `search_skills("commit")` returns real skill descriptions from the deployed bundle.

Deployed via Cloudflare's **Git integration** (dashboard → Workers → connect repo), not a local `wrangler deploy` — worth knowing because the two build settings below aren't wrangler defaults, they're specific to that flow:

- **Root directory:** `mcp-server/remote` (wrangler.toml doesn't live at the repo root)
- **Build command:** `node build.js` (generates the gitignored `skills-data.js` before `wrangler deploy` runs — without this, the deploy fails with "Could not detect a directory containing static files", because `wrangler deploy` finds no config and no import target)

## Why this exists

`server.js` needs the repo cloned + Node installed on whoever's connecting. This is the "add one URL, zero setup" version — a client on a call, or a stranger visiting the portfolio, can connect without cloning anything.

## How it differs from `server.js`

- **Transport:** MCP Streamable HTTP (`POST /mcp`) instead of stdio. Stateless — no SSE, no session IDs, since neither tool needs server-initiated messages.
- **Skill content:** baked into `skills-data.js` at build time instead of read from disk per-request — Cloudflare Workers have no filesystem access at runtime. Run `node build.js` to (re)generate it from `../../skills/*.md`; it's gitignored (fully derived, regenerate rather than commit and risk drift).
- **Zero dependencies**, same as `server.js` — hand-rolled JSON-RPC over HTTP rather than the MCP SDK, for the same reason (no npm registry access when this was built).
- **Not sharing tool logic with `server.js` as a common module** — different module systems (CommonJS vs. ES module) and no way to test the bundling interop in the sandbox this was built in. The ~40 lines of tool logic are duplicated on purpose; see `worker.js`'s header comment.

## Deploy it (manually, from a local machine)

```bash
node build.js          # generates skills-data.js from ../../skills/*.md
npx wrangler deploy    # needs a Cloudflare account; prompts to log in on first run
```

Deploys to `https://ai-delivery-playbook.<your-subdomain>.workers.dev/mcp` (name comes from `wrangler.toml`). Re-run `node build.js` before every deploy if `skills/*.md` changed since the last one.

The live deployment actually runs through Cloudflare's Git integration instead (auto-builds on push to `main`) — see the Root directory / Build command settings above. Either path works; the Git integration just means new skills or fixes go live automatically on merge, without a manual `wrangler deploy` step.

## Verify it

```bash
node test.js
```

Imports `worker.js`'s actual exported `fetch` handler and drives it with real Web-standard `Request` objects (Node 18+ has `fetch`/`Request`/`Response` as globals — the same Web Fetch API surface Workers implement). This exercises the real request-handling code path — JSON-RPC parsing, all four MCP methods, both tools' happy and error paths, CORS preflight, wrong method/path, malformed JSON — without needing `wrangler dev` or a live deploy.

`test.js` alone doesn't prove the live deployment works — the `curl` checks above (against the actual `*.workers.dev` URL) cover that gap. Beyond that: confirmed via `claude mcp add --transport http ai-delivery-playbook --scope user https://ai-delivery-playbook.mikulas-frenak.workers.dev/mcp` — the Claude Code CLI connects to the remote URL directly and works, same confidence level as AIPB-11's stdio verification, just over HTTP instead of stdio.

## Connect a client to it

Same shape as any other remote MCP server in [`../../docs/mcp-servers.md`](../../docs/mcp-servers.md) — `type: "http"` instead of a local `command`:

```json
{
  "mcpServers": {
    "ai-delivery-playbook": {
      "type": "http",
      "url": "https://ai-delivery-playbook.mikulas-frenak.workers.dev/mcp"
    }
  }
}
```

See [`../setup.md`](../setup.md) for per-client steps.
