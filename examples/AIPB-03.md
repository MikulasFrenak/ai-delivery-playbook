# Worked Example: AIPB-03 — Positioning pass

**Trigger:** An external review reframed this repo from "a Claude skills folder" to "an engineering methodology," and proposed several naming and structural changes to match that framing.

**Workflow:** [`feature-delivery`](../workflows/feature-delivery.md), Task/chore path.

## Trace

1. **Verification before agreement** — same discipline as AIPB-02: 6 review points were checked individually rather than accepted wholesale. Two were adjusted rather than adopted as-is: renaming "Atomic Skills" was scoped to the pitch-level label only, leaving the actual Claude Code "skill" mechanism untouched; the reviewer's suggested "Engineering Playbooks" name for a new level was rejected as confusing (a playbook containing playbooks) in favor of "Worked Examples." One point (a v0.1.0 usability audit) was explicitly ruled out of scope — a real audit isn't a renaming task, and folding it in would have quietly expanded the ticket.
2. **[`create-task`](../skills/create-task.md)** — wrote `.tasks/AIPB-03.md` (Chore template) scoping exactly 5 agreed changes, with the 6th recorded as deliberately excluded and why.
3. **[`implement-task`](../skills/implement-task.md)** — renamed two Level labels, added a new Level 4 to `architecture.md` and `CLAUDE.md`'s Repo Layout table, added an identity sentence and softened scope statement across 3 files, and wrote up AIPB-01 and AIPB-02 as the first Level 4 content. Ran the same repo-wide verification sweep AIPB-02 established (broken links, table integrity, stale label references, consistent wording) before considering it done — all clean.
4. **[`commit`](../skills/commit.md)** — staging matched the task file's scope exactly (12 files, all listed in Files to Touch).
5. **Push + PR** — opened as [PR #4](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/4).

## Postscript: the run caught a gap in itself

After PR #4 was open, a simple question — "why is AIPB-03 under `.tasks/` and not `examples/`?" — led to checking whether the Task file lifecycle rule (`.tasks/TICKET-ID.md` should be deleted once a PR exists, not kept until merge) had actually been followed for AIPB-01 and AIPB-02. It hadn't: both were still sitting in `.tasks/` despite their PRs being merged. The reason was mechanical, not carelessness — the rule is enforced by `/commit` checking for an open PR, but neither ticket had a *follow-up* commit after its PR opened, so the check never re-ran. `/commit`'s Step 2 lifecycle check is correct; it just has no trigger to *re-check* a ticket once its own work is done and no more commits are coming.

Fixed by: deleting `AIPB-01.md`/`AIPB-02.md` in a standalone `trivial/` commit (no ticket owns a pure cleanup action like this), and deleting `AIPB-03.md` directly in this ticket's own branch, since its PR was already open at the time.

## What this run actually validated

The self-correction is the interesting part, not the renaming. A one-line user question surfaced a real process gap that none of the verification sweeps in this run (or AIPB-02's) were designed to catch, because they check *content correctness*, not *process adherence*. Worth remembering as a distinct category of check for future runs.
