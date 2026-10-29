---
name: review-comment-style
disable-model-invocation: true
description: Formats PR/MR review drafts — one inline comment per finding with a severity tag, evidence and a concrete fix (optionally a suggestion block), plus a review summary with Verified / Must fix / Non-blocking / Not verified. Drafts only, never posts. NEVER auto-invoke — only run when user explicitly types /review-comment-style or when called from the review-pr skill.
---

# review-comment-style — How Review Drafts Are Written

## Overview

A review is only as useful as the comments are easy to act on. This skill fixes the shape: **one finding per inline comment**, each with a severity tag, the evidence and a fix, plus a short summary for the review body. It is called by [`review-pr`](./review-pr.md) and can be run alone to restyle comments you already have.

---

## Inputs

- The findings (severity, file, line on the PR head, evidence, fix) and the verdict
- Line numbers taken from the PR head, e.g. `git show "${REF}:path" | grep -n '<snippet>'` — never guessed

## Output

Two kinds of text, each in its **own fenced block** so it can be copied in one click:

### A. Inline comment per finding

Put `path:line` on the line above the block, in order of severity.

````md
**[Low] <Area>: <short imperative title>**

<One or two sentences: what is wrong or missing, with the evidence (`file.ts:LINE` or the observed behaviour).>

<Concrete fix. If it is one exact replacement, give a suggestion block:>
```suggestion
<replacement lines>
```

_Not blocking._
````

### B. Review summary

````md
### Review: <Approve with comment | Request changes | Approve | Comment>

**Verified**
- <what was run or read, e.g. tests for X (N passed), lint and type-check clean on changed files>

**Must fix** (only for Request changes)
1. <finding with path:line and fix>

**Non-blocking**
1. <finding, same words as the inline comment, or "see inline">

**Not verified**
- <explicit list, or "nothing">
````

---

## Rules

- **Severity tags in titles:** `[Must]` (blocks merge), `[Low]`, `[Nit]`, `[Question]`. Same words in the summary and the inline comment.
- **Title is a short imperative** (`Gate enabled on storeId`), not a verdict on the author. Polite, concrete, no sarcasm, no emojis, no headings inside inline comments.
- **Every comment names the evidence and the fix.** No fix, no comment. A question is one short question tagged `[Question]`.
- **Suggestion blocks only for exact, self-contained replacements** (same file, a few lines). Otherwise describe the fix in words.
- **One finding per comment, under about 8 lines.**
- **Do not repeat what someone already raised** — link it instead (`see discussion_r<id>` or the thread URL).
- **The summary lists a finding only if it has an inline comment or is cross-cutting** (missing tests, PR description mismatch).
- **Never post.** After the blocks, say which review option to choose (Approve / Request changes / Comment) and which old threads should be resolved.
- **Private details stay out of drafts that will be pasted publicly:** see the Private overlay in [`review-pr`](./review-pr.md).
