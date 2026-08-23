---
name: agent-eval
disable-model-invocation: true
description: Builds a golden set + scoring rubric for one specific judgment call a skill makes, runs the current implementation against it, and gates any change to that skill on the score not regressing. Run when a skill has real usage history (not on day one) — after a wrong call already happened, before a skill's prompt/logic changes, or periodically for high-frequency skills. NEVER auto-invoke — only run when user explicitly types /agent-eval.
---

# agent-eval — Golden-Set Evaluation for a Skill's Judgment Calls

## Overview

A skill that "seems to work" and a skill that's actually been measured against real cases are not the same claim — see [`docs/eval-framework.md`](../docs/eval-framework.md) for why spot-check confidence quietly stops scaling the moment the skill changes again. This skill runs that translation as a concrete, repeatable process: build a golden set from real history, score the current implementation against it, and record the result as a baseline the next change gets checked against.

Read `docs/eval-framework.md` first if the golden-set/rubric/baseline/regression vocabulary isn't already familiar — this skill assumes it and doesn't re-derive it.

Not a day-one skill — a golden set needs real history to be built from. Run this when a skill has actually been used enough times to have real cases, especially after a wrong call was already noticed, or before changing a skill's prompt/logic that's had a scorecard before.

---

## Inputs

- Which skill, and which specific judgment call inside it, is being evaluated (not "the whole skill" — most skills make several distinct calls, and they don't all deserve the same golden set)
- Real historical examples where the correct output is already known — past runs, past tickets, cases a human already corrected. Never invented for this purpose.
- Access to whoever can say what "correct" means for a genuinely ambiguous case, if the rubric isn't exact-match

## Output

- `evals/<skill-name>.md` — a durable scorecard (not deleted like `.tasks/` — score history only means something if it persists across runs)

## Guardrails

- **Do not invent golden-set examples.** A golden set built from made-up cases tests whether the skill agrees with whoever wrote the examples, not whether it's actually right. Pull from real history — past runs, past tickets, cases a human already corrected.
- **Do not call one passing run "evaluated."** A single example can't distinguish a reliably correct skill from one that got lucky once. The golden set needs enough real cases to actually catch a regression, not just clear a single happy path.
- **Do not silently lower the regression threshold to make a bad run look like a pass.** If the current score doesn't clear the stated baseline, that's the finding — record it as a regression and say so, don't quietly redefine "pass."
- **Do not skip re-running the eval after the skill's prompt or logic changes.** A scorecard that isn't re-run after a change isn't gating anything — it's a historical record of a version that no longer exists.
- **Do not treat this as a substitute for `test-scaffold`.** Unit/component tests check that code does what the code says; a golden set checks that a judgment call lands where a human would — different failure modes, both needed.

---

## Workflow

### Step 1: Identify the Judgment Call and Why Now

Name the specific decision being evaluated — not the whole skill. If the user hasn't said which one, ask: _"Which specific judgment call inside this skill — not the whole skill — do you want evaluated?"_

Confirm why now: a known wrong call, an upcoming prompt/logic change, or a periodic check for a high-frequency skill. If none of these apply and this is the skill's first real use, say so — this isn't a day-one skill, and a golden set built from too little history won't catch anything real.

### Step 2: Build or Extend the Golden Set

Gather real examples where the correct output is already known:

- Past runs of this skill with a human-confirmed correct answer
- Past tickets/decisions where this judgment call was made and later verified
- Known failures (like the case that prompted running this skill in the first place) — these belong in the golden set specifically, not set aside as "the bug we already know about"

If `evals/<skill-name>.md` already exists, extend its existing golden set rather than starting over — score history is only comparable if the set it's measured against stays consistent (documented additions are fine, silently swapping the set out isn't).

Aim for enough examples to be a real sample, not a handful cherry-picked to look clean — if fewer than ~10 real cases exist, say so plainly rather than presenting a 3-example set as a solid baseline.

### Step 3: Define the Rubric

State, in writing, how a single example is scored:

- **Exact-match** — the common case: does the output match the known-correct answer, yes/no.
- **Partial-credit/subjective** — only when exact-match genuinely doesn't fit (e.g. a quality judgment, not a category). Write the criteria down *before* scoring any example, not while looking at results — deciding the rubric example-by-example is grading to a target, not evaluating.

### Step 4: Run the Current Implementation Against the Golden Set

Execute the skill's actual current logic/prompt against every example in the golden set, recording each result against the rubric from Step 3. Don't sample a subset — every run needs the full set, or the score isn't comparable to the last one.

### Step 5: Compute the Score and Compare to Baseline

Score = (examples scored correct) / (total examples). Compare against the last recorded baseline in `evals/<skill-name>.md`, if one exists.

- **Holds or improves** → this run is a candidate new baseline.
- **Regresses** → this is the finding, not something to explain away. Report it plainly, per the Guardrails above.

### Step 6: Apply the Regression Gate

If this eval was run because a skill change is pending:

- **Score holds or improves** → the change is safe to ship on the evidence available.
- **Score regresses** → the change doesn't ship as-is. Either fix the regression, or someone with the authority to accept the trade-off does so explicitly — record who and why in the scorecard, don't just lower the threshold quietly (see Guardrails).

### Step 7: Write the Scorecard

Write or update `evals/<skill-name>.md`:

```markdown
# Eval scorecard — <skill-name>

## Judgment call evaluated
[The specific decision, not the whole skill]

## Rubric
[Exact-match, or the stated partial-credit criteria]

## Golden set
[Where the examples came from, how many, last extended when]

## Score history
| Date | Score | Baseline before | Regression? | Notes |
|---|---|---|---|---|
| YYYY-MM-DD | 17/20 (85%) | — (first run) | — | Initial baseline |
| YYYY-MM-DD | 19/20 (95%) | 85% | No — improved | Prompt change: [what changed] |

## Regression threshold
[Current baseline — the number a future run must meet or exceed]

## Accepted trade-offs (if any)
[Any regression that shipped anyway, who accepted it, and why]
```

### Step 8: Report

Tell the user:
- The score, and whether it's a first baseline, a hold, an improvement, or a regression
- If a regression: what it means for the pending change (blocked, or needs an explicit accepted trade-off)
- Any golden-set-size or rubric caveats from Steps 2–3 that limit how much confidence this score actually deserves
