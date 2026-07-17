# Adopting the playbook in a team

How a team goes from "we've heard about AI agents" to running this playbook on its own. It's the same enablement pipeline that works for any new technology — agents are not a special case:

```
Research
    ↓
Workshop / live demo
    ↓
Pilot on one real ticket
    ↓
Shared conventions (AGENTS.md)
    ↓
Team runs it independently
```

The goal at the end is *not* "the lead uses agents." It's "the team knows how to work with agents, and the agents know how the team works." Enablement — raising what everyone else can do — beats individual output.

## The stages

**1. Research.** One person (usually the lead) runs the playbook on a real ticket end-to-end themselves first. Not a toy example — a real one, with the failure modes that come with it. You can't teach what you haven't debugged.

**2. Workshop / live demo.** Show, don't tell. A live run of one workflow on the team's own codebase lands harder than any slide deck: the team sees the checkpoints, the trace (trigger → workflow → skills → tools), and — importantly — the moments where a human says no.

**3. Pilot on one real ticket.** One ticket, one workflow, pairing welcome. Agent output goes through the same PR review as anyone else's work. This is where the team learns the most important habit: treating the agent as a teammate whose work gets reviewed, not as a magic box whose output gets pasted.

**4. Shared conventions.** Write the repo's `AGENTS.md`: branching, testing, styling, the skills the team actually uses. This is the moment the knowledge stops living in one person's head. From here on, agents follow the same standards as the rest of the team — because they're written down.

**5. Independence.** The team runs workflows without the lead in the loop on every step. The lead's job shifts to reviewing the system (are the conventions right? are the checkpoints in the right places?) rather than reviewing every run.

## What makes it stick

**Review as mentoring — for humans and agents alike.** The review style that grows engineers ("what happens when this renders 500×?" instead of "change this to memoization") is the same style that improves agent workflows: ask why the output looks the way it does, trace it, fix the *convention* that allowed the mistake — not just the instance. A review that only patches the instance guarantees the same mistake next sprint.

**Feedback runs on facts.** Observation → data → context → impact → discussion. "The last 3 agent-written PRs needed rework because X" leads somewhere; "the agents write bad code" doesn't. Same rule as giving feedback to people — and it applies in both directions, up and down.

**Decisions go through options and trade-offs.** The Research Before Implementing rule in `AGENTS.md` — 2–3 concrete approaches, trade-offs, a recommendation, then a decision — isn't an AI-era invention. It's how healthy teams have always decided: problem → constraints → options → trade-offs → decision → ownership. The playbook just applies the same discipline to work done with agents.

**Not every decision is democratic.** Brainstorm, gather arguments, weigh trade-offs together — but when the team circles or information is thin, someone takes ownership: "OK, my call, we go this way, and here's why." Explaining the *why* is what keeps that from feeling like a decree.

**Most friction isn't technical.** Teams rarely struggle because people can't write code. They struggle over unclear expectations, missing process, and FE/BE/QA/Product seeing different halves of the problem. Adopting agents doesn't fix that — but the conventions this playbook forces you to write down (expectations, standards, checkpoints, traces) remove a surprising amount of it as a side effect.
