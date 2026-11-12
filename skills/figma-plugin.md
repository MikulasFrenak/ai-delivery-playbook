---
name: figma-plugin
disable-model-invocation: true
description: Turns a design brief into a small local Figma development plugin that draws the frames (component kits, light and dark, desktop and phone, bound to the file's variables) when the Figma MCP's write limit blocks drawing, or an unlimited, re-runnable draw is wanted — the agent writes and statically checks the plugin, the person runs it in the Figma desktop app and reports back what it drew. NEVER auto-invoke — only run when user explicitly types /figma-plugin.
---

# figma-plugin — Draw a Design Brief Without the MCP's Limit

## Overview

Figma's MCP can draw into a file (`use_figma`), but on a Starter plan its tool calls are capped (Figma's rate-limits page says "up to 20 per month", without saying when it resets), and the local desktop MCP server is read-only and needs a paid seat. What works on any plan is a **development plugin**: a folder with a manifest and one script that the person imports once in the Figma desktop app and runs. It uses the same Plugin API an MCP write call runs, but it has no quota, it can be read before it is run, and it removes its own earlier output so it can be run again.

This skill writes that plugin from a design brief, checks it without Figma, hands it over, reads the result from the person's message and screenshot, and fixes and re-runs. It's the reverse of [`/design-brief`](./design-brief.md) (Figma to a brief; this goes from a brief to Figma). The options compared, the manifest, a code skeleton, the layout rules learned live and what's proven are in [`docs/figma-plugin.md`](../docs/figma-plugin.md), which this skill cites the way `perf-check` cites `docs/web-performance.md`.

**Never auto-invoke.** It writes into a design file the person owns.

---

## Inputs

- **The brief:** which frames to draw (name, width, light or dark, the states each shows), the content of each from the ticket's task file (facts already verified), and which component kits (variants, and which text should be editable)
- **The facts the script depends on:** the page to draw on, the variable collection and the exact variable names (and how dark values are held: a mode, or a parallel group), the fonts and which styles exist, a free area of the canvas
- **Where the plugin folder goes:** outside the repository, or untracked. Default: a visible folder next to the repo, so no hidden folder has to be picked in a file dialog

## Output

