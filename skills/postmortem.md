---
name: postmortem
disable-model-invocation: true
description: Turns local incident notes (tasks/postmortems/TICKET-ID.notes.md, gitignored) into a blameless post-mortem kept at tasks/postmortems/TICKET-ID.md next to the task files, links it both ways with the ticket's task file, and optionally converts it to Confluence wiki markup to publish (or publishes directly via a wiki MCP). NEVER auto-invoke — only run when user explicitly types /postmortem.
---

# postmortem — Generate a Blameless Post-Mortem

## Overview

Reads local incident notes and writes a standard blameless post-mortem to `<package-root>/tasks/postmortems/TICKET-ID.md`. That Markdown file is the durable record: kept in the repo next to the task files, never deleted, and linked both ways with the ticket's task file (see `AGENTS.md` → Task file lifecycle). Publishing to a wiki is an optional last step — Confluence wiki markup by default, converted from the Markdown; skip the conversion if this project's wiki takes Markdown (Notion, GitHub wiki).

A blameless post-mortem focuses on what happened and what prevents recurrence, not who to blame. That framing goes in the output itself (see the Intro section below) — don't soften or drop it when adapting this skill.

| File | Committed? | Holds |
|---|---|---|
| `tasks/postmortems/TICKET-ID.notes.md` | No — gitignored | Raw incident notes: names, log excerpts, customer details, whatever was captured at the time |
| `tasks/postmortems/TICKET-ID.md` | Yes | The blameless post-mortem: roles instead of names, no customer data, no secrets |

The notes stay local because a committed file can't be taken back: rewriting it later still leaves the raw version in git history.

---

## Workflow

### Step 1: Get the Ticket ID

If the user provided a ticket ID, use it. Otherwise ask: _"What is the ticket ID for this post-mortem?"_ Use the ticket that tracks the incident and its fix — the post-mortem shares its ID and its task file.

### Step 2: Read the Notes

Look for the notes file at:

```
<package-root>/tasks/postmortems/TICKET-ID.notes.md
```

If it doesn't exist, ask: _"I couldn't find `tasks/postmortems/TICKET-ID.notes.md`. Do you want me to create a blank one to fill in, or paste the incident details here?"_

Before reading further, check the notes can't be committed:

```bash
git ls-files --error-unmatch <package-root>/tasks/postmortems/TICKET-ID.notes.md 2>/dev/null && echo "TRACKED"
git check-ignore -q <package-root>/tasks/postmortems/TICKET-ID.notes.md || echo "NOT IGNORED"
```

- **Tracked:** stop and tell the user — the raw notes are already in git history, and whether to rewrite history is their call.
- **Not ignored:** add `**/tasks/postmortems/*.notes.md` to the root `.gitignore` and say so in your output.

Also read `<package-root>/tasks/TICKET-ID.md` if it exists — its confirmed root cause, What was built and PR/MR link feed Description, Contributing Factors and Resolution.

### Step 3: Write the Post-Mortem

Fill in every section of the template below and save it to:

```
<package-root>/tasks/postmortems/TICKET-ID.md
```

Infer reasonable values where the mapping is obvious. Leave a `(fill in)` placeholder only for fields that are genuinely unknown (meeting date, participants, exact timestamps) — don't invent specifics to avoid a placeholder. If the file already exists (a re-run after new information), update it in place.

Everything copied from the notes goes through these first:
- **Roles, not names** — "the on-call engineer", "a customer on the business plan". Names are what turn a post-mortem into blame, and they don't belong in a durable repo file.
- **No customer data** — no identifiers, emails, account numbers or message contents.
- **No secrets or internal hosts** — redact tokens, keys and internal hostnames/IPs in any log excerpt. In a public repo `/public-repo-check` runs before push as well, but it won't catch a customer's name.

```markdown
# YYYY-MM-DD Name of incident

**Task:** [TICKET-ID](../TICKET-ID.md)
**Date of post-mortem meeting:** (fill in)
**Participants:** (fill in — roles or team names)
**Wiki:** —

---

## Intro

_This is a blameless post-mortem. We will not focus on the past events as they pertain to "could've", "should've", etc. All follow-up action items will be assigned to a team/individual before the end of the meeting._

**Incident Leader:** [role from the notes file]

## Description

[Summary + symptom, as plain prose. Link the ticket and the PR/MR.]

## Timeline

- (fill in) — first report received (reporter's role, ticket link)
- (fill in) — acknowledged / assigned
- (fill in) — root cause identified
- [resolved date from notes] — fix merged

## Contributing Factor(s)

- [Root cause point 1]
- [Root cause point 2]
- [Why this wasn't caught, point 1]
- [Why this wasn't caught, point 2]

## Stabilization Steps

[Any immediate mitigations. If none: "No stabilization required — [reason, e.g. bug was display-only with no data-persistence impact]."]

## Resolution

[Fix, as prose or light bullets — no code snippets.]

## Impact

[Severity, who was affected (as roles or groups), scope — from the notes file's severity field and symptom description.]

## Corrective Actions

- [Prevention item 1] — ticket: (fill in, or "not ticketed") — assigned to: (fill in)
- [Prevention item 2] — ticket: (fill in, or "not ticketed") — assigned to: (fill in)

## Future long term solution

[Any architectural improvement beyond the immediate fix, if applicable.]

## Notes

[Open questions or links not covered above. If none: "none."]
```

If there's no task file for TICKET-ID (the incident was fixed without one), put the ticket URL on the `**Task:**` line instead.

### Step 4: Link It Both Ways

- Add `**Postmortem:** [postmortems/TICKET-ID.md](./postmortems/TICKET-ID.md)` to the header of `<package-root>/tasks/TICKET-ID.md`, under `**Status:**`. On a closed-out task file this one line is the only edit — it doesn't reopen it.
- For each Corrective Action whose ticket already has a task file, add the same `**Postmortem:**` line there, and link that task file on the action's line (`ticket: [ACTION-ID](../ACTION-ID.md)`). Actions ticketed later get linked by [`/create-task`](./create-task.md) Step 5.

This skill only writes files. [`/commit`](./commit.md) stages the post-mortem and the linked task files with the rest of the change — never the `.notes.md`.

### Step 5: Publish to the Wiki (Optional)

Ask the user: _"Publish this post-mortem to the wiki too? Which space and parent page?"_ The repo file stays the source of truth; the wiki page is a copy.

If yes, convert the Markdown to Confluence wiki markup (skip this if the wiki takes Markdown):

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
| Link | `[text\|https://…]` | `[text](https://…)` |
| Literal curly brace | `\{` and `\}` | `{` and `}` raw (Confluence treats `{...}` as macro syntax) |

Never use `1.`, `2.` for numbered lists — Confluence renders them as plain text. Never use backtick `` ` `` for inline code — use `{{...}}` instead. Never write bare `{` in prose — escape as `\{`, or Confluence may try to parse it as a macro. Relative repo links (`../TICKET-ID.md`) don't resolve on a wiki — replace them with the ticket URL, or the file's URL on the repo host. Put a `----` rule between sections.

If a wiki MCP is connected (see `docs/mcp-servers.md` → Issue Tracker / Wiki MCP), use its page-creation tool with:

- Space/parent location: whatever the user specified (never assume a default space or page ID — those are project-specific and easy to get wrong silently)
- Title: the post-mortem title (the `#` heading)
- Content: the converted wiki markup
- Content format: wiki markup

Without a wiki MCP, output the markup for pasting via *Insert (`+`) → Other macros → Wiki markup*.

After creation, output the page URL and put it on the post-mortem's `**Wiki:**` line.
