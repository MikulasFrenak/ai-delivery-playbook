---
name: create-task
disable-model-invocation: true
description: Creates a structured task planning file in <package-root>/.tasks/TICKET-ID.md. Run at the start of a ticket — before any implementation — to capture scope, plan, and relevant files. NEVER auto-invoke — only run when user explicitly types /create-task.
---

# create-task — Task Planning File

## Overview

Run this skill when you pick up a new ticket and want to scope it before writing any code. It produces a living `.tasks/TICKET-ID.md` document at the package root with the ticket context, implementation plan, and relevant files pre-populated from codebase exploration.

`/implement-task` reads this file in its own Step 2 — run this first if you want the planning separate from execution.

**Follow the steps in order. Do not start writing the file until Step 6 is complete.**

---

## Inputs

- Ticket ID, or a request to create one
- Target package/directory (for a monorepo) or none (single-repo project)
- Optional design links
- Optional issue-tracker integration (falls back to pasted ticket content if not connected)

## Output

- `<package-root>/.tasks/TICKET-ID.md`

## Guardrails

- Do not implement code — this skill is planning-only.
- Do not invent acceptance criteria, files-to-touch, or answers to open questions — leave a `?` with a note on what's needed instead.
- Do not overwrite an existing task file without asking first (Step 1).
- Do not create a tracker ticket without explicit user confirmation of the drafted summary/description (Step 1a).

---

## Workflow

### Step 1: Get the Ticket ID and Target Package

If the user provided a ticket ID (e.g. `PROJ-1234`), use it. Otherwise ask: _"What is the ticket ID? If there's no ticket yet, say 'create one' and I'll file it."_

If the user replies that no ticket exists yet (e.g. _"create one"_, _"no ticket"_, _"file it"_), branch to **Step 1a** below. Otherwise continue.

Determine the target package (for a monorepo) or the working directory (for a single-repo project):
- If the user specified it — use it.
- If the ticket ID prefix or naming convention maps to a known package — infer it.
- Otherwise ask: _"Which package/directory does this task belong to?"_

**Resolve `<package-root>`.** For monorepos, packages may live under different roots depending on convention (e.g. `apps/`, `packages/`, `services/`). Check the repo's own docs/config for the layout, then confirm the target directory exists before proceeding. For single-repo projects, `<package-root>` is the repo root.

Check whether `.tasks/TICKET-ID.md` already exists at `<package-root>/.tasks/`. If it does, read it, report its current state to the user, and ask whether to overwrite or just review it.

---

### Step 1a: Create the Ticket (only when none exists)

Run only when the user has confirmed there is no existing ticket. Use whichever issue-tracker MCP server or CLI is configured for this project (e.g. Jira, Linear, GitHub Issues).

1. **Resolve the target iteration/sprint/milestone**, if the tracker uses one.
   - Ask the user which project/board and which iteration to file into, unless a default is documented in the repo's own conventions.
   - If the user wants "the next one after the currently active one," look up the active iteration first, then confirm the next one exists before targeting it — do not silently fall back to the active iteration.

2. **Draft summary + description from the conversation context.**
   - Summary: imperative, ≤72 chars.
   - Description: markdown, with sections `## Goal`, `## Scope`, `## Acceptance`, `## Out of scope` as applicable. Pull facts from the prior conversation (e.g. flag lists, trace IDs, file paths) — do not invent.
   - Show the draft to the user and ask: _"OK to file as-is, or want to tweak summary/description/assignee?"_ Wait for confirmation.

3. **Create the ticket** via the configured tracker's API/MCP tool, using whatever fields that tracker requires (project/board key, issue type, assignee, iteration). Confirm project/board identifiers with the user or the repo's documented defaults rather than hardcoding them here.

4. **Verify** the ticket landed where expected (correct project, correct iteration) by re-fetching it. Report the new ID + URL to the user.

5. Continue with **Step 2** using the freshly created ticket ID.

---

### Step 2: Collect Ticket Content

**Fetch the ticket via the configured issue-tracker integration first.** If no integration is connected or the lookup fails, ask the user to paste the ticket content as a fallback.

Extract:

- **Summary** — what needs to be built or fixed
- **Type** — feature, bugfix, or chore (infer from summary + content if not explicit)
- **Acceptance Criteria** — exact conditions to satisfy (for features)
- **Reproduction steps** — how to trigger the bug (for bugfixes)
- **Feature flag** — flag name if mentioned
- **Design links** — extract any Figma/design-tool URLs provided. Designs often come in two flavours:
  - **UX / flows** — interaction flows, user journeys
  - **UI / implementation** — exact visuals, spacing, tokens
  - If only a flow link is present, ask the user: _"Do you also have a UI/implementation design link?"_
  - Store both separately in the task file header (see template)
  - **After storing the links:** if this playbook includes a design-brief/tokens skill, run it against the UI implementation link and append its output to the task file. This gives `/implement-task` a ready-made token map when it picks up the work.
- **Ticket link** — construct from the ID using this project's tracker URL pattern.

---

### Step 3: Detect Task Type

Classify the ticket as one of:

| Type | Signals |
|---|---|
| **Feature** | New UI, new flag, design link, User Story / "As a user..." |
| **Bugfix** | Reproduction steps, "Actual / Expected", broken behaviour |
| **Chore** | Tooling, config, docs, no user-facing change |

