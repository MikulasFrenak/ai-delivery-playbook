# evals/

One `<skill-name>.md` scorecard per skill that's been through [`/agent-eval`](../skills/agent-eval.md) — golden set, rubric, score history, and current regression threshold. See [`docs/eval-framework.md`](../docs/eval-framework.md) for the vocabulary and reasoning behind why this exists as its own durable artifact instead of living in `.tasks/`.

Unlike `.tasks/TICKET-ID.md`, files here are **never deleted on merge** — a scorecard's whole value is the score history staying comparable across every future run, the same reason `docs/*.md` survives past the ticket that first wrote it.

No scorecards yet — this directory is created ahead of the first skill that gets a real golden set built for it (see `agent-eval`'s Guardrails: it isn't a day-one skill, so don't expect entries here until a skill has real usage history to evaluate against).
