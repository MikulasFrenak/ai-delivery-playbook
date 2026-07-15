# Future Considerations

Ideas raised in review that are deliberately **not implemented yet** — captured here so they don't get lost, without pretending they're committed to. Nothing here should be read as a roadmap promise; it's a backlog of ideas worth revisiting once there's a real problem that motivates them (the same bar every other change in this playbook has been held to since AIPB-02).

## A 5th level: Reference Architectures

Proposed shape: per-stack bundles of "recommended workflow → recommended skills → recommended MCPs," e.g. a React SPA bundle, a React Native bundle, a Node API bundle. The pitch is that a team adopting this playbook could pick their stack and get a pre-assembled starting point instead of composing one from scratch.

Not building this now — explicitly flagged by the reviewer as "not now, maybe v0.3." It also can't be done credibly yet: this playbook has exactly one stack's worth of real usage behind it (FE/mobile, and even that is thin). A second real adoption in a different stack would be the actual trigger for this, not a hypothetical.

## A Principles doc ("constitution")

Proposed principles: human in the loop, composable, tool-agnostic, reproducible, small skills, observable, incremental adoption. The idea is a short doc that every future PR gets checked against.

Worth doing eventually — several of these principles are already *implicit* in how this playbook has been built (e.g. `disable-model-invocation: true` by default is "human in the loop"; the skill/workflow/lifecycle split is "composable"). Writing them down explicitly would make that intentional rather than incidental. Deferred because writing a constitution before the thing it constrains has had much real-world use risks describing principles that don't actually hold up once tested.

## Resolved: "Capability" reframing and README rewrite

Both items previously tracked here — reframing Capability as an abstract, tool-agnostic unit of engineering behavior, and the README identity rewrite gated on that reframing — landed via the `AGENTS.md`/`CLAUDE.md` split (`/generate-agents-md`) once a real second consumer (review-spa, zensmash) existed to generalize from. `AGENTS.md` now carries the tool-agnostic framing and conventions; `CLAUDE.md` is a thin `@AGENTS.md` import plus only genuinely Claude Code-specific mechanics. (The "Capability" label this section refers to was itself retired in AIPB-08 — one concept, one name: **skill**.)

Deliberately **not** done as part of that: rewriting the 8 existing skill files themselves to be multi-tool. They remain coupled to real Claude Code mechanics (`disable-model-invocation` frontmatter, slash-command invocation) that still don't have a settled equivalent in other tools. That stays out of scope for the same reason it always was — speculative generalization with no second implementation of *that specific mechanic* to generalize from, unlike the CLAUDE.md/AGENTS.md split itself.
