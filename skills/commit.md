---
name: commit
disable-model-invocation: true
description: Generates a well-structured commit message from the current git diff, runs the quality gate, creates the commit, and optionally creates/updates the PR/MR. NEVER auto-invoke — only run when user explicitly types /commit.
---

# commit — Generate & Create Commit

## Overview

Inspects the current git diff, generates a well-structured commit message following this repo's convention (see `CLAUDE.md`), runs the quality gate, and creates the commit — optionally following up with `/pr-update` or a new PR/MR.

## Workflow

### Step 0: Check Branch

Run `git branch --show-current`.

**If on the repo's protected branch (`main`/`master`), create a branch first — never commit directly to it.**

Determine the branch type from context (task description, diff content), per `CLAUDE.md`'s branch-naming convention:

| Type | Pattern | When |
|---|---|---|
| `feature/` | `feature/TICKET-ID/short-kebab-desc` | New functionality from a ticket |
| `bugfix/` | `bugfix/TICKET-ID/short-kebab-desc` | Fixing broken behaviour, failing tests, regressions |
| `chore/` | `chore/TICKET-ID/short-kebab-desc` | Ticketed non-feature work: deps, refactor, config |
| `trivial/` | `trivial/short-kebab-desc` | Tooling, docs, config — no ticket |

Rules for the short desc:
- kebab-case, max ~30 chars, imperative (`add-filter-banner`, `fix-ct-tests`, `update-claude-rules`)
- If the type is unclear from context, ask: _"Is this a feature, bugfix, or chore?"_

Then run:

```bash
git checkout -b feature/TICKET-ID/short-desc
```

If already on a non-protected branch, skip this step.

### Step 1: Get the Ticket ID

If the current branch starts with `trivial/`, skip this step — use `TRIVIAL` as the ID.

If the user provided a ticket ID, use it. Otherwise ask: _"What is the ticket ID for this commit?"_

### Step 2: Read the Diff

Run `git diff --staged` (and `git diff` if nothing is staged yet), plus `git status`, to understand what changed.

**Task file lifecycle check** — run alongside the diff:

```bash
# 1. Check if a task file exists for this ticket
ls <package-root>/.tasks/TICKET-ID.md 2>/dev/null

# 2. Check if a PR/MR is already open for this branch — see the host-detection
#    table in the pr-update skill (Step 2) for the right command per host
#    (gh / glab / az repos / Bitbucket)
```

| Task file exists? | PR/MR already open? | Action |
|---|---|---|
| Yes | Yes | **Delete it** — work is done, file served its purpose |
| Yes | No | **Include as update** — ongoing work, keep it |
| No | — | Nothing to do |

### Step 2.3: `CLAUDE.md` Conflict Guard

Check if any `CLAUDE.md` file is in the diff.

**If `CLAUDE.md` is the ONLY change (no code changes):**
- If the current branch is `feature/`, `bugfix/`, or `chore/`, warn the user:

  > ⚠️ You're committing only `CLAUDE.md` changes on a non-trivial branch. Consider a `trivial/` branch instead — doc-only changes mixed into long-lived branches are prone to conflicts as the base branch moves. Create a `trivial/update-claude-rules` branch now?

- If the user agrees, create the branch and continue. If not, continue on the current branch.

**If `CLAUDE.md` is mixed with code changes:**
- Rebase from the base branch first to shrink the divergence window:

  ```bash
  git fetch origin && git rebase origin/<base-branch>
  ```

- If the rebase succeeds, continue normally. If there are conflicts, stop and tell the user to resolve them before re-running `/commit`.

### Step 2.5: Announce What Will Be Staged

Before running any `git add` command, output a clearly visible summary:

---

## 📦 Staging for commit — TICKET-ID

**Files to stage:**
- `path/to/file.tsx` — reason
- `path/to/other.ts` — reason

**Files NOT staged (and why):**
- `.env*`, generated/auto-generated code — never staged

> If the task file is flagged for deletion, include it here as:
> - `.tasks/TICKET-ID.md` *(delete — ticket complete)*

---

This gives the user a chance to review before anything is written to git.

### Step 2.6: Design Verification (Optional — only when the task has a design link)

