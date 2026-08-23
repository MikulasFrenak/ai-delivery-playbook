# Eval Framework — Golden Sets, Scoring, and Regression Gates for Agent-Produced Work

A reliability-adjacent extension example, per this playbook's own framing: the structure (skills → workflows → lifecycle) is stack-agnostic, and this doc is what filling that structure in for an *agent-quality* concern looks like, the same way `docs/sla-framework.md` is for product reliability. Where `sla-framework.md` asks "how well does the *product* behave," this doc asks "how well does the *agent's own judgment* behave, on the specific calls this playbook asks it to make repeatedly" — ticket-ID assignment, classification-style decisions, anything a skill does the same way across many runs where "roughly right most of the time" quietly becomes the actual bar unless someone measures it.

This is the theory and vocabulary. The process described below is also implemented as a runnable skill — [`/agent-eval`](../skills/agent-eval.md) — that builds the golden set, runs the scoring, and writes the result into a durable scorecard rather than leaving "it seems to work" as the only available answer.

---

## The vocabulary, precisely

| Term | Question it answers | Example |
|---|---|---|
| **Golden set** | What are the known-correct examples we're checking against? | 20 real past tickets where the correct ticket-type classification is already known, pulled from history — not invented |
| **Rubric** | How is a single example scored — pass/fail, or by what criteria? | "Matches the human-assigned type exactly" vs. a partial-credit rubric for a more subjective judgment call |
| **Score** | What's the aggregate result of running the current skill against the whole golden set? | 17/20 correct = 85% |
| **Baseline** | What's the last accepted score, that a new run gets compared against? | 85%, recorded after the last time this skill's prompt changed |
| **Regression** | A new run that scores worse than baseline | A prompt tweak that "reads better" but drops the score to 70% is a regression, not an improvement, regardless of how it reads |

**A golden set is not a test suite.** Unit tests check that code does what the code says it does. A golden set checks that a *judgment call* — the kind of decision only worth automating because it's usually right, not because it's provably deterministic — still lands where a human would land, on cases where a human already told you the right answer.

---

## The gap this closes — "it seems to work" vs. actually measured

This is the same practical gap `sla-framework.md` names for reliability, one level up: **a skill "feels right" after a few spot-checks, and a skill that's actually been measured against real cases, are not the same claim — and the job is building the second one, not trusting the first.**

**Spot-check confidence**: running a skill a handful of times, reading the outputs, and concluding "yeah, that looks right." Real signal, not worthless — but it's anecdote, not measurement, and it silently stops scaling the moment the skill is touched again (a prompt edit, a new edge case, a different model version) because there's no baseline to compare the next run against.

**Measured confidence**: a golden set with a stated rubric, a current score, and a baseline from the last accepted version — so "did this change make it better or worse" has an actual number attached instead of a vibe.

**The translation step is the actual skill**, same as `define-slo`'s translation from vague ask to testable target. Concretely:

1. **What specific judgment call is actually being evaluated?** "The skill" is usually too broad — most skills make several distinct calls (classify, extract, decide), and they don't all deserve the same golden set. Pick the one that's actually gone wrong before, or the one with the highest cost if it's silently wrong.
2. **Where do the golden-set examples come from?** Real history — past runs, past tickets, cases a human already corrected — never invented from scratch. An invented golden set tests whether the skill agrees with whoever wrote the examples, not whether it's actually right.
3. **What's the rubric?** Exact-match is the easy case. Anything more subjective needs the rubric written down *before* scoring, not decided example-by-example while looking at results (that's grading to a target, not evaluating).
4. **What's the regression threshold?** A score that's allowed to drift down slowly, one accepted "close enough" at a time, isn't actually gated by anything — decide the threshold once, in writing, before it's needed.

Do this whenever a skill has real usage history — not on day one, and not speculatively for every skill that exists. A skill nobody's used ten times yet doesn't have enough history to build a real golden set from.

---

## Regressions gate the change, not the roadmap

Unlike an SLO's error budget, an eval score doesn't drive prioritization on its own — it drives one narrower decision: **does this specific change to this specific skill ship as-is, or not.**

- **Score holds or improves** → the change is safe to ship on the evidence available; update the baseline.
- **Score regresses** → the change doesn't ship until either the regression is fixed, or someone explicitly accepts the trade-off in writing (a change that fixes a worse problem at the cost of a rarer one is a real, defensible call — but it has to be a stated decision, not a silently lowered bar).

Write down, per skill: who has the authority to accept a regression on purpose, and where that decision gets recorded (the scorecard itself — see the skill's Output section).

---

## Where this fits

Not tied to a single lifecycle stage the way Requirements/Architecture are — this runs **whenever a skill's prompt or logic changes**, and periodically for high-frequency skills even without a change, the same way a postmortem runs when triggered by an incident rather than on a fixed schedule. It's a standing practice, not a phase.

---

## Worked example

A skill makes ticket-type classifications (Feature / Bugfix / Chore) as part of its workflow, and someone notices it mis-classified two Chores as Features last week.

Bad response (spot-check confidence): re-read the prompt, tweak the wording that seemed to cause it, ship the tweak, move on.

Better, following the steps above:

1. Judgment call identified: ticket-type classification specifically — not "the whole skill."
2. Golden set built from real history: pull the last 20 tickets where the type was manually confirmed, including the two known-wrong ones.
3. Rubric: exact match against the confirmed type — no partial credit, since there are only three categories and each has different downstream consequences (branch prefix, commit format).
4. Run the current prompt against all 20: score comes back 17/20 (85%), including both known failures — confirms the golden set actually reproduces the reported problem before touching anything.
5. Regression threshold set: any future change must score ≥ 85%, the current baseline, or it doesn't ship without an explicit accepted trade-off.
6. Prompt tweak made, golden set re-run: 19/20 (95%) — genuine improvement, baseline updated to 95%, scorecard written.

---

## Sources

- [OpenAI Evals](https://github.com/openai/evals) — open-source framework and worked examples for building golden-set-style evaluations of LLM-driven systems
- [Anthropic — Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — evaluation as part of agent design, not an afterthought bolted on once something's already shipped
