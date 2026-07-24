# ai-delivery-playbook

AI Delivery Playbook is an open framework for designing repeatable AI-assisted software delivery processes — agents working as part of the team, not instead of it. It provides composable skills, reusable workflows, lifecycle guidance and worked examples that can be adapted to any engineering team: the team learns to work with agents, and agents learn to work with the team.

Built with frontend and mobile delivery in mind, but designed to be technology-agnostic and extensible. Skills are documented tool-agnostically in [`AGENTS.md`](./AGENTS.md) — read natively by Codex, Copilot, Cursor, Aider and most other agents — with `skills/` as this repo's own Claude Code implementation of them (`CLAUDE.md` is a thin file that imports `AGENTS.md`).

See [`architecture.md`](./architecture.md) for how it's structured, [`examples/`](./examples/) for real worked runs, [`docs/adoption.md`](./docs/adoption.md) for how to introduce the playbook to a team (research → workshop → pilot → conventions → independence), and [`CONTRIBUTING.md`](./CONTRIBUTING.md) if you want to add a skill or workflow.

## Try it — no clone required

Every skill is live over MCP. Add this to your MCP client config (Claude Code, Cursor, or anything else that speaks MCP) and it can search and pull skills directly:

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

Then ask it something like *"search the ai-delivery-playbook skills for commit conventions, then show me the full skill."* See [`mcp-server/setup.md`](./mcp-server/setup.md) for exact steps per client (Claude Code CLI, VS Code/JetBrains extension, Claude Desktop app), and [`mcp-server/README.md`](./mcp-server/README.md) for how the server itself works — including a local-stdio option if you'd rather run it from a clone.
