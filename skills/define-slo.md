---
name: define-slo
disable-model-invocation: true
description: Translates a vague, client-driven reliability ask ("it needs to be fast," "it can't go down") into a measurable technical SLO — SLI, target, measurement window, exclusions, error budget, instrumentation status, and ownership. Run during Requirements, before Architecture, whenever a ticket includes a non-functional/reliability ask. NEVER auto-invoke — only run when user explicitly types /define-slo.
---

# define-slo — Client-Driven Ask → Technical SLO

## Overview

A reliability ask ("this needs to be reliable," "it can't be slow") is a real requirement, but it isn't testable until it's a number with a window. This skill runs the translation from [`docs/sla-framework.md`](../docs/sla-framework.md) as a concrete, repeatable process instead of leaving it as a judgment call made differently every time — which is exactly the gap that shows up as "we don't really know how that gets decided" when someone asks how a reliability target or roadmap priority was set.

Read `docs/sla-framework.md` first if the SLI/SLO/SLA/error-budget vocabulary isn't already familiar — this skill assumes it and doesn't re-derive it.

Runs alongside or just before [`create-task`](./create-task.md) for any ticket with a reliability ask — the resulting SLO is itself an acceptance criterion, and Architecture needs it in view before a design gets picked (see `lifecycle/architecture.md`).

---

## Inputs

- The client-driven ask, in whatever words it was actually said ("needs to be fast," "can't go down," "must never lose data")
- The ticket or feature this applies to (for `<package-root>/.tasks/TICKET-ID.md` output, if one exists)
- Access to whoever can answer "what does missing this actually cost" — the user, or documented product/business context. Don't guess this.

## Output

- A **Reliability Target** section, written into `<package-root>/.tasks/TICKET-ID.md` if that file exists (append to it — don't duplicate `create-task`'s sections); otherwise reported directly in conversation for the user to place.
- Each SLI gets: target value, measurement window, stated exclusions, computed error budget, instrumentation status, and named ownership.

## Guardrails

- **Do not invent SLO numbers.** "p95 < 500ms" without someone who actually knows what's acceptable to the business is a guess wearing a precise-looking number. If the cost-of-missing isn't known, ask — don't default to an industry-standard-sounding figure and present it as decided.
- **Do not skip the instrumentation check (Step 4).** An SLO for a metric nobody is measuring isn't a target, it's a hope — say so plainly rather than writing the number down as if it's already being tracked.
- **Do not lump distinct concerns into one SLI** because the client used one word for both (Step 1) — "fast" for a checkout endpoint and "fast" for a reporting dashboard are different requirements with different costs of missing.
- **Do not silently pick an owner.** If nobody in the conversation has actually been named responsible for this SLO, leave it as an open question rather than assuming it defaults to whoever's implementing the ticket.

---

## Workflow

### Step 1: Split the Ask into Distinct SLIs

Read the client-driven ask and identify every genuinely separate concern hiding inside it. "Reliable" often bundles at least two of: latency, availability, correctness/data-integrity, throughput under load.

For each concern, name the specific SLI (e.g. "checkout API p95 latency," "checkout API availability") — not "the API" as one blob covering every endpoint, since different endpoints usually deserve different targets.

If it's genuinely unclear whether two mentioned concerns are actually one SLI or two, ask rather than guessing.

### Step 2: Establish Cost of Missing, per SLI

For each SLI from Step 1, ask (don't assume): **what does missing this actually cost, and does it differ from the other SLIs identified?** A checkout timeout costs revenue immediately; a slow internal report costs annoyance. This is what determines how tight the SLO needs to be — skipping this step is how a project ends up with one arbitrary "five nines" target applied uniformly regardless of what's actually at stake.

### Step 3: Set the SLO — Target, Window, Exclusions

For each SLI, produce:

- **Target value** — from Step 2's answer, informed by (not dictated by) industry norms for that kind of endpoint.
- **Measurement window** — "never down" isn't achievable or meaningful; state a real rolling window (e.g. "over 28 days").
- **Exclusions, stated explicitly** — planned maintenance, client-caused overload, force majeure. Write these into the SLO text itself, not as an unstated assumption someone has to guess at later.
- **SLO vs. SLA headroom** — if this ticket/project has an external SLA already, confirm the SLO here is tighter, with real margin. If there's no SLA yet, note that this SLO is currently the only commitment and flag whether one should exist.

### Step 4: Check Instrumentation

For each SLI, answer plainly: **does the telemetry to measure this already exist?**

- If yes — name where (which dashboard/metric).
- If no — this is the actual first task this skill produces, before any code change aimed at hitting the target. Add it explicitly to the task file's Implementation Plan or Files to Touch, not as a footnote.

An SLO with no instrumentation is not yet a working SLO — say this in the output rather than letting the number stand unqualified.

### Step 5: Compute the Error Budget

For each SLO with a percentage target, compute the error budget (`1 − SLO`) in concrete terms for the stated window — e.g. "99.9% over 28 days ≈ 43 minutes of allowed downtime." A number in real units (minutes, request count) is checkable in a way "99.9%" alone isn't.

State plainly what happens when the budget is spent for this SLI, per `docs/sla-framework.md`'s error-budget-drives-the-roadmap rule: feature work pauses, reliability work takes priority, until the SLO is back in a healthy range for the window.

### Step 6: Assign Ownership

Name, explicitly:

- Who gets paged/notified when this SLO's error budget is burning fast
- Who has the authority to say "pause feature work, we're stabilizing" when the budget runs out

If the conversation hasn't actually established this, leave it as an open question in the output (`?` with a note, matching `create-task`'s convention) rather than defaulting to "whoever's on this ticket."

### Step 7: Write the Output

Append a **Reliability Target** section to `<package-root>/.tasks/TICKET-ID.md` if it exists:

```markdown
## Reliability Target

**Client-driven ask:** [verbatim or close paraphrase of what was actually asked for]

| SLI | Target | Window | Exclusions | Error budget | Instrumented? | Owner |
|---|---|---|---|---|---|---|
| [e.g. checkout API p95 latency] | [e.g. < 500ms] | [e.g. rolling 5 min] | [e.g. none] | — (latency SLOs don't get a budget the same way availability does — note breach frequency instead) | [Yes — <dashboard> / No — first task below] | [name, or ?] |
| [e.g. checkout API availability] | [e.g. 99.9%] | [e.g. rolling 28 days] | [e.g. announced maintenance] | [e.g. ~43 min/28 days] | [Yes/No] | [name, or ?] |

**Instrumentation gaps (if any):** [what needs to be added before this SLO is actually trackable — file as a real task, not a footnote]

**Error budget policy for this ticket's service:** [what happens when the budget's spent — pause features, prioritize reliability work — per docs/sla-framework.md]
```

If no task file exists yet, report the same content directly in conversation and suggest running `create-task` first if the user wants it captured durably.

### Step 8: Report

Tell the user:
- The SLI table produced
- Any instrumentation gaps found — these are real, immediate follow-up work
- Any `?` left for cost-of-missing, exclusions, or ownership that still need an answer before this SLO is genuinely decided (not just written down)
