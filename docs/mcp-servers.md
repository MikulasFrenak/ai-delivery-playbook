# MCP Servers

MCP servers are declared in `.mcp.json` at the repo root. A committed `.claude/settings.json` with `"enableAllProjectMcpServers": true` enables every server in `.mcp.json` automatically — no per-developer opt-in needed.

To disable a specific server for yourself only, add it to `disabledMcpjsonServers` in `.claude/settings.local.json`:

```json
{
  "disabledMcpjsonServers": ["sonarqube"]
}
```

Common reasons to disable a server:

| Server | Common reason to disable |
|---|---|
| `sonarqube` | No token, or don't want a Docker container running per session |
| `figma` | Figma desktop app not installed or not running |
| `honeycomb` (or other observability tool) | Don't use observability tooling |
| `atlassian` (or other issue tracker) | Don't need cloud issue-tracker integration, or prefer to paste ticket content manually |
| on-premise trackers (e.g. `jira-dc` / `confluence-dc`) | No token set up for the self-hosted instance |
| `miro` | Don't use whiteboard tooling or prefer not to authenticate |
| `chrome-devtools` | Chrome not running with `--remote-debugging-port=9222` |

Restart Claude Code after editing `settings.local.json`.

This file documents the servers this playbook's skills/workflows commonly assume. Treat each section below as a template — swap in your project's actual hostnames, project keys, and auth details.

---

## AI Delivery Playbook Skill Server (this repo's own server)

Unlike every other entry in this file — which document servers this repo's skills *consume* — [`mcp-server/`](../mcp-server/) is a server this repo *provides*: it serves `skills/*.md` over MCP so any agent can search and fetch them without cloning the repo. See [`mcp-server/README.md`](../mcp-server/README.md) for setup and [`.tasks/AIPB-11.md`](../.tasks/AIPB-11.md) for the design decisions.

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

Local stdio only for now — no remote hosting yet, so the repo needs to be cloned locally.

---

## Figma MCP

Figma offers two MCP options — pick one per developer/machine.

### Option A — Local (Figma desktop app)

Runs inside the **Figma desktop app** on `http://127.0.0.1:3845/mcp` — no separate process needed.

