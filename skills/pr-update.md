---
name: pr-update
disable-model-invocation: true
description: Appends the latest committed changes as new rows to the open PR/MR description — or creates the PR/MR first, with those changes as its initial description, if one doesn't exist yet — on GitHub, GitLab, Azure DevOps, or Bitbucket. Reads the last commit diff, generates table rows in the project's format, and updates (or creates) the PR/MR via the appropriate host CLI. NEVER auto-invoke — only run when user explicitly types /pr-update or when called from the commit skill.
---

# pr-update — Append Changes to PR/MR Description

## Overview

Reads the last commit on the current branch, generates new rows in the PR/MR changes-table format, and appends them to the open PR/MR description — on whichever host this repo actually uses. If no PR/MR is open yet, offers to create one instead, using those same generated rows as its initial description.

**Follow the steps in order. Stop gracefully at any step if the prerequisite is not met.**

---

## Workflow

### Step 1: Get Branch and Ticket ID

```bash
git branch --show-current
```

Extract the ticket ID from the branch name, matching whatever convention this repo documents (see `CLAUDE.md`), e.g.:
- `feature/TICKET-ID/desc` → `TICKET-ID`
- `bugfix/TICKET-ID/desc` → `TICKET-ID`
- `chore/TICKET-ID/desc` → `TICKET-ID`
- `trivial/desc` → no ticket ID — skip the PR update and inform the user

---

### Step 2: Detect the Host and Find the Open PR/MR

Detect the host from the git remote URL:

```bash
git remote get-url origin
```

