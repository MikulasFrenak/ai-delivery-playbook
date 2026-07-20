---
name: design-brief
disable-model-invocation: true
description: Reads a Figma node and produces a structured Design Brief mapped to this project's own conventions — color tokens, spacing scale, typography variants, icon and component matches. Run at the start of any UI task that has a Figma link, or to verify an implementation against the design. NEVER auto-invoke — only run when user explicitly types /design-brief.
---

# design-brief — Read Figma Design Context

## Overview

Reads a Figma node and outputs a structured **Design Brief** mapped to *this project's* conventions — not raw Figma values. Concretely: color hex codes become the project's actual token names (`theme.colors.primary` / a CSS custom property / a Tailwind class — whatever this project uses), pixel spacing becomes the project's spacing scale, text styles become the project's typography variants, and Figma icon/component names become matches in this project's own icon set and component library.

Run this at the start of any UI task that has a Figma link (see the "Figma (UI / implementation)" vs. "Figma (UX flows)" link distinction in [`/implement-task`](./implement-task.md) Step 3 — this skill is the one that turns the *implementation* link into a usable brief), or mid-task to answer "what token is this color?" / "which icon is this?". The Design Brief becomes the source of truth for implementation — don't re-query raw Figma MCP tools after this; re-run `/design-brief` instead if the design changes.

**Prerequisites:** A Figma MCP server connected — either the local Figma-desktop-app server or the remote hosted one (see `docs/mcp-servers.md` → Figma MCP for both options).

---

## Workflow

### Step 1: Load Figma MCP Tools

Batch-load all needed schemas in a single `ToolSearch` call:

```
ToolSearch query="select:mcp__figma__get_design_context,mcp__figma__get_screenshot,mcp__figma__get_metadata,mcp__figma__get_variable_defs"
```

(Tool name prefix may be `figma` or `figma-remote` depending on which option from `docs/mcp-servers.md` is connected — check the actual tool list.)

### Step 2: Get the Figma URL

If the user provided a URL directly, use it. If invoked from `/implement-task` or `/create-task`, read the task file header per the link-type table there — prefer the **UI / implementation** link for all visual measurements; consult the **UX flows** link only for interaction logic and edge-case states, not CSS values.

Parse the URL:
- **fileKey** — the segment after `/design/` in the URL
- **nodeId** — the `?node-id=` query parameter, normalized to Figma's API format (dash separator, e.g. `42-15`)

### Step 3: Fetch Design Context + Screenshot

These are two independent reads of the same node — run them together rather than one after another (see "Independent Verification Fan-Out" in `AGENTS.md`'s Agent Orchestration section for why this is generally safe for read-only calls):

```
mcp__figma__get_design_context { fileKey, nodeId }
mcp__figma__get_screenshot     { fileKey, nodeId }
```

**If the context response is truncated or too large:**
1. Run `mcp__figma__get_metadata { fileKey, nodeId }` to get the high-level node tree
2. Identify the key child nodes (header, body, footer, state variants)
3. Fetch each individually: `mcp__figma__get_design_context { fileKey, nodeId: "<childId>" }`

### Step 4: Map to This Project's Conventions

This is the step that makes the brief useful instead of just a Figma dump — every design property gets translated into something this project's codebase actually has. **Find the project's real token/component source before guessing:**

| What to find | Where to look (adapt to this project) |
|---|---|
| Color tokens | The project's theme/design-token file (e.g. a `theme.ts`/`tailwind.config.*`/CSS custom-properties file) |
| Spacing scale | The project's spacing function or scale constant (e.g. `theme.spacing(n)`, a Tailwind spacing scale, a `--space-*` custom property set) |
| Typography variants | The project's type-scale definition (theme typography variants, a set of text-style utility classes, etc.) |
| Icon set | The project's icon package/folder — search by the Figma icon's name first, then visually if no exact name match |
| Reusable UI components | The project's component library (internal design-system package, or the project's own `components/ui`-style folder) |

For each Figma property below, look up the real match — **never invent a token name**; if nothing matches, say so explicitly in Open Questions rather than guessing.

#### Colors

For each color used in the node: note the Figma color name + hex, then search the project's token source for that hex (or the closest semantic match — primary/error/warning/success/text-primary/text-secondary/divider/background, etc., are common categories but this project's actual names may differ).

#### Spacing

Figma gives raw pixels; convert to the project's scale (e.g. an 8px-base spacing function, a Tailwind step, or a fixed `--space-*` token). For a value that doesn't land cleanly on the scale, keep the raw pixel value and note the deviation rather than rounding silently.

#### Typography

Map each text layer (font, size, weight, line-height) to the closest existing variant in the project's type system. Note the font family(ies) used — a project commonly separates a display/heading font from a body font; check which is which here rather than assuming.

#### Icons

For each icon visible in the design: note the Figma icon name, then search the project's icon set for a name or shape match. **Never add a new icon package** to satisfy one design — if nothing matches, flag it as an open question instead.

#### Components

For each Figma component/frame, identify the closest existing reusable component in this project (a dropdown/select, text field, table, date picker, alert/info box, chip, tooltip, dialog, etc.) — reuse before rebuilding.

### Step 5: Output the Design Brief

```markdown
## Design Brief — [Node name from Figma]

**Screenshot:** [attached from get_screenshot]
**Source:** `[Figma URL]`

### Component Structure

[Figma frame hierarchy, e.g.]
Card (Frame, auto-layout vertical, gap 16px)
  +-- Header (Frame, auto-layout horizontal, gap 8px)
  |     +-- Icon (24x24)
  |     +-- Title (Text)
  +-- Body (Frame)
        +-- Row x N

### Colors

| Element | Figma value | Project token |
|---|---|---|
| ... | `#RRGGBB` | `<project token>` |

### Spacing

| Property / Element | Figma | Project scale |
|---|---|---|
| ... | 16px | `<project spacing value>` |

### Typography

| Element | Figma style | Project variant |
|---|---|---|
| ... | ... | `<project typography variant>` |

### Icons

| Figma icon | Project icon | Import |
|---|---|---|
| ... | ... | ... |

### Components to Use

| Figma component | Project equivalent |
|---|---|
| ... | ... |

### Mobile / Responsive

[Note mobile-specific variants, breakpoints, or layout changes. If none: "—".]

### Open Questions

[Any token not found, icon not matched, or ambiguous design decision — flag here rather than guessing.]
```

**After this output:** treat the Design Brief as the source of truth for implementation values for the rest of the task. Don't call raw Figma MCP tools again during this task — re-run `/design-brief` explicitly if the design changes mid-task.
