# AI Delivery Playbook — Claude Code Project Guide

This file serves two purposes:

1. It's the Claude Code guide for working **in this repo** (the playbook itself).
2. It's a **template** of cross-cutting conventions to copy into your own project's `CLAUDE.md`. Sections marked *Example* show a real pattern distilled from a production adoption — replace the specifics with your own stack, tooling, and package names.

This playbook is built primarily with **Frontend Web and Mobile (React Native)** delivery in mind — that's why the examples throughout lean on components, views, screens, and design tokens rather than backend services. The underlying structure (skills → workflows → lifecycle) generalizes to any stack; only the concrete examples are FE/mobile-flavored.

The skills in [`skills/`](./skills/) (e.g. `create-task`, `analyze-story`) assume a `CLAUDE.md` exists at the repo root and, for monorepos, at each package root — they read these before exploring code or writing a plan. Keep this file (and per-package equivalents) accurate for that reason, not just as documentation.

---

## Repo Layout

| Path | Level | Purpose |
|---|---|---|
| `skills/` | 1 — Atomic Skills | One `<name>.md` per skill, invoked as `/<name>` |
| `workflows/` | 2 — Workflows | Multi-skill sequences for a delivery scenario |
| `lifecycle/` | 3 — Engineering Lifecycle | Stage-level docs (Requirements → Release) |
| `docs/` | Reference | Setup and tooling docs (e.g. `mcp-servers.md`, `vocabulary.md`) |

See [`architecture.md`](./architecture.md) for how these levels relate.

---

## Package Map *(template)*

For a monorepo, list every package that has its own `CLAUDE.md` with package-specific overrides and gotchas — always read it before touching code there. Packages **without** a `CLAUDE.md` follow the root conventions without exception.

| Package | CLAUDE.md | Notes |
|---|---|---|
| `apps/web` | [CLAUDE.md](../apps/web/CLAUDE.md) | e.g. API client wiring, state pattern, legacy migration status |
| `apps/mobile` | [CLAUDE.md](../apps/mobile/CLAUDE.md) | e.g. React Native — native module usage, platform-specific (`.ios.tsx`/`.android.tsx`) file conventions |
| `packages/<name>` | [CLAUDE.md](../packages/<name>/CLAUDE.md) | e.g. shared component library, design tokens, framework constraints |

For active-development packages worth flagging separately (new routes, in-flight migrations), keep a second small table with the ticket/epic that introduced them.

---

## Branching & Commits *(template)*

```
feature/TICKET-ID/short-kebab-desc   # new functionality
bugfix/TICKET-ID/short-kebab-desc    # broken behaviour / failing tests
chore/TICKET-ID/short-kebab-desc     # ticketed, non-feature work: deps, refactor, config
trivial/short-kebab-desc             # tooling, docs, config (no ticket)
```

`chore/` vs `trivial/`: both cover non-feature, non-bugfix work — the difference is whether it's tracked by a ticket. If it has a ticket (matches the `create-task` skill's Chore template), it's `chore/`. If it's small enough that filing a ticket would be overhead, it's `trivial/`.

Commit format:

```
TICKET-ID - Summary (imperative, max 72 chars)   # feature/, bugfix/, or chore/ branches
TRIVIAL - Summary (imperative, max 72 chars)     # trivial/ branches

- What changed and why
- Non-obvious decisions
- Files affected if not obvious
```

Adapt to your own team's actual policy, but decide and document explicitly:
- Which branch(es) can never be committed to directly
- Whether commits carry a `Co-Authored-By` trailer or not
- Whether `CLAUDE.md`-only changes go on their own branch type (keeps doc updates decoupled from long-lived feature branches)
- PR merge strategy (squash vs merge commit) and whether the source branch auto-deletes

---

## Testing Infrastructure *(template)*

Document your actual test runner setup here (unit / component / e2e, and where each runs — locally vs CI).

**Example — cross-process bridge quirk:** if your CT setup proxies through a separate process (e.g. a remote-browser grid), callback counters incremented in Node-side test code may never reflect what happened in the real browser, because the runner's dispatch bridge and the test framework's own `mount` populate different arrays. Symptom: `expect.poll(() => callCount)` always times out in CI but the interaction visibly works.

Fix pattern — track the interaction from the browser side instead of a Node-side closure variable:

```tsx
test('calls onAction when button is clicked', async ({ mount, page }) => {
  await mount(<Component onAction={() => {}} />)

  await page.evaluate((selector) => {
    const w = window as unknown as Record<string, unknown>
    w.__actionClickFired = false
    document.addEventListener(
      'click',
      (e) => {
        if ((e.target as Element).closest(`[data-testid="${selector}"]`)) {
          w.__actionClickFired = true
        }
      },
      { capture: true, once: true }
    )
  }, 'btn-action')

  await page.getByTestId('btn-action').click()
  await page.waitForFunction('window.__actionClickFired === true')
})
```

`page.waitForFunction` with a string polls entirely in-browser — no Node-side bridge involved. `capture: true` fires before framework event delegation.

