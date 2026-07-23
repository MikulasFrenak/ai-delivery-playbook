# ai-delivery-playbook

AI Delivery Playbook is an open framework for designing repeatable AI-assisted software delivery processes — agents working as part of the team, not instead of it. It provides composable skills, reusable workflows, lifecycle guidance and worked examples that can be adapted to any engineering team: the team learns to work with agents, and agents learn to work with the team.

Built with frontend and mobile delivery in mind, but designed to be technology-agnostic and extensible. Skills are documented tool-agnostically in [`AGENTS.md`](./AGENTS.md) — read natively by Codex, Copilot, Cursor, Aider and most other agents — with `skills/` as this repo's own Claude Code implementation of them (`CLAUDE.md` is a thin file that imports `AGENTS.md`).

See [`architecture.md`](./architecture.md) for how it's structured, [`examples/`](./examples/) for real worked runs, [`docs/adoption.md`](./docs/adoption.md) for how to introduce the playbook to a team (research → workshop → pilot → conventions → independence), and [`CONTRIBUTING.md`](./CONTRIBUTING.md) if you want to add a skill or workflow.

Skills are also servable directly to any MCP-compatible agent — no clone-and-copy required. See [`mcp-server/README.md`](./mcp-server/README.md).
