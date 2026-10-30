# AIPB-10 — Add a complete example .mcp.json to the MCP servers doc

**Ticket:** self-assigned (no tracker)
**Type:** Chore
**Status:** done — [PR #14](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/14), closed 2026-07-20
**Source:** reconstructed on 2026-10-29 from PR #14's commit (the PR has no description) — not written at the time; no acceptance criteria were recorded

---

## What & Why

The commit states no motivation beyond what it adds: every documented server collected into one ready-to-adapt block.

## What was built

A complete example `.mcp.json` in `docs/mcp-servers.md` covering every documented server: Atlassian Cloud, Jira/Confluence Data Center (`uvx mcp-atlassian`), Figma local and remote, Honeycomb, Flagsmith, Miro, chrome-devtools and SonarQube (Docker).

## Architecture Notes

- Internal hostnames became `<your-company>` placeholders and tokens come from environment variables, per the public-repo hygiene rules.
- The doc tells readers to delete servers they don't use rather than debug their startup.