**Example — state-store hydration quirk:** if your CT test code runs in Node and your store is a client-side singleton (e.g. Zustand), calling the store's `setState` from test code mutates a Node-side module instance the mounted component never sees. Update the store from inside `page.evaluate` after mounting instead, using the store's own actions rather than raw `setState`:

```tsx
await mount(<MyComponent prop={value} />)

await page.evaluate(() => {
  const w = window as unknown as { __appStore: { getState: () => { setFlag: (v: boolean) => void } } }
  w.__appStore.getState().setFlag(false)
})
```

Expose the store on `window` only from the CT harness entry point, not from production code.

**QA selectors:** pick one attribute convention (e.g. `data-testid`) and apply it consistently. Import selectors from a shared file rather than inlining strings, so a rename is a one-file change.

**Unit tests:** run pure-function/unit tests before component tests — they're faster and catch logic bugs without spinning up a browser.

**Test file placement:** a component-level spec lives next to its component; a view/integration spec lives next to the view and is reserved for concerns that span multiple components or need shared state. Don't consolidate everything into one giant spec file.

---

## Claude Code Settings

**Never modify the committed `.claude/settings.json`** — it's shared across the team. All local-only additions (auto-approved permissions, model overrides, MCP toggles) belong in **`.claude/settings.local.json`** only.

- When proposing or applying a permission addition, always target `settings.local.json`
- If a tool call auto-writes a permission to `settings.json`, restore it (`git checkout -- .claude/settings.json`) and add it to `settings.local.json` manually instead
- Run `git diff .claude/settings.json` before any commit to catch silent writes

---

## Claude Code Skills

Skill definitions in this playbook live in [`skills/`](./skills/). In a real project, Claude Code looks for them under `.claude/skills/` (or `.claude/commands/` for older setups) — copy accordingly when adopting a skill from here.

### MCP Invocation Policy

**Never call any MCP tool automatically.** MCP servers (issue tracker, design tool, code-quality scanner, feature-flag service, browser automation, observability, etc. — see [`docs/mcp-servers.md`](./docs/mcp-servers.md)) consume tokens and may trigger external side effects. Only invoke one when the user explicitly asks for it in the current message, or by running a skill whose own instructions document that MCP usage. Don't infer intent and call MCPs speculatively.

### Skill Invocation Policy

**Never auto-invoke a skill from its description alone.** Every skill file in this playbook sets `disable-model-invocation: true` for exactly this reason — a skill only runs when the user explicitly types its slash command. Don't invoke one based on pattern-matching the user's request.

When authoring a new skill, default to `disable-model-invocation: true` even if it seems harmless at first — write it defensively, not reactively. A skill's description is written to help a human decide when to run it, not to double as a trigger phrase; if the flag is left off, a well-matched description becomes exactly the kind of phrasing a model might pattern-match on its own, which is especially risky for skills that create tickets, post comments, or touch git. Only omit the flag for a skill you've deliberately decided is safe to auto-invoke.

### Skills in this playbook

