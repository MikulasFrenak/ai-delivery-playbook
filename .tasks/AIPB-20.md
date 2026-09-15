# AIPB-20 — security-check skill + docs/security.md

**Ticket:** self-assigned (solo repo, no external tracker — see AGENTS.md "Ticket IDs for solo/no-tracker projects")
**Type:** Chore

---

## What & Why

Neither `create-task`, `analyze-story`, nor `implement-task` has any security/threat step — confirmed by grepping all three for security/threat/risk language: zero matches. What exists today is all adjacent, not this: `public-repo-check` (secrets leaking into *this* repo), `docs/mcp-governance.md` (least privilege for *agent tooling*), and one line in `docs/error-handling.md` about not leaking stack traces. Nobody currently asks "does this ticket change who can access what, or add a new secret/input surface" during planning.

**Grounded in OWASP Top 10:2025** (verified via web search, not assumed from training memory — the list changed meaningfully from the 2021 version most training data would default to: two new categories, **A06 Insecure Design** among them, which is direct external validation that design-time security thinking deserves its own step, not a post-hoc checklist). Full mapping in the Plan below.

**Approach chosen (B of 3 discussed):** a new skill, `/security-check`, paired with a new `docs/security.md` — mirroring the closest existing precedent, `define-slo` ↔ `docs/sla-framework.md`, both structurally (a vague/implicit non-functional concern → concrete, written criteria in the task file) and mechanically (standalone skill, documented as running "alongside or just before `create-task`," triggered from `lifecycle/requirements.md` rather than hard-called from inside `create-task.md` the way `design-brief` is — `design-brief` reacts to a concrete input already in the ticket; `security-check`, like `define-slo`, reacts to a *kind of ask*, so it follows `define-slo`'s integration shape, not `design-brief`'s).

**Rejected alternatives:**
- **Inline-only** (fold the 5 trigger questions directly into `create-task.md`'s own steps, no new skill/doc): simplest, but buries security inside an already-long skill and leaves nowhere to cite the OWASP taxonomy without inlining a wall of reference material.
- **Doc-only** (write `docs/security.md`, nothing runs it): rejected because `CONTRIBUTING.md`'s own newly-added skill+doc-pairing rule says the doc is "what the skill *cites*" — a doc with no skill pointing to it tends to go stale unread.

**Naming:** `/security-check` (not `/threat-model` — sounded off; not `/security-review` — Claude Code already ships a built-in `/security-review` for diff-time review, and reusing that name would collide/confuse). Fits this repo's existing "X-check" pattern (`public-repo-check`, `mcp-check`), even though those two audit something that already exists and this one elicits a requirement before code exists — "run a security check on this ticket" reads naturally either way.

---

## Plan

- [x] Create **`docs/security.md`** (mirror `docs/sla-framework.md`'s shape: vocabulary/taxonomy → the translation problem → where it fits in the lifecycle → sources). Content: OWASP Top 10:2025 categories, and the trigger-question → category mapping below.
- [x] Author **`skills/security-check.md`** — frontmatter (`disable-model-invocation: true`), Overview linking `docs/security.md` (same "read this first, assumed not re-derived" pattern `define-slo` uses for `sla-framework.md`), Guardrails, Workflow. Core mechanic: 5 trigger questions, and — mirroring `define-slo`'s own Guardrail against inventing SLO numbers — **do not invent mitigations**; if the actual mitigation/owner isn't known, leave it as an open question rather than asserting a plausible-sounding one.

  Trigger question → OWASP:2025 category:
  | Trigger question | Category |
  |---|---|
  | New input surface (form, endpoint, upload, webhook)? | A05 Injection |
  | Changes who sees/does what (auth, roles, sharing)? | A01 Broken Access Control, A07 Authentication Failures |
  | Touches personal/sensitive data? | A04 Cryptographic Failures, A09 Security Logging and Alerting Failures |
  | New dependency or external service? | A03 Software Supply Chain Failures |
  | Handles secrets/tokens in app code? | A04 Cryptographic Failures, A02 Security Misconfiguration |

  A06 (Insecure Design) and A10 (Mishandling of Exceptional Conditions) aren't per-trigger — A06 is the reason this whole skill exists (security decided during planning, not bolted on after), and A10 is already covered by `docs/error-handling.md` — cross-reference it, don't restate it.

  **Output shape** (mirrors `define-slo`'s Output exactly): a **Security Considerations** section appended to `<package-root>/.tasks/TICKET-ID.md` if it exists, else reported directly in conversation. Only written when at least one trigger question is "yes" — a ticket that trips none of them gets no section, not an empty one.

- [x] Add a paragraph to **`lifecycle/requirements.md`**, same shape and same paragraph position as the existing `define-slo` paragraph there (non-functional requirements get the same rigor as functional ones) — run `/security-check` whenever a ticket trips one of the 5 trigger questions, before Architecture starts.
- [x] Register in the three mandatory places per `CONTRIBUTING.md`: `skills/security-check.md` itself, `architecture.md`'s Level 1 list, `AGENTS.md`'s skills table.
- [x] Checked `docs/vocabulary.md` — skipped adding terms. "Trigger question" and "Security Considerations" are self-explanatory, not the kind prone to drift the way "Scope tier"/"Blast radius" were.
- [x] Cross-referenced the built-in `/security-review` distinction in `skills/security-check.md`'s Overview, `docs/security.md`'s Overview, and `lifecycle/requirements.md`'s new paragraph — three places, not one, since it's the easiest thing for a reader to conflate.
- [x] Reconciled `PLAN.md` directly (skill count 19→20, new Status line, reference-docs list, plus two new Next-up items: "Release ≠ deploy" — carrying forward the earlier brainstorm about rollout/rollback/flag-lifecycle as the logical next ticket — and the vendor-neutral "context weight per skill" idea from the same conversation).
- [x] Ran a `/public-repo-check`-style grep across every new/changed file — clean. The two matches are the pre-existing, already-public deployed skill-server URL (same as AIPB-17/18's precedent), not new leaks.

---

## Files to Touch

| File | Change |
|---|---|
| `docs/security.md` | new file — OWASP:2025 taxonomy + trigger-question mapping + vocabulary |
| `skills/security-check.md` | new skill file |
| `lifecycle/requirements.md` | add a `security-check` paragraph, same shape as the existing `define-slo` one |
| `architecture.md` | add `security-check` to Level 1 skills list |
| `AGENTS.md` | add row to "Skills in this playbook" table |
| `docs/vocabulary.md` | add new terms only if they recur beyond this doc |
| `PLAN.md` | reconcile via `/plan-update` after landing |

No `workflows/*.md` changes needed — same precedent as `agent-eval`/`branch-cleanup`/`plan-update`/`mcp-check`: standalone, not baked into the three delivery workflows' `uses_skills` lists.

---

## Open Questions

_(none open right now — approach, name, and integration shape all resolved this session)_

---

## Architecture Notes

_Add non-obvious decisions here as you discover them during implementation._
