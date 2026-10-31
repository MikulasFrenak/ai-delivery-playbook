# Worked Example: AIPB-24 — `/github-actions-setup`, first real adoption

**Task file:** [tasks/AIPB-24.md](../tasks/AIPB-24.md) — what the skill is and why. This page is how its first real
run went. [AIPB-25](../tasks/AIPB-25.md) wrote it up and carried its lessons back into the skill.

**Trigger:** A solo web project had no PR checks and deployed by hand, and a merged fix had sat undeployed for hours.
The project is private: Vite + TypeScript, Cloudflare Pages by direct upload, the whole site behind a shared password
checked by a Pages Function. The setup was done in one session with an agent, then generalized into the skill (AIPB-24).
The first merges and the first AI review ran the next morning.

**Workflow:** none of the delivery workflows. This is a one-time setup per repo.

## Trace

1. **Inventory, then one decision.** The agent read the package scripts, the deploy script and how the host was set
   up. It chose a CI-driven artifact deploy (Step 2's option a) over switching to the host's Git integration: the
   project already existed by direct upload, and the tests should gate the deploy. The AI review was on a label, for
   the budget. E2E stayed local, because it reads gitignored photos.
2. **The PR that added the workflows proved two of the four jobs.** The check job (type-check, 942 unit and 47 browser
   tests, build) and the hygiene check passed on that PR's own runs. The hygiene patterns had first been tried on real
   paths and titles with `node -e`. The deploy and the review stayed unticked, since neither can run on a PR. A later
   `trivial/` PR passed the hygiene check's TRIVIAL path too.
3. **The first merge's deploy failed three times, each for a different reason. Each one is now a rule in the skill:**
   - **It ran before the secrets existed.** The merge happened before the person had stored the deploy secrets, and
     the log showed `CLOUDFLARE_API_TOKEN:` empty. This was expected and warned about. The useful habit was reading the
     log before changing anything.
   - **A malformed token.** The token, pasted at `gh secret set`'s prompt, was stored unusable: Cloudflare answered
     `6111` "Invalid format for Authorization header". The dashboard no longer showed the token (it shows a new one
     once), and **Roll** was one click away on tokens other projects used. Instead: a new dedicated token, stored by a
     one-liner that waits for a token-shaped value on the clipboard, checks it against the exact endpoint the deploy
     calls, and stores it through stdin only if the host accepts it. Two traps on the way:
     - copying the command to run it replaced the token on the clipboard;
     - `gh` run outside the repo folder fails with "not a git repository", so always pass `--repo`.
   - **The app's own secret disappeared.** The deploy then went green, and the site answered `503` "Site password not
     configured.": the password Function failing closed. The deploy credentials had also been added to the Pages
     project's runtime secrets, and the site password was gone from that list. The fix: set the password again, re-run
     the deploy job (a runtime secret applies from the next deployment), and delete the deploy credentials from the
     host. They stayed in GitHub.
4. **The AI review failed three times before it worked.** Every failed run stopped after one turn in about 2 seconds,
   with `total_cost_usd: 0` and an empty `modelUsage`: the credential was refused before any model call, and the action
   hides the message. The three causes, in order:
   - the token pasted at a prompt;
   - the clipboard holding the command instead of the token;
   - the **one-time code** the browser page shows during `claude setup-token`. That code is meant to be pasted back
     into the terminal, which then prints the real token: `sk-ant-…`, 108 characters.

   Stored with a check that the value starts with `sk-ant-`, the next run took about 40 seconds. It posted what the
   prompt asks for: a verdict, Verified / Must fix / Non-blocking / Not verified, and one `[Nit]` inline comment with
   the file, the evidence and a fix. The Nit was fair: the token one-liner was macOS-only.

   Two smaller findings:
   - A label added right after a push ran against the PR's *previous* head, because the PR took minutes to pick up the
     new commit.
   - `gh run rerun` replays a run with its original commit's workflow file.

   The switch that makes the action show its own message (`display_report`) was pushed but never ran, because of that
   lag. It's documented as untested.
5. **The lessons went back into the skill the same day**: the deploy ones in PR #50, the AI review ones and this page
   in AIPB-25. The rule about where secrets live is general, so it went into `AGENTS.md` as its own cross-cutting
   section, not only into this skill.

## What this run actually validated

- **Every failure was in the person's one-time setup; none was in the workflows.** The YAML ran as written. The fragile
  part of CI setup is moving secrets between dashboards, terminals and clipboards. That's why the skill now gives a
  check-then-store command rather than "run `gh secret set`", and why it says what each failure looks like.
- **Fail-closed paid off.** A password gate that answers `503` without its secret, rather than serving the site, turned
  a lost secret into a closed site instead of an exposed one. Worth copying: a gate whose configuration can go missing
  should close, not open.
- **Read the signal before changing anything.** Each failure had a one-read signal:
  - an empty env var or a host error code in the job log;
  - the site's own `503` message;
  - the `$0` result signature.

  What stayed hidden was the AI review's actual error, which is why the skill now says how to make the action show it.
- **The PR's own run proves only what can run on a PR.** Ticking the deploy when the setup PR passed would have
  recorded as done a job that then failed three times.
