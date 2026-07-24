---
name: branch-cleanup
disable-model-invocation: true
description: Deletes local branches that are actually merged (verified against the PR/MR host, not just git's own merge graph, which misses squash-merged branches) and prunes stale remote-tracking refs. NEVER auto-invoke — only run when user explicitly types /branch-cleanup.
---

# branch-cleanup — Delete Merged Local Branches

## Overview

The git host can auto-delete a branch on the remote when its PR/MR merges (GitHub: Settings → General → "Automatically delete head branches"), but it has no way to reach your local clone — see `CLAUDE.md`'s "Branch cleanup after merge" note. Local cleanup stays manual until something actually runs it, so branches pile up.

The harder problem isn't running `git branch -d` — it's knowing which branches are *actually* safe to delete. `git branch --merged <base>` is the obvious check, but it only proves a branch's commits are ancestors of the base branch's tip. That's true for a real merge commit (`git merge`, GitHub's default "Merge pull request" strategy) but **false for a squash merge** — the squashed commit on the base branch is a new commit, not a descendant of the original branch, so `--merged` silently misses it even though the branch's content fully landed. A repo that squash-merges will show most of its actually-done branches as "not merged."

This skill cross-references against the real PR/MR state on the host, not just git's local graph, so it doesn't miss squash-merged branches or wrongly flag one as safe when it merges via a strategy `--merged` can't see.

**Never auto-invoke** — deleting branches, even safely, isn't something to run as a side effect of an unrelated request.

---

## Workflow

### Step 1: Detect the Host

Same detection as [`pr-update`](./pr-update.md) Step 2 — check the git remote URL for GitHub / GitLab / Azure DevOps / Bitbucket and confirm the corresponding CLI is installed and authenticated (`gh auth status` / `glab auth status` / `az account show` / a stored Bitbucket credential). If none is available, fall back to Step 3's `--merged` check alone and say so explicitly — it will under-report on a repo that squash-merges, and the report in Step 5 must make that limitation visible rather than silently presenting a partial list as complete.

### Step 2: List Local Branches

```bash
git branch --list
```

Exclude the current branch and every protected base branch this repo documents (`main`/`master`, per `CLAUDE.md`).

### Step 3: Cheap First Pass — `git branch --merged`

```bash
git branch --merged <base-branch>
```

Anything in this list is provably merged — no host query needed for these. This catches ordinary merge commits and fast-forwards; it will not catch squash merges.

### Step 4: Host Cross-Check for Everything Else

For every remaining local branch (not caught by Step 3), query the host directly — don't guess from commit content or branch age:

```bash
# GitHub
gh pr list --head <branch> --state merged --json number,mergedAt,url --limit 1

# GitLab
glab mr list --source-branch <branch> --state merged

# Azure DevOps
az repos pr list --source-branch <branch> --status completed --org https://dev.azure.com/<org> --detect false

# Bitbucket (REST — no first-party CLI)
curl -s -u "<user>:<app-password>" \
  "https://api.bitbucket.org/2.0/repositories/<workspace>/<repo>/pullrequests?q=source.branch.name=%22<branch>%22%20AND%20state=%22MERGED%22"
```

Classify each:

| Result | Meaning | Action |
|---|---|---|
| Merged PR/MR found | Confirmed merged, regardless of strategy | Safe to delete |
| Open PR/MR found | Still in review | Never delete |
| No PR/MR found at all | Never pushed, or pushed with no PR opened | Never delete — could be someone's in-progress local work; flag it, don't touch it |

### Step 5: Show the Full Plan Before Touching Anything

Never delete without this shown first, in full:

```
## Local branch cleanup

Will delete (confirmed merged):
- trivial/foo — merged PR #12, 2026-07-10
- chore/AIPB-09/bar — merged PR #14, 2026-07-15 (squash — caught via host, not git --merged)

Leaving alone:
- feature/baz — PR #18 still open
- some-local-experiment — no PR/MR found on the host, might be unpushed local work

[If Step 1 found no host CLI:] Host CLI unavailable — this list only reflects git's own
--merged check and will miss any squash-merged branch. Treat "leaving alone" as
"unverified," not "confirmed unmerged."
```

Ask: delete the confirmed-merged list above? (yes / no / let me pick a subset)

### Step 6: Delete + Prune

```bash
git checkout <base-branch> && git pull
git branch -d <branch>
```

If `-d` refuses ("not fully merged") for a branch Step 4 already confirmed via the host — expected for a squash merge, since the branch's commits genuinely aren't ancestors of the squash commit — use `-D` instead. This is safe specifically *because* the host already confirmed the merge in Step 4, not because the user is blind-overriding git's own warning.

```bash
git fetch --prune
```

Cleans up stale `remotes/origin/*` refs for branches already deleted on the host side.

### Step 7: Report

List what was deleted, what was deliberately left alone and why (open PR, no PR found, or host unavailable), and confirm `git fetch --prune` ran. If the host CLI wasn't available in Step 1, repeat that caveat here — don't let a partial cleanup read as a complete one.
