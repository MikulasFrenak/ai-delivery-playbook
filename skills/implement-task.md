---
name: implement-task
disable-model-invocation: true
description: Full end-to-end workflow for implementing a ticket in any package of this repo — from reading the ticket and design through implementation, quality checks, tests, docs, and commit. NEVER auto-invoke — only run when user explicitly types /implement-task.
---

# implement-task — Full Task Implementation Workflow

## Overview

Run this skill when starting work on a ticket. It guides you through the complete lifecycle: understanding the task, reading the design, implementing, testing, documenting, and committing.

This is the "do the work" counterpart to `create-task` (which only plans) and `analyze-story` (which only breaks a Story down). If a task file already exists, this skill reads it as the source of truth instead of re-deriving the plan.

**Follow the steps in order. Do not skip ahead.**

---

## Workflow

### Step 0: Detect the Target Package

Before anything else, determine which package this task belongs to.

**How to detect:**
1. If the user specified a package explicitly — use it.
2. If a task file path is known (e.g. `apps/<pkg>/.tasks/TICKET-ID.md`) — extract the package from the path.
3. If neither — ask: _"Which package does this task belong to?"_

**Resolve `<package-root>`** — for monorepos, check the repo's own docs/config for the layout (e.g. `apps/` vs `packages/`) and confirm the target directory exists. For single-repo projects, `<package-root>` is the repo root.

Once the package root is known, read all convention docs, most general to most specific:
1. Repo-root conventions doc (e.g. `/CLAUDE.md`) — cross-cutting conventions (styling, icons, API clients, honesty & accuracy rules)
2. Any cross-cutting rules doc (e.g. `/.claude/CLAUDE.md`) — branching, testing infrastructure, research policy
3. `<package-root>/CLAUDE.md` — package-specific overrides and gotchas (authoritative for store patterns, QA-selector location, i18n path, component structure, API clients, test setup)

Keep all of these as reference throughout Steps 4–11. Anything a package's own `CLAUDE.md` says **overrides** the generic defaults described in this skill.

---

### Step 1: Get the Ticket ID and Content

If the user provided a ticket ID, use it. Otherwise ask: _"What is the ticket ID?"_

**Fetch the ticket via the configured issue-tracker MCP.** If it's not connected or the lookup fails, ask the user to paste the ticket content as a fallback.

Extract:
- **Summary** — what needs to be built
- **Acceptance Criteria** — exact conditions to satisfy
- **Feature flag** — flag name if mentioned
- **Design link** — node URL if provided

### Step 1b: Research Best Patterns

Now that the ticket content is known, search for the best way to solve this before looking at the codebase.

**Search the web** for current best practices, recent guides, and known pitfalls directly relevant to this specific task (the UI pattern, state strategy, API approach, or performance concern involved). Do not rely solely on training knowledge.

**Present 2–3 concrete approaches** to the user:
- For each option: 1–2 sentences on what it is, its main trade-off, and when it fits
- State which one you recommend and why
- Note any conflict with what the convention docs say (project conventions take precedence over general best practices)

**Wait for the user's go-ahead** on the chosen approach before proceeding.

---

### Step 2: Task File

Check whether `<package-root>/.tasks/TICKET-ID.md` exists (use the package detected in Step 0).

**If the file exists** (e.g. created via `/create-task`): read it. Use its Implementation Plan, Files to Touch, and Open Questions as the source of truth. Resolve any open questions before proceeding. Skip creating a new file.

**If the file does not exist**: run `/create-task` now to produce it — it explores the codebase and produces a pre-populated plan. Only proceed to Step 3 after the file is written.

> Tip: run `/create-task` separately at the start of a sprint if you want planning decoupled from implementation.

### Step 3: Read the Design

If this playbook (or your project) has a design-brief skill that turns a Figma link into a token-mapped brief, run it now with the design link from the task file header. Otherwise, fetch the design directly via the Figma MCP.

The task file header may contain two design links — use the right one:

| Link type | Field | Use for |
|---|---|---|
| **UI / implementation** | `Figma (UI / implementation):` | **Primary source** — exact spacing, colors, typography, component structure |
| **UX / flows** | `Figma (UX flows):` | Interaction logic, edge-case states — behaviour questions only, not visual values |

**Always prefer the UI link** for extracting concrete values. If only one link exists, use it for both.

