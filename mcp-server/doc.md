# mcp-server — Skill Server

## Purpose

Serves this repo's `skills/*.md` files over MCP (Model Context Protocol) so any MCP-compatible agent can search and fetch them at runtime, instead of a human copying files into a project's `.claude/skills/`. Built as the v1 prototype for AIPB-11 — see `.tasks/AIPB-11.md` for why this shape (two generic content-serving tools, not one tool per skill) was chosen.

## Structure

- `server.js` — the server itself. Reads `../skills/*.md` on every call (no caching, no build step — 13 small files, not worth it yet), parses each file's YAML-ish frontmatter with a hand-rolled line parser (no `js-yaml` dependency), and implements the MCP JSON-RPC 2.0 stdio protocol directly (`initialize`, `notifications/initialized`, `tools/list`, `tools/call`) with zero npm dependencies.
- `test.js` — smoke test. Spawns `server.js` as a real child process and talks to it over stdio exactly as an MCP client would, asserting on both tools' happy paths and error paths. Run with `node mcp-server/test.js`.
- `README.md` — what the server does, dependencies, verification, known limits.
- `setup.md` — exact connection steps per client (Claude Code CLI, VS Code/JetBrains extension, Claude Desktop app, Cursor/other) — split out because each reads its MCP config from a different place, and a couple of them don't share config with each other even on the same machine.
- `remote/` — Cloudflare Workers version of this same server (Streamable HTTP instead of stdio, no clone needed once deployed). Built and locally verified, not yet deployed — see `remote/README.md` and `.tasks/AIPB-12.md`.

## Data Source

Reads directly from `../skills/*.md` on disk — there is no separate database or index. `search_skills` and `get_skill` are pure functions of what's currently in `skills/`, so the server's catalog always matches the repo's actual skill set with no sync step to forget.

## Fetch-and-follow, not fetch-and-copy

The whole point of serving skills over MCP is that a connected agent can run one *without* the repo cloned. Left unstated, an agent calling `get_skill` will reflexively fall back to what it knows from Claude Code's native skill mechanism — copy the returned content into the current project's `.claude/skills/` (or `.claude/commands/`) before treating it as runnable, since that's how skill files normally get discovered. That defeats the "no clone/no copy needed" premise this server exists for, and it showed up in practice: a VS Code extension session asked to run `branch-cleanup` via MCP, and its first move was writing `.claude/skills/branch-cleanup.md` into an unrelated repo instead of just following the fetched instructions.

Fixed at the tool level, not by hoping the calling agent infers it correctly: `get_skill`'s own `description` now says explicitly not to copy the file locally, and every successful `get_skill` response is prefixed with a one-line reminder (`"Fetched via MCP — follow these instructions directly now..."`) so the instruction travels with the content itself rather than living only in a tool description that might not get weighted heavily. Copying into `.claude/skills/` is still the right move, but only when the user separately asks for the skill to work as a native `/skill-name` slash command going forward — that's a different, opt-in request, not something `get_skill` should default to.

## Known Issues & TODOs

- [ ] Not yet verified against a genuinely separate agent session (different machine, repo not cloned) — only verified via the in-process smoke test (`test.js`). Do this before using it in a real client demo.
- [ ] MCP's `prompts` primitive (an alternative shape, more literally "user-controlled" than `tools`) was considered and deferred — client support for it is inconsistent as of this writing. Revisit per AIPB-11 if that changes.
- [ ] `implement-task`'s Step 5 (QA selectors, i18n, feature flags, component wiring) doesn't have a template for "build a standalone tool" — this doc.md and the file structure above are the ad-hoc substitute. Worth generalizing only once a second tool/server of this shape gets built (see AIPB-11's Delivery Note).
