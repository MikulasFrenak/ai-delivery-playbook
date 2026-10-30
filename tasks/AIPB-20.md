# AIPB-20 — security-check skill + docs/security.md

**Ticket:** self-assigned (solo repo, no external tracker — see AGENTS.md "Ticket IDs for solo/no-tracker projects")
**Type:** Chore
**Status:** done — [PR #43](https://github.com/MikulasFrenak/ai-delivery-playbook/pull/43), closed 2026-09-15
**Source:** written at the time; closed out in [AIPB-22](./AIPB-22.md)

---

## What & Why

Neither `create-task`, `analyze-story`, nor `implement-task` has any security/threat step — confirmed by grepping all three for security/threat/risk language: zero matches. What exists today is all adjacent, not this: `public-repo-check` (secrets leaking into *this* repo), `docs/mcp-governance.md` (least privilege for *agent tooling*), and one line in `docs/error-handling.md` about not leaking stack traces. Nobody currently asks "does this ticket change who can access what, or add a new secret/input surface" during planning.

**Grounded in OWASP Top 10:2025** (verified via web search, not assumed from training memory — the list changed meaningfully from the 2021 version most training data would default to: two new categories, **A06 Insecure Design** among them, which is direct external validation that design-time security thinking deserves its own step, not a post-hoc checklist). Full mapping in Architecture Notes below.

**Approach chosen (B of 3 discussed):** a new skill, `/security-check`, paired with a new `docs/security.md` — mirroring the closest existing precedent, `define-slo` ↔ `docs/sla-framework.md`, both structurally (a vague/implicit non-functional concern → concrete, written criteria in the task file) and mechanically (standalone skill, documented as running "alongside or just before `create-task`," triggered from `lifecycle/requirements.md` rather than hard-called from inside `create-task.md` the way `design-brief` is — `design-brief` reacts to a concrete input already in the ticket; `security-check`, like `define-slo`, reacts to a *kind of ask*, so it follows `define-slo`'s integration shape, not `design-brief`'s).

**Rejected alternatives:**
- **Inline-only** (fold the 5 trigger questions directly into `create-task.md`'s own steps, no new skill/doc): simplest, but buries security inside an already-long skill and leaves nowhere to cite the OWASP taxonomy without inlining a wall of reference material.
- **Doc-only** (write `docs/security.md`, nothing runs it): rejected because `CONTRIBUTING.md`'s own newly-added skill+doc-pairing rule says the doc is "what the skill *cites*" — a doc with no skill pointing to it tends to go stale unread.

**Naming:** `/security-check` (not `/threat-model` — sounded off; not `/security-review` — Claude Code already ships a built-in `/security-review` for diff-time review, and reusing that name would collide/confuse). Fits this repo's existing "X-check" pattern (`public-repo-check`, `mcp-check`), even though those two audit something that already exists and this one elicits a requirement before code exists — "run a security check on this ticket" reads naturally either way.

---

## What was built

`docs/security.md`, grounded in OWASP Top 10:2025, and `skills/security-check.md`. The skill asks 5 planning-time trigger questions and writes a Security Considerations section into the task file only when one of them applies. It is integrated into `lifecycle/requirements.md` as a paragraph, the same way `define-slo` is, and registered in all three mandatory places. The distinction from Claude Code's built-in `/security-review` (diff-time scan) is stated in three places. `PLAN.md` gained two Next-up items: "Release ≠ deploy" and a vendor-neutral "context weight" per skill.

---

## Open Questions

_(none open right now — approach, name, and integration shape all resolved this session)_

---

## Architecture Notes

Trigger question → OWASP Top 10:2025 category:

| Trigger question | Category |
|---|---|
| New input surface (form, endpoint, upload, webhook)? | A05 Injection |
| Changes who sees/does what (auth, roles, sharing)? | A01 Broken Access Control, A07 Authentication Failures |
| Touches personal/sensitive data? | A04 Cryptographic Failures, A09 Security Logging and Alerting Failures |
| New dependency or external service? | A03 Software Supply Chain Failures |
| Handles secrets/tokens in app code? | A04 Cryptographic Failures, A02 Security Misconfiguration |

- A06 (Insecure Design) and A10 (Mishandling of Exceptional Conditions) aren't per-trigger. A06 is the reason this skill exists (security decided during planning, not bolted on after), and A10 is already covered by `docs/error-handling.md`, so it's cross-referenced rather than restated.
- **Do not invent mitigations** — mirrors `define-slo`'s guardrail against inventing SLO numbers. If the actual mitigation or owner isn't known, it stays an open question.
- A ticket that trips none of the trigger questions gets no Security Considerations section, not an empty one.
- `docs/vocabulary.md` deliberately got no new terms: "Trigger question" and "Security Considerations" are self-explanatory, unlike "Scope tier"/"Blast radius" in AIPB-18.
