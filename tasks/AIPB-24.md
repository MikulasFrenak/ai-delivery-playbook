# AIPB-24 — github-actions-setup skill: CI checks, PR hygiene, deploy on merge, on-demand AI review

**Ticket:** self-assigned (solo repo, no external tracker — see AGENTS.md "Ticket IDs for solo/no-tracker projects")
**Type:** Chore
**Status:** open

---

## What & Why

`lifecycle/release.md` names a gap: no merge/deploy skill, so the deploy after a merge happens by hand or through
whatever CI a project already has. On a solo web project (2026-10-30), a merged fix sat undeployed for hours, and PRs
showed no checks at all. That project then got GitHub Actions in one sitting:

- a check job (type-check, unit and browser tests, build) on every PR;
- a hygiene check on the PR's paperwork: the ticket ID in the title with a matching branch and task file, a real
  description, and tests alongside changed source;
- a deploy job on merge that uploads the build the check passed to the existing direct-upload hosting project;
- a label-triggered, read-only Claude review written to `review-pr`'s rules.

The setup has decisions worth making the same way next time (artifact deploy vs. the host's Git integration, the
secret handling, on-demand review for the budget) and pitfalls worth not rediscovering. This makes it a skill any
project on GitHub can run, with nothing from the source project in it.

**Approach:** one skill, `skills/github-actions-setup.md`, with templates for the three workflows, a deploy table per
host, and a Project-specific section like `review-pr`'s. It cites `docs/deployment.md` for the deploy shape instead of
pairing a new doc: the deploy-shape vocabulary already lives there, and this skill is the mechanical GitHub way to fill
it in. That doc gains one paragraph on artifact deploys from CI as the alternative to Git-connected builds.

**Naming:** `/github-actions-setup`, not `/ci-setup`. It is GitHub-specific on purpose (workflow files, `gh secret
set`, Actions concurrency, artifacts), and says so in Step 0 rather than half-applying to GitLab or Azure. It is not
Claude Code's `/install-github-app`, which installs the Claude GitHub App and an `@claude` workflow. The skill says so.

---

## Acceptance Criteria

- [ ] `skills/github-actions-setup.md` exists, with frontmatter per `CONTRIBUTING.md`, Guardrails, a numbered
      Workflow, templates for `ci.yml`, `pr-hygiene.yml` and the AI review, and a Project-specific section.
- [ ] It never has the agent see or store a secret: the person runs `gh secret set` themselves.
- [ ] It's tool- and project-agnostic: no names, URLs, account IDs or ticket prefixes from the source project
      (`/public-repo-check` clean).
- [ ] Registered in `architecture.md`'s Level 1 list and `AGENTS.md`'s skills table; `lifecycle/release.md`'s Skills
      used and Gap updated; `docs/deployment.md` points to it.
- [ ] The templates match a setup that ran: the check job and the hygiene check passed on the source project's own PR.

---

## Plan

- [ ] Write the skill from the source project's workflows, generalized.
- [ ] Register it, and update `lifecycle/release.md`, `docs/deployment.md`, `PLAN.md`.
- [ ] `/public-repo-check` on the diff; PR; close-out and `tasks/README.md` row.

---

## Files to Touch

| File | Change |
|---|---|
| `skills/github-actions-setup.md` | new |
| `architecture.md`, `AGENTS.md` | registration |
| `lifecycle/release.md`, `docs/deployment.md` | Skills used, Gap; artifact-deploy paragraph |
| `PLAN.md`, `tasks/README.md` | status, index |

---

## Open Questions

- The source project's deploy job and AI review hadn't run yet when this was written: both first run on its first
  merge with the secrets in place. The templates are copied from files that passed `yaml` parsing and, for the check
  job and the hygiene check, a real run.

---

## Architecture Notes

- **Artifact deploy from CI is the recommended default for an existing project**, not the host's Git integration. The
  tests gate the deploy, the project stays as it is, and `docs/deployment.md`'s two Git-build failure modes can't
  happen. A fresh project can still choose the Git integration; the skill makes it a decision, not a default.
- **Hygiene is its own workflow.** It triggers on `edited` and `labeled`, and fixing a description shouldn't re-run the
  test suite.
- **The AI review is opt-in by label**, because each run is a full paid session; every-PR is one line away and the
  skill says how.
- **Action versions are looked up, not written in.** The templates say `@<major>` and Step 3 says how to find the
  current one; pinned numbers in a playbook would be stale within months.
