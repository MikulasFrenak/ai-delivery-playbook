---
name: plan-update
disable-model-invocation: true
description: Creates or updates this repo's root PLAN.md — the living Status/Next-up/Open-questions/Parked/Decision-points doc defined in AGENTS.md — from the current conversation and the repo's real state. NEVER auto-invoke — only run when user explicitly types /plan-update.
---

# plan-update — Create or Update PLAN.md

## Overview

`PLAN.md` is a living, root-level delivery/roadmap doc — see AGENTS.md's "PLAN.md — living delivery/roadmap doc" section for the full template and rules. It answers "what's the actual state of the project right now, what's next, and why" — something neither a ticket tracker (one task) nor `AGENTS.md` (deliberately stable architecture) covers.

This skill exists because `PLAN.md` is meant to be updated **as thinking happens, not as a separate chore** — but "update it in the same sitting" only works if there's a repeatable way to reconcile the file rather than re-deriving its shape from scratch each time. That's what this skill does: read the current `PLAN.md` (or start from the template if none exists), reconcile it against what actually changed, and rewrite the stale sections in place.

**This skill edits the file only — it does not commit.** Whether `PLAN.md` changes get committed alongside the work that motivated them, or via a separate pass, is a judgment call for the user (see `/commit`); don't assume either.

---

## Workflow

### Step 1: Read the Current State

- If `PLAN.md` exists at the repo root, read it in full.
- If it doesn't, create it from the template in AGENTS.md's "PLAN.md" section — don't invent a different structure.

### Step 2: Gather What Actually Changed

Don't rely on memory of the conversation alone — cross-check against the repo:

- `git log --oneline -20` (and further back if the last `PLAN.md` update is older than that) for merged work since the file was last touched.
- Open branches/PRs (`git branch --list`, `gh pr list` or host equivalent) for what's actively in flight.
- `.tasks/*.md` for tickets currently open (per this repo's task-file lifecycle, a file here means the ticket isn't done yet).
- Any other durable artifact relevant to this repo's own conventions (`evals/*.md`, `docs/future-considerations.md`) if the update touches areas they track.

### Step 3: Reconcile Each Section — Rewrite in Place, Don't Append

Per AGENTS.md's rules for this file:

- **Status** and **Next up** — rewrite in place to reflect current reality. These are snapshots, not changelogs; resist the urge to leave old status lines "for history" — git history already has that.
- **Open questions / decisions needed** — remove any that got resolved this session (move the resolution into Status, or into Next up if it spawned new work); add any newly surfaced ones.
- **Parked** — the one section allowed to accumulate. Add newly-parked ideas with enough context a cold read still makes sense; use ✅/⬜ sub-items for partial progress. If a fuller writeup already exists elsewhere (e.g. `docs/future-considerations.md`), link to it rather than duplicating — same rule the initial `PLAN.md` in this repo already follows.
- **Decision points** — add/update only if this session changed what should trigger a revisit; otherwise leave as-is.
- **Sources** — update only if the session leaned on external research; if none, leave as `None`.

### Step 4: Promote, Don't Duplicate

If an item in **Next up** is now actually being worked on, it should get a real ticket (self-assigned `AIPB-NN` or an external tracker ID, per AGENTS.md) and `.tasks/TICKET-ID.md` file via `/create-task` — `PLAN.md` keeps only the one-line backlog entry (optionally noting the ticket ID once assigned), not the task file's full detail. Don't let `PLAN.md` grow into a second task tracker.

### Step 5: Confirm

Show the user a short diff summary (which sections changed and why) rather than the full rewritten file — they can read the file directly. Don't commit; that's a separate, explicit step (`/commit`).