**Setup:**
1. Install the [Figma desktop app](https://www.figma.com/downloads/)
2. Keep it running while using Claude Code

### Option B — Remote (hosted)

A remote HTTP server at `https://mcp.figma.com/mcp` — no desktop app required, useful on machines where installing/running the desktop app isn't practical (e.g. CI, remote/cloud dev environments).

```json
{
  "mcpServers": {
    "figma-remote": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp"
    }
  }
}
```

**Step 1 — Authenticate:**

Uses OAuth — no token or env var needed. On first use, Claude triggers an interactive authentication flow that opens a browser to log in via your Figma account.

**Step 2 — Verify:**

```bash
claude   # restart Claude Code — the tools appear in the tool list
```

**Usage:** Figma-dependent skills/workflows (e.g. a design-implementation skill) become available automatically once either option is connected. If both `figma` and `figma-remote` are declared in `.mcp.json`, disable whichever one you don't use via `disabledMcpjsonServers` to avoid duplicate tools.

---

## Observability MCP (example: Honeycomb)

A remote HTTP MCP server (e.g. `https://mcp.<region>.honeycomb.io/mcp`) can expose observability data (queries, datasets, triggers, SLOs) to Claude.

**Prerequisites:** An account with access to the relevant region/environment.

**Step 1 — Authenticate:**

Most of these use OAuth — no token needs to be set as an env var. On first use, Claude triggers an interactive authentication flow that opens a browser to log in.

**Step 2 — Verify:**

```bash
claude   # restart Claude Code — the tools appear in the tool list
```

---

## Issue Tracker MCP — Cloud (example: Atlassian / Jira Cloud)

A remote HTTP server (e.g. `https://mcp.atlassian.com/v1/mcp/authv2`) gives Claude direct access to a cloud issue tracker (and wiki, e.g. Confluence Cloud) so skills like `create-task` can fetch ticket context without you pasting it manually.

**Prerequisites:** A cloud account with access to your organization's instance (e.g. `<your-org>.atlassian.net`).

**Step 1 — Authenticate:**

Uses OAuth 2.1 — no token or env var needed. On first use, Claude triggers an interactive authentication flow that opens a browser to log in.

**Step 2 — Verify:**

```bash
claude   # restart Claude Code — the tools appear in the tool list
```

After authentication, ask Claude to fetch any ticket to confirm it works:
> "Get the context from PROJ-1234"

> **Important:** If your organization also runs an on-premise instance, the cloud server won't see those tickets — see the on-premise section below.

---

## Issue Tracker / Wiki MCP — On-Premise (example: Jira DC / Confluence DC)

For self-hosted instances (e.g. `jira.<your-domain>` / `confluence.<your-domain>`), auth is typically via a **Personal Access Token (PAT)** rather than OAuth, using a CLI-based MCP server (e.g. `mcp-atlassian`).

**Step 1 — Generate PATs:**

- Issue tracker: your instance → top-right avatar → **Profile** → **Personal Access Tokens** → Create
- Wiki: same, on the wiki instance

Copy each token — it won't be shown again.

**Step 2 — Set the tokens as environment variables:**

Add to your shell profile (e.g. `.zshrc`) and restart the terminal:

```bash
export JIRA_PERSONAL_TOKEN=<your-token>
export CONFLUENCE_PERSONAL_TOKEN=<your-token>
```

Or add them under `env` in `.claude/settings.local.json` (takes effect on next Claude Code restart):

```json
{
  "env": {
    "JIRA_PERSONAL_TOKEN": "<your-token>",
    "CONFLUENCE_PERSONAL_TOKEN": "<your-token>"
  }
}
```

**Step 3 — Verify:**

```bash
claude   # restart Claude Code — the on-premise tools appear in the tool list
```

Ask Claude to fetch a ticket or page to confirm:
> "Get the ticket PROJ-1485"
> "Get the wiki page at https://confluence.<your-domain>/display/..."

---

## Feature Flag MCP (example: Flagsmith)

A remote HTTP server can expose feature-flag state for a specific project to Claude.

**Prerequisites:** An account with access to the relevant project.

**Step 1 — Authenticate:**

Uses OAuth — no token needs to be set as an env var. On first use, Claude triggers an interactive authentication flow that opens a browser to log in.

**Step 2 — Verify:**

```bash
claude   # restart Claude Code — the tools appear in the tool list
```

---

## Whiteboard MCP (example: Miro)

A remote HTTP server (e.g. `https://mcp.miro.com/`) gives Claude direct read access to boards — paste a board URL and Claude can inspect its content.

**Prerequisites:** An account with access to the relevant boards.

**Step 1 — Authenticate:**

Uses OAuth 2.1 — no token or env var needed. On first use, Claude triggers an interactive authentication flow that opens a browser to log in.

**Step 2 — Verify:**

```bash
claude   # restart Claude Code — the tools appear in the tool list
```

After authentication, paste any board URL in chat to confirm it works:
> "Read this board: https://miro.com/app/board/..."

---

## Chrome DevTools MCP

The Chrome DevTools MCP (`chrome-devtools-mcp`, maintained by Google's ChromeDevTools team) attaches to a **running Chrome instance** via the DevTools Protocol and gives Claude tools for navigation, DOM inspection, input, screenshots, network, performance, and console/debugging. This is what the `verify-browser` skill uses.

**Prerequisites:** Google Chrome installed on your machine.

**Step 1 — Launch Chrome with remote debugging:**

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-mcp-profile \
  --ignore-certificate-errors \
  --ignore-certificate-errors-spki-list \
  --no-first-run \
  --no-default-browser-check
```

> `--user-data-dir` is **required** on Chrome 136+ — the flag is silently ignored on the default profile without it. Using `/tmp/chrome-mcp-profile` keeps the session isolated. To reuse your real session (for authenticated dev environments), point it to your actual Chrome profile directory instead.
>
> `--ignore-certificate-errors` + `--ignore-certificate-errors-spki-list` — skips the "Your connection is not private" warning for local HTTPS endpoints without needing to manually trust the cert each time a new profile is created.
>
> **Do not use `--disable-web-security`** — it disables CORS entirely and makes the browser unsafe for any other tab you open.

Add this as a shell alias for convenience:

```bash
# ~/.zshrc
alias chrome-debug='/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-mcp-profile \
  --ignore-certificate-errors \
  --ignore-certificate-errors-spki-list \
  --no-first-run \
  --no-default-browser-check'
```

**About unrelated console errors in a multi-service/micro-frontend setup:**

If your app is composed of multiple independently-running services or modules (e.g. a shell app plus separately-served micro-frontends), console errors from a sibling service that isn't running locally are expected and safe to ignore. No Chrome flag suppresses them because they're genuine network failures — the only way to eliminate them is to start that sibling service alongside the one you're testing.

**Step 2 — Verify:**

```bash
claude   # restart Claude Code — Chrome DevTools tools appear in the tool list
```

Then navigate to the app and ask Claude to inspect the DOM or take a screenshot:
> "Navigate to https://localhost:<port> and check that the nav bar rendered correctly"

DOM inspection (`querySelector`, `evaluate`, `getOuterHTML`) is the preferred approach — use screenshots only when visual layout can't be verified from the DOM alone.

> **Security note:** The debugging port (`127.0.0.1:9222`) is localhost-only — never expose it on `0.0.0.0`.

---

## Code Quality MCP (example: SonarQube)

Can run as a **Docker container** and connect to a self-hosted instance. Lets Claude query issues directly without maintaining a manual patterns table.

**Prerequisites:** Docker must be installed and running.

**Step 1 — Get a token:**
1. Go to your instance → **My Account** → **Security**
2. Generate a token (type: *User Token*)
3. Copy it — it won't be shown again

**Step 2 — Set the token as an environment variable:**

Add to your shell profile (`.zshrc` / `.bashrc`):

```bash
export SONARQUBE_TOKEN=<your-token>
```

Or add it under `env` in `.claude/settings.local.json`:

```json
{
  "env": {
    "SONARQUBE_TOKEN": "<your-token>"
  }
}
```

**Step 3 — Verify:**

```bash
docker pull mcp/sonarqube   # ensure the image is available
claude                       # restart Claude Code — tools appear in the tool list
```

---

## Complete example `.mcp.json`

All of the servers above in one ready-to-adapt file. Swap the `<...>` placeholders for your own hostnames and keep secrets in environment variables — never commit real URLs of internal systems or tokens (see the public-repo hygiene rules in `AGENTS.md`).

```json
{
  "mcpServers": {
    "atlassian": {
      "type": "http",
      "url": "https://mcp.atlassian.com/v1/mcp/authv2"
    },
    "jira-dc": {
      "command": "uvx",
      "args": ["mcp-atlassian"],
      "env": {
        "JIRA_URL": "https://jira.<your-company>.com",
        "JIRA_PERSONAL_TOKEN": "${JIRA_PERSONAL_TOKEN}"
      }
    },
    "confluence-dc": {
      "command": "uvx",
      "args": ["mcp-atlassian"],
      "env": {
        "CONFLUENCE_URL": "https://confluence.<your-company>.com",
        "CONFLUENCE_PERSONAL_TOKEN": "${CONFLUENCE_PERSONAL_TOKEN}"
      }
    },
    "figma": {
      "type": "http",
      "url": "http://127.0.0.1:3845/mcp"
    },
    "figma-remote": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp"
    },
    "honeycomb": {
      "type": "http",
      "url": "https://mcp.eu1.honeycomb.io/mcp"
    },
    "flagsmith": {
      "type": "http",
      "url": "https://app.getgram.ai/mcp/flagsmith-mcp"
    },
    "miro": {
      "type": "http",
      "url": "https://mcp.miro.com/"
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--browserUrl=http://127.0.0.1:9222"]
    },
    "sonarqube": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "SONARQUBE_TOKEN", "-e", "SONARQUBE_URL", "-e", "SONARQUBE_IDE_PORT", "mcp/sonarqube"],
      "env": {
        "SONARQUBE_URL": "https://sonarqube.<your-company>.com",
        "SONARQUBE_TOKEN": "${SONARQUBE_TOKEN}",
        "SONARQUBE_IDE_PORT": "64120"
      }
    }
  }
}
```

Delete the servers you don't use — a smaller `.mcp.json` means fewer startup failures to debug (see the disable table at the top for per-developer opt-outs instead).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Figma MCP not connecting | Make sure Figma desktop app is running |
| An OAuth-based server not appearing | Restart Claude Code and re-run the OAuth flow |
| OAuth loop / no browser opens | Check that the server's host is reachable; try disabling VPN/proxy temporarily |
| Cloud issue tracker returns "issue does not exist" for tickets that do exist | You may be looking at an on-premise-only project — use the on-premise server instead |
| On-premise tracker MCP not appearing / no tools | Verify the PAT env var is exported **and** that `.mcp.json`'s env block uses the variable name the server actually expects |
| `chrome-devtools` MCP not appearing | Launch Chrome with `--remote-debugging-port=9222 --user-data-dir=/tmp/chrome-mcp-profile` first, then restart Claude Code |
| Chrome debug port silently ignored | `--user-data-dir` is required on Chrome 136+ — use any non-default path |
| SonarQube MCP not appearing | Check the token env var is set and Docker is running |
| SonarQube Docker fails to start | Run `docker pull mcp/sonarqube` to ensure the image is present |
