# Contributing to the AI Delivery Playbook

## Ways to contribute

- **Fix or clarify something** in an existing skill, workflow, or lifecycle doc — open a PR directly.
- **Add a new skill** — see the checklist below.
- **Add a new workflow** — a workflow composes existing skills into a sequence for a delivery scenario (see `workflows/*.md` for the pattern); it shouldn't introduce new mechanics of its own.
- **Report a gap** — several docs in this repo already call out known gaps explicitly (e.g. `lifecycle/architecture.md`, `lifecycle/release.md`) rather than papering over them. If you find another one, add it the same way instead of forcing a fit.

For branching, commit format, and PR conventions, see [`CLAUDE.md`](./CLAUDE.md) — this file doesn't repeat those, to avoid the two drifting out of sync.

## Adding a new skill

1. **Frontmatter.** Every skill needs:
   ```yaml
   ---
   name: your-skill-name
   disable-model-invocation: true
   description: One sentence on what it does and when to run it, ending with "NEVER auto-invoke — only run when user explicitly types /your-skill-name."
   ---
   ```
   Default to `disable-model-invocation: true` even if the skill seems harmless — see `CLAUDE.md`'s Skill Invocation Policy for why.

2. **If it's generalized from a real project's skill**, anonymize it before it lands here:
   - Strip company names, internal project codenames, ticket-ID prefixes, and internal URLs to generic placeholders (`<your-org>`, `TICKET-ID`, `<component-library>`)
   - Run [`/public-repo-check`](./skills/public-repo-check.md) before opening the PR — it scans for exactly this category of leak, plus secrets/tokens/UUIDs
   - Use an existing skill file (e.g. `skills/create-task.md`) as the reference for how much to anonymize, rather than deciding case by case

3. **Register it in three places** — easy to miss one:
   - The skill file itself, in `skills/<name>.md`
   - `architecture.md`'s Level 1 "Capabilities" list
   - `CLAUDE.md`'s "Skills in this playbook" table

4. **If it fits into an existing workflow**, update that workflow's `uses_skills` frontmatter and its numbered sequence in `workflows/*.md`. If it changes the step numbering of a skill another doc already cites by step number (e.g. `implement-task` Step 4), grep for that reference and update it — stale step-number cross-references are the easiest thing to miss in this repo.

5. **If it serves a lifecycle stage**, add it to the relevant `lifecycle/*.md`'s "Skills used" list.

6. **Use the terms in [`docs/vocabulary.md`](./docs/vocabulary.md) consistently** — ticket vs. task file, capability vs. skill, etc. A one-word inconsistency here is exactly the kind of thing that survives review and drifts for months (see `docs/vocabulary.md`'s own opening paragraph for how that happened once already).

## Before opening a PR

Run [`/public-repo-check`](./skills/public-repo-check.md) if you touched anything that could plausibly carry a secret, UUID, real hostname, or org-specific name — new MCP config, a new example, a new skill sourced from a real project.
