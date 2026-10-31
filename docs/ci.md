# CI: checks, a testing deploy per PR, the real deploy, PR hygiene, Claude review

This repo's own GitHub Actions, set up with [`/github-actions-setup`](../skills/github-actions-setup.md) (AIPB-26). What
runs when:

| Event | What runs | Workflow |
|---|---|---|
| A PR to `main` is opened or updated | **MCP tests, skill rules, links:** both MCP server smoke tests, then `.github/scripts/check-docs.mjs`. It checks every skill's frontmatter, every skill's registration in `AGENTS.md` and `architecture.md` (`CONTRIBUTING.md` → "Register it in three places"), and every relative link. | `ci.yml` |
| …then, for a PR from this repo | **Testing deploy:** the checked bundle goes up as a preview version of the MCP server at the PR's own address, `https://pr-<n>-ai-delivery-playbook.<subdomain>.workers.dev/mcp`, and one MCP call checks it answers. The real server isn't touched. | `ci.yml` |
| A PR to `main` is opened, edited, updated or (un)labelled | **Description, tests, ticket:** the PR's paperwork (below). | `pr-hygiene.yml` |
| A push to `main` (a merged PR) | The same check, then **Deploy to the real server** (`https://ai-delivery-playbook.mikulas-frenak.workers.dev/mcp`) and the same MCP call against it. A failing check deploys nothing. | `ci.yml` |
| A push to `main` | **Notify review-spa**, so its case-study numbers follow this repo. | `notify-review-spa.yml` |
| The `claude-review` label is added to a PR from this repo | **Claude review:** read-only, posted as inline comments and a summary. | `claude-review.yml` |

Fork PRs get the check and hygiene, but no testing deploy or review: GitHub gives them no secrets, and their code
shouldn't reach a deploy.

## Run the checks locally

```bash
node mcp-server/test.js
(cd mcp-server/remote && node build.js && node test.js)
node .github/scripts/check-docs.mjs && node --test .github/scripts/check-docs.test.mjs
```

## PR hygiene

It lists every problem at once, in the job's summary:

- **Ticket:** the title starts like a commit, `AIPB-<n> - Summary` or `TRIVIAL - Summary`. With a ticket, the branch
  names it (`chore/AIPB-<n>/…`) and `tasks/AIPB-<n>.md` exists at the PR's head. `TRIVIAL` goes on a `trivial/` branch.
- **Description:** about 100 characters or more, not counting HTML comments and the attribution line.
- **Tests:** a changed `mcp-server/**/*.js` or `.github/scripts/*` file needs a changed test file (`test.js`,
  `*.test.mjs`) in the same PR, unless the `no-tests-needed` label is on and the description says why. Docs-only PRs
  pass.

## The testing deploy and the real one

- **Testing:** `wrangler versions upload --preview-alias pr-<n>` from the PR's checked bundle. Each push to the PR
  replaces its version at the same address. It needs the worker's **Preview URLs** on, which `preview_urls = true` in
  `mcp-server/remote/wrangler.toml` sets. The address is in the job summary and on the PR's **testing** environment.
- **Real:** `wrangler deploy` of the checked bundle, one deploy at a time, after every merge to `main`.
- **Manual deploys still work** (`mcp-server/remote/README.md`), as an escape hatch.
- **If a deploy fails**, read the job log before changing anything:
  - an empty `CLOUDFLARE_API_TOKEN:` means the secret isn't set;
  - `6111` means the stored value isn't the bare token;
  - an authentication error means the token lacks Workers Scripts · Edit.

  Then re-run the failed job.

## One-time setup (repo admin)

Each step is typed in your own terminal, so no token passes through chat. Secrets are per repo, so these are this
repo's own, even if another repo has the same names.

1. **A Cloudflare token for the deploys.** On dash.cloudflare.com: My Profile → API Tokens → **Create Token** → Custom
   token. Name it after this repo, and set **Account → Workers Scripts → Edit**, for your account. It's shown once,
   so keep the page open. Never roll a token another project uses. Start this line, then click the token's copy
   button: it checks the token against this worker before saving it. `<account-id>` is what `wrangler whoami` prints.
   ```bash
   echo "Waiting up to 2 minutes: click the token's copy button now..."; for i in $(seq 120); do T="$(pbpaste | tr -d '[:space:]')"; [[ "$T" =~ ^[A-Za-z0-9_-]{30,}$ ]] && break; T=""; sleep 1; done; if [ -z "$T" ]; then echo "No token appeared on the clipboard."; else R="$(curl -s "https://api.cloudflare.com/client/v4/accounts/<account-id>/workers/scripts/ai-delivery-playbook/settings" -H "Authorization: Bearer $T")"; if echo "$R" | grep -q '"success": *true'; then printf %s "$T" | gh secret set CLOUDFLARE_API_TOKEN --repo MikulasFrenak/ai-delivery-playbook && echo "Token works and is saved."; else echo "Cloudflare said:"; echo "$R" | head -c 400; echo; fi; fi; unset T R; printf '' | pbcopy
   ```
   ```bash
   gh secret set CLOUDFLARE_ACCOUNT_ID --repo MikulasFrenak/ai-delivery-playbook
   ```
2. **The Claude token for the review.** Run `claude setup-token`. Its browser page shows a one-time code: paste that
   back into the terminal, which then prints the token (`sk-ant-…`). Copy the token, then run this from a Run button
   or type it, since copying the command would replace the token on the clipboard:
   ```bash
   T="$(pbpaste | tr -d '[:space:]')"; case "$T" in sk-ant-*) printf %s "$T" | gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo MikulasFrenak/ai-delivery-playbook && echo "Saved a ${#T}-character token." && printf '' | pbcopy;; *) echo "The clipboard doesn't hold a Claude token. Nothing saved.";; esac; unset T
   ```
3. **The labels:**
   ```bash
   gh label create claude-review --description "Ask Claude for a read-only code review" --color 5319e7 --repo MikulasFrenak/ai-delivery-playbook
   ```
   ```bash
   gh label create no-tests-needed --description "Source changed without test changes, on purpose (say why)" --color c5def5 --repo MikulasFrenak/ai-delivery-playbook
   ```
4. **After the first CI deploy works, turn off Cloudflare's Git build** for the worker: Workers & Pages →
   ai-delivery-playbook → Settings → Build → disconnect the repository. Until then, every push deploys twice. That's
   harmless, since both upload the same `main`, but the Git build doesn't wait for the checks.
5. **Optional, free on a public repo:**
   - Settings → Branches → require **MCP tests, skill rules, links** and **Description, tests, ticket** before
     merging.
   - Settings → General → **Automatically delete head branches**.

## The Claude review

Add the `claude-review` label; remove and re-add it for another pass. It reads `AGENTS.md`, `CONTRIBUTING.md`, the task
file and the diff, and looks for:

- contradictions between skills;
- stale step numbers and cross-references;
- unsourced claims;
- vocabulary drift;
- anything unsafe to publish;
- bugs in code.

It posts with the `[Must]/[Low]/[Nit]/[Question]` tags and a verdict. It can't push, approve, label or merge. Each run is
a paid session, so it runs only when asked.

If it fails within seconds at `$0`, the credential was refused. Store it again as in step 2.
