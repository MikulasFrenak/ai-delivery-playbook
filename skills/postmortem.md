---
name: postmortem
disable-model-invocation: true
description: Fills in a blameless post-mortem template from a local .tasks/.postmortems/TICKET-ID.md notes file and outputs Confluence wiki markup ready to paste (or publish directly via a wiki MCP). Adapt the markup section if this project's wiki isn't Confluence. NEVER auto-invoke — only run when user explicitly types /postmortem.
---

# postmortem — Generate a Blameless Post-Mortem

## Overview

Reads a local `.tasks/.postmortems/TICKET-ID.md` notes file and maps its content into a standard blameless post-mortem template. Output is **Confluence wiki markup** by default (paste via *Insert (`+`) → Other macros → Wiki markup*) — if this project's wiki is something else (Notion, a plain markdown doc, GitHub wiki), skip the markup-syntax conversion in Step 3 and output plain markdown instead; the template structure itself is wiki-agnostic.

A blameless post-mortem focuses on what happened and what prevents recurrence, not who to blame. That framing goes in the output itself (see the Intro section below) — don't soften or drop it when adapting this skill.

---

## Workflow

### Step 1: Get the Ticket ID

If the user provided a ticket ID, use it. Otherwise ask: _"What is the ticket ID for this post-mortem?"_

### Step 2: Read the Post-Mortem Notes File

Look for the file at:

```
<package-root>/.tasks/.postmortems/TICKET-ID.md
```

If it doesn't exist, ask: _"I couldn't find `.tasks/.postmortems/TICKET-ID.md`. Do you want me to create a blank one to fill in, or paste the incident details here?"_

### Step 3: Map and Output as Confluence Wiki Markup

Use the file content to fill in every section. Infer reasonable values where the mapping is obvious. Leave a `(fill in)` placeholder only for fields that are genuinely unknown (meeting date, participants, exact timestamps) — don't invent specifics to avoid a placeholder.

**Confluence wiki markup cheat-sheet — use these, not markdown equivalents:**

| Element | Confluence | NOT markdown |
|---|---|---|
| Heading 1 | `h1. Title` | `# Title` |
| Heading 2 | `h2. Title` | `## Title` |
| Bullet list | `* item` | `- item` |
| Numbered list | `# item` | `1. item` |
| Bold | `*text*` | `**text**` |
| Italic | `_text_` | `_text_` (same, but avoid in list context) |
| Horizontal rule | `----` | `---` |
| Inline code | `{{code}}` | `` `code` `` |
| Literal curly brace | `\{` and `\}` | `{` and `}` raw (Confluence treats `{...}` as macro syntax) |

Never use `1.`, `2.` for numbered lists — Confluence renders them as plain text. Never use backtick `` ` `` for inline code — use `{{...}}` instead. Never write bare `{` in prose — escape as `\{`, or Confluence may try to parse it as a macro.

```
h1. YYYY-MM-DD Name of incident

*Date of post-mortem meeting:* (fill in)
*Participants:* (fill in)

----

h2. Intro

_This is a blameless post-mortem. We will not focus on the past events as they pertain to "could've", "should've", etc. All follow-up action items will be assigned to a team/individual before the end of the meeting._

*Incident Leader:* [owner from the notes file]

----

h2. Description

[Summary + symptom, as plain prose. Include ticket and PR/MR links as plain URLs.]

----

h2. Timeline

* (fill in) — first report received (reporter, ticket link)
* (fill in) — acknowledged / assigned
* (fill in) — root cause identified
* [resolved date from notes] — fix merged

----

h2. Contributing Factor(s)

* [Root cause point 1]
* [Root cause point 2]
* [Why this wasn't caught, point 1]
* [Why this wasn't caught, point 2]

----

h2. Stabilization Steps

[Any immediate mitigations. If none: "No stabilization required — [reason, e.g. bug was display-only with no data-persistence impact]."]

----

h2. Resolution

[Fix, as prose or light bullets — no code snippets.]

----

h2. Impact

[Severity, who was affected, scope — from the notes file's severity field and symptom description.]

----

h2. Corrective Actions

* [Prevention item 1] — assigned to: (fill in)
* [Prevention item 2] — assigned to: (fill in)

----

h2. Future long term solution

[Any architectural improvement beyond the immediate fix, if applicable.]

----

h2. Notes

[Open questions or links not covered above. If none: "none."]
```

### Step 4: Save

Write the filled-in wiki markup back to:

```
<package-root>/.tasks/.postmortems/TICKET-ID.md
```

This overwrites the source notes file — the wiki markup version *is* the standard post-mortem format for this project going forward. No confirmation needed for this local overwrite (it's not a publish step).

### Step 5: Publish (Optional)

Ask the user: _"Publish this post-mortem to the wiki now? Which space and parent page?"_

If confirmed and a wiki MCP is connected (see `docs/mcp-servers.md` → Issue Tracker / Wiki MCP), use its page-creation tool with:

- Space/parent location: whatever the user specified (never assume a default space or page ID — those are project-specific and easy to get wrong silently)
- Title: the post-mortem title (same as the `h1.` heading)
- Content: the full wiki markup from Step 3
- Content format: wiki markup

After creation, output the returned page URL so the user can open it directly.
