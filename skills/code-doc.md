---
name: code-doc
disable-model-invocation: true
description: Creates or updates a doc.md file for a component, module, or feature section. Use after implementing or modifying any of these. NEVER auto-invoke — only run when user explicitly types /code-doc.
---

# code-doc — Generate / Update Component / Module / Section Documentation

## Overview

After creating or modifying a piece of code worth documenting, run this skill to produce a `doc.md` next to it. The file serves as living documentation for future developers (and Claude). It scales to whatever granularity was actually touched:

- **Component** — a single reusable UI piece (e.g. `src/components/<ComponentName>/`)
- **Module** — a feature area with its own routing/entry point (e.g. `src/modules/<feature-name>/`, `src/views/<ViewName>/`)
- **Section** — a broader grouping of several modules/components under one feature domain (e.g. everything under `src/modules/<domain-name>/`)

The template in Step 3 has sections for all three levels — use only the ones relevant to what you're documenting.

## Workflow

**Follow these steps in order.**

### Step 1: Identify the Target and Its Granularity

Determine what was created or changed, and at which of the three levels above it sits:
- **Component root** — the folder containing the component's main file, styles, and tests
- **Module root** — the folder containing the entry-point file (naming varies by project — a `*Module.tsx`, an `index.ts` with a default export, a routed view file). Check this package's `CLAUDE.md` for the actual convention.
- **Section root** — the umbrella folder containing multiple modules/components that share a domain

If the user did not specify, ask: _"What should I document, and is it a component, a module, or a broader section?"_

### Step 2: Read the Target

Read the following files (if they exist), scoped to the granularity from Step 1:

**Component:**
- The component file itself — props/inputs, exported variants
- Its stories/examples file, if the project uses one
- Its test file — often the clearest source of truth for expected behavior

**Module:**
- The entry point — routing / composition-root setup
- Any context/provider or store file — what data/handlers are exposed
- `index.ts` — public exports
- Child component files, to understand the UI structure

**Section:**
- Each module's own `doc.md`, if present — summarize rather than re-deriving from scratch
- Shared code (context, store, utils) used across the section's modules
- Routing config that ties the section's modules together

In all cases, check for an existing `doc.md` first — update it rather than overwriting from a blank slate.

### Step 3: Write or Update `doc.md`

Create or update `doc.md` at the target's root. Pick the relevant sections for the granularity — don't force a Component doc through Module-only sections or vice versa.

```markdown
# [Component / Module / Section Name]

## Purpose
What this does and why it exists. One short paragraph.

## Props / Public API
(Component-level) The public props/inputs and their meaning; which are required vs optional; any notable defaults.

## Route & Access
(Module/Section-level)
- **Route(s):** `/path/to/route`
- **Permission(s):** [permission/role identifier, if this project has an authorization model]
- **Feature flag(s):** [flag name(s), if any — see docs/mcp-servers.md for the feature-flag MCP if one is configured]

## UI Overview
Description of the main states (default, loading, empty, error, variants) or, for a Section, the modules it contains and how a user moves between them.

## Structure
- [entry-point / main file] — what it owns and composes
- [context/store file] — context/store definition and hook
- Child components — one line each, only the non-obvious ones

## Data Sources
- **API client:** which generated client or artifact is used
- **Endpoints / queries:** key calls made
- **Real-time:** WebSocket / SSE if applicable

## Known Issues & TODOs
- [ ] Any deprecated/legacy code (old styling system, old component library, class components) still present
- [ ] Migration notes
- [ ] Anything that needs follow-up
```

Don't leave a section with nothing to say — delete it instead of writing "N/A". A Component doc typically drops `Route & Access` and `Data Sources`; a Section doc typically drops `Props / Public API` in favor of listing its modules under `Structure`.

### Step 4: Confirm

Tell the user where `doc.md` was written and summarise the key sections in 2–3 lines.
