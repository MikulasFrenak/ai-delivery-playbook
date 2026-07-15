---
name: generate-agents-md
disable-model-invocation: true
description: Splits a repo's CLAUDE.md into a tool-agnostic AGENTS.md (read natively by Codex, Copilot, Cursor, Aider, and most other agents) plus a thin CLAUDE.md that imports it via `@AGENTS.md` and keeps only genuinely Claude Code-only mechanics. Run once per repo to adopt the split, or again later to refresh AGENTS.md against the current codebase. NEVER auto-invoke — only run when user explicitly types /generate-agents-md.
---

# generate-agents-md — CLAUDE.md → AGENTS.md Split

## Overview

Claude Code reads `CLAUDE.md`. It does not natively read `AGENTS.md` — but `AGENTS.md` is the cross-tool standard most other agents (Codex CLI, GitHub Copilot, Cursor, Windsurf, Aider, Zed, Jules, VS Code, JetBrains Junie, and more) read natively. A repo whose only instructions file is `CLAUDE.md` is invisible to all of them.

The fix this skill applies — the same one used on this playbook's own root — is not to maintain two full files by hand (guaranteed drift) or delete `CLAUDE.md` (breaks Claude Code's richer per-repo memory). Instead:

- **`AGENTS.md`** becomes the single source of truth: stack, architecture, conventions, branching/commits, testing, styling, hygiene rules — everything that's true regardless of which tool is reading it.
- **`CLAUDE.md`** shrinks to a one-line import (`@AGENTS.md`, Claude Code's own memory-file import syntax) plus only mechanics that are genuinely Claude-Code-specific: `.claude/settings.json` vs `settings.local.json` handling, `disable-model-invocation` skill-invocation semantics, `.claude/skills/` or `.claude/commands/` directory conventions.

This is a **report-and-write** skill, not a report-only one (unlike `/public-repo-check`) — its whole job is producing the two files. It still asks before overwriting anything unexpected (see Step 4).

---

## Workflow

### Step 1: Confirm Scope

Ask if not already clear from context:
- Which repo (path), and is it a monorepo needing per-package `AGENTS.md`/`CLAUDE.md` pairs too, or a single root pair?
- Does a `CLAUDE.md` already exist there to split, or is this a from-scratch adoption (no instructions file yet)?
- Is an `AGENTS.md` already present from a previous run of this skill (refresh case) or hand-authored separately (merge case — don't clobber hand-written content without flagging it)?

### Step 2: Read and Re-Verify

Read the target repo's current `CLAUDE.md` (and any package-level ones) in full. Don't just mechanically copy its sections into the new files — cross-check factual claims against the actual codebase first (file layout, package.json scripts, test runner, directory structure). A `CLAUDE.md` that's gone stale relative to the code is a good sign this split is overdue, and this is the moment to fix that staleness, not carry it forward into the new file.

### Step 3: Classify Every Section

For each section, decide:

| Goes in `AGENTS.md` | Stays in `CLAUDE.md` |
|---|---|
| Stack, architecture, repo/package layout | `.claude/settings.json` / `settings.local.json` handling |
| Branching & commit conventions | Skill-invocation policy (`disable-model-invocation`, slash-command-only invocation) |
| Testing setup, styling rules, cross-cutting conventions | `.claude/skills/` or `.claude/commands/` directory mechanics |
| Public-repo hygiene, research-before-implementing policy | MCP *server config* mechanics specific to Claude Code's own approval UX (the policy "never call MCP automatically" itself is tool-agnostic and belongs in `AGENTS.md` — only Claude-Code-specific plumbing stays here) |
| A "Skills" section describing what `skills/*.md` do, framed so any tool can follow the same sequence from prose alone | A pointer line: "`skills/` is Claude Code's implementation of the skills described in `AGENTS.md`" |

When unsure whether something is Claude-specific, default to `AGENTS.md` — the cost of a tool-agnostic file containing one irrelevant paragraph for non-Claude tools is low; the cost of Copilot/Cursor/Codex never seeing an important convention because it got left in `CLAUDE.md` is high.

### Step 4: Write the Files

- New/updated `AGENTS.md`: the tool-agnostic content from Step 3, restructured to read as a complete standalone guide (not "see CLAUDE.md for the rest").
- New/updated `CLAUDE.md`: **line 1 must be exactly `@AGENTS.md`** (no heading above it — Claude Code's import syntax requires the `@path` reference to resolve cleanly), followed by only the Claude-only content from Step 3. If a repo has no genuinely Claude-specific mechanics, this file may end up being just the one import line — that's correct, not incomplete.
- If either target file already exists with content that doesn't look like a previous run of this skill (e.g. hand-written prose with no clear tool-agnostic/Claude-only split), stop and ask before overwriting — merge intent matters more than a clean split here.

### Step 5: Report

Summarize: what moved where, any staleness fixes made in Step 2 (call these out explicitly — they're often the most valuable part of running this), and whether the target repo has per-package files needing the same treatment.
