# Error Handling Patterns

A backend extension example, per this playbook's own framing (see `docs/deployment.md`'s opening note — same idea, different concern). This is what "how a backend service actually behaves when something goes wrong" looks like as a documented convention, the same way styling or responsive-UI conventions are documented for frontend work in `AGENTS.md`'s Cross-Cutting Rules.

Paired with [`docs/sla-framework.md`](./sla-framework.md): an SLO states the reliability target; this doc is how a service behaves *within* that budget instead of just getting measured against it after the fact. Read that one first if the SLI/SLO/error-budget vocabulary isn't already familiar.

---

## Error taxonomy — three categories, not two

Most error handling collapses to "did it work or not," which loses the information that actually determines what to do next. Split by **who's responsible for the failure and whether retrying helps**:

| Category | Examples | Retry helps? | Whose fault |
|---|---|---|---|
| **Client error** | Bad input, missing auth, requesting something that doesn't exist | No — retrying the same request fails the same way | Caller |
| **System error** | Unhandled exception, bug, data corruption | No — the code is wrong, not the timing | Us |
| **Transient/infra error** | Timeout, connection reset, dependency temporarily unavailable, rate limit | **Yes**, with backoff | Neither — the environment |

The category is what should drive the response, not the raw exception type. A `TimeoutError` reaching a client as a bare 500 throws away the one piece of information ("this is worth retrying") that would let the caller do the right thing automatically.

---

## Consistent error response shape

Every error an API returns should have the same shape, machine-parseable, regardless of which endpoint or which internal exception produced it. **RFC 9457 (Problem Details for HTTP APIs, obsoleting the earlier RFC 7807) is the standard worth aligning to** rather than inventing a bespoke shape per project:

```json
{
  "type": "https://example.com/errors/insufficient-funds",
  "title": "Insufficient funds",
  "status": 402,
  "detail": "Account balance (12.50 EUR) is below the requested amount (50.00 EUR).",
  "instance": "/accounts/abc123/withdrawals/xyz789",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736"
}
```

Fields worth keeping non-negotiable across every service in a system:

- **`type`/`title`** — stable, machine-checkable identifier a client can branch on (`if error.type === '.../insufficient-funds'`), not just a human sentence that changes wording between releases and silently breaks client-side error handling.
- **`trace_id`** (or `correlation_id`) — the single most valuable field for anyone debugging this later. Propagate it from the original request through every downstream call and put it in every log line touching that request. Without it, "look at the logs" means grepping blind through everything happening at that timestamp across every service.
- **Client-facing detail is not the same as the internal one.** `detail` is safe to show a user or return to a caller; the actual stack trace, internal hostnames, and query text go to structured server-side logs, keyed by the same `trace_id`, never into the response body. Leaking internals in error responses is a real, common security issue, not a style nitpick.

---

## Retries and idempotency

**Only retry the transient category above**, and only with backoff:

- **Exponential backoff with jitter** is the standard pattern — double the wait after each failed attempt, and add randomness so many clients retrying the same failure don't all hit the recovering service at the same instant (a "thundering herd"). Always honor a `Retry-After` header if the failing service sends one — it knows its own recovery time better than a generic backoff curve does.
- **Retrying a mutating request (create, charge, submit) without an idempotency key is a data-integrity bug waiting to happen**, not just an inefficiency — a client retry after a timeout can otherwise create the order/charge the card twice, when the original request actually succeeded and only the *response* was lost. An idempotency key (client-generated, sent with the request, stored server-side against its result) lets the server recognize "I already did this" and return the original result instead of repeating the side effect.
- **Don't retry client errors.** Retrying a 400 or 404 with the same payload fails identically every time and just adds load; the fix is in the request, not the timing.

---

## Failure isolation: circuit breakers and graceful degradation

When a downstream dependency is failing, the question is whether the caller should **keep hammering it** (making the outage worse and burning its own resources on doomed calls) or **stop and fail fast**.

- **Circuit breaker pattern**: after enough consecutive failures to a dependency, stop calling it for a cooldown period and fail fast instead — protects both the struggling dependency (no added load while it recovers) and the calling service (no threads/connections tied up waiting on calls that won't succeed).
- **Graceful degradation vs. fail-fast — pick deliberately per dependency, not as a global default.** A product-recommendations service being down shouldn't take checkout down with it — serve the page without recommendations. A payments service being down *should* fail the checkout loudly rather than silently accepting orders it can't actually charge for. State this choice explicitly per integration point rather than letting it default to whatever the framework happens to do.

---

## Observability — an error that isn't traceable didn't really get handled

- **Never silently swallow an exception.** A bare `catch {}` (or equivalent) that suppresses an error without logging it is the single most common way a real production issue goes undetected until a user complains — at which point there's no trail to follow.
- **Structured logging, not string concatenation** — log the error as a structured event (level, `trace_id`, error category, relevant IDs) so it's queryable later, not just a human-readable sentence buried in unstructured text.
- **The `trace_id` from the error response format above is what makes an error investigable across service boundaries** — without it, correlating "this client-reported error" with "these five internal log lines across three services" is guesswork.

---

## Where this fits in the lifecycle

- **Architecture**: which dependencies get circuit breakers, which failures degrade gracefully vs. fail loudly — these are architecture decisions, made explicitly per `lifecycle/architecture.md`'s existing framing ("a decision, not a document"), not discovered ad hoc while writing the try/catch.
- **Implementation**: the response-shape and retry/idempotency conventions above apply uniformly — see `lifecycle/implementation.md`.
- **Verification**: a test suite that only exercises the happy path hasn't verified error handling at all — assert on the actual error response shape (not just "it returned non-200"), and on retry/idempotency behavior for mutating endpoints specifically.

---

## Sources

- [RFC 9457 — Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html) (obsoletes RFC 7807)
- [RFC 7807 — Problem Details for HTTP APIs (original)](https://www.rfc-editor.org/rfc/rfc7807.html)
- [Best practices for API error handling (Zuplo)](https://zuplo.com/learning-center/best-practices-for-api-error-handling)
- [API retry mechanisms — how they work + best practices (BoldSign)](https://boldsign.com/blogs/api-retry-mechanism-how-it-works-best-practices/)
