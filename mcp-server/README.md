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

- **Local stdio only, for now.** Whoever uses `server.js` directly needs the repo cloned so it can read `../skills/*.md` — it isn't reachable over the internet the way `https://mcp.figma.com/mcp` is. A remote version exists at [`remote/`](./remote/) (Cloudflare Workers, Streamable HTTP) — built and locally verified, not yet deployed. See `remote/README.md` and `.tasks/AIPB-12.md`.
- **Keyword search only.** Fine at 13 skills; revisit (embeddings, hybrid ranking) only if the catalog grows enough that keyword-in-description misses matches people expect.
- **Per-client config, not shared automatically.** The Claude Code CLI and the VS Code/JetBrains extension read different config files — registering via `claude mcp add --scope user` does not make the server available in the extension. One exception: the Claude Desktop app's `claude_desktop_config.json` covers both the regular Desktop chat *and* Cowork sessions, despite Cowork running in its own sandboxed environment. See `setup.md` for what each client actually needs.

Fresh-session, repo-not-cloned use has been verified live in all four surfaces: the Claude Code CLI, the VS Code extension (asked from `review-spa`, ai-delivery-playbook not cloned there — got back an accurate answer pulled from `skills/design-brief.md`), the Claude Desktop app, and a Cowork session (called `search_skills`/`get_skill` directly, got real content back from `skills/postmortem.md`).
