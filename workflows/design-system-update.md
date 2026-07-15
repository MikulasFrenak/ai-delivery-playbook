---
name: design-system-update
level: 2 - Workflow
status: documented
uses_skills: [create-task, implement-task, verify-browser, code-doc, commit, pr-update]
---

# design-system-update

**Trigger:** A change to a shared component, design token, or icon set — anything that other packages consume rather than something a single feature owns.

**What's different from `feature-delivery`:** the blast radius. A change here can silently break every consumer, not just the package you're editing, so verification has to cover consumers, not just the component itself.

**Sequence:**

1. [`create-task`](../skills/create-task.md) — usually the Feature or Chore template depending on whether it's new functionality or a token/refactor change. In Step 5 (Explore the Codebase), explicitly search for every consumer of the component/token being changed — this list belongs in the task file's Files to Touch or Open Questions, not discovered mid-implementation.
2. [`implement-task`](../skills/implement-task.md) — Step 3 (Read the Design) is where the updated tokens/spec get pulled from Figma or equivalent (see [`docs/mcp-servers.md`](../docs/mcp-servers.md)'s Figma section). **Gap:** this playbook doesn't yet have a dedicated design-token-extraction skill, so this is a direct MCP read rather than a pre-digested brief. Then Step 4 (Understand Architecture) should explicitly answer: is this a breaking change to the component's public API/props, or purely visual? A breaking change needs a migration note for every consumer, not just the ones you touch in this ticket.
3. [`verify-browser`](../skills/verify-browser.md) — run this **once per distinct consumer surface** that's plausibly affected, not just the design-system package's own storybook/demo page. A token change that looks right in isolation can still break contrast or spacing somewhere it's used with an unusual prop combination.
4. [`code-doc`](../skills/code-doc.md) — at minimum a Component-level doc update; if the change affects several components under one visual system, consider a Section-level doc summarizing the change across all of them.
5. [`commit`](../skills/commit.md) — call out any breaking change explicitly in the commit message, even if every consumer in *this* repo was already updated — other consumers (if the package is published) won't have the context otherwise.
6. [`pr-update`](../skills/pr-update.md) — for follow-up commits, e.g. a consumer that failed CI after the initial change.

**Exit criteria:** PR/MR merged, every identified consumer verified (not just the changed package), and any breaking change documented in a place downstream consumers will actually see it (changelog, PR description, or `code-doc` output — whichever this project's consumers are known to check).
