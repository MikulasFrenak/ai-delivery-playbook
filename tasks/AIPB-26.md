# AIPB-26 — This repo's own CI: checks, a testing deploy per PR, the real deploy on merge

**Ticket:** self-assigned (solo repo, no external tracker — see AGENTS.md "Ticket IDs for solo/no-tracker projects")
**Type:** Chore
**Status:** done — [PR #52](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/52), closed 2026-10-31
**Source:** written at the time

---

## What & Why

PRs here get no checks. `CONTRIBUTING.md` warns that registering a skill in all three places is "easy to miss one",
and nothing catches a missed one or a dead link before merge. The MCP server deploys through Cloudflare's Git build,
which doesn't wait for its tests. And a change to the server can only be tried after it's live.

`/github-actions-setup` (AIPB-24) was run on this repo, with three decisions taken with the repo owner on 2026-10-31:

- **Checks:** the two MCP smoke tests, plus a docs check.
- **AI review:** on a label.
- **Deploy:** from CI after the checks, with a testing deploy at each PR's own address.

The testing deploy per PR was a new requirement, so it went into the skill as Step 4b.

## Acceptance Criteria

- [x] Every PR runs both MCP smoke tests and `.github/scripts/check-docs.mjs`: skill frontmatter, registration in
      `AGENTS.md` and `architecture.md`, relative links. The check has tests that plant each mistake.
- [x] Every PR from this repo gets a testing deploy: the checked bundle as a preview version at
      `pr-<n>-ai-delivery-playbook.<subdomain>.workers.dev`, smoke-tested with one MCP call, and the real server untouched.
      _PR #52's re-run on 2026-10-31, once the token was stored, uploaded version `d012c9a3` at
      `pr-52-ai-delivery-playbook…workers.dev`, and the smoke test got the skill back._
- [x] A merge to `main` deploys the checked bundle to the real server and smoke-tests it; a failing check deploys
      nothing.
      _PR #52's merge deployed version `37b67eb5` to the real server, and its smoke test passed (2026-10-31)._
- [ ] PR hygiene (AIPB IDs, branch, task file, description, tests for `mcp-server/` and `.github/scripts/` source) and
      the label-triggered Claude review run, the review for same-repo PRs only.
      _Hygiene passed on PR #52's own run; the review first runs when the label is used, after its secret is stored._
- [x] `docs/ci.md` says what runs when and gives the one-time setup; the server README, `docs/deployment.md` and
      `lifecycle/release.md` describe the new deploy shape; the skill has the testing-deploy step.

## What was built

Three workflows and two scripts. On every PR: MCP tests, a tested docs check and PR hygiene. On same-repo PRs: a testing
deploy at the PR's own `pr-<n>` address. On merge: the real deploy from GitHub Actions. On a label: the Claude review.
The skill gained Step 4b, a testing deploy per PR, from it.

## Open Questions — answers

- **This repo's secrets:** the owner's one-time step (`docs/ci.md`). The Cloudflare token was stored on 2026-10-31,
  and both deploys then ran. `CLOUDFLARE_ACCOUNT_ID` wasn't needed: wrangler found the account through the token.
  The review stays open until its secret is stored and the label is used.

## Architecture Notes

- **Preview versions, not a second worker.** `wrangler versions upload --preview-alias pr-<n>` gives each PR a stable
  address on the same worker, with no second project to create or clean up. Production keeps serving its active
  deployment until `wrangler deploy` on `main`.
- **One docs check, run as a script and tested.** The registration and link rules were prose in `CONTRIBUTING.md`. As a
  script they can fail a PR, and the tests prove each rule fires.
- **Same-repo guard on the testing deploy and the review.** This repo is public. A fork's PR gets no secrets, and its
  content shouldn't drive a deploy or a paid review.
- **Cloudflare's Git build is turned off only after the first CI deploy works** (`docs/ci.md` step 4). Until then both
  deploy the same `main`, which is harmless.
