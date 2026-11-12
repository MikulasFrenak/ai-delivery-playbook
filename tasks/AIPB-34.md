# AIPB-34 — /figma-plugin: draw a design brief into Figma without the MCP's limit

**Ticket:** self-assigned (solo repo, no external tracker — see AGENTS.md "Ticket IDs for solo/no-tracker projects")
**Type:** Feature
**Status:** done — [PR #NEW](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/NEW), closed 2026-11-12
**Source:** written at the time
**Related:** [`/design-brief`](../skills/design-brief.md) — the other direction (Figma to a brief). [AIPB-32](./AIPB-32.md) — the model for a skill that ran live first and says per step what is proven

---

## What & Why

The playbook can read a Figma design into a brief (`/design-brief`), but nothing helps an agent *draw* a design into Figma when the Figma MCP won't let it. That happened on 2026-11-10 and again on 2026-11-12, on a real project: the Figma MCP's write path (`use_figma`) stopped with "tool call limit on the Starter plan" after a few calls. Figma's rate-limits page says "up to 20 per month" for the plan, doesn't say when it resets, and doesn't say which tools count. The local desktop MCP server is not a way out: it needs a paid seat and is read-only.

What worked was a **development plugin**: a folder with a manifest and one script, written by the agent, imported once in the Figma desktop app by the person and run there. It uses the same Plugin API an MCP write call runs, has no limit, can be read before it is run, and cleans up after itself so it can be run again. It drew two component kits and ten frames (light and dark, desktop and phone) bound to the file's variables. The ask, 2026-11-12: a skill for exactly that, so the next brief can be drawn the same way.

The constitution's principle IV says a pattern runs live before it is written up as a skill. This one did, twice in one day: the first script drew everything, one layout bug showed up in the author's screenshot (the desktop columns collapsed to their padding), and the fix was verified by the author the same day. The skill and its doc record that bug and say per step what is and isn't proven.

## Acceptance Criteria

- [x] `skills/figma-plugin.md`: frontmatter per `CONTRIBUTING.md`; Inputs, Output, Guardrails; a numbered workflow from choosing the path to recording the result
- [x] Guardrails written from the live run and Figma's own docs: the person runs the plugin, no third-party plugin or MCP bridge is installed, no network and no dependencies in the plugin, it writes only to the named page and removes only what it created, variable names and fonts are never guessed, a static check is not a visual check
- [x] `docs/figma-plugin.md`, paired with the skill: the options compared with their primary sources and the date they were read, the manifest, a generic code skeleton, the layout rules learned live (including the collapse), the static check and what it can't catch, and a proven / not-yet-proven table
- [x] Facts about Figma come from its developer docs, read 2026-11-12, and are cited; where a page doesn't state something (plan requirements for development plugins, the limit's reset) the doc says so
- [x] Registered: `AGENTS.md` skills table, `architecture.md` Level 1 list; `tasks/README.md` row; `PLAN.md` count and status
- [x] Anonymized for a public repo: no project, repo or file names, file keys, plan keys or addresses; the example is described generically
- [x] `check-docs.mjs` and its tests pass; added lines scanned for leaks

## What was built

`/figma-plugin`, a nine-step procedure that turns a design brief into a local development plugin, checks it without Figma, hands it to the person to run in the desktop app, reads the result from their message and screenshot, and fixes and re-runs. The paired `docs/figma-plugin.md` carries the compared options with sources, the manifest, a generic code skeleton, the layout rules, the static check, and the proven / not-yet-proven table. Registered in `AGENTS.md` and `architecture.md`. The docs check and its tests pass, the MCP server's smoke test serves 25 skills, and the doc's skeleton ran against the doc's mock.

## Open Questions

Still open; **moved to `PLAN.md`** → Open questions, since each needs a live run and not a decision here.

- Does a development plugin run on a View or Collab seat, and does the browser version of Figma run one? Figma's docs say development needs the desktop app and don't mention seats.
- Can the plugin hand a screenshot back to the agent (for example by exporting a node to a file)? The agent now depends on the person sending one, or on a spare MCP read.
- How does this behave on a file with several variable modes, and in FigJam or Slides? Only a single-mode design file was drawn.

## Architecture Notes

- The skill never installs or runs anything inside Figma itself. The person does, which keeps principle I (a person decides) and principle VI (safe to publish) intact and avoids trusting a community bridge.
- The plugin's cleanup removes only nodes whose names start with a prefix it owns, so a re-run never touches the person's own frames.
- A static dry run against a mock of the Plugin API caught typos and wrong ordering, but not the layout collapse. That is why Step 7 insists on the person's screenshot.
