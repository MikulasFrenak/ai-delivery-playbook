---
name: github-actions-setup
disable-model-invocation: true
description: Sets up GitHub Actions for a repo — a check job (type-check, tests, build) on every PR, a PR hygiene check (ticket ID with matching branch and task file, a real description, tests alongside changed source), a deploy-on-merge job that ships only the build the check passed, and an optional on-demand AI code review (label-triggered, read-only) — plus the docs and the one-time secret setup the person does themselves. NEVER auto-invoke — only run when user explicitly types /github-actions-setup.
---

# github-actions-setup — CI Checks, PR Hygiene, Deploy on Merge, On-Demand AI Review

## Overview

Run this when a repo on GitHub has no CI, or deploys by hand. It leaves the repo with:

- **A check on every PR**: type-check, lint, tests and the build, shown on the PR, so a red change is visible before merge.
- **A PR hygiene check**: the title carries the ticket ID (or `TRIVIAL`), the branch and the task file agree with it, the description says more than a title, and changed source comes with changed tests. It enforces in CI what [`commit`](./commit.md) and the task-file lifecycle in `AGENTS.md` already ask for.
- **A deploy on every merge to the production branch** that ships the *artifact the check built*, one deploy at a time. A red check deploys nothing.
- **Optionally, an AI review on request**: a label on the PR starts a read-only review that posts inline comments and a summary, written to the [`review-pr`](./review-pr.md) / [`review-comment-style`](./review-comment-style.md) rules.
- **A `docs/ci.md`** saying what runs when, and the one-time setup steps.

The deploy *shape* and the decisions it forces — build-time vs. runtime config, Git-connected builds and their failure modes — are in [`docs/deployment.md`](../docs/deployment.md). This skill is the GitHub Actions way to fill it in.

Not to be confused with Claude Code's `/install-github-app`. That one installs the Claude GitHub App and an `@claude` mention workflow. This skill builds the repo's own CI and deploy, and an opt-in review that needs no GitHub App.

---

## Inputs

