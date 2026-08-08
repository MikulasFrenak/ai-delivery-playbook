# SLA Framework — Client-Driven vs. Technical SLAs

A backend extension example, per this playbook's own framing: the structure (skills → workflows → lifecycle) is stack-agnostic, and this doc is what filling that structure in for a backend/reliability concern looks like, the same way `docs/deployment.md` is for infrastructure. It plugs into [`lifecycle/requirements.md`](../lifecycle/requirements.md) — an SLA is a non-functional requirement, and "non-functional" doesn't mean "untestable," it means the acceptance criteria are about *how well* rather than *what*.

This is the theory and vocabulary. The translation process described below (Client-Driven vs. Technical SLAs section) is also implemented as a runnable skill — [`/define-slo`](../skills/define-slo.md) — that walks the same steps against a real ticket and writes the result into the task file rather than leaving it as prose someone has to remember to apply.

---

## The vocabulary, precisely (Google SRE)

Three terms get used interchangeably in casual conversation and shouldn't be, because they answer different questions:

| Term | Question it answers | Example |
|---|---|---|
| **SLI** (Indicator) | What are we actually measuring? | Request latency, error rate, availability |
| **SLO** (Objective) | What's our internal target for that measurement? | p99 latency < 300ms; 99.9% success rate over 28 days |
| **SLA** (Agreement) | What did we commit to externally, with consequences if we miss? | "99.9% uptime or a service credit" |

**SLOs should be tighter than SLAs**, with real headroom between them — an SLO breach should be an internal alarm well before it becomes an SLA violation and a customer conversation. If your SLO and SLA are the same number, you have no warning system, only a post-mortem trigger.

**Error budget = 1 − SLO.** A 99.9% SLO leaves a 0.1% error budget — concretely, 3,000 allowed failures out of 3 million requests over a four-week window. This isn't a target to hit; it's a **spending account for risk**. Ship faster and take more risk while the budget has room; slow down and prioritize reliability work when it's nearly spent. This is the mechanism, not a metaphor — see "Error budgets drive the roadmap" below.

---

## Client-driven vs. technical SLAs — the translation problem

This is the practical gap most teams actually have, and it's worth naming directly: **a client-driven SLA and a technical SLA are not the same artifact, and the job is translating between them — not picking one.**

**Client-driven SLA**: what the business or customer actually asks for, usually informally and usually vague — "it needs to be fast," "it can never go down," "we need this reliable." This is a real requirement, not noise to be dismissed, but it isn't yet measurable.

**Technical SLA/SLO**: the same commitment translated into an SLI with a number and a measurement window — "p95 API response time under 400ms, measured over rolling 5 minutes" or "99.95% availability, measured monthly, excluding announced maintenance windows."

**The translation step is the actual skill**, and skipping it is what produces the failure mode of "we don't really know how this gets decided" when someone asks how reliability targets or roadmap priorities get set. Concretely, translating a vague ask into a testable one means asking:

1. **What does "fast" or "reliable" cost the client if missed?** A checkout flow timing out costs revenue immediately; a reporting dashboard being slow costs annoyance. These deserve different SLOs even if the client used the same word ("fast") for both.
2. **What's the measurement window?** "Never down" is not achievable or meaningful; "99.9% over 28 days" is both.
3. **What's excluded?** Planned maintenance, client-caused overload, force majeure — state exclusions explicitly, in the SLA text itself, not as an unwritten assumption.
4. **Who owns the SLI's instrumentation?** An SLO nobody is actually measuring isn't a target, it's a hope. If the metric doesn't exist yet, "add the instrumentation" is the first real task this produces — not the SLO number itself.

Do this translation during **Requirements**, before Architecture — the technical SLO is itself an acceptance criterion, and picking an architecture without knowing the reliability target you're building toward is deciding blind.

---

## Error budgets drive the roadmap

This directly answers a question that's easy to fumble if it's never been made explicit: **how does the roadmap actually get prioritized, and who's responsible for that decision?**

The SRE answer is mechanical, not political: **the error budget is the roadmap input.**

- **Budget has room** → ship features, take calculated risk, deploy more freely.
- **Budget is nearly spent** → freeze new feature risk, prioritize reliability/fix work until the SLO is back in a healthy range.

This turns "how do we decide what to build next" from a vague, personality-driven conversation into a rule anyone can state and defend: *we ship when we're within budget, we stabilize when we're not, and the SLO number is what makes that call instead of a debate.* Write this rule down per-service, not just in the abstract — "who owns this SLO, what happens when the budget's spent, who has authority to freeze feature work" — same idea as this playbook's own "decide and document explicitly" convention from `AGENTS.md`'s Branching & Commits section, applied to reliability instead of git.

---

## Where this fits in the lifecycle

- **Requirements**: the client-driven ask gets translated into a technical SLO with a stated measurement window and exclusions — this becomes a testable acceptance criterion, same as any functional one.
- **Architecture**: the SLO is an input to the architecture decision, not an afterthought — an SLO of 99.99% and one of 99% imply genuinely different designs (redundancy, retry strategy, degradation behavior).
- **Implementation**: see [`docs/error-handling.md`](./error-handling.md) — error handling is how a service actually behaves *within* its error budget instead of just measuring against it after the fact.
- **Release / ongoing**: SLO burn rate is a real signal for whether a release is safe to continue rolling out, not just whether it built and passed tests.

---

## Worked example

Client says: *"The API needs to be reliable — our customers complain when it's slow or down."*

Bad translation (too vague to build against): "make it reliable."

Better translation, following the steps above:

1. Split "slow" and "down" into separate SLIs — latency and availability are different failure modes with different fixes.
2. SLO: *p95 latency < 500ms, measured over rolling 5-minute windows, for the `/checkout` endpoint specifically* (not "the API" as one blob — a reporting endpoint and checkout endpoint don't deserve the same target).
3. SLO: *99.9% availability, measured over a rolling 28-day window, excluding announced maintenance.*
4. Error budget for availability: ~43 minutes of downtime per 28 days. State that number back to the client — "reliable" now means something both sides can check.
5. Instrumentation task filed: does latency/availability telemetry for `/checkout` actually exist yet? If not, that's the first ticket, before any code changes aimed at "making it faster."
6. Ownership stated: who gets paged when the budget burns fast, and who has authority to say "pause feature work this sprint, we're stabilizing."

---

## Sources

- [Google SRE Book — Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [Google SRE Workbook — Error Budget Policy](https://sre.google/workbook/error-budget-policy/)
- [Google SRE Workbook — Implementing SLOs](https://sre.google/workbook/implementing-slos/)
