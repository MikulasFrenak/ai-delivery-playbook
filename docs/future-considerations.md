# Future Considerations

Ideas raised in review that are deliberately **not implemented yet** — captured here so they don't get lost, without pretending they're committed to. Nothing here should be read as a roadmap promise; it's a backlog of ideas worth revisiting once there's a real problem that motivates them (the same bar every other change in this playbook has been held to since AIPB-02).

## A 5th level: Reference Architectures

Proposed shape: per-stack bundles of "recommended workflow → recommended skills → recommended MCPs," e.g. a React SPA bundle, a React Native bundle, a Node API bundle. The pitch is that a team adopting this playbook could pick their stack and get a pre-assembled starting point instead of composing one from scratch.

Not building this now — explicitly flagged by the reviewer as "not now, maybe v0.3." It also can't be done credibly yet: this playbook has exactly one stack's worth of real usage behind it (FE/mobile, and even that is thin). A second real adoption in a different stack would be the actual trigger for this, not a hypothetical.

## A Principles doc ("constitution")

Proposed principles: human in the loop, composable, tool-agnostic, reproducible, small skills, observable, incremental adoption. The idea is a short doc that every future PR gets checked against.

Worth doing eventually — several of these principles are already *implicit* in how this playbook has been built (e.g. `disable-model-invocation: true` by default is "human in the loop"; the skill/workflow/lifecycle split is "composable"). Writing them down explicitly would make that intentional rather than incidental. Deferred because writing a constitution before the thing it constrains has had much real-world use risks describing principles that don't actually hold up once tested.

## An MCP server exposing this playbook's skills

Proposed shape: wrap the skills in `skills/` (design-brief, diagram, postmortem, test-scaffold, commit, implement-task, etc.) as callable MCP tools, so any MCP-compatible agent can invoke a skill directly instead of copying skill markdown into a project's `.claude/skills/` or reading it via `AGENTS.md`. Same skills, packaging becomes a server instead of files to copy. The pitch: point your own agent at the server and exercise the methodology live — a stronger demo for the AI-agent-consulting positioning than a repo walkthrough, since a prospective client's own Claude Code/Cursor session could try it without cloning anything.

Not building this now:

1. Every skill here is a **prompt/procedure for an agent to read and follow** — markdown + frontmatter, `disable-model-invocation: true`, human-confirmed steps — not a deterministic function with a typed input/output contract. An MCP tool needs that contract. Several skills (`postmortem`, `design-brief`) are conversational/multi-turn and don't reduce cleanly to one tool call.
2. Several skills only do real work through ANOTHER MCP server already connected in the calling session (`design-brief` needs Figma MCP, `verify-browser` needs chrome-devtools MCP). Wrapping those as a second-order server means proxying credentials/tool calls through your own infrastructure — a real security/scope question, not a packaging detail.
3. No real second consumer forcing the tool-contract decisions yet — same AIPB-02 bar as everything else in this doc: decide the shape once a concrete use case (a client session, or a second project of your own) requires it, not speculatively upfront.
4. The human-in-the-loop property is easiest to preserve while skills stay markdown a human/agent reads together. Turning them into opaque server-side tool calls needs deliberate design so "agents draft, humans decide" doesn't quietly erode.

What would actually start this: pick 1-2 skills that are already naturally single-call/deterministic — `public-repo-check`, `code-doc` are candidates, mechanical checks with a clear input/output — as a small v1 pilot, rather than attempting to wrap the whole skill set at once. That tests the packaging question cheaply before committing to it for the harder, conversational skills.

**Update:** deeper research on this landed in `.tasks/AIPB-11.md`. Short version: a "content-serving" shape (two generic tools, `search_skills`/`get_skill`, returning skill markdown as-is rather than wrapping each skill's logic as a function) resolves blockers 1 and 2 above — skills never become deterministic functions, they just get fetched over the wire instead of from a local clone, and any skill that depends on another MCP (Figma, chrome-devtools) still executes in the *calling client's* own already-connected session, never proxied through this server. Blockers 3 and 4 (no real second consumer yet; protect human-in-the-loop) still stand — see AIPB-11 for the full writeup and prior art.

## Resolved: "Capability" reframing and README rewrite

Both items previously tracked here — reframing Capability as an abstract, tool-agnostic unit of engineering behavior, and the README identity rewrite gated on that reframing — landed via the `AGENTS.md`/`CLAUDE.md` split (`/generate-agents-md`) once a real second consumer (review-spa, zensmash) existed to generalize from. `AGENTS.md` now carries the tool-agnostic framing and conventions; `CLAUDE.md` is a thin `@AGENTS.md` import plus only genuinely Claude Code-specific mechanics. (The "Capability" label this section refers to was itself retired in AIPB-08 — one concept, one name: **skill**.)

Deliberately **not** done as part of that: rewriting the 8 existing skill files themselves to be multi-tool. They remain coupled to real Claude Code mechanics (`disable-model-invocation` frontmatter, slash-command invocation) that still don't have a settled equivalent in other tools. That stays out of scope for the same reason it always was — speculative generalization with no second implementation of *that specific mechanic* to generalize from, unlike the CLAUDE.md/AGENTS.md split itself.
