# ai-delivery-playbook skill server

An MCP server that serves this repo's `skills/*.md` files at runtime, so any MCP-compatible agent can pull them without cloning the repo or copying files into `.claude/skills/`. See [`../.tasks/AIPB-11.md`](../.tasks/AIPB-11.md) for the research and design decisions behind this shape, and [`../docs/future-considerations.md`](../docs/future-considerations.md) for why a fuller version (wrapping each skill as its own tool) isn't what got built.

## What it does

Two tools, not one per skill:

- **`search_skills(query)`** — keyword search over skill id + description. Empty query lists every skill.
- **`get_skill(skill_id)`** — returns one skill's full markdown, frontmatter included, exactly as it lives in `skills/`.

Nothing runs server-side beyond reading local files. The calling agent reads the fetched skill and follows it itself — same as if it had this repo cloned. Skills that depend on another MCP server already being connected (`design-brief` needs Figma, `verify-browser` needs chrome-devtools) still work that way through the *calling* client's own connections; this server never touches those.

## Zero dependencies

No `npm install` needed — `server.js` uses only Node's built-in `fs`, `path`, and `readline`, and implements the MCP JSON-RPC wire protocol directly rather than pulling in the MCP SDK (this sandbox had no npm registry access when it was built; keeping it dependency-free means that's a non-issue for anyone using it too).

Requires Node.js (any reasonably recent version — built and tested on v22).

## Connect it

See [`setup.md`](./setup.md) for exact steps per client — Claude Code CLI, the VS Code/JetBrains extension, the Claude Desktop app, and Cursor/other MCP clients each read their config from a different place, and the CLI's and the IDE extension's configs don't share automatically. Short version: it's always the same `node .../mcp-server/server.js` command, just registered differently depending on where you're running it from.

## Verify it

```bash
node mcp-server/test.js
```

Spawns `server.js` as a real subprocess and drives it over stdio exactly like an MCP client would: `initialize` → `notifications/initialized` → `tools/list` → `tools/call` for both tools, plus the error paths (missing `skill_id`, unknown skill, unknown tool). Prints `OK` and exits 0 on success.

## Known limits

- **Local stdio only, no remote hosting yet.** Whoever wants to use this needs the repo cloned locally so `server.js` can read `../skills/*.md` — it isn't reachable over the internet the way `https://mcp.figma.com/mcp` is. Remote HTTP hosting (Cloudflare Workers, per AIPB-11's plan) is a later step, once there's a real reason to distribute a URL instead of a path.
- **No fresh-session verification.** `test.js` proves the wire protocol works; it doesn't prove a *different* Claude Code/Cursor session on a separate machine (with this repo not cloned) can connect and use it end to end. Do that check before relying on this for a client demo.
- **Keyword search only.** Fine at 13 skills; revisit (embeddings, hybrid ranking) only if the catalog grows enough that keyword-in-description misses matches people expect.
