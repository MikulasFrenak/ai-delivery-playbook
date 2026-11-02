# The mobile agent loop: tests, simulator and API checks from chat

What an agent can do for a mobile change from its chat, one step at a time, and what broke. Written from one real run
(AIPB-27) on a React Native project, iOS simulator, macOS. Tool-agnostic where it can be: the commands are the host's, not
the agent's.

Each step says **proven** (run in that session) or **not yet proven**. The not-yet-proven list at the end is the work a
future `verify-mobile` skill would have to do first. `/verify-browser` covers web; this page covers what it doesn't.

## The loop

| Step | What the agent does | Status |
|---|---|---|
| 1. Task | Reads the ticket in the tracker, plans in a task file, branches | proven |
| 2. Change | Edits files, commits | proven |
| 3. Verify in code | Tests, lint and types in a throwaway worktree | proven |
| 4. Verify in the app | Boots the simulator, starts the bundler, launches the app | partly proven (see below) |
| 5. Verify the API | Reuses a request copied from the network inspector | proven |
| 6. Review | Reads a PR, runs its checks in a worktree, drafts comments | proven |
| 7. Ship | Opens the PR, requests reviewers, comments on the ticket | proven |
| 8. Drive the UI and compare with the design | Taps through the new screens, screenshots, compares with the design tool | **not yet proven** |

Two rules held throughout. Reads are free; **every write to a shared system asks first** (a push, a PR, a review request, a
tracker comment). And **no secret is printed**: values are read from a file into a variable and never echoed.

## Tests, lint and types in a throwaway worktree

For a PR (or any ref) the agent checks out a second working tree, so the user's branch and uncommitted work stay as they are.

```bash
git fetch origin '+refs/pull/<n>/head:refs/remotes/origin/pr-<n>-head'
git worktree add --detach /tmp/pr-wt origin/pr-<n>-head
ln -s "$PWD/node_modules" /tmp/pr-wt/node_modules        # no second install
cd /tmp/pr-wt
TZ=UTC npx jest --watchman=false --maxWorkers=2 --silent <paths of the changed code>
npx eslint <changed files>
npx tsc --noEmit                                         # report only errors in changed files
cd - && git worktree remove --force /tmp/pr-wt && git worktree prune
```

**Proven.** Notes from the run:

- **Call the binary, not a package script.** A script such as `pnpm run <generate>` in a worktree whose `node_modules` is a
  symlink stopped and asked to purge `node_modules`. It was killed without confirming. Run `npx <tool>` directly.
- Pin the time zone (`TZ=UTC`) and turn the file watcher off, or snapshot and date tests differ from CI.
- A whole-project `tsc` has errors that aren't the change's. Report only the ones in the changed files, and say so.
- Remove the worktree and temp files when done.

## The simulator, from chat

`xcrun simctl` is the agent's handle on the iOS simulator.

```bash
xcrun simctl list devices booted            # what is running; empty = nothing is booted
xcrun simctl list devices | grep -E 'iOS|<model>'
xcrun simctl listapps booted                # bundle ids of installed apps
xcrun simctl terminate booted <bundle-id>
xcrun simctl launch booted <bundle-id>
```

