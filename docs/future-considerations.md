# Future Considerations

Ideas raised in review that are deliberately **not implemented yet** — captured here so they don't get lost, without pretending they're committed to. Nothing here should be read as a roadmap promise; it's a backlog of ideas worth revisiting once there's a real problem that motivates them (the same bar every other change in this playbook has been held to since AIPB-02).

## A 5th level: Reference Architectures

Proposed shape: per-stack bundles of "recommended workflow → recommended capabilities → recommended MCPs," e.g. a React SPA bundle, a React Native bundle, a Node API bundle. The pitch is that a team adopting this playbook could pick their stack and get a pre-assembled starting point instead of composing one from scratch.

Not building this now — explicitly flagged by the reviewer as "not now, maybe v0.3." It also can't be done credibly yet: this playbook has exactly one stack's worth of real usage behind it (FE/mobile, and even that is thin). A second real adoption in a different stack would be the actual trigger for this, not a hypothetical.

## A Principles doc ("constitution")

Proposed principles: human in the loop, composable, tool-agnostic, reproducible, small capabilities, observable, incremental adoption. The idea is a short doc that every future PR gets checked against.

Worth doing eventually — several of these principles are already *implicit* in how this playbook has been built (e.g. `disable-model-invocation: true` by default is "human in the loop"; the skill/workflow/lifecycle split is "composable"). Writing them down explicitly would make that intentional rather than incidental. Deferred because writing a constitution before the thing it constrains has had much real-world use risks describing principles that don't actually hold up once tested.

## Reframing "Capability" as tool-agnostic

The suggestion: describe a Capability as an abstract unit of engineering behavior, implementable as a Claude Skill, a Codex agent, a Gemini CLI command, a Cursor rule, etc. — with Claude Code as this repo's current implementation, not the only possible one.

The framing idea is reasonable and cheap to *state*. What's out of scope is actually rewriting the 9 existing skill files to be multi-tool — they're currently coupled to real Claude Code mechanics (`disable-model-invocation` frontmatter, slash-command invocation, MCP tool-search patterns) that don't have a settled equivalent in other tools yet. Doing that rewrite now would be speculative generalization with no second implementation to generalize *from* — the same trap this playbook's own anonymization work (AIPB-01 onward) was careful to avoid by always generalizing from something real.

## README "open framework" identity rewrite

Proposed replacement for the identity sentence added in AIPB-03: *"AI Delivery Playbook is an open framework for designing repeatable AI-assisted software delivery processes. It provides composable capabilities, reusable workflows, lifecycle guidance and worked examples that can be adapted to any engineering team."*

Not adopted yet because it describes a bigger ambition (a cross-tool, cross-team methodology) than what's actually built (a Claude-Code-specific playbook with one stack's worth of examples). Revisit once the tool-agnostic reframing above has actually happened — the README should describe what the repo is, not what it aspires to become.