- A repo whose `origin` is on GitHub, with `gh` authenticated (Step 0)
- The ticket ID, per this repo's conventions (`create-task`; for solo repos, `AGENTS.md` → Ticket IDs for solo/no-tracker projects)
- How the project deploys today, and where (Step 1 finds out; ask if it can't)

## Output

- `.github/workflows/ci.yml` and `.github/workflows/pr-hygiene.yml`, plus `.github/workflows/<ai>-review.yml` if chosen
- `docs/ci.md`, a pointer in the deploy doc, and a CI line in `AGENTS.md`
- A list of one-time setup steps (secrets, label, branch rule) for the person to run, and a PR whose own run tests the check job

---

## Guardrails

- **Never see or write a secret.** Name each secret and say how to create it. The person stores it with `gh secret set <NAME>`, which prompts for the value, so it never passes through chat, a file or shell history. Setting a secret, a label or a branch rule is the person's step, not yours.
- **Least privilege.** Use workflow-level `permissions: contents: read` and widen per job only where needed. A deploy token covers the one product it deploys to (e.g. a Pages-edit token, not an account-wide key).
- **Deploy only from the production branch, only what was checked.** The deploy job runs on `push` to that branch, `needs` the check, and uploads the check's artifact rather than building again. Never deploy from `pull_request` events. They also get no secrets from forks, which is GitHub's protection, not a bug to work around.
- **One deploy at a time.** The deploy job gets its own `concurrency` group with `cancel-in-progress: false`. PR runs may cancel superseded ones; runs on the production branch never do, or a merge would skip its deploy.
- **Don't re-platform the hosting to fit CI.** If the project deploys by direct upload, keep it, and deploy from CI with the same command. Switching to the host's Git integration (or back) is the person's decision. Say what it costs: on some hosts a new project, new secrets, and a lost URL.
- **Pin actions to their current major, looked up, not remembered:** `gh api repos/<owner>/<action>/releases/latest`. Examples in docs, this one included, go stale.
- **Leave out of CI what can't run there.** Tests that need gitignored fixtures, private data, devices or real cameras are excluded on purpose, and `docs/ci.md` says where they still run. They must not be "fixed" by committing the private data.
- **The AI review is opt-in and read-only.** Trigger it on a label by default, since every run is a paid session. Its tools are read-only plus "post a comment". It never pushes, approves, requests changes, merges or labels. State the cost model in `docs/ci.md`.
- **Never turn on auto-merge**, and never weaken an existing branch rule.
- **Verified vs. not verified.** The PR that adds the workflows proves only the check job. The deploy job is unproven until the first merge with the secrets in place, and the review until the label is used. Say so in the task file and the PR, and don't tick those criteria early.
- **No poll loops** on CI. Read a run's state once, or let the host or your tooling notify you.

---

## Workflow

### Step 0: Confirm GitHub and the CLI

1. `git remote get-url origin` must be a github.com (or GitHub Enterprise) URL. If it isn't, stop: GitLab CI, Azure Pipelines and Bitbucket Pipelines follow the same shape but different files. Say so rather than half-applying this skill.
2. `gh auth status` must list the **`workflow`** scope. Pushing files under `.github/workflows/` without it is rejected. The person adds it with `gh auth refresh -s workflow`.
3. `gh api repos/<owner>/<repo>/actions/permissions` should report Actions enabled.

### Step 1: Inventory (read, don't guess)

| Question | Where to look |
|---|---|
| Package manager and version | the lockfile, `packageManager` in `package.json`, `pyproject.toml`, … |
| Runtime version | `engines`, `.nvmrc`, `.node-version`, `.python-version`, … |
| Check commands: type-check, lint, each test type, build | the scripts in `package.json` / `Makefile` / task runner |
| Build output directory | the bundler config, or the host's config file (e.g. `pages_build_output_dir`) |
| Assets the build or tests download (models, fonts, fixtures) | setup scripts; cache them in CI, keyed on the script |
| Tests that need local-only data | gitignored folders the tests read; `skipIf` on missing data |
| How it deploys today | the deploy script, the host's dashboard/config: direct upload vs. Git integration, project name, production branch |
| Existing workflows | `.github/workflows/`; extend them rather than adding a parallel one |
| The deploy doc | `docs/deploy*.md` or the README section to update |

Run the check commands locally once, so you know they pass before CI runs them.

### Step 2: Decide with the person (recommend one)

- **Deploy model:**
  - **(a) CI-driven upload.** The deploy job runs the host's CLI with an API token. It keeps the existing project, and the tests gate the deploy. Recommended when a project already exists, or when the tests must gate the deploy.
  - **(b) The host's Git integration.** The host builds on push. Simplest for a fresh project, but its builds don't run your tests. See `docs/deployment.md` → Git-connected builds for its failure modes.
  - **(c) No auto-deploy**, checks only.
- **AI review:** none / on a label (default) / on every PR (state the cost). Which model: the mid-priced one, unless the repo's routing rules say otherwise.
- **Branch rule** ("require the check before merging"): recommend it. Private repos get it on paid plans only. Without it a red check still blocks the deploy, but not the merge.

### Step 3: Write `ci.yml`

Fill in the `<...>` from Step 1. Drop the cache step if there's nothing to download.

```yaml
# Checks every PR to <prod-branch>; a push to <prod-branch> (a merged PR) is checked the same way, then deployed.
name: CI

on:
  pull_request:
    branches: [<prod-branch>]
  push:
    branches: [<prod-branch>]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  # A new push to a PR replaces its running check; runs on <prod-branch> always finish, so each merge deploys.
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  check:
    name: Type-check, tests, build
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@<major>
      - <set up the package manager and runtime, with its dependency cache>
      - run: <install, frozen lockfile>
      - name: Cache downloaded assets
        uses: actions/cache@<major>
        with:
          path: <downloaded file or folder>
          key: assets-${{ hashFiles('<the script that downloads them>') }}
      - run: <download step, if any>
      - run: <type-check>
      - run: <lint>
      - run: <unit tests>
      - run: <other test types that can run here — leave out the local-only ones>
      - run: <build>
      - name: Keep the checked build for the deploy
        if: github.event_name == 'push'
        uses: actions/upload-artifact@<major>
        with:
          name: build
          path: <build output dir>
          retention-days: 7

  deploy:
    name: Deploy
    needs: check
    if: github.event_name == 'push' && github.ref == 'refs/heads/<prod-branch>'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    concurrency:
      group: production-deploy
      cancel-in-progress: false
    environment:
      name: production
      url: <production URL>
    steps:
      - uses: actions/checkout@<major>
      - <set up the runtime and install, if the deploy CLI is a project dependency>
      - uses: actions/download-artifact@<major>
        with:
          name: build
          path: <build output dir>
      - name: Deploy
        run: <deploy command, Step 4>
        env:
          <SECRET_NAME>: ${{ secrets.<SECRET_NAME> }}
```

Notes:
- Node + pnpm: put `pnpm/action-setup` **before** `actions/setup-node` with `cache: pnpm`. It reads the version from `packageManager`.
- Artifacts are shared between jobs of the **same run** only, which is exactly what the deploy needs.
- GitHub creates the `production` environment on first use. It gives the deploy history a page, and environment rules (required reviewers, branch filters) if the person wants them later.

### Step 3b: Write `pr-hygiene.yml`

The hygiene check reads the PR, not the code, so it needs no install and runs in seconds. Keep it in its **own workflow**: its triggers include `edited` and `labeled`, and fixing a description shouldn't re-run the whole test suite.

Fill in the constants at the top from Step 1 and the repo's conventions. This uses the playbook's commit and title format, `TICKET-ID - Summary` or `TRIVIAL - Summary`; a repo with a different format changes `TITLE` and the messages.

```yaml
# Checks a PR's paperwork, not its code: the ticket in the title with a matching branch and task file, a real
# description, and tests alongside changed source. Its own workflow, so editing a description re-runs this alone.
name: PR hygiene

on:
  pull_request:
    branches: [<prod-branch>]
    types: [opened, edited, synchronize, reopened, labeled, unlabeled]

permissions:
  contents: read
  pull-requests: read

concurrency:
  group: pr-hygiene-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  hygiene:
    name: Description, tests, ticket
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/github-script@<major>
        with:
          script: |
            const TITLE = /^(<PREFIX>-\d+|TRIVIAL) - \S/;           // the commit format, with the repo's ticket prefix
            const TASK_FILE = (id) => `tasks/${id}.md`;              // per the repo's package layout
            const SOURCE = /^(src|lib)\/.*\.(ts|tsx)$/;            // what counts as source
            const TEST = /\.(test|spec)\.(ts|tsx)$|^e2e\//;        // what counts as a test
            const NOT_SOURCE = /__fixtures__|\.d\.ts$/;            // generated or fixture files
            const NO_TESTS_LABEL = "no-tests-needed";
            const MIN_DESCRIPTION = 100;

            const pr = context.payload.pull_request;
            const { owner, repo } = context.repo;
            const problems = [];

            const title = pr.title.match(TITLE);
            if (!title) {
              problems.push("**Title**: start it like a commit, `TICKET-ID - Summary` or `TRIVIAL - Summary`.");
            } else if (title[1] === "TRIVIAL") {
              if (!pr.head.ref.startsWith("trivial/")) problems.push("**Branch**: a TRIVIAL change goes on a `trivial/` branch.");
            } else {
              const id = title[1];
              if (!pr.head.ref.toLowerCase().includes(id.toLowerCase())) problems.push(`**Branch**: \`${pr.head.ref}\` doesn't name ${id}.`);
              try {
                await github.rest.repos.getContent({ owner, repo, path: TASK_FILE(id), ref: pr.head.sha });
              } catch {
                problems.push(`**Task file**: \`${TASK_FILE(id)}\` is missing.`);
              }
            }

            const body = (pr.body ?? "").replace(/<!--[\s\S]*?-->/g, "").trim();
            if (body.length < MIN_DESCRIPTION) problems.push("**Description**: say what changed, why, and how it was checked.");

            const files = await github.paginate(github.rest.pulls.listFiles, { owner, repo, pull_number: pr.number, per_page: 100 });
            const changed = files.filter((file) => file.status !== "removed").map((file) => file.filename);
            const sources = changed.filter((path) => SOURCE.test(path) && !TEST.test(path) && !NOT_SOURCE.test(path));
            const labels = pr.labels.map((label) => label.name);
            if (sources.length && !changed.some((path) => TEST.test(path)) && !labels.includes(NO_TESTS_LABEL)) {
              problems.push(`**Tests**: source changed with no test changes. Add or update tests, or add the \`${NO_TESTS_LABEL}\` label and say why.`);
            }

            await core.summary
              .addHeading("PR hygiene", 3)
              .addRaw(problems.length ? problems.map((problem) => `- ${problem}`).join("\n") : "Title, branch, task file, description and tests all check out.")
              .write();
            if (problems.length) core.setFailed(problems.join("\n"));