Treat the resulting design brief/context as the source of truth for implementation values for the rest of this task — don't re-query the design tool repeatedly for the same values. If the design changes mid-task, re-fetch explicitly.

### Step 4: Understand Architecture Before Coding

**Re-read the package's `CLAUDE.md` now** and answer, for this specific package:

- **Component model** — functional components, class components, or a mix? If class components are still present, do they expose a functional wrapper (a HOC or a thin function component) for hooks/context — new hooks and state usually belong there, not inside a class component being converted mid-task
- **State** — which state-management pattern/helper this package uses, and whether it needs per-user or per-session scoping
- **Routing** — single-route or multi-route; how this package references routes in other packages/modules (should be a shared enum/constants file, never a hardcoded path string)
- **Overlay/z-index conventions** — if this is a micro-frontend or otherwise composed app, check whether the package documents a known stacking-context gotcha (see the Overlays example in `CLAUDE.md`) before reaching for `createPortal`
- **API client** — is a generated client already published for the endpoints this task needs? If not, what's the fallback (a placeholder HTTP client, a local stub)?

If any of these aren't documented in the package's `CLAUDE.md`, that's a gap — note it as an open question, and consider adding the answer back to that `CLAUDE.md` once you've worked it out, so the next task doesn't re-derive it.

---

### Step 5: Implementation

**Read the package `CLAUDE.md` before writing any code — it defines the exact paths and patterns for this package.** Every path below is a generic default; substitute the package's documented convention wherever it differs.

#### 5a. QA Selectors
Add entries to the package's QA-selector file for every new interactive element, following its existing naming convention (e.g. `package-name--section--element`). Import selectors from that shared file in tests — never inline strings.

#### 5b. Feature Flag (if required)
Follow the package's flag-registration pattern exactly — typically: add the flag identifier to a central enum/constants file, then register it wherever the package reads active flags into its runtime state. If the package has no flag system yet, check `docs/mcp-servers.md` for the feature-flag MCP before assuming one needs to be built from scratch.

#### 5c. Cross-Module Routes (if cross-module navigation needed)
Add the route to the package's shared routes enum/constants file and reference it by name — never hardcode a path string. If the router's history can be rewritten externally (e.g. by a host shell), read the *current* URL (`window.location.search`) rather than trusting a routing prop that might be stale.

#### 5d. State Store (if needed)
Create the store following the package's existing pattern and location. If the package supports persisted, per-user state, use that helper rather than plain in-memory state when the ticket calls for it — and scope the storage key per user if the pattern requires it.

#### 5e. Component
Create the component following the package's file/folder convention. Universal rules regardless of package:
- Use this package's styling approach (see `CLAUDE.md`'s Styling section) — don't introduce a second one for a single component
- All colors/spacing from design tokens — never hardcode raw values
- All icons from the package's existing shared icon set — check before adding a new icon package
- All user-visible strings go through the package's i18n mechanism — translation keys only, never inline literal text
- Apply the package's QA-selector attribute (from 5a) to every interactive element

#### 5f. i18n Strings
Add all user-visible strings to the package's **primary** locale/resource file only. If the project has a translation-sync pipeline (e.g. a service that auto-syncs new keys to other languages), do not manually add placeholder entries to every other locale file — that creates review noise for no benefit.

The "i18n mechanism" doesn't have to mean an i18n library. A handful of locales and a few dozen strings is often better served by a plain hand-written `Record<Locale, Strings>` dictionary than by pulling in i18next/react-intl/FormatJS — no ICU parsing, no lazy bundle loading, no runtime negotiation to configure. Reach for a real library only once the project actually needs what one buys you: real plural/gender rules per language, translator-facing tooling, or lazy-loaded per-locale bundles. Don't add the dependency preemptively "because it's a translation feature."

#### 5g. Wire Up in the View/Module
Import and render the new component following the package's existing composition pattern — a plain functional import for a modern package, or through the legacy wrapper identified in Step 4 if this package still has class-component modules. Keep new logic in the wrapper/hook layer, not inside a class component you're not otherwise converting.

---

### Step 6: Cleanup

If this playbook (or your project) has a legacy-cleanup skill, run it on every **existing** file you modified (not newly created files) — it catches legacy patterns (old styling systems, deprecated imports, hardcoded colors) introduced or left behind in files you touched. Apply only safe, in-scope changes — don't migrate an entire module as a side effect of an unrelated ticket.

### Step 7: Quality Checks

