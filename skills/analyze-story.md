---
name: analyze-story
disable-model-invocation: true
description: Deep-analyzes a Story-type ticket — produces an Event Model diagram (draw.io XML), backend/frontend breakdown, splittability assessment, and creates tracker subtasks. NEVER auto-invoke — only run when user explicitly types /analyze-story.
---

# analyze-story — Story Analysis & Event Modeling

## Overview

Run this skill when you pick up a **Story**-type ticket (not a plain Task) and need to break it down before sprint planning or implementation. It produces:

1. **Event Model Diagram** — draw.io XML (swimlane, time flows left→right): Views → Commands → API → Events → Read Models
2. **`analysis.md`** — backend changes, frontend breakdown, splittability, open questions
3. **Tracker subtasks** — one per FE slice + one backend subtask + one for tests

The draw.io output opens in draw.io desktop, `app.diagrams.net`, or a wiki page — and can be imported directly into **Miro** (drag the `.drawio` file onto a Miro board, or use Import → Diagrams.net).

**Follow steps in order. Do not create subtasks until Step 5 is approved by the user.**

---

## Workflow

### Step 1: Get the Story ID

If the user provided a ticket ID (e.g. `PROJ-1234`), use it. Otherwise ask: _"What is the Story ID?"_

**Fetch via the configured issue-tracker MCP.** If it's not connected, ask the user to paste the full ticket content.

Extract:
- **Summary** — what the story is about
- **Description / Goal** — user-facing purpose
- **Acceptance Criteria** — exact done conditions
- **Design links** — UX flow and/or UI implementation links. If the story has a Figma link, screenshots of the relevant screens will be embedded directly into the Event Model diagram (Zone 1) instead of placeholder boxes. If no link is in the ticket, ask: _"Do you have a Figma UX link for this story? I'll use it to pull real screen screenshots into the diagram."_
- **Linked tickets** — existing subtasks, epics, related bugs
- **Labels / components** — which package/module is affected

If the issue type is **Task** (not Story), warn the user: _"This looks like a Task, not a Story. `/create-task` is better suited for Tasks — do you want to continue anyway?"_

---

### Step 2: Read Docs & Understand the Package

Determine the target package from the story context. Ask if ambiguous.

**Resolve `<package-root>`** — for monorepos, check the repo's own docs/config for the layout (e.g. `apps/` vs `packages/`) and confirm the target directory exists. For single-repo projects, `<package-root>` is the repo root.

Read in order:
1. Repo-root conventions doc (e.g. `/CLAUDE.md`)
2. Cross-cutting rules doc (e.g. `/.claude/CLAUDE.md`) — testing, branching, MCP policy
3. `<package-root>/CLAUDE.md` — package-specific patterns

