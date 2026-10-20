---
name: diagram
disable-model-invocation: true
description: Generates a draw.io XML diagram from a module's code — a flow diagram, an activity/swimlane diagram, or a condensed feature-flow diagram. Saves output to docs/ or alongside the module. NEVER auto-invoke — only run when user explicitly types /diagram.
---

# diagram — Generate a draw.io Diagram from Code

## Overview

Reads a module and produces a `.drawio` XML file visualizing its flow, logic, or architecture — useful for documenting a non-obvious flow (multi-step async process, multi-actor interaction, a feature's decision tree) in a form a non-reader-of-code can follow. Output is uncompressed draw.io XML, openable directly in the draw.io desktop app or [app.diagrams.net](https://app.diagrams.net).

If this project already has one or more `.drawio` files (check `docs/` or alongside modules), read one first and match its exact visual style (colors, node shapes, layout conventions) instead of inventing a new one — consistency across a project's diagrams matters more than any individual diagram looking "better."

## Workflow

### Step 1: Identify the Target & Diagram Type

Ask the user (if not already provided):
- Which module / file / flow to diagram?
- What type of diagram?
  - **Flow** — simple linear/branching flow
  - **Activity + Swimlane** — multi-actor diagram with columns (one per actor/system)
  - **Condensed / widget flow** — a simplified, high-level version of a larger flow, for a summary view
- Where to save? Default: `docs/<module-name>-flow.drawio`

### Step 2: Read the Code

Read the relevant files to map out the steps, decision points, actors, and async operations *before* writing any XML — don't draw from a partial read. Typical places to look, adapted to this project's actual structure:
- The top-level module/orchestrator file — what triggers what
- Context/state files — what state and handlers exist
- Logic/service files — API calls, async operations, conditions
- Test-selector or QA-attribute definitions — useful for confirming what user-facing interactions actually exist

### Step 3: Generate the draw.io XML

Produce uncompressed draw.io XML following these conventions.

#### File wrapper

```xml
<mxfile host="app.diagrams.net" modified="YYYY-MM-DDTHH:MM:SS.000Z" agent="AI agent" version="24.7.10" editor="draw.io" compressed="false">
  <diagram id="kebab-case-id" name="Human Readable Title">
    <mxGraphModel dx="1500" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1800" pageHeight="1200" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <!-- nodes and edges here -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

#### Node styles (semantic colors — reuse these, don't invent new ones per diagram)

| Node type | Fill | Stroke | Shape style |
|---|---|---|---|
| Title label | none | none | `text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=18;fontStyle=1;` |
| Start / End node (dot) | `#000000` | `#000000` | `ellipse;aspect=fixed;html=1;fillColor=#000000;strokeColor=#000000;` |
| Start / End box | `#e7f5ff` | `#1971c2` | `rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#e7f5ff;strokeColor=#1971c2;` |
| Process / Action | white | default | `rounded=1;arcSize=18;whiteSpace=wrap;html=1;` |
| Decision | white | default | `rhombus;whiteSpace=wrap;html=1;` |
| Warning / Data note | `#fff9db` | `#f08c00` | `rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#fff9db;strokeColor=#f08c00;` |
| Success / Happy path | `#d3f9d8` | `#2b8a3e` | `rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#d3f9d8;strokeColor=#2b8a3e;` |
| Error / Failure | `#ffe3e3` | `#c92a2a` | `rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#ffe3e3;strokeColor=#c92a2a;` |
| Info / Secondary | `#e3fafc` | `#1098ad` | `rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#e3fafc;strokeColor=#1098ad;` |
| External / Navigation | `#f3f0ff` | `#5f3dc4` | `rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#f3f0ff;strokeColor=#5f3dc4;` |
| Fork / Join bar | — | `#000000` | `shape=line;strokeWidth=8;strokeColor=#000000;` |
| Swimlane column background | `#ffffff` | `#ced4da` | `rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#ced4da;` |
| Legend | `#f1f3f5` | `#adb5bd` | `rounded=1;whiteSpace=wrap;html=1;fillColor=#f1f3f5;strokeColor=#adb5bd;` |

#### Edge styles

| Edge type | Style additions |
|---|---|
| Normal flow | `edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=block;` |
| Async / dashed | add `dashed=1;` |
| Success branch | add `strokeColor=#2b8a3e;` |
| Error branch | add `strokeColor=#c92a2a;` |
| Warning branch | add `strokeColor=#e67700;` |
| Navigation / external link | add `strokeColor=#5f3dc4;` |
| Curved (condensed/widget style) | `curved=1;html=1;endArrow=block;` |

#### Colours, contrast and encoding

- **Project palette first.** The table above is the default. If the project has a design-token or colour palette (a colours file, a tokens package), map each semantic role to the nearest palette entry and use only palette values. After generating, check programmatically that every hex value in the file belongs to the palette — a first pass tends to leave a few strays.
- **Set text colour explicitly.** Give every cell a `fontColor` (dark text on light fills, light text on dark fills) and use `fontSize` 12 or larger inside boxes. Never rely on the editor default, and avoid pale text on pastel fills.
- **One dimension per visual channel** when a diagram carries several (a system map with owners and object types): border colour = owner, fill colour = object type, shape = category (for example hexagon for a gateway, cylinder for a store). Always add the legend (`id="3"`).
- **Categorical colours must be told apart at a glance.** Every colour in a set (for example one per team) must differ in hue or lightness from *all* others, not just its neighbours. Compare similar pairs (orange vs red, green vs teal, navy vs indigo) after the first draft and adjust.

#### Label escaping

With `html=1` the label is HTML after XML decoding, so it is escaped twice: `&` becomes `&amp;amp;`, a non-breaking space becomes `&amp;nbsp;`, `<br>` becomes `&lt;br&gt;`. A triple-escaped entity prints literally (for example the text `&nbsp;`) and an unescaped one makes the file unreadable. Prefer plain characters (` | `, ` - `) over `&nbsp;`.

#### Swimlane layout (multi-actor diagrams)

- Draw background column rectangles first, then column header labels, then nodes inside each column
- Column width: ~300px; height covers all nodes in that column plus padding
- Nodes positioned at `x = column_left + padding`, `y = step_index * row_height`
- Leave 80–100px vertical gap between nodes for readability

#### ID assignment

- `id="0"` and `id="1"` are always reserved (root cells)
- `id="2"` = title label
- `id="3"` = legend (if present)
- `id="4"` onward = swimlane backgrounds, then nodes, then edges — sequential, no gaps
- For large maps (dozens of nodes) descriptive ids (`sec_payments`, `e_app_gateway`) are fine as long as they are unique and `0`–`3` keep their meaning

### Step 4: Save the File

Write the XML to the target path (default `docs/<name>-flow.drawio`).

Confirm to the user: "Diagram saved to `docs/xxx.drawio`. Open with the draw.io desktop app or app.diagrams.net."

Before saying that, validate and look at the result:

1. **Validate the XML:** parse the file, then check that ids are unique and every edge `source` / `target` exists.
2. **Render and inspect:** if the draw.io desktop app is installed, export a PNG with its CLI (`drawio -x -f png -s 0.5 -o /tmp/<name>.png <file>.drawio`; on macOS the binary may be at `/opt/homebrew/bin/drawio`) and open the image. XML checks cannot show overlapping text, text running outside a box, or literal entities — only the render can. Fix, re-export, and delete the PNG afterwards (do not commit it).

### Step 5: Update `doc.md` (if it exists)

If the module already has a `doc.md` ([`/code-doc`](./code-doc.md) output), add or update a **Diagrams** section:

```markdown
## Diagrams
- [`docs/module-name-flow.drawio`](../../../docs/module-name-flow.drawio) — flow diagram
```

---

## Tips

- Keep node labels short — wrap long text with `\n` inside the label rather than widening the node indefinitely
- Always include a title label (`id=2`) and a legend if the diagram uses color coding a reader wouldn't otherwise infer
- For a complex module, prefer splitting into multiple focused diagrams over one diagram trying to show everything
- If unsure about a flow detail from reading the code alone, add a note node saying so rather than guessing at the logic
- Every node and link needs a readable source (code, an API spec, a doc). Do not infer a relationship from the folder names of another artefact; where no source says what sits behind something, label it "not verified" instead of drawing it as fact
- Show roles, not people's names, in a diagram meant to be shared