Lint, type-check, unit tests, and component tests all only need the code as it currently stands — none of them consumes another's output — so run them **together, in parallel**, substituting this project's actual package manager/scripts (see "Independent Verification Fan-Out" in `CLAUDE.md`'s Agent Orchestration section for why this is safe):

```bash
<package-manager> --filter <package-name> lint &
<package-manager> --filter <package-name> typecheck &
<package-manager> --filter <package-name> test:unit &
<package-manager> --filter <package-name> test-ct &
wait
```

1. **Lint — package-scoped (fast):** run the package's own lint script rather than a full-repo lint where possible. Fix all errors; pre-existing warning conventions (e.g. an allowed unused-var prefix) are fine to leave as-is.

2. **Type-check:** run the compiler's `--noEmit`-equivalent check directly rather than relying solely on editor diagnostics (an IDE only indexes open files). Fix any errors; pre-existing warnings are acceptable.

3. **Unit tests + component tests:** fix any failures before proceeding. If a test type can't run locally for environment reasons, note that explicitly rather than silently skipping it — CI will validate.

4. **Code-quality MCP (if configured):** query it for issues in each modified file (see `docs/mcp-servers.md`) — this can run alongside the batch above too, it's a separate read-only check. Fix blocker/critical issues in lines you authored; skip pre-existing issues in untouched lines.

If a failure needs real diagnosis rather than a quick fix, and delegating that diagnosis to a separate agent is practical for this project, the same fan-out rule applies: it comes back as a finding you act on, not an independent fix to files you're already editing.

### Step 8: Tests

**Unit tests** — write for any new pure function or utility, next to the source file, covering normal cases, edge cases, and boundary values.

**Component tests** — if this playbook has a test-scaffolding skill, run it to scaffold a spec for the new component. Otherwise write one following the package's existing spec convention:
- Use the package's own test-utilities import, not a raw framework import, if the package documents one
- Use the package's QA-selector attribute for targeting, not framework defaults
- Cover default render, key interactions, and QA-selector targeting
- If this package's CLAUDE.md documents a known CT/state-store testing quirk (see the Testing Infrastructure examples in `CLAUDE.md`), follow that pattern for any callback or store-state assertions

### Step 9: Documentation

Run [`/code-doc`](./code-doc.md) to create or update the relevant `doc.md` — at the component, module, or section level, whichever this task actually touched. Make sure it reflects the new component, any new store, and updated known TODOs.

### Step 10: Update Task File

Mark completed items in `<package-root>/.tasks/TICKET-ID.md` and add any non-obvious architecture decisions discovered during implementation.

### Step 11: Commit

Run [`/commit`](./commit.md) with the ticket ID — it generates the commit message, runs the quality gate, and offers to create/update the PR/MR.

Include in the commit: all implementation files, the updated i18n resource file, the updated QA-selector file, `doc.md`, and `.tasks/TICKET-ID.md`. Do **not** stage `.env*` files, generated/auto-generated client code, or infra config files unless the ticket is explicitly about them. `/commit`'s own Step 5 handles creating or updating the PR/MR afterward — no separate step needed here.

---

## Feature Flag Behaviour Checklist

Before closing the task, verify:
- [ ] When the flag is **off**: no visible change to the user — the feature is completely hidden
- [ ] When the flag is **on**: feature works as described in the Acceptance Criteria
- [ ] Session-only dismiss state (if applicable): behaves correctly across a page reload vs. a tab switch, matching what the ticket actually asked for

---

## Convention Lookup

Always read the target package's `CLAUDE.md` first — it's authoritative for all of these. Use this as the checklist of things that should be documented there per package (fill in per-package, don't leave it to be rediscovered on every ticket):

| What | Where to check |
|---|---|
| QA selectors — file & attribute | Package `CLAUDE.md` |
| i18n strings — file & sync pipeline | Package `CLAUDE.md` |
| Feature flags — registration mechanism | Package `CLAUDE.md` / `docs/mcp-servers.md` |
| Cross-module routes | Package `CLAUDE.md` |
| State store pattern | Package `CLAUDE.md` |
| Task tracking path | `<package-root>/.tasks/TICKET-ID.md` |
| Lint / test commands | Package `CLAUDE.md` or root `package.json` scripts |
| Design tokens location | Package `CLAUDE.md` |
| Shared icon set | Package `CLAUDE.md` |
