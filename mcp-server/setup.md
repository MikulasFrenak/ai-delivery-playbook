# ai-delivery-playbook skill server — Setup

How to connect `mcp-server/server.js` from each Claude client. Every one of these ultimately points at the same command — only the config location and mechanism differ:

```
node /absolute/path/to/ai-delivery-playbook/mcp-server/server.js
```

## Prerequisites

1. **Clone this repo somewhere on the machine that will run the server.** It's local stdio, not a hosted URL (see README's Known limits) — there's no remote endpoint to point at yet, so the person connecting to it needs their own local copy.
2. **Node.js installed** (any reasonably recent version — built and tested on v22). No `npm install` needed; the server has zero dependencies.
3. **Swap `/absolute/path/to/ai-delivery-playbook` for your own clone's actual path** in every example below — e.g. `/Users/<you>/Github/ai-delivery-playbook/mcp-server/server.js`. This is the one step people actually get wrong: copy-pasting the placeholder path as-is silently fails (the client just won't find a server to launch).

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

## Claude Desktop app (also covers Cowork)

A separate config file entirely — `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS (`%APPDATA%\Claude\claude_desktop_config.json` on Windows). There's no in-app "add server" button for a local stdio server as of 2026 — edit the file directly. From a terminal:

```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

The space in "Application Support" needs escaping (`\ `) or the whole path quoted — a plain `Application/Support` (slash instead of space) won't resolve to anything.

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

Merge into the existing `mcpServers` block if the file already has one — don't overwrite it. Fully quit (Cmd+Q, not just closing the window) and reopen the app afterward.

**Confirmed:** this one config file covers both the regular Desktop chat *and* Cowork sessions — despite Cowork running in its own sandboxed environment, it does pick up servers from `claude_desktop_config.json`. No separate Cowork-specific setup needed.

## Cursor / other MCP clients

Same JSON shape, added wherever that client's own docs say its MCP config lives (`.cursor/mcp.json`, settings UI, etc.) — this server speaks plain MCP over stdio, nothing client-specific about it.

---

## Verify it's actually working

Don't just check that the tool appears in a tool list — ask the connected session to use it against a project that isn't this repo:

> "Use search_skills to find something about commit conventions, then get_skill and show me the full content."

If it comes back with real content pulled from `skills/commit.md`, the loop works end to end.

**Confirmed working, live, in all four surfaces above:** Claude Code CLI (`claude mcp list` showed it connected), the VS Code extension (asked from `review-spa`, repo not cloned there — got back an accurate answer pulled from `skills/design-brief.md`), the Claude Desktop app, and a Cowork session (called `search_skills("postmortem incident")` directly and got the real `skills/postmortem.md` description back). See `.tasks/AIPB-11.md` for the full trace.
