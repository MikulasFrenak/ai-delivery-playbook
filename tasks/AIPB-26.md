# AIPB-26 — This repo's own CI: checks, a testing deploy per PR, the real deploy on merge

**Ticket:** self-assigned (solo repo, no external tracker — see AGENTS.md "Ticket IDs for solo/no-tracker projects")
**Type:** Chore
**Status:** open
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

- [ ] Every PR runs both MCP smoke tests and `.github/scripts/check-docs.mjs`: skill frontmatter, registration in
      `AGENTS.md` and `architecture.md`, relative links. The check has tests that plant each mistake.
- [ ] Every PR from this repo gets a testing deploy: the checked bundle as a preview version at
      `pr-<n>-ai-delivery-playbook.<subdomain>.workers.dev`, smoke-tested with one MCP call, and the real server untouched.
- [ ] A merge to `main` deploys the checked bundle to the real server and smoke-tests it; a failing check deploys
      nothing.
- [ ] PR hygiene (AIPB IDs, branch, task file, description, tests for `mcp-server/` and `.github/scripts/` source) and
      the label-triggered Claude review run, the review for same-repo PRs only.
- [ ] `docs/ci.md` says what runs when and gives the one-time setup; the server README, `docs/deployment.md` and
      `lifecycle/release.md` describe the new deploy shape; the skill has the testing-deploy step.

## Plan

- [ ] `.github/workflows/ci.yml`, `pr-hygiene.yml`, `claude-review.yml`; `.github/scripts/check-docs.mjs` (+ tests),
      `smoke-test.sh`; `preview_urls = true`.
- [ ] Docs as above; Updated-by on AIPB-12 and AIPB-24; `PLAN.md`.
- [ ] `/public-repo-check`; PR; its own runs; close-out.

## Files to Touch

| File | Change |
|---|---|
| `.github/workflows/ci.yml`, `pr-hygiene.yml`, `claude-review.yml` | new |
| `.github/scripts/check-docs.mjs`, `check-docs.test.mjs`, `smoke-test.sh` | new |
| `mcp-server/remote/wrangler.toml`, `mcp-server/remote/README.md` | preview URLs; the deploy now from CI |
| `docs/ci.md` (new), `docs/deployment.md`, `lifecycle/release.md` | what runs when; the two deploy shapes |
| `skills/github-actions-setup.md` | Step 4b, a testing deploy per PR |
| `AGENTS.md`, `CONTRIBUTING.md`, `PLAN.md`, `tasks/AIPB-12.md`, `tasks/AIPB-24.md` | layout, PR checks, status, Updated by |

## Open Questions

- **The testing and production deploys need this repo's own Cloudflare and Claude secrets.** Until the owner stores
  them (`docs/ci.md`), the testing job on this PR goes red; a re-run after storing them proves it.

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
