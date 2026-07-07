# Worked Example: AIPB-06 — Label relationships, defer the rest

**Trigger:** A second external review (8.5/10), whose own closing lines said: stop redesigning, go back to polishing, no changes unless a real problem shows up.

**Workflow:** [`feature-delivery`](../workflows/feature-delivery.md), Task/chore path.

## Trace

1. **Reading the review's own conclusion, not just its ideas** — the review contained several substantial proposals (a 5th architecture level, a Principles doc, reframing the whole repo as tool-agnostic, a bigger README identity). All were good ideas. Most were also explicitly self-flagged by the reviewer as deferred ("not now, maybe v0.3," "one thing I'd add later," "eventually"). Treating a reviewer's own hedges as real signal, not boilerplate modesty, was the actual judgment call in this run — it would have been easy to read "this could evolve into a methodology" as license to build the methodology today.
2. **Scope split** — proposed implementing only the one item with no such hedge (labeling the arrows between architecture levels) and writing everything else into `docs/future-considerations.md` as captured-but-not-committed ideas, rather than either ignoring them or building them prematurely.
3. **[`create-task`](../skills/create-task.md)** — wrote `.tasks/AIPB-06.md` scoping exactly that split.
4. **[`implement-task`](../skills/implement-task.md)** — relabeled `architecture.md`'s arrows, wrote `docs/future-considerations.md` with an explicit rationale per deferred idea (not just a bullet list — each entry says *why* it's deferred, so a future reader can judge if the reason still holds), registered it in `CLAUDE.md`. Ran the standard verification sweep — clean.

**Outcome:** see the PR linked from this ticket's history once opened.

## What this run actually validated

Positive, expansive feedback is a different failure mode than a critical review — the risk isn't acting on a false claim (like AIPB-02's table-rendering non-issue), it's over-acting on a true-but-premature one. The check that mattered here wasn't "is this correct," it was "did the reviewer actually ask for this now, or are they thinking out loud." Worth treating vision and scope as separate axes when reviewing feedback, not just correctness and incorrectness.