```

Notes:
- **Read the PR from `context.payload`**, never by interpolating `${{ github.event.pull_request.title }}` or the body into the script. Those are untrusted text, and interpolation makes them code.
- **List every problem at once**, so one push fixes them all, rather than failing on the first.
- **The tests rule is deliberately coarse:** "a source file changed, so a test file should too". It catches forgotten tests, not weak ones; quality is the reviewers' job. The opt-out label keeps it honest: the person says why in the description.
- **Before committing, run the patterns against a few real paths and titles** from the repo, e.g. with a short `node -e` script. A pattern that silently matches nothing passes every PR.
- **Strip any boilerplate the repo's PR descriptions always carry** (an attribution line, an empty template) before measuring the description, or it never fails.

### Step 4: The deploy step, per host

Check each command against the vendor's current docs before relying on it. CLIs change flags.

| Host | Deploy command (from the job) | Secrets | Token permission |
|---|---|---|---|
| Cloudflare Pages (direct upload) | `wrangler pages deploy <dir> --branch <prod-branch> --commit-hash "$GITHUB_SHA"` (project from `wrangler.toml` or `--project-name`) | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | Account → Cloudflare Pages → Edit |
| Cloudflare Workers | `wrangler deploy` | same two | Account → Workers Scripts → Edit (plus whatever bindings it deploys) |
| Vercel | `vercel pull --yes --environment=production`, `vercel build --prod`, `vercel deploy --prebuilt --prod` | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | a token scoped to the team |
| Netlify | `netlify deploy --prod --dir <dir>` | `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` | a personal access token |
| GitHub Pages | `actions/upload-pages-artifact` + `actions/deploy-pages` instead of a command | none | job `permissions: pages: write, id-token: write` |

Runtime secrets the app itself reads (a site password, API keys) stay in the host's secret store, not in GitHub. CI only needs the deploy credentials.

### Step 5: The AI review workflow (if chosen)

This uses `anthropics/claude-code-action`. Check its `action.yml` for current inputs before writing it. Another vendor's review action takes the same shape: label trigger, read-only tools, the prompt below.

```yaml
# A read-only AI code review of a PR, on request: add the `<label>` label (remove and re-add it for another pass).
name: AI review