- **A black Simulator window with a device "booted" in its title is usually a device that isn't booted.** `simctl list
  devices booted` shows it. This was seen and diagnosed; the fix (`shutdown all`, restart the service, `boot <udid>`,
  `erase` as the last resort because it deletes the app and its login) was **not yet proven**.
- **Several devices of the same model can exist** across runtimes. Say which one, by identifier.
- **Bundler and inspector order matters** (proven). The app connects to the network inspector when it starts, so open the
  inspector first, then start the bundler with a clean cache, then start or relaunch the app. A stale bundler cache kept the
  app on its own `fetch`, so the inspector showed zero connections and no requests; a clean-cache start and a relaunch
  brought the connections up.

## Android emulator, from chat

**Not yet proven.** The project's own how-to describes `adb reverse` for the inspector and bundler ports, and one trap: an
emulator started from a terminal with the corporate proxy variables set can't reach the bundler, so the app falls back to its
embedded bundle. Starting it with those variables unset fixed it. This run didn't use Android Studio or the emulator.

## API checks from a copied request

The network inspector shows the real headers the app sends. Its "copy as cURL" gives an agent a working call without any
secret passing through chat.

1. The user copies the request in the inspector.
2. A small script reads the clipboard and writes a local, git-ignored environment file (mode `0600`) for the API client
   (here, Bruno). It keeps hand-edited variables on a rerun and adds missing ones as `<FILL_IN>`.
3. The agent reads values from that file into shell variables and sends **read-only** requests, one variable changed at a
   time, through the corporate proxy if one is needed (`curl --noproxy '' -x <proxy>`).

**Proven.** The runs showed things a test file alone wouldn't have:

- Seven endpoints ignored an optional session header whether it was valid, absent, empty or invalid. A "missing header"
  test there would have been a test that always failed, or one that always passed.
- A missing required header gave 400, not the 401 an earlier test accepted as "400 or 401". A test that accepts a list of
  statuses hides a changed one, so one test asserts one status.
- The auth token expired after about an hour. Check its expiry (decode the payload, print only `exp`) before a run, not after
  a wave of 401s.

## Review, PR and tracker

All **proven**, and covered by skills: [`/review-pr`](../skills/review-pr.md) and
[`/review-comment-style`](../skills/review-comment-style.md) for reviews, the host CLI for opening a PR and requesting
reviewers. Reading a tracker work item and its comments through its MCP server worked; a comment is only added after the
user approves the text.

## Lessons

| Symptom | Cause | What to do |
|---|---|---|
| A package script in a worktree asks to purge `node_modules` | The worktree's `node_modules` is a symlink | Kill it, answer nothing, call the tool's binary directly |
| A secret appeared in the chat | A `sed` filter with `\s` did nothing: BSD `sed` on macOS has no `\s` | Read values with `awk` into variables and never print the file; treat a printed secret as leaked and say so |
| A push went to `main` | A branch cut from `origin/main` took it as its upstream | `git config branch.autoSetupMerge simple` and `push.default simple`; check `git status -sb` before a push |
| The token can read a PR but not create one | The token had no contents permission | Use the host's CLI under the user's own login |
| The network inspector shows no requests | Bundler cache kept the app's own `fetch`, or the app started before the inspector | Inspector first, bundler with a clean cache, relaunch the app |
| Simulator window is black | No device booted | `simctl list devices booted`; boot a named device |
| A test accepts `[200, 401]` | It was written to pass against whatever the API did | One test, one status; if the API's answer isn't certain, probe it first |

## Not yet proven: what `verify-mobile` has to run first

| Step | What it needs |
|---|---|
| Tap, scroll and type in the running app | A driver the agent can call: an Appium session, Maestro, `idb` or a mobile MCP server. None was run |
| Screenshot the screen | `xcrun simctl io booted screenshot <file>` writes it; the agent reads the file. Written down, not run |
| Compare with the design | The design tool's MCP screenshot of the same frame against the simulator's, and a rule for what counts as a match (tokens, spacing, copy). Not run |
| Android emulator and Android Studio | The same loop on the emulator: install, `adb reverse`, launch, screenshot. Not run |
| A real device or a device farm | Not considered here |

A `verify-mobile` skill lands once one pass of the table's first three rows has been run live and its failures are written
down, the way [`examples/AIPB-19.md`](../examples/AIPB-19.md) did for worktree-isolated agents.

See also: [`lifecycle/verification.md`](../lifecycle/verification.md), [`/verify-browser`](../skills/verify-browser.md),
[`/review-pr`](../skills/review-pr.md), [`AGENTS.md`](../AGENTS.md).