This determines which template to use in Step 6.

---

### Step 4: Read Docs & Research Best Patterns

Now that the task type and requirements are clear, gather context before touching the codebase.

**Read all convention docs in order, from most general to most specific:**
1. Repo-root conventions doc (e.g. `/CLAUDE.md`) — monorepo-wide conventions
2. Any cross-cutting rules doc (e.g. `/.claude/CLAUDE.md`) — branching, testing infrastructure, research policy
3. `<package-root>/CLAUDE.md` — package-specific overrides, gotchas, and paths

**Search the web** for current best practices, recent guides, and known pitfalls relevant to this specific task. Do not rely solely on training knowledge — the ecosystem moves fast and patterns evolve.

**Present 2–3 concrete approaches** to the user before writing the plan:
- For each option: 1–2 sentences on what it is, its main trade-off, and when it fits this situation
- State clearly which one you recommend and why
- Note any conflict with project conventions (repo convention docs override external best practices)

**Wait for the user's go-ahead** on the approach before proceeding to Step 5.

---

### Step 5: Explore the Codebase

Before writing the file, read enough code to give real answers. Do not fill in placeholders.

**Always do:**
- Re-read `<package-root>/CLAUDE.md` (or equivalent) for specific paths: test-selector conventions, state-management patterns, i18n paths, component conventions
- Find the target module/view from the ticket summary using whatever module map or directory convention this package documents
- Read the target module's entry point to understand its existing structure and any wrapper/composition pattern in use
- Check the test-selector conventions used in this package
- Check feature-flag definitions if a flag is mentioned in the ticket
- Check routing definitions if cross-module or cross-app navigation is involved

**For features — also do:**
- Look at the closest existing component/module in the same area as a reference for naming and structure
- Check for existing state stores to avoid duplicating patterns
- Check the package's i18n resource file for the existing namespace
- Check for existing unit-test files near similar utilities — if the new feature includes a pure function or utility, note a matching test file in the Files to Touch table

**For bugfixes — also do:**
- Read the code path described in the reproduction steps
- Look for the logic handling the broken behaviour (filtering, sorting, state mutations, routing)
- Check git log for recent changes to the relevant files: `git log --oneline -10 -- <file>` to see if there's a recent regression

From this exploration, produce:
- A concrete **Implementation Plan** (not placeholder bullets)
- A **Files to Touch** table with real file paths and what each change is
- **Open Questions** — anything ambiguous that needs a decision before coding

---

### Step 6: Write the Task File

Create `<package-root>/.tasks/TICKET-ID.md` (use the package detected in Step 1) using the appropriate template below.

Fill in **every field** from Steps 2 and 4. Do not leave placeholder text (`...`, `?`, `TBD`) unless it genuinely cannot be answered yet — and if you leave a `?`, add a note explaining what information is needed.

---

#### Feature Template

```markdown
# TICKET-ID — [Short title]

**Ticket:** [ticket URL]
**Design (UX flows):** [UX link or —]
**Design (UI / implementation):** [UI link or —]
**Feature flag:** `flag_name_here` (or — if none)

---

## Goal

[1–2 sentences: what is being built and why it exists]

---

## Acceptance Criteria

- [ ] AC 1
- [ ] AC 2

---

## Implementation Plan

- [ ] Step 1
- [ ] Step 2

---

## Files to Touch

| File | Change |
|---|---|
| `src/components/...` | new component |
| `src/utils/myUtil.ts` | new pure function — if applicable |
| `src/utils/myUtil.test.ts` | unit tests for the function above — if applicable |
| `src/components/.../Component.spec.tsx` | component/e2e spec |

---

## Open Questions

- ?

---

## Architecture Notes

_Add non-obvious decisions here as you discover them during implementation._
```

---

#### Bugfix Template

```markdown
# TICKET-ID — [Short title]

**Ticket:** [ticket URL]
**Type:** Bugfix

---

## Problem

[What is broken — one clear sentence]

## Reproduction Steps

1. ...
2. ...

## Expected vs Actual

- **Expected:** ...
- **Actual:** ...

---

## Root Cause Hypothesis

[What you think is wrong based on reading the code — not a guess, a reasoned hypothesis]

---

## Fix Plan

- [ ] Step 1
- [ ] Step 2

---

## Changes

_For multi-area fixes, summarize each change here. Fill in during / after implementation._

| Area | Problem solved | Implementation | Flag scope |
|---|---|---|---|
| ... | ... | ... | Both / flag-on only |

---

## Files to Touch

| File | Change |
|---|---|
| `src/...` | ... |

---

## Open Questions

- ?

---

## Notes

_Add findings here as you investigate and implement._
```

---

#### Chore Template

```markdown
# TICKET-ID — [Short title]

**Ticket:** [ticket URL]
**Type:** Chore

---

## What & Why

[What needs to change and why]

---

## Plan

- [ ] Step 1
- [ ] Step 2

---

## Files to Touch

| File | Change |
|---|---|
| `src/...` | ... |
```

---

### Step 7: Report

Tell the user:
- Where the file was written: `<package-root>/.tasks/TICKET-ID.md`
- A brief summary of what the implementation plan contains
- Any open questions that need an answer before implementation can start
- Any notable structural quirks in the target module (e.g. legacy wrapper/composition patterns) that a downstream `/implement-task` run should account for