on:
  pull_request:
    types: [labeled]

jobs:
  review:
    if: github.event.label.name == '<label>'
    runs-on: ubuntu-latest
    timeout-minutes: 20
    permissions:
      contents: read
      pull-requests: write
      issues: write
      id-token: write
    steps:
      - uses: actions/checkout@<major>
        with:
          fetch-depth: 0
      - uses: anthropics/claude-code-action@<major>
        with:
          # One of the two: a subscription token (`claude setup-token`) or an API key.
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          # Comments come from github-actions with the workflow's own token: no GitHub App needed.
          github_token: ${{ secrets.GITHUB_TOKEN }}
          prompt: |
            <the review prompt, below>
          claude_args: |
            --model <model-id>
            --max-turns 40
            --allowedTools "mcp__github_inline_comment__create_inline_comment,Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*),Bash(git log:*),Bash(git diff:*),Bash(git show:*),Read,Glob,Grep"
```

**The prompt** carries `review-pr`'s and `review-comment-style`'s rules, adapted to a bot that can't run a worktree:

1. Read the repo's `AGENTS.md` (or equivalent) and the PR's task file, if any.
2. Read the description and the existing comments, and don't repeat a point already raised.
3. Read the whole diff and the code around each change. Look for bugs, new logic without tests, broken repo rules, and docs or numbers that don't match the code.
4. Check every finding against the code and name the file and line. What the code can't show goes under "Not verified". The CI check runs the tests, so don't run them.
5. Post one inline comment per finding on a changed line: `**[Must] / [Low] / [Nit] / [Question] <imperative title>**`, the evidence, and a concrete fix (a `suggestion` block only for an exact few-line replacement). Under ~8 lines each. `[Must]` only for broken behaviour, security, lost data or a broken repo rule.
6. Finish with one summary comment: `### <AI> review: <Request changes | Approve with comment | Approve>`, then Verified / Must fix / Non-blocking / Not verified. A few real findings beat a long list.

