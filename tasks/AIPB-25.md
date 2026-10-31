# AIPB-25 — Trace github-actions-setup's first adoption; carry its lessons into the skills

**Ticket:** self-assigned (solo repo, no external tracker — see AGENTS.md "Ticket IDs for solo/no-tracker projects")
**Type:** Chore
**Status:** open
**Source:** written at the time

---

## What & Why

`/github-actions-setup` (AIPB-24) ran for real on 2026-10-30/31 in a private solo web project. All four of its jobs
ended up working, but only after six failures, all of them in the person's one-time secret setup:

- the deploy ran before the secrets existed;
- a token was stored malformed from a paste prompt;
- the app's own runtime secret was lost on the host;
- the AI review's credential was refused three times: a paste, the clipboard holding the command, then a one-time
  OAuth code instead of the token.

PR #50 carried the deploy lessons back. What's still only in that session: the AI review's credential and failure
signature, the general rules for secrets a person stores, two review mechanics learned while reviewing its PR, and the
run itself. The playbook's place for "how a run went and what it proved" is `examples/`.

## Acceptance Criteria

- [ ] `examples/AIPB-24.md` traces the adoption, and the AIPB-24 task file links it (`**Worked example:**`) both ways.
      No names, IDs or URLs from the source project.
- [ ] `skills/github-actions-setup.md` covers the AI review credential:
      - one credential, not both;
      - `claude setup-token`'s code vs. its token;
      - a shape-checked store;
      - the refused-credential signature (`is_error`, one turn, `$0`);
      - how to see the hidden message;
      - how a re-run picks up (or doesn't pick up) a workflow change.
- [ ] `AGENTS.md` has a tool-agnostic section on secrets a person stores: who stores them, clipboard-check-stdin over a
      paste prompt, what's being copied, one store per reader, explicit targets.
- [ ] `review-pr` and `review-comment-style` carry the three review mechanics: inline comments only on diff lines, an
      author can only Comment on their own PR, and no links to generated folders in a review worktree.

## Plan

- [ ] Write the example; link it from the AIPB-24 task file, the skill and `tasks/README.md`.
- [ ] Skill, `AGENTS.md`, `review-pr`, `review-comment-style`; `PLAN.md`.
- [ ] `/public-repo-check` on the diff; PR; close-out.

## Files to Touch

| File | Change |
|---|---|
| `examples/AIPB-24.md` | new |
| `skills/github-actions-setup.md`, `skills/review-pr.md`, `skills/review-comment-style.md` | lessons |
| `AGENTS.md` | Secrets a person stores |
| `tasks/AIPB-24.md`, `tasks/README.md`, `PLAN.md` | links, status |

## Open Questions

_(none)_

## Architecture Notes

- **The secrets rules go in `AGENTS.md`, not only the skill.** They hold for any "paste your secret" step, not only
  GitHub Actions. The skill keeps the ready one-liners and links back.
- **The example is named after AIPB-24**, the ticket whose skill ran, as examples are, and written by AIPB-25.
- **`display_report` is documented as untested:** it was pushed during the run, but the PR hadn't picked it up when
  the review finally worked.