If the task file contains a `Figma (UI / implementation):` link, ask the user:

> Run [`/design-brief`](./design-brief.md) to pull the latest screenshot and verify the implementation matches the design?

- **Yes** → run it, then compare against a screenshot from [`/verify-browser`](./verify-browser.md). Flag any visual mismatches before committing.
- **No / skip** → proceed to Step 2.7.

Do **not** auto-run it without asking — it typically requires a local design-tool connection that isn't always available.

### Step 2.7: Browser Verification (Optional — Skippable)

Ask the user:

> Run `/verify-browser` to check the change in the browser before committing?

- **Yes** → run it and wait for it to complete. If it reveals a regression or error, stop and fix before continuing to Step 3.
- **No / skip** → proceed directly to Step 3.

Do **not** auto-run it without asking — it requires Chrome DevTools MCP and a running dev server, which may not always be available.

---

### Step 3: Draft the Commit Message

Follow this format (per `CLAUDE.md`):

```
TICKET-ID - Summary of what changed (imperative, max 72 chars)

- `file.tsx` (ClassName/functionName): what changed — why it was needed
- `other-file.ts` (anotherArea): what changed — why it was needed
```

**Bullet format — structure:**
- Prefix every bullet with the filename in backticks: `` `formatDate.ts` ``
- Follow with the function/class/logical area in parentheses: `(formatDate)`
- After the colon: **what** changed + **why**, separated by ` — `
- One bullet per logical change area — group tightly related micro-changes into one bullet

**Bullet format — content:**
- What was changed and why (specific, not generic)
- Any non-obvious decisions or trade-offs made
- Deprecated code removed or flagged, with migration notes if applicable
- Never write "updated", "fixed", "changed" without saying what specifically: ✗ "fixed cache" → ✓ "replaced `map.has(k)` + `get(k)!` with a single `get()` + early return — avoids the non-null assertion a linter/quality-gate rule flagged"

**Good examples (illustrative — use your own project's real changes):**

```
- `formatDate.ts` (formatDate): added a `readonly` modifier to the cache field — never reassigned after init
- `formatDate.ts` (parseRange): replaced map.has+get! with a single get()+early return — type narrowing doesn't survive has(), and the linter flagged the assertion
- `geometry.ts` (distanceBetween): Math.sqrt(a²+b²) → Math.hypot(a,b) — avoids intermediate overflow on large coordinates
- `geometry.ts` (updateBounds callback): extracted `const point = place.point` before .map() — narrowing doesn't carry into the callback closure
```

**Other rules:**
- First line: `TICKET-ID - ` prefix + imperative summary — use `TRIVIAL - ` when on a `trivial/` branch
- If nothing was staged yet, stage all relevant changed files first (never stage `.env*` or generated files)
- **Task file:** follow the lifecycle rule determined in Step 2:
  - Delete (`git rm`) if a PR/MR is already open → bullet: `` `.tasks/TICKET-ID.md`: removed — ticket work complete ``
  - Update (stage normally) if no PR/MR yet → bullet: `` `.tasks/TICKET-ID.md`: updated plan/notes ``
- **`Co-Authored-By` trailer:** follow whatever this repo's `CLAUDE.md` documents — don't assume either way.

**Multi-area changes:** when the commit touches 3+ independent problem areas, replace the bullet list with the Changes table from `.tasks/TICKET-ID.md` (if populated):

```
TICKET-ID - Summary

| Area | Problem solved | Implementation | Flag scope |
|---|---|---|---|
| Save blocked during drag | Save could fire mid-drag before position committed | added a dragging guard to the disable-save check | Both |
| Abort stale in-flight requests | Old requests could overwrite newer state | added an AbortController, swallow abort errors | Flag on only |
```

### Step 4: Quality Gate — Lint + Type-Check + Unit Tests + Component Tests + Build

None of these need each other's output — each only needs the code as it currently stands (see "Independent Verification Fan-Out" in `CLAUDE.md`'s Agent Orchestration section) — so run all of them **in parallel**, substituting this project's actual package-manager scripts. All must pass.

```bash
<package-manager> --filter <package-name> lint &
<package-manager> --filter <package-name> typecheck &
<package-manager> --filter <package-name> test:unit &
<package-manager> --filter <package-name> test-ct &
<package-manager> --filter <package-name> build &
wait
```

