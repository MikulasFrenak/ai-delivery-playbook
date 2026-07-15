@AGENTS.md

# Claude Code addendum

Everything else — repo layout, branching/commits, testing, skills, cross-cutting rules, public-repo hygiene — lives in [`AGENTS.md`](./AGENTS.md) above. This file only adds mechanics specific to Claude Code itself.

## Claude Code Settings

**Never modify the committed `.claude/settings.json`** — it's shared across the team. All local-only additions (auto-approved permissions, model overrides, MCP toggles) belong in **`.claude/settings.local.json`** only.

- When proposing or applying a permission addition, always target `settings.local.json`
- If a tool call auto-writes a permission to `settings.json`, restore it (`git checkout -- .claude/settings.json`) and add it to `settings.local.json` manually instead
- Run `git diff .claude/settings.json` before any commit to catch silent writes

## Skill Invocation Policy

Skill definitions in this playbook live in [`skills/`](./skills/) — Claude Code's implementation of the skills described in `AGENTS.md`. In a real project, Claude Code looks for them under `.claude/skills/` (or `.claude/commands/` for older setups) — copy accordingly when adopting a skill from here.

**Never auto-invoke a skill from its description alone.** Every skill file in this playbook sets `disable-model-invocation: true` for exactly this reason — a skill only runs when the user explicitly types its slash command. Don't invoke one based on pattern-matching the user's request.

When authoring a new skill, default to `disable-model-invocation: true` even if it seems harmless at first — write it defensively, not reactively. A skill's description is written to help a human decide when to run it, not to double as a trigger phrase; if the flag is left off, a well-matched description becomes exactly the kind of phrasing a model might pattern-match on its own, which is especially risky for skills that create tickets, post comments, or touch git. Only omit the flag for a skill you've deliberately decided is safe to auto-invoke.