| Skill | When to use |
|---|---|
| [`/analyze-story`](./skills/analyze-story.md) | Deep-analyze a Story ticket — Event Model diagram, FE/backend breakdown, splittability, create subtasks. Run this *before* `create-task` when starting from a Story |
| [`/create-task`](./skills/create-task.md) | Create `.tasks/TICKET-ID.md` from a ticket (or from one of `analyze-story`'s subtasks) — planning only, no code |
| [`/implement-task`](./skills/implement-task.md) | Full implementation flow for a ticket — reads the task file, design, implements, tests, docs, commit |
| [`/verify-browser`](./skills/verify-browser.md) | Verify a change in the live browser via Chrome DevTools MCP (web only — see the skill for the native-mobile gap) |
| [`/commit`](./skills/commit.md) | Generate a commit message from the current diff, run the quality gate, commit, and offer to create/update the PR/MR |
| [`/pr-update`](./skills/pr-update.md) | Append the last commit's changes as new rows to the open PR/MR description (GitHub, GitLab, Azure DevOps, Bitbucket) |
| [`/code-doc`](./skills/code-doc.md) | Create or update a `doc.md` for a component, module, or feature section after implementing or changing it |
| [`/public-repo-check`](./skills/public-repo-check.md) | Scan working tree + git history for secrets, UUIDs, and org-specific naming before pushing to a public remote |
| ... | Add your own following the same skill-file pattern |

### Task file lifecycle

`.tasks/TICKET-ID.md` is a **living planning doc** — open with it, close by deleting it:

| State | Task file action |
|---|---|
| PR not open yet | Keep & update — ongoing work, file is active context |
| PR already open | Delete in the same commit — ticket is done |

The file's content is preserved in git history on the branch forever, so deleting it from the working tree loses nothing. [`/commit`](./skills/commit.md) Step 2 enforces this automatically — it checks for an open PR/MR and stages the deletion if one exists, rather than relying on manual cleanup.

### Design-tool skills

If your design tool exposes two MCP servers — one local/read (desktop app) and one remote/write (cloud, diagram/file generation) — keep that split explicit in your skills' instructions, since read and write operations often need different auth and different tools. See the Figma example in [`docs/mcp-servers.md`](./docs/mcp-servers.md).

---

## Research Before Implementing

For any non-trivial task, don't start writing code immediately:

1. **Search the web** for current best practices, recent guides, and known pitfalls relevant to the problem — don't rely solely on training knowledge.
2. Identify **2–3 concrete approaches**. For each, write 1–2 sentences: what it is, its main trade-off, and when it fits.
3. State which approach you recommend and why, then compare it against this repo's own conventions and flag any conflicts.
4. **Wait for explicit go-ahead** before touching any code.

This applies to new features, architecture decisions, reviewer feedback, or anything that would meaningfully change existing behaviour. (The `create-task` and `analyze-story` skills already bake this step into their own workflow — this rule is what they're following.)

---

## Cross-Cutting Rules *(examples — replace with your stack's conventions)*

### Styling

State which one of these this project actually uses — don't leave it to be inferred file-by-file, and don't let a second approach creep in alongside it "just for one component."

**Universal, regardless of stack:**
- Never hardcode colors/spacing that a token or variable already covers; don't approximate a token with a runtime color-manipulation helper when an exact one exists
- Prefer framework/library-provided class-name or selector constants over hardcoded strings when targeting internal DOM structure
- One styling approach per component — mixing two (e.g. a utility-class component with a stray inline `style=`) is a sign something should be refactored, not a shortcut

**Per-approach gotchas:**

| Approach | Watch out for |
|---|---|
| CSS-in-JS (Emotion, styled-components, MUI `styled()`) | Avoid the framework's inline-style prop (e.g. MUI's `sx`) as a substitute for a real styled component — it defeats theming and static analysis |
| Tailwind / utility classes | Long className strings hide intent — extract a component instead of repeating the same cluster of utilities everywhere |
| CSS Modules / Sass / Less | Global selectors leak across modules without `:local`/module scoping — verify your build actually scopes them |
| Bootstrap (legacy) / global CSS | Specificity wars and `!important` creep — treat any new addition here as tech debt, not precedent for more |
| Inline `style={{...}}` / `style="..."` | No hover/focus/media-query support, no theme tokens, no static analysis or reuse — acceptable only for a one-off computed value (e.g. a measured width); never a substitute for a real styling approach |
| React Native `StyleSheet.create` / `styled-components/native` / NativeWind | No cascade and no shared global stylesheet by default — shared values (color, spacing) must come from an explicit theme/token import, not CSS custom properties; `Platform.select`/`.ios.tsx`/`.android.tsx` splits are the normal way to diverge per platform, not a special case to avoid |

### Cross-module navigation — example: micro-frontend architecture

- Route to other modules via a shared enum/constants file — never hardcode path strings
- If the host shell's router can rewrite history externally, read the *current* URL (e.g. `window.location.search`) rather than a possibly-stale prop passed down from routing state

### Overlays — example: micro-frontend architecture

- If the host shell wraps each module in its own stacking context, a `createPortal(..., document.body)` from inside a module can render **behind** the module's own content. Use a fixed-position element inside the module's own DOM tree instead.

### Icons

- Prefer your existing shared icon set over adding a new icon package
- Document where new icons should be added (naming convention, storage location)

### API clients

- Auto-generated API-client packages should never be hand-edited
- If both a generated client and an older local copy exist, prefer the published generated one and document the migration status

### Browser verification, issue trackers, code quality, feature flags

These are all MCP-backed in this playbook — see [`docs/mcp-servers.md`](./docs/mcp-servers.md) for setup, URLs, and troubleshooting rather than duplicating that detail here. Notable policy carried over from real usage: if your organization runs **both** a cloud and an on-premise instance of the same tool (e.g. Jira Cloud + Jira Data Center), document which ticket-prefix maps to which MCP server — the wrong one will confidently report "issue does not exist" instead of hinting you queried the wrong instance.

---

## Public Repo Hygiene

This playbook is meant to be public. If you're generalizing a skill or doc sourced from a real (private) project into this repo — or maintaining any other repo intended to go public — run [`/public-repo-check`](./skills/public-repo-check.md) before pushing.

Never commit to a public repo:
- Real secrets, tokens, API keys, or private-key material
- Cloud/tenant/resource UUIDs (e.g. an issue-tracker `cloudId`, a cloud-provider subscription ID)
- Internal hostnames or IPs other than `localhost`/`127.0.0.1`/`0.0.0.0`
- A company name, internal project codename, product/ticket-ID prefix, or any other identifier that ties this content back to a specific organization
- Personal file-system paths or personal emails

When generalizing a skill sourced from a real project — as every skill in `skills/` was — the source material's specific names are the most common leak: package names, ticket-ID prefixes, internal URLs, tools tied to one org's licensing. Strip them to generic placeholders (`<your-org>`, `TICKET-ID`, `<component-library>`) the same way the existing skills do; use those files as the reference pattern for how much to anonymize, rather than deciding case-by-case.

---

## Setup

See [`docs/mcp-servers.md`](./docs/mcp-servers.md) for MCP server setup. Add your own machine-setup doc (runtime versions, package manager, auth proxy/VPN requirements, token-usage visibility) as `docs/setup.md` — that content is inherently org-specific, so it isn't templated here.