If a script doesn't exist for this package, check `package.json` first rather than assuming — skip only what's genuinely absent.

Also run any root-level cross-package check this project defines (e.g. a monorepo-wide lint) before pushing, to catch cross-package issues a package-scoped run would miss.

If diagnosing a failure from one of these needs real interpretation (not just re-running with `--fix`) and this project's setup makes a second agent practical, that diagnosis can be delegated — but it comes back as a finding for you to act on, not as an independent fix committed to the same files you're already working in.

**Lint failures:** fix errors (or use the project's auto-fix flag), re-stage, and rerun.

**Unit test failures:** diagnose and fix — a failure here means the logic is broken, not the test.

**Component test failures:** diagnose and fix before committing. Do not skip failing tests.

**A test type not runnable locally** (missing browser binary, platform issue): note in the commit message that it will be validated in CI — don't silently skip it without saying so.

**Never bypass a pre-commit hook** (`--no-verify` or equivalent) as a default move. Only skip a hook when this repo's `CLAUDE.md` documents that hook as currently broken/known-bad, and say so explicitly in your output — silently bypassing hooks hides exactly the kind of failure they exist to catch.

**Quick Bail-Out Rules** — don't proceed to Step 5 (commit) if any of these are true:

| Condition | Action |
|---|---|
| Lint has errors | Fix (or auto-fix) and rerun before continuing |
| Type-check has new errors (pre-existing ones are fine) | Fix before committing |
| A code-quality MCP (if configured) reports blocker/critical issues in lines you authored | Fix before committing |
| Unit or component tests fail | Diagnose and fix the root cause — never skip or delete a failing test |
| A test type genuinely can't run locally (missing browser binary, platform gap) | Note it explicitly in the commit message as CI-validated — don't silently skip |

---

### Step 5: PR/MR — Create or Update

Skip this step silently if the branch is `trivial/` (no ticket ID).

**Check for an open PR/MR** using the host-detection approach from [`pr-update`](./pr-update.md) Step 2 (`gh`/`glab`/`az repos`/Bitbucket, based on the git remote).

**If an open PR/MR exists** → ask the user:

> Commit created. Run `/pr-update` to append these changes to the PR/MR description?

**If none exists** → ask the user:

> No open PR/MR found for this branch. Create one now?

If the user confirms, build the description before creating it:

1. Start from the commit message body.
2. Check for new test spec files: `git diff --name-only --diff-filter=A | grep -E '\.spec\.(ts|tsx|js)$'`
3. If new spec files exist, append a **New tests** section listing each spec file and its test case names (e.g. `grep -h "test(\|it("  <spec-files>`).

Example description shape:

```markdown
- What changed and why (from commit body)

## New tests

| Spec | Cases |
|---|---|
| `src/utils/formatDate.spec.ts` | returns null for undefined, formats known range, is timezone-safe |
```

Then create it via the appropriate host CLI:

```bash
# GitHub
gh pr create --title "TICKET-ID - <commit summary>" --body-file /tmp/pr_desc.md --base <base-branch>

# GitLab
glab mr create --title "TICKET-ID - <commit summary>" --description "$(cat /tmp/pr_desc.md)" --target-branch <base-branch>

# Azure DevOps
az repos pr create \
  --org https://dev.azure.com/<org> \
  --title "TICKET-ID - <commit summary>" \
  --description "$(cat /tmp/pr_desc.md)" \
  --source-branch <current-branch> \
  --target-branch <base-branch> \
  --detect false \
  --output table

# Bitbucket (REST API — no dedicated CLI)
curl -s -u "<user>:<app-password>" -X POST \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg title "TICKET-ID - <commit summary>" --rawfile desc /tmp/pr_desc.md --arg src "<current-branch>" --arg dst "<base-branch>" \
    '{title: $title, description: $desc, source: {branch: {name: $src}}, destination: {branch: {name: $dst}}}')" \
  "https://api.bitbucket.org/2.0/repositories/<workspace>/<repo>/pullrequests"
```

After creating, ask the user:

> PR/MR created. Run `/pr-update` next time you add commits to this branch, to keep the description in sync?
