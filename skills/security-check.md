---
name: security-check
disable-model-invocation: true
description: Runs 5 trigger questions against a ticket to catch security implications during planning (new input surface, access/role changes, sensitive data, new dependencies, secrets/tokens in app code) and writes a Security Considerations section into the task file. Run during Requirements, before Architecture, whenever a ticket trips one of the trigger questions. Not a substitute for Claude Code's built-in /security-review, which scans real code/diffs — this runs before any code exists. NEVER auto-invoke — only run when user explicitly types /security-check.
---

# security-check — Planning-Time Security Trigger Questions

## Overview

A security implication ("this touches user data," "this changes who can see what") is a real requirement, but it's easy to miss when nobody explicitly asks about it during planning — it either gets caught late in review (expensive) or not at all. This skill runs that catch as a concrete, repeatable process from [`docs/security.md`](../docs/security.md) instead of leaving it to whoever happens to think of it.

Read `docs/security.md` first if the OWASP Top 10:2025 taxonomy isn't already familiar — this skill assumes it and doesn't re-derive it.

Runs alongside or just before [`create-task`](./create-task.md) for any ticket — same integration shape as [`define-slo`](./define-slo.md), triggered from `lifecycle/requirements.md` rather than hard-called from inside `create-task.md`.

**Not a substitute for Claude Code's built-in `/security-review`.** That scans a real diff for real vulnerabilities before merge. This skill runs earlier and asks a different question: does this *ticket* — before any code exists — touch something that needs a security decision at all. Both are useful; neither replaces the other.

---

## Inputs

- The ticket or feature this applies to (for `<package-root>/.tasks/TICKET-ID.md` output, if one exists)
- Enough of the ticket's actual scope to answer the 5 trigger questions honestly — not a guess from the title alone

## Output

- A **Security Considerations** section written into `<package-root>/.tasks/TICKET-ID.md` if that file exists (append to it — don't duplicate `create-task`'s sections); otherwise reported directly in conversation.
- Only written when at least one trigger question is "yes." A ticket that trips none of them gets no section — an empty checklist is review noise, not a decision.

## Guardrails

- **Do not invent mitigations.** A plausible-sounding mitigation nobody actually confirmed is a guess wearing a decided-looking answer — same failure mode `define-slo` guards against for SLO numbers. If the real mitigation or owner isn't known, leave it as an open question (`?` with a note, matching `create-task`'s convention) rather than asserting one.
- **Do not skip a trigger question because the ticket "obviously" doesn't need it.** Run all 5 explicitly and record the answer, even when it's no — a skipped question is exactly how a real implication gets missed silently.
- **Do not write a Security Considerations section for a ticket that trips zero trigger questions.** No section is the correct output there, not an empty one.
- **Do not treat this as a diff-time vulnerability scan.** This skill runs during planning, against the ticket's described scope — it can't catch a bug introduced during implementation. Run `/security-review` (built-in) for that.

---

## Workflow

### Step 1: Run the 5 Trigger Questions

Answer each explicitly against the ticket's actual scope, not the title alone:

| Trigger question | OWASP:2025 category |
|---|---|
| New input surface (form, endpoint, upload, webhook)? | A05 Injection |
| Changes who sees/does what (auth, roles, sharing)? | A01 Broken Access Control, A07 Authentication Failures |
| Touches personal/sensitive data? | A04 Cryptographic Failures, A09 Security Logging and Alerting Failures |
| New dependency or external service? | A03 Software Supply Chain Failures |
| Handles secrets/tokens in app code? | A04 Cryptographic Failures, A02 Security Misconfiguration |

If all 5 are "no," stop here — report that plainly (Step 4) and don't write a section.

### Step 2: For Each "Yes," Identify the Concrete Concern

Don't stop at tagging the OWASP category — name what could actually go wrong for *this* ticket. "A01 Broken Access Control" is a category; "a user could pass another user's ID in the URL and read their data if the query doesn't filter by the requesting user" is the actual concern. See `docs/security.md`'s Worked example for the level of specificity expected.

### Step 3: Name the Mitigation, or Flag It as Open

For each concern from Step 2, state the concrete mitigation (e.g. "enforce `user_id` filtering server-side in the query, not client-side after fetch"). If the real mitigation isn't yet known — a design decision still pending, a library not yet chosen — leave it as an explicit open question per the Guardrails above, not a placeholder that reads as decided.

### Step 4: Write the Output

If at least one trigger question was "yes," append to `<package-root>/.tasks/TICKET-ID.md`:

```markdown
## Security Considerations

**Trigger questions run:** [all 5, with yes/no for each — even the "no" ones, for the record]

| Concern | Category | Mitigation |
|---|---|---|
| [e.g. a user could read another user's order history by ID] | A01 Broken Access Control | [e.g. filter by requesting user server-side in the query — or "?" if not yet decided] |

**Open questions (if any):** [mitigations or owners not yet confirmed — don't guess these]
```

If no task file exists yet, report the same content directly in conversation and suggest running `create-task` first if the user wants it captured durably.

If all 5 trigger questions were "no," skip this step entirely — report that instead (Step 5).

### Step 5: Report

Tell the user:
- Each trigger question's answer (yes/no), even if the result is "none apply, no section written"
- The concerns and mitigations table, if one was written
- Any open questions left for mitigations/owners not yet confirmed