| Remote URL contains | Host | CLI |
|---|---|---|
| `github.com` | GitHub | `gh` |
| `gitlab.com` or self-hosted GitLab | GitLab | `glab` |
| `dev.azure.com` or `visualstudio.com` | Azure DevOps | `az repos` |
| `bitbucket.org` | Bitbucket | REST API via `curl` (no first-party CLI) |
| Anything else (self-hosted Gitea/Gogs/Forgejo, sourcehut, a private GitLab CE instance that doesn't say "gitlab" in its hostname, etc.) | Unknown | none built in |

This table covers the hosts common enough to have a well-known CLI — it's a starting point, not a hard boundary. For an unlisted host: check whether it exposes an OpenAPI-compatible REST API (most do) and drive that with `curl` the same way the Bitbucket row does, rather than assuming the skill can't run at all. Only fall back to telling the user and stopping if there's genuinely no way to query PR/MR state programmatically (no CLI, no reachable API, no credentials).

Confirm the corresponding CLI (or API access) is installed/reachable and authenticated before proceeding (`gh auth status`, `glab auth status`, `az account show`, a stored Bitbucket app-password/token, or a working credential for an unlisted host's API). If it isn't, tell the user what's missing and stop — don't try to guess credentials.

**Find the open PR/MR for the current branch:**

```bash
# GitHub
gh pr view --json number,body,url

# GitLab
glab mr view --output json   # or: glab mr list --source-branch <branch>

# Azure DevOps — extract org/project from the remote first, e.g.
# https://<org>@dev.azure.com/<org>/<project>/_git/<repo> → org: https://dev.azure.com/<org>
az repos pr list --source-branch <current-branch> --org https://dev.azure.com/<org> --detect false --output json

# Bitbucket
curl -s -u "<user>:<app-password>" \
  "https://api.bitbucket.org/2.0/repositories/<workspace>/<repo>/pullrequests?q=source.branch.name=%22<branch>%22"
```

**If no open PR/MR is found → don't stop.** Ask the user:

> No open PR/MR found for this branch. Create one now with these changes as the initial description?

- If they decline, stop without erroring — that's a valid choice, not a failure.
- If the branch is `trivial/` (no ticket ID), skip this offer silently and stop — trivial branches don't get a PR/MR, same rule `commit.md` follows.
- If they confirm, continue to Step 3 as normal, but note this run is *creating* rather than *updating*: the table + `## Testing` section built in Steps 4–5 becomes the PR/MR's initial description instead of an appendix, and Step 6 creates it (title `TICKET-ID - <commit summary>`, same convention and host commands as [`commit.md`](./commit.md) Step 5, "PR/MR — Create or Update") instead of editing an existing one.

**If an open PR/MR is found**, note its id/number and current description/body from the response, and continue to Step 3.

---

### Step 3: Read the Last Commit

```bash
git log -1 --format="%s%n%n%b"
git diff HEAD~1 HEAD
```

Also check if a task file exists for this ticket (see the `create-task` skill), e.g. `<package-root>/.tasks/TICKET-ID.md`.

Use the commit message, diff, and task file (if present) to understand:
- What areas / files changed
- What problem each change solved
- What the implementation approach was
- Whether the change is gated by a feature flag (flag-on only) or applies always (both)

---

### Step 4: Generate New Table Rows

For each logical change area in the last commit, produce one row in this format:

```
| **Area name** | Problem solved | Implementation detail | Flag scope |
```

Rules:
- **Area name**: short label in bold — e.g. `Fix: sort order after drag`, `Readonly field validation`
- **Problem solved**: one sentence — the bug or issue that existed before
- **Implementation**: concrete — what code changed and how it fixes the problem; name the file/class if not obvious
- **Flag scope**: `Both` (applies regardless of flag), `Flag on only`, `Flag off only`, or `-` (no feature flag involved — e.g. a plain bug fix)
- Group closely related micro-fixes (e.g. multiple similar null-check fixes) into a single row
- Do not create a row for the PR/MR description update itself or for skill/tooling changes

If the commit is purely tooling / `.claude/` changes → no rows to add, inform the user and stop.

---

### Step 5: Build the Updated Description

Take the current PR/MR description/body string.

**If it already contains a markdown table** (a line starting with `|`):
- Append the new rows directly after the last `|...|` line of the table
- Preserve all existing rows exactly as-is

**If it has no table yet**:
- Append a new table after the existing text:

```
| Area | Problem solved | Implementation | Flag scope |
|---|---|---|---|
| **...** | ... | ... | ... |
```

After the table (new or existing), append a `## Testing` section **only if one does not already exist** in the description:

```
## Testing

**How to trigger:**
- <step-by-step actions to reproduce the scenario>

**What to verify:**
- <golden path: expected visible result>
- <edge case or regression the fix addresses>

**Observability (if applicable):**
- <trace/log/metric check the reviewer can run, if this project has an observability MCP wired up — see docs/mcp-servers.md>
```

Rules for the Testing section:
- Derive "How to trigger" from the commit message, task file AC, and changed code — be specific enough that a reviewer can follow without asking
- "What to verify" must cover the golden path AND the specific bug/edge case fixed (if a bugfix)
- "Observability" row: include only if the change involves metrics, tracing, logging, or analytics; omit otherwise
- Keep it concise — 3–6 bullet points total across all subsections

---

### Step 6: Update or Create the PR/MR

Write the description to a temp file first, on every host — this avoids shell-escaping issues with markdown tables, backticks, and quotes:

```bash
cat > /tmp/pr_desc_update.md << 'EOF'
<full description content>
EOF
```

**If an open PR/MR already existed (the normal case)** — update it:

```bash
# GitHub
gh pr edit --body-file /tmp/pr_desc_update.md

# GitLab
glab mr update <mr-id> --description "$(cat /tmp/pr_desc_update.md)"

# Azure DevOps
az repos pr update \
  --id <pr-id> \
  --org https://dev.azure.com/<org> \
  --description "$(cat /tmp/pr_desc_update.md)" \
  --detect false \
  --output table

# Bitbucket (REST API — no dedicated CLI)
curl -s -u "<user>:<app-password>" -X PUT \
  -H "Content-Type: application/json" \
  -d "$(jq -n --rawfile desc /tmp/pr_desc_update.md '{description: $desc}')" \
  "https://api.bitbucket.org/2.0/repositories/<workspace>/<repo>/pullrequests/<pr-id>"
```

Confirm success by printing the PR/MR id and number of rows added.

**If this run is creating a new PR/MR instead (Step 2's fallback, user confirmed)** — create it, using the same title convention and host commands as [`commit.md`](./commit.md) Step 5, with `/tmp/pr_desc_update.md` as the description body:

```bash
# GitHub
gh pr create --title "TICKET-ID - <commit summary>" --body-file /tmp/pr_desc_update.md --base <base-branch>

# GitLab
glab mr create --title "TICKET-ID - <commit summary>" --description "$(cat /tmp/pr_desc_update.md)" --target-branch <base-branch>

# Azure DevOps
az repos pr create \
  --org https://dev.azure.com/<org> \
  --title "TICKET-ID - <commit summary>" \
  --description "$(cat /tmp/pr_desc_update.md)" \
  --source-branch <current-branch> \
  --target-branch <base-branch> \
  --detect false \
  --output table

# Bitbucket (REST API — no dedicated CLI)
curl -s -u "<user>:<app-password>" -X POST \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg title "TICKET-ID - <commit summary>" --rawfile desc /tmp/pr_desc_update.md --arg src "<current-branch>" --arg dst "<base-branch>" \
    '{title: $title, description: $desc, source: {branch: {name: $src}}, destination: {branch: {name: $dst}}}')" \
  "https://api.bitbucket.org/2.0/repositories/<workspace>/<repo>/pullrequests"
```

Confirm success by printing the new PR/MR's id/number and link.

---

### Step 7: Report

Tell the user:
- Which PR/MR was updated **or created** (id/number + link)
- If created: say so plainly ("no open PR/MR existed, so I created one") — don't phrase a creation as if it were an update
- How many rows were appended (or, if newly created, that this is the initial description) and a one-line summary of each
- Whether a `## Testing` section was added or already existed
- If the step stopped early (no ticket ID, no open PR/MR and the user declined to create one, tooling-only commit), say so plainly instead of reporting a fake success
