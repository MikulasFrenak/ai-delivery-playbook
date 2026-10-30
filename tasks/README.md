# Task files

One file per ticket of this repo's own work. Each is the ticket's spec and plan while it's open, and afterwards the durable record of why the change happened. They are never deleted. The lifecycle and close-out rules live in [`AGENTS.md`](../AGENTS.md) → Task file lifecycle.

- **Source** says how a file came to exist. *Written at the time* means it was the live planning doc. *Restored* means it was written at the time, deleted under the old delete-on-merge rule, and brought back from git history in AIPB-22. *Reconstructed* means no task file was ever written, so it was rebuilt in AIPB-22 from the PR description and commit messages only. Those files contain no invented acceptance criteria.
- `TRIVIAL` changes have no ticket and no task file, by design.
- **Example** links to a worked-example trace in [`examples/`](../examples/) where one exists. Examples are historical narratives and keep the paths of their time (`.tasks/`).
- **Post-mortems** for bugs that were incidents go in `postmortems/`, written by [`/postmortem`](../skills/postmortem.md) and linked from the ticket's `**Postmortem:**` line. This repo has none yet.

| Ticket | Title | Status | PR | Source | Example |
|---|---|---|---|---|---|
| [AIPB-01](./AIPB-01.md) | Add a CONTRIBUTING.md for skill authoring | done | [#1](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/1) | restored | [trace](../examples/AIPB-01.md) |
| [AIPB-02](./AIPB-02.md) | Polish create-task.md from external review | done | [#3](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/3) | restored | [trace](../examples/AIPB-02.md) |
| [AIPB-03](./AIPB-03.md) | Positioning pass: Capabilities, SDLC naming, Worked Examples | done | [#4](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/4) | restored | [trace](../examples/AIPB-03.md) |
| [AIPB-04](./AIPB-04.md) | Add a vocabulary doc and fix task/ticket terminology drift | done | [#6](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/6) | restored | [trace](../examples/AIPB-04.md) |
| [AIPB-05](./AIPB-05.md) | Enforce the task-file lifecycle instead of relying on someone noticing | superseded | — | restored |  |
| [AIPB-06](./AIPB-06.md) | Label the level relationships; capture the rest as backlog | done | [#7](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/7) | restored | [trace](../examples/AIPB-06.md) |
| [AIPB-07](./AIPB-07.md) | Split CLAUDE.md into tool-agnostic AGENTS.md + Claude-only shim | done | [#8](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/8) | reconstructed |  |
| [AIPB-08](./AIPB-08.md) | Retire "Capability" for "Skill"; frame agents as teammates | done | [#12](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/12) | reconstructed |  |
| [AIPB-09](./AIPB-09.md) | Add team adoption guide (docs/adoption.md) | done | [#13](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/13) | reconstructed |  |
| [AIPB-10](./AIPB-10.md) | Add a complete example .mcp.json to the MCP servers doc | done | [#14](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/14) | reconstructed |  |
| [AIPB-11](./AIPB-11.md) | MCP server exposing this playbook's skills (research + plan) | done | [#17](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/17) | restored |  |
| [AIPB-12](./AIPB-12.md) | Remote (Cloudflare Workers) transport for the skill server | done | [#18](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/18), [#19](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/19), [#20](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/20) | restored |  |
| [AIPB-13](./AIPB-13.md) | get_skill: fetch-and-follow, not fetch-and-copy | done | [#24](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/24), [#25](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/25), [#28](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/28) | restored |  |
| [AIPB-14](./AIPB-14.md) | Make branch-cleanup and pr-update genuinely host-agnostic | done | [#26](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/26) | reconstructed |  |
| [AIPB-15](./AIPB-15.md) | Add agent-eval skill: golden-set scoring for skill judgment calls | done | [#34](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/34) | reconstructed |  |
| [AIPB-16](./AIPB-16.md) | Wire agent-eval into the contribution flow; adopt PLAN.md with /plan-update | done | [#35](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/35) | reconstructed |  |
| [AIPB-17](./AIPB-17.md) | Add self-healing-selectors skill + test-maintenance doc | done | [#36](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/36) | reconstructed |  |
| [AIPB-18](./AIPB-18.md) | mcp-check skill + docs/mcp-governance.md | done | [#37](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/37) | written at the time |  |
| [AIPB-19](./AIPB-19.md) | Document worktree-isolated parallel agents, run live first | done | [#42](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/42) | reconstructed | [trace](../examples/AIPB-19.md) |
| [AIPB-20](./AIPB-20.md) | security-check skill + docs/security.md | done | [#43](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/43) | written at the time |  |
| [AIPB-21](./AIPB-21.md) | Add review-pr and review-comment-style skills | done | — (direct to `main`) | reconstructed |  |
| [AIPB-22](./AIPB-22.md) | Spec-anchored task files: keep them, close them out, move to tasks/ | done | [#47](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/47) | written at the time |  |
| [AIPB-23](./AIPB-23.md) | Link post-mortems and worked examples to task files; check merge state live | done | [#48](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/48) | written at the time |  |
| [AIPB-24](./AIPB-24.md) | github-actions-setup skill: CI checks, PR hygiene, deploy on merge, on-demand AI review | done | [#49](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/49) | written at the time |  |
