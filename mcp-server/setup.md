# ai-delivery-playbook skill server — Setup

How to connect `mcp-server/server.js` from each Claude client. Every one of these ultimately points at the same command — only the config location and mechanism differ:

```
node /absolute/path/to/ai-delivery-playbook/mcp-server/server.js
```

---

## Claude Code (CLI)

```bash
claude mcp add --transport stdio ai-delivery-playbook --scope user -- node /absolute/path/to/ai-delivery-playbook/mcp-server/server.js
```

`--scope user` makes it available from any project, not just this repo — the whole point is using it without ai-delivery-playbook cloned/open. Verify with `claude mcp list`; restart the session if it doesn't show up immediately.

## Claude Code (VS Code / JetBrains extension)

The IDE extension does **not** inherit `~/.claude.json`'s user-scoped servers as of 2026 — that's a known gap between the CLI and the extension (they read different config, tracked in anthropics/claude-code#42740). The reliable path is a **project-level `.mcp.json`**, placed at the root of whichever project you're actually working in (not this repo) — that file is read by both the CLI and the extension:

```json
{
  "mcpServers": {
    "ai-delivery-playbook": {
      "command": "node",
      "args": ["/absolute/path/to/ai-delivery-playbook/mcp-server/server.js"]
    }
  }
}
```

Reload the window after adding it. You can also swap configs on the fly with `claude --mcp-config <path>`, or check what's currently loaded with the `/mcp` command inside a session.

## Claude Desktop app

A separate config file entirely — `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS (`%APPDATA%\Claude\claude_desktop_config.json` on Windows). There's no in-app "add server" button for a local stdio server as of 2026 — edit the file directly:

```json
{
  "mcpServers": {
    "ai-delivery-playbook": {
      "command": "node",
      "args": ["/absolute/path/to/ai-delivery-playbook/mcp-server/server.js"]
    }
  }
}
```

Merge into the existing `mcpServers` block if the file already has one — don't overwrite it. Fully quit and reopen the app afterward; closing the window isn't enough for it to reload config.

**Note:** a Cowork session inside the Desktop app runs in its own separate sandboxed environment and won't automatically see servers added this way either — this covers the regular (non-Cowork) Desktop chat.

## Cursor / other MCP clients

Same JSON shape, added wherever that client's own docs say its MCP config lives (`.cursor/mcp.json`, settings UI, etc.) — this server speaks plain MCP over stdio, nothing client-specific about it.

---

## Verify it's actually working

Don't just check that the tool appears in a tool list — ask the connected session to use it against a project that isn't this repo:

> "Use search_skills to find something about commit conventions, then get_skill and show me the full content."

If it comes back with real content pulled from `skills/commit.md`, the loop works end to end. See `README.md` → Known limits for what's still unverified.
