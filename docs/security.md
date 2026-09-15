# Security — Planning-Time Trigger Questions

A cross-cutting extension example, per this playbook's own framing: the structure (skills → workflows → lifecycle) is stack-agnostic, and this doc is what filling that structure in for security looks like, the same way [`docs/sla-framework.md`](./sla-framework.md) is for reliability. It plugs into [`lifecycle/requirements.md`](../lifecycle/requirements.md) — a security concern is a non-functional requirement, and like reliability, it has to be decided during planning, not discovered mid-implementation or caught (or missed) in review.

This is the theory and taxonomy. The trigger-question process described below is also implemented as a runnable skill — [`/security-check`](../skills/security-check.md) — that walks the same questions against a real ticket and writes the result into the task file rather than leaving it as something someone has to remember to think about.

**This is not a substitute for reviewing the actual diff for vulnerabilities before merge** — Claude Code ships a built-in `/security-review` for exactly that, scanning real code for real issues. This doc and `/security-check` are about the earlier, easier-to-fix moment: does this *ticket* — before any code exists — touch something that needs a security decision at all.

---

## The taxonomy: OWASP Top 10:2025

OWASP's Top 10 gets revised periodically; the 2025 revision changed meaningfully from the 2021 version most training data defaults to — two new categories, and a reordering that moved Security Misconfiguration from #5 to #2. Worth citing the current version explicitly rather than an older, more familiar one:

| # | Category | What it actually covers |
|---|---|---|
| A01 | **Broken Access Control** | Who can see/do what — including SSRF, folded in from 2021's separate category |
| A02 | **Security Misconfiguration** | Default configs, exposed debug endpoints, verbose error messages, missing security headers |
| A03 | **Software Supply Chain Failures** *(new)* | Dependency vulnerabilities, typosquatting, compromised packages, build-pipeline integrity |
| A04 | **Cryptographic Failures** | Secrets handling, encryption at rest/in transit, weak hashing |
| A05 | **Injection** | SQL/command/XSS — untrusted input reaching an interpreter without validation |
| A06 | **Insecure Design** | Security decided (or not) at design time, before code exists — the category that justifies this doc existing |
| A07 | **Authentication Failures** | Identity verification, session handling, credential storage |
| A08 | **Software or Data Integrity Failures** | Unsigned/unverified updates, CI/CD pipeline integrity |
| A09 | **Security Logging and Alerting Failures** | Both directions: don't log secrets, *and* do log security-relevant events for detection |
| A10 | **Mishandling of Exceptional Conditions** *(new)* | Already covered in this repo — see [`docs/error-handling.md`](./error-handling.md) |

---

## The translation problem: a vague concern into a written decision

Same shape as `docs/sla-framework.md`'s client-driven-to-technical-SLA translation: most tickets don't arrive with an explicit security ask, so the job is *noticing* when one is implied, not waiting for someone to state it. Five trigger questions catch most real cases without turning every ticket into an OWASP audit:

| Trigger question | Category it catches |
|---|---|
| New input surface (form, endpoint, upload, webhook)? | A05 Injection |
| Changes who sees/does what (auth, roles, sharing)? | A01 Broken Access Control, A07 Authentication Failures |
| Touches personal/sensitive data? | A04 Cryptographic Failures, A09 Security Logging and Alerting Failures |
| New dependency or external service? | A03 Software Supply Chain Failures |
| Handles secrets/tokens in app code? | A04 Cryptographic Failures, A02 Security Misconfiguration |

A "no" to all five means no security section gets written — a ticket that trips nothing shouldn't carry an empty checklist as review noise.

**The rule this repo's own `AGENTS.md` Public Repo Hygiene section only states narrowly is actually broader:** "don't commit secrets to a *public* repo" is a special case of "don't hardcode secrets in application code at all" — private or public. Git history is permanent even after a later deletion, secrets get baked into build artifacts and logs, and rotation becomes a code change instead of a config change. Secrets belong in environment variables or a secrets manager, scoped per environment (dev/staging/prod each get their own), never in source.

**The same least-privilege principle this repo already applies to agent tooling in [`docs/mcp-governance.md`](./mcp-governance.md) applies to the application's own API clients too:** a token scoped to read-only when the feature only reads is correctly scoped; a token that can also write "just in case" is over-provisioned by design, not by accident.

**Access control's most common real failure is trusting the client.** Hiding a button doesn't stop a direct call to the endpoint behind it — role/permission checks belong server-side, enforced in one place (middleware/guard), not reconstructed ad hoc per handler.

---

## Where this fits in the lifecycle

- **Requirements**: the 5 trigger questions run against the ticket; any "yes" gets a written Security Considerations section — this becomes part of the acceptance criteria, same treatment `define-slo` gives a reliability ask.
- **Architecture**: a ticket with access-control or data-sensitivity implications needs that decision made before an approach is picked, not discovered while writing the handler.
- **Implementation**: this is where `docs/error-handling.md` (A10) and secret/token handling (A04) actually get executed — the plan from Requirements becomes real code.
- **Verification / Release**: Claude Code's built-in `/security-review` covers the diff-time check this doc explicitly doesn't — see the distinction in the Overview above.

---

## Worked example

Ticket: *"Add an endpoint so users can export their own order history as CSV."*

Running the 5 trigger questions:

1. **New input surface?** Yes — a new endpoint, even though it's read-only. → A05: validate any query params (date range, format) rather than trusting them unvalidated into a query.
2. **Changes who sees/does what?** Yes — this must return *only* the requesting user's own orders. → A01: the authorization check is "does this order belong to this authenticated user," enforced server-side in the query itself (e.g. a `WHERE user_id = :current_user`), not filtered client-side after fetching everyone's orders.
3. **Touches personal/sensitive data?** Yes — order history is personal data. → A04/A09: the export shouldn't log full order contents in access logs; if the CSV is generated server-side and stored temporarily, it needs a short expiry and shouldn't be publicly listable.
4. **New dependency?** Depends — a CSV-generation library, if one gets added. → A03: check it's actively maintained before adding it, not just that it has the right function signature.
5. **Secrets/tokens in app code?** No new secret here — not applicable.

Security Considerations section written into the task file: the A01 authorization rule (own-orders-only, enforced in the query), the A04/A09 logging/expiry note, and — if a CSV library gets added — a note to check it during Implementation, not assume it's fine because it compiled.

---

## Sources

- [OWASP Top 10:2025](https://owasp.org/Top10/2025/)
- [OWASP Top Ten Project](https://owasp.github.io/www-project-top-ten/)