It must say it is read-only: never push, approve, request changes, merge, label or edit.

### Step 6: Document it

- **`docs/ci.md`:**
  - a "what runs when" table (event → jobs → workflow);
  - what PR hygiene checks, the exact title format, which paths count as source and as tests, and the opt-out label;
  - the one-time setup (Step 7) as numbered steps;
  - the deploy: which artifact goes where, that manual deploys still work, what an auth failure means;
  - the review: how to trigger and re-run it, what it can and can't do, its cost model, how to switch it to every PR;
  - what stays local, and why.
- **The deploy doc:** one line saying a merge deploys, linking `docs/ci.md`.
- **`AGENTS.md`:** a CI line in the stack section, and `.github/workflows/` in the repo layout.
- **The task file:** an earlier ticket whose decision this changes (e.g. "deploys are manual") gets this ticket in its `**Updated by:**` line.

### Step 7: Hand the one-time setup to the person

List exact steps, in order:

1. **The deploy token:** where to click in the host's dashboard, and the exact permission. Then `gh secret set <NAME>` for each secret, one command per block.
2. **The labels:** `gh label create no-tests-needed --description "…" --color <hex>` for hygiene, and the review label if chosen.
3. **The AI credential** (one of the two), if the review was chosen.
4. **The branch rule (optional):** Settings → Branches → require the checks named in `ci.yml` and `pr-hygiene.yml`.

Without step 1 the first merge still runs the checks; the deploy job then fails on authentication and ships nothing. Say that, so a red deploy job isn't a surprise.

### Step 8: Open the PR and verify what can be verified

1. Open the PR. Its own runs are the first real test of the check job and the hygiene check. The PR must itself follow the title, branch, task-file and description rules. Read the results once; if one fails, fix the workflow on the same branch.
2. The task file and the PR tick only the check and hygiene criteria. The deploy and the review stay unticked, with "first runs on the first merge / first label".
3. After the person merges with the secrets in place, confirm the host shows a production deployment at the merge commit, and the site answers. A follow-up close-out can tick the deploy then.

---

## Project-specific section (fill in per repo)

| Question | Your answer |
|---|---|
| Production branch | e.g. `main` |
| Check commands | e.g. `pnpm run typecheck`, `pnpm test`, `pnpm run test:browser`, `pnpm run build` |
| PR title format and ticket prefix | e.g. `<PREFIX>-<n> - Summary` / `TRIVIAL - Summary` |
| Task-file path | e.g. `tasks/<ID>.md`, or `<package>/tasks/<ID>.md` in a monorepo |
| Source and test paths for hygiene | e.g. source `src/**/*.ts`; tests `*.test.ts`, `e2e/`; never source: fixtures, generated files |
| Build output | e.g. `dist/` (+ `functions/` for a Pages project) |
| Downloaded assets to cache | e.g. a model file fetched by a setup script |
| Tests that stay local, and why | e.g. E2E reading gitignored photos |
| Host, deploy model, project | e.g. Cloudflare Pages, direct upload, `<project-name>` |
| Deploy secrets | names only, never values |
| AI review trigger and model | e.g. label `ai-review`, the mid-priced model |
| Where the docs go | e.g. `docs/ci.md`, `docs/deploy.md` |