Also check:
- Existing views/pages in the package (understand current screen structure)
- Existing components in the package (avoid duplicating)
- Existing state stores in the package
- The backend/API client package name (from the package's CLAUDE.md) — understand current API surface

---

### Step 3: Deep Story Analysis

This is the core step. Think through the story as a sequence of interactions across time.

#### 3a. Identify all Actors

Actors are who/what initiates actions:
- **User** — direct UI interaction (click, type, scroll)
- **System** — automatic triggers (page load, timer, route change)
- **Backend** — backend responses that trigger UI changes

#### 3b. Map the Event Flow (left → right)

For each Acceptance Criterion, trace the full interaction chain:

```
[User action] → [UI Command] → [Backend API call] → [Response/Event] → [UI update / Read Model]
```

Example for "User filters a list by date range":

```
[User selects date range in DatePicker]
  → [setDateRange command in store]
  → [GET /items?from=&to= API call]
  → [items data received event]
  → [Table renders with new data]
```

Do this for **every AC**, not just the happy path. Include:
- Empty states (no data returned)
- Loading states (while the API call is in-flight)
- Error states (API returns 4xx/5xx)
- Edge cases from the ACs

#### 3c. Identify Backend Changes

For each API call identified in 3b, determine:

| API call | Endpoint | Method | New or existing? | New fields needed | Breaking change? |
|---|---|---|---|---|---|
| Get items | `/items` | GET | existing | `startDate`, `endDate` filter | no |
| Create item | `/items` | POST | **new** | full body | n/a |

Mark as:
- **New endpoint** — backend team must create it
- **Extended endpoint** — new query params or response fields added
- **Existing** — no backend change needed

If backend changes are needed, note the generated API-client package that would need a new published version. This becomes the backend subtask scope.

#### 3d. Identify FE Components

List every distinct UI piece needed:

| Component | Type | Exists? | Notes |
|---|---|---|---|
| `DateRangePicker` | filter chip | ✅ exists (shared component library) | just wire up |
| `ItemTable` | container | ✅ exists | extend with new column |
| `ItemDetailDrawer` | overlay | ❌ new | right-side panel |
| `ExportButton` | action | ❌ new | triggers download |

"Exists" means available in the project's shared component library or already in the package. "New" means we build it.

#### 3e. Splittability Assessment

Evaluate whether the story can be split into independent deliverable slices. A slice is splittable when:
- It can be merged and deployed behind a feature flag without breaking other slices
- It has a clear, independently-testable done condition
- Its backend dependency can be stubbed with demo/mock data

Produce a split table:

| Slice | What it delivers | Backend dependency | Can ship independently? | Suggested subtask |
|---|---|---|---|---|
| 1 — Date filter UI | DateRangePicker wired to store, UI only (no real API) | none (demo data) | ✅ yes | `[FE] Date range filter UI` |
| 2 — Item list from backend | Real API call, loading/empty/error states | GET /items (new) | ⚠️ needs backend first | `[FE] Item list API integration` |
| 3 — Item detail drawer | ItemDetailDrawer component, all states | GET /items/:id (new) | ⚠️ needs backend first | `[FE] Item detail drawer` |
| Backend | New endpoints for slices 2 & 3 | — | ✅ independent | `[BE] /items GET + GET /:id` |
| Tests | CT specs for slices 1–3 | — | ⚠️ after FE slices | `[TEST] CT specs` |

Flag any slice that is NOT splittable (tight coupling, shared state) — those stay in one Task.

---

### Step 4: Generate Event Model Diagram (draw.io XML)

Match your team's Event Modeling template. The diagram has **3 zones stacked vertically**, time flows **left → right**.

---

#### Zone 1 — Header (top)

A text box with the story title + ticket link, followed by **screen images** (from Figma if available, otherwise placeholder boxes).

```
[Story title — TICKET-ID]    [Screen 1 image]   [Screen 2 image]   ...
                              "Item list table"    "Mobile filters"
```

**If a Figma UX or UI link was extracted in Step 1:**

1. Call `mcp__figma__get_metadata` on the Figma node URL to get the list of child frames/screens inside that page.
2. For each relevant screen (match by name to the story's AC — e.g. "Item list", "Filter drawer"):
   - Call `mcp__figma__get_screenshot` on that frame's node ID.
   - Save the screenshot as `<package-root>/.tasks/analyzes/TICKET-ID/screen-<N>.png`.
3. In the draw.io XML, place each screenshot as an `image` vertex in Zone 1:
   ```xml
   <mxCell id="screen-1" value="Item list table" style="shape=image;html=1;verticalLabelPosition=bottom;labelBackgroundColor=none;verticalAlign=top;align=center;strokeColor=#ced4da;fillColor=none;imageAspect=1;aspect=fixed;image=img/screen-1.png;" vertex="1" parent="1">
     <mxGeometry x="300" y="20" width="240" height="150" as="geometry" />
   </mxCell>
   ```
   > Note: draw.io `image=img/...` paths are relative to the `.drawio` file location. PNGs are saved in the same `.tasks/analyzes/TICKET-ID/` folder as the diagram.

**If no Figma link exists:** use a grey placeholder rectangle with the screen name as label:

```xml
<mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#ced4da;fontStyle=2;" value="[Screen: Item list table]" ... />
```

**How many screens to include:** only screens that are directly involved in the story's ACs. Skip generic chrome (nav bar, sidebar) unless the story changes them. Aim for 2–4 screens max — Zone 1 should stay compact.

---

#### Zone 2 — User space (middle)

This is the main timeline. Actors sit on the **left edge** as icons; the flow of Blue and Green stickies runs left → right.

**Actors (left edge column, stacked vertically):**
- 👤 User icon — a filled person silhouette shape
- ⚙️ Gear icon — for Processor / automated system
- ✉️ Envelope icon — for notification / email trigger (add only when relevant)

**Stickies in user space:**

| Type | fill | stroke | Meaning |
|---|---|---|---|
| 🔵 Command | `#DAE8FC` | `#6C8EBF` | User intent — what the user triggers or sends |
| 🟢 Read Model | `#D5E8D4` | `#82B366` | Query view — data displayed on screen to the user |

Commands and Read Models are placed at the **same vertical level** in the timeline (they are both user-facing). They are connected **down** to Events in Zone 3 via arrows.

Pattern rules:
- **User sends a command** → Blue Command sticky → arrow down to Event in service lane
- **User sees data** → Green Read Model sticky → arrow down to Event (or backend call) in service lane
- **Processor triggers something** → Gear icon → arrow to Blue Command or directly to Event

---

#### Zone 3 — Service swimlanes (bottom)

Horizontal swimlane rows where **Orange Events** (facts that happened) live. Events are the output of commands being processed by a service. Adjust the number and names of lanes to match your own system's layers — a typical starting point:

| Swimlane row | What lives here | Example events |
|---|---|---|
| **Backend/API Layer** | Events produced by your own backend | `ItemsLoaded`, `ItemDetailFetched`, `FilterApplied` |
| **Domain Service Layer** | Events from internal domain services | `DataProcessed`, `CalculationCompleted` |
| **External Layer** | Events from outside systems (3rd party APIs, external teams) | `WebhookReceived`, `ExternalDataUpdated` |

**Orange Event sticky style:** `fillColor=#FFE6CC; strokeColor=#d6b656`

Arrows connect:
- Blue Command (Zone 2) → down into the service lane that handles it → Orange Event
- Orange Event → up to Green Read Model (Zone 2) that displays the result

**New backend endpoints** (not yet existing): add a red dashed border to the Event: `strokeColor=#c92a2a; dashed=1`
**Existing endpoints**: standard orange border

---

#### draw.io XML structure

```xml
<mxfile host="app.diagrams.net" modified="YYYY-MM-DDTHH:MM:SS.000Z" agent="Claude Code" version="24.7.10" editor="draw.io" compressed="false">
  <diagram id="event-model-TICKET-ID" name="TICKET-ID — Event Model">
    <mxGraphModel dx="2000" dy="1200" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="3000" pageHeight="1600" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- ZONE 1: Header -->
        <!-- title text node -->
        <!-- ticket link text node -->
        <!-- wireframe placeholder boxes -->

        <!-- ZONE 2: User space (full-width background rectangle, light grey) -->
        <!-- Actor icons on left edge (person / gear / envelope shapes) -->
        <!-- Blue Command stickies + Green Read Model stickies, left → right -->

        <!-- ZONE 3: Service swimlanes -->
        <!-- N horizontal background rectangles, stacked, with row labels -->
        <!-- one label per swimlane, per your own layer names -->
        <!-- Orange Event stickies inside the correct lane -->

        <!-- EDGES: Command→Event (down), Event→ReadModel (up) -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

**Layout measurements:**
- Page width: 3000px (scale to number of events)
- Actor column width: 120px
- Zone 2 (user space) height: 220px
- Each Zone 3 swimlane row height: 160px
- Sticky width: 140px, height: 70px
- Horizontal gap between stickies: 60px
- Start first sticky at x=220 (after actor column)

**Legend box** (top-right corner):

```
🔵 Command — user intent
🟢 Read Model — query view
🟠 Event — fact (Backend/API Layer)
🟠* Event — NEW endpoint (dashed red border)
⚙️ Processor — automated / service
```

**Save** the XML to `<package-root>/.tasks/analyzes/TICKET-ID/event-model.drawio`.

---

### Step 5: Write the Analysis File

Create `<package-root>/.tasks/analyzes/TICKET-ID/analysis.md`:

```markdown
# TICKET-ID — [Story title] — Analysis

**Ticket:** [ticket URL]
**Type:** Story
**Package:** <package>
**Event Model Diagram:** [`event-model.drawio`](./event-model.drawio)
**Figma (UX flows):** [link or —]
**Figma (UI / implementation):** [link or —]

---

## Goal

[1–2 sentences: what user problem this story solves]

---

## Acceptance Criteria

- [ ] AC 1
- [ ] AC 2

---

## Event Flow Summary

| Actor | Command | API Call | Event | Read Model |
|---|---|---|---|---|
| User | selects date range | GET /items?from=&to= | items list received | Table re-renders |
| System | page load | GET /options | options list received | Selector populated |

---

## Backend Changes Required

| Endpoint | Method | Status | Fields / Notes |
|---|---|---|---|
| `/items` | GET | **new** | `from`, `to` query params; returns `ItemGroup[]` |
| `/items/:id` | GET | **new** | returns full `Item` with detail data |
| `/options` | GET | existing | no change |

**API client package to update:** `<generated-client-package-name>`

---

## FE Components Breakdown

| Component | File | Status | Dependencies |
|---|---|---|---|
| `DateRangePicker` | shared component library | ✅ exists | — |
| `ItemTable` | `src/components/ItemTable/` | ✅ exists | extend with new column |
| `ItemDetailDrawer` | `src/components/ItemDetailDrawer/` | ❌ new | Item API type |
| `ExportButton` | `src/components/ExportButton/` | ❌ new | — |

---

## Splittability

| Slice | Delivers | Backend needed | Can ship alone? |
|---|---|---|---|
| 1 — Date filter UI | DateRangePicker + store | no | ✅ yes |
| 2 — Item list API | Real data + states | GET /items | ⚠️ after backend |
| 3 — Item detail | Drawer + all states | GET /items/:id | ⚠️ after backend |

**Recommended split:** 4 subtasks — see below.

---

## Proposed Subtasks

<!-- Created in the tracker after Step 6 approval -->

- [ ] `[FE] TICKET-ID — Date range filter UI` — store wiring + DateRangePicker, demo data, no backend
- [ ] `[FE] TICKET-ID — Item list API integration` — GET /items, loading/empty/error states
- [ ] `[FE] TICKET-ID — Item detail drawer` — ItemDetailDrawer, GET /items/:id
- [ ] `[BE] TICKET-ID — /items GET + GET /:id endpoints`
- [ ] `[TEST] TICKET-ID — CT specs for all FE slices`

---

## Open Questions

- ?

---

## Architecture Notes

_Add decisions discovered during implementation._
```

Show the user the analysis and subtask list. Ask:
> _"Review the proposed subtasks above. Should I create them in the tracker now, or do you want to adjust the split first?"_

**Wait for confirmation before proceeding to Step 6.**

---

### Step 6: Create Tracker Subtasks

Only run after explicit user confirmation from Step 5.

For each proposed subtask:

1. Use whatever sub-task issue type your tracker exposes (e.g. Jira's `Sub-task` type) so it becomes a proper child of the parent Story in the tracker's hierarchy.

2. Draft the description in markdown:
   ```markdown
   ## Parent Story
   [ticket URL]

   ## Scope
   [What this subtask covers — pulled from the analysis]

   ## Acceptance Criteria
   - [ ] [specific done condition for this slice]

   ## Files to Touch
   [from the component breakdown table]

   ## Backend Dependency
   [endpoint name + new/existing, or "none"]
   ```

3. Create it via the configured tracker MCP/API, setting:
   - Project/board identifier — confirm with the user or the repo's documented defaults
   - Sub-task issue type, with `parent` set to the Story's ID
   - Assignee — default to the user's own account unless specified otherwise
   - **Do not set a sprint/iteration field on the subtask** if your tracker auto-inherits it from the parent Story — check first, since forcing it can cause the tracker to reject the request.

4. After creating all subtasks, update the **Proposed Subtasks** checklist in `analysis.md` with the real ticket keys (e.g. `- [x] [PROJ-1235] [FE] ...`).

---

### Step 6.5: Post Analysis Summary as a Ticket Comment

After writing the analysis file (and optionally after creating subtasks), post a summary comment to the story ticket via the tracker's comment API.

**Always do this step** — it makes the analysis visible to the whole team directly in the tracker without them needing to open local files.

Comment format (markdown):

```markdown
## 📊 Story Analysis

**Event Model (Miro):** <miro-link-if-provided, otherwise omit this line>
**Local diagram + analysis:** `<package-root>/.tasks/analyzes/TICKET-ID/`

---

## 🔧 Proposed Subtasks

1. `[BE]` ...
2. `[FE]` ...
3. `[TEST]` ...

---

## ❓ Open Questions

1. ...

---

## 🏗️ Architecture Notes

- ...
```

- If the user provided a Miro link during the session, include it. Otherwise omit the Miro line.
- Pull content directly from the `analysis.md` sections — do not paraphrase.

---

### Step 7: Report

Tell the user:
- Path to the event model diagram: `<package-root>/.tasks/analyzes/TICKET-ID/event-model.drawio`
  - _"Open with draw.io desktop, drag into app.diagrams.net, or drag directly onto a Miro board (Import → Diagrams.net)"_
- Path to the analysis file: `<package-root>/.tasks/analyzes/TICKET-ID/analysis.md`
- Ticket comment posted ✅ (link to the ticket)
- Subtask keys created (list them)
- Any **open questions** that need an answer before implementation starts
- Which subtask to pick up first (usually the backend subtask or the first independent FE slice)

---

## Notes on Event Modeling

Event Modeling (https://eventmodeling.org) traces a system as a **timeline** of building blocks.

### The 4 building blocks used in this template

| Block | Colour | Meaning | Example |
|---|---|---|---|
| **Command** | 🔵 Blue | User intent — what they want to happen | User clicks filter, submits form, navigates to route |
| **Event** | 🟠 Orange | Fact — something that happened (immutable) | `ItemsLoaded`, `FilterApplied`, `ItemDetailFetched` |
| **Read Model** | 🟢 Green | Query view — data shown to the user | List table, detail view, summary panel |
| **Processor** | ⚙️ Gear | Automated handler — service, API, external system | Backend endpoint, domain service, external API |

### The 3 core interaction patterns

**Command pattern** (user changes state):

```
👤 User → 🔵 Command → ⚙️ Backend/Service → 🟠 Event
```

**Read pattern** (user sees data):

```
⚙️ Backend/Service → 🟠 Event → 🟢 Read Model → (displayed in UI)
```

**Automation pattern** (system reacts to event):

```
🟠 Event → ⚙️ Processor → 🟠 New Event
```

### Why this helps for planning

- **Gaps** — if an AC produces a Read Model but there's no Command + Event feeding it, the backend endpoint is missing
- **Coupling** — two Commands that write to the same Event can't be split into parallel subtasks
- **Backend scope** — each new Orange Event in the backend layer = one new or modified endpoint
- **FE scope** — each Blue Command + Green Read Model pair = one FE component or store action
- **Split points** — a story can be split wherever a Green Read Model can be stubbed with demo data (no real Event needed yet)
