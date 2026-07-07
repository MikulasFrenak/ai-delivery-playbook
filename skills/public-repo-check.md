---
name: public-repo-check
disable-model-invocation: true
description: Scans the working tree and git history for anything unsafe to publish to a public repository — secrets, tokens, internal hostnames, cloud/tenant UUIDs, and company- or project-specific naming. Run before pushing new content to a public remote, or before flipping a repo from private to public. NEVER auto-invoke — only run when user explicitly types /public-repo-check.
---

# public-repo-check — Pre-Publish Sanitization Scan

## Overview

Run this before pushing to a public remote. It's a **report-only** skill — it never edits, redacts, or rewrites anything automatically. Some matches are false positives that need human judgment, and removing something already pushed requires rewriting git history, which is destructive and affects anyone who already cloned the repo. That decision belongs to the user, not to this skill.

It scans two things, separately, because they carry very different risk:
1. **Working tree + staged changes** — what would go out on the *next* push
2. **Full git history** — what's *already* exposed if the repo has ever been pushed, even if the sensitive content was later deleted from the working tree

---

## Workflow

### Step 1: Confirm Scope

Ask if not already clear from context:
- Whole repo, or a specific subpath?
- Working tree only (fast, right before a single push), or full history too (slower, needed before a repo's first-ever public push or before making an existing private repo public)?

### Step 2: Build the Denylist

**Universal patterns** — always check for these regardless of project:
- Email addresses
- API keys / tokens — common vendor shapes (e.g. `AKIA[0-9A-Z]{16}`, `ghp_`/`gho_` GitHub tokens, `xox[baprs]-` Slack tokens) plus generic `key=`/`token=`/`secret=`/`password=` assignments with a real-looking value (not a placeholder like `<token>` or `YOUR_KEY_HERE`)
- Private-key blocks (`-----BEGIN ... PRIVATE KEY-----`)
- UUIDs — cloud/tenant/resource IDs are almost always UUID-shaped (`[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`)
- Internal-looking hostnames/IPs — anything other than `localhost`/`127.0.0.1`/`0.0.0.0`, and any domain suffix like `.internal`, `.corp`, `.local`
- Personal file-system paths (`/Users/<name>/`, `/home/<name>/`, `C:\Users\<name>\`)
- `.env`, `.pem`, `*credentials*`, `*.key`, or similar secret-shaped files tracked in git

**Project-specific terms** — ask the user: _"Any company name, internal project codename, product prefix, or ticket-ID prefix that should never appear in this public repo?"_ Check this repo's `CLAUDE.md` for an existing "Public Repo Hygiene" section — reuse whatever pattern/placeholder convention it documents rather than inventing a new one.

### Step 3: Scan Working Tree + Staged Changes

Run each denylist pattern with `grep -rn` (or `rg`) across tracked and staged files, excluding `.git/`. For project-specific terms, do a plain case-insensitive substring search. Record every match as `file:line`.

### Step 4: Scan Git History (only if in scope per Step 1)

```bash
git log --all -p | grep -niE '<pattern>'      # per denylist pattern, across all history
git log --all --diff-filter=A --name-only     # catch odd binary/config files ever added
```

**If a match exists only in history** (already removed from the working tree), flag it as still exposed — anyone can `git log -p` a public repo. Fixing this needs history rewriting (`git filter-repo`, BFG, or similar) followed by a force-push, which breaks every existing clone and is irreversible for anyone who already has the old history. **Do not perform a history rewrite as part of this skill.** Report the finding and let the user decide whether and how to act on it.

### Step 5: Report

For each finding: file/commit, the match, its category (secret / PII / cloud-resource-ID / company-specific-naming / other), and a suggested next step:
- **Working-tree match** — redact or replace with a placeholder before committing
- **History-only match** — needs an explicit, separate decision about history rewriting; do not treat this the same as a working-tree fix
- **Ambiguous match** (e.g. a UUID that's actually a public test fixture) — call it out as needing human judgment rather than guessing

If nothing is found, say so plainly rather than implying a guarantee — a pattern-based scan reduces risk, it doesn't prove the repo is clean.