A plugin folder (`manifest.json`, `code.js`, a short `README.md` with the run steps), the result of the static check, and, after the run, what the person reported (the plugin's message, a screenshot), the fixes made, and a short note in the task file: what was drawn (frame names), on which page, on what date.

## Guardrails

- **Say which path was chosen and why.** When the MCP write path works and returns screenshots, the agent can see what it draws and that is faster; use this skill when that path is blocked, rate-limited or unwanted.
- **The person runs it.** The agent never asks for a Figma login, and never installs or runs a third-party plugin, bridge or MCP server on the way. Everything that runs inside Figma is a script the person can read in `code.js`.
- **No network, no dependencies, no secrets in the plugin.** The manifest sets `"networkAccess": { "allowedDomains": ["none"] }`.
- **It writes only to the named page, and removes only what it created,** matched by a name prefix it owns. It never touches the person's own frames.
- **Never guess a variable name or a font.** Read them (Step 2) or ask. A missing variable stops the script with a clear message; it doesn't fall back to raw colours.
- **The script is not where content gets invented.** Text in the frames comes from the brief and the task file. If a fact isn't verified there, verify it first.
- **A static check is not a visual check.** Don't say the frames look right until the person's screenshot or message says so. The layout bug in the live run passed the static check (see the doc).
- **Run it once, then rely on its cleanup.** A second run removes the first run's nodes before drawing; if the cleanup has not been confirmed, delete the old nodes by hand first.
- **Sizes and spacing are plain numbers** unless the file has number variables for them. Don't invent a spacing scale for one piece.

---

## Workflow

### Step 1: Choose the Path

If `use_figma` or an equivalent write tool is available and not rate-limited, say so and offer it: the agent sees its own result. Use the plugin when the tool is blocked, when many frames would burn a small quota, or when the person wants a script they can read and re-run. Confirm with the person before continuing.

### Step 2: Collect What the Script Needs

Get the page name, the variable collection and every variable name the frames will use, the fonts and their style names (a font may lack a weight: say so and choose the nearest, in the brief), and a free area of the canvas. Sources, in order: the task file or design doc, the person pasting the names from the file's variables panel, a read through the MCP if it is still available. Don't draw from remembered names.

### Step 3: Turn the Brief into a Frame List

One line per frame: name, width, theme, state, what is on it. List the component kits and their variants and which text properties each needs. Show the list to the person. Anything the brief leaves open (a state, a layout of an opened panel) is a question now, not a guess in code.

### Step 4: Write the Plugin

Create the folder with `manifest.json` and `code.js` from the skeleton in [`docs/figma-plugin.md`](../docs/figma-plugin.md). The rules that matter:

1. Plain Plugin API only. Helpers that exist in one MCP environment (for example `figma.createAutoLayout`) aren't in the public API: write your own.
2. Declare `"documentAccess": "dynamic-page"` and load pages and nodes with the async calls.
3. Start by removing the nodes a previous run made (by name prefix), and by checking the page and the variable collection exist.
4. Bind colours and font families to the file's variables. Components get TEXT properties for what changes per instance.
5. Layout: a hugging parent needs at least one child that defines its size. Columns that must be equal height get the tallest column's height as a minimum height; all-fill-height columns collapse.
6. Finish with a message that names what was drawn and a diagnostics line (heights of the parts that have shown trouble).

### Step 5: Check Without Figma

Run `node --check code.js`. Then run it against a small mock of the Plugin API (the doc has one) to catch typos, missing variables and calls in the wrong order. Say plainly what this cannot catch: layout, sizes and anything visual.

### Step 6: Hand It Over

Give the person the exact steps: open the **Figma desktop app** (development plugins need it) and the file; **Plugins → Development → Import plugin from manifest…**; pick `manifest.json` (in a file dialog, **Cmd+Shift+G** accepts a pasted path, which is the way into a hidden folder); then **Plugins → Development →** the plugin's name. After a few seconds a message names what was drawn, or begins "Failed". The person can undo with Cmd+Z, which removes everything the run added. Ask for the message and a screenshot.

### Step 7: Read the Result

Compare the person's screenshot with the frame list, frame by frame: content, states, theme, sizes, anything collapsed, clipped or overlapping, and the diagnostics line. If the person can't send a screenshot, say what is unverified. Don't call it done on the message alone.

### Step 8: Fix and Re-Run

Edit `code.js`, check it again (Step 5), and ask for a re-run (**Cmd+Option+P** runs the last plugin). The cleanup removes the earlier output. Repeat Steps 7 and 8 until the person is satisfied.

### Step 9: Record

Add to the task file what was drawn: the page, the frame names, the date, and that the Figma frames are the visual definition under the repo's own design-source rule (if it has one). Don't commit the plugin folder unless the person asks: the frames are the artefact, and the script is how they were made. If the person wants it kept, say where and that it needs the file's variable names to run.

---

## What's not yet proven

Say these when they're relevant, and don't present them as part of the procedure above:

- **Seats and plans.** The live run was on a Starter plan with a full editing seat. Figma's developer docs don't state a plan requirement for development plugins; a view-only or collaborator seat wasn't tried.
- **The browser.** The docs say plugin development and testing needs the desktop app. Running a development plugin in the browser wasn't tried.
- **Handing a screenshot back.** The plugin can't return an image to the agent today, so the person sends one. Whether a plugin could export a node to a file the agent can read wasn't tried.
- **Files with several variable modes, FigJam and Slides.** Only a single-mode design file was drawn.

See [`docs/figma-plugin.md`](../docs/figma-plugin.md) for what was run and what would prove each.
