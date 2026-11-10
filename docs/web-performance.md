# Web Performance — Measure Every Page the Same Way

This is the theory, the numbers and the worked example. The procedure is a runnable skill, [`/perf-check`](../skills/perf-check.md); how a vague "it must be fast" becomes a target is [`/define-slo`](../skills/define-slo.md), with the vocabulary in [`sla-framework.md`](./sla-framework.md). Same split as those two: this file explains, the skill does.

Status: web pages are **measured live**. The CI gate, real-visitor data and native mobile apps are **not yet proven**. See [What's proven](#whats-proven-and-what-isnt).

---

## What gets measured

Three Core Web Vitals, judged at the 75th percentile of real page views. The thresholds are the same for every device ([web.dev](https://web.dev/articles/defining-core-web-vitals-thresholds)):

| Metric | What the visitor feels | Good | Poor |
|---|---|---|---|
| Largest Contentful Paint (LCP) | When the main content shows up | ≤ 2.5 s | > 4 s |
| Interaction to Next Paint (INP) | How fast the page answers a tap or a click | ≤ 200 ms | > 500 ms |
| Cumulative Layout Shift (CLS) | How much the page jumps while loading | ≤ 0.1 | > 0.25 |

A page counts as good when at least 75% of its views are good on all three. A Lighthouse run loads the page once and doesn't interact with it, so it can't measure INP. Total Blocking Time (TBT) is the usual lab stand-in, and it's an approximation.

## Lab and field are different things

| | Lab | Field |
|---|---|---|
| What it is | One controlled load on a simulated slow phone | What real visitors on real devices got |
| Tool | Lighthouse | Real-user monitoring, or Chrome's public field data for popular sites |
| Good for | Comparing changes, finding causes, a PR gate | Whether the SLO is met |
| Weakness | Not any real visitor | Needs collecting; tells you what, not why |

[`/perf-check`](../skills/perf-check.md) measures the lab side. A lab score is not an SLO result, and the skill says so in every report.

## From an ask to a target

Take "the site must feel fast on phones" through `/define-slo`'s steps:

| SLI | Target | Window | Instrumented? |
|---|---|---|---|
| LCP of mobile page views, 75th percentile | ≤ 2.5 s | rolling, e.g. 28 days | Lab: yes. Field: only once real-visitor data is collected |
| CLS, same population | ≤ 0.1 | same | same |
| INP, same population | ≤ 200 ms | same | Field only; lab shows TBT as a stand-in |

The targets above are the Core Web Vitals "good" values, a starting point and not a client's answer. If the client has a number, it replaces them. `/define-slo` still owns the exclusions, the error budget and the owner.

A **performance budget** is a different thing: a limit a lab run can check in CI, such as page weight, JavaScript size or a Lighthouse score. A budget protects the SLO before release. Don't present one as the other.

## The method, and why each part is pinned

| Part | Setting | Why |
|---|---|---|
| Tool and version | Lighthouse, one pinned version (12.8.2 in the worked example) | Its scoring weights have changed over time ([scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)), so scores from different versions don't compare |
| Mobile profile | Lighthouse's default: 412 × 823 screen, simulated 150 ms round trip, about 1.6 Mbit/s, 4× CPU slowdown | Read from the reports themselves, so the doc states what was really applied |
| Desktop profile | Lighthouse's desktop preset: simulated 40 ms round trip, 10 Mbit/s, no CPU slowdown | Same |
| Runs | 3 per page and profile by default, 5 when a result is close to a limit. Take the median | Lighthouse's [own guidance](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md) says a median of 5 runs is about twice as stable as one run |
| Conditions | One report at a time, on a quiet machine | The same guidance: parallel reports on one machine disturb each other |
| Environment | One of: production, staging, a PR's testing deploy. Say which | A page can behave differently behind a different CDN or with different data |

## Worked example: two live sites

The author's portfolio (a React single-page app) and browser game (React Native on the web, with a WebAssembly renderer), measured on 2026-11-10 with the method above. Medians:

| Page | Profile | Runs | Score | LCP | CLS | TBT | Weight | JS | Within the default budget |
|---|---|---|---|---|---|---|---|---|---|
| Portfolio | Desktop | 3 | 100 | 0.6 s | 0.021 | 0 ms | 1,940 KiB | 82 KiB | yes |
| Portfolio | Mobile | 3 | 60 | 12.6 s | 0.270 | 0 ms | 1,940 KiB | 82 KiB | no: score, LCP, CLS |
| Game | Desktop | 3 | 80 | 3.5 s | 0.006 | 2 ms | 3,654 KiB | 515 KiB | no: score, LCP |
| Game | Mobile | 3 | 57 | 19.9 s | 0.010 | 403 ms | 3,654 KiB | 515 KiB | no: score, LCP, TBT |

The default budget here is score ≥ 90, LCP ≤ 2.5 s, CLS ≤ 0.1 and TBT ≤ 200 ms. A client's own numbers would replace it.

**Why several runs.** The portfolio's three mobile scores were 60, 60 and 59. The game's were **41, 59 and 57**. A single run of the game could have said 41 or 59. The portfolio's first single run read 54, and its median is 60. Desktop was steadier on both sites (100, 100, 99 and 80, 81, 80), so the spread is a mobile problem here. That's what these two sites showed, not a rule, and it's why desktop gets the same 3 runs: no page has been shown to be steady without them.

**What the causes said.**
- **Portfolio, mobile:** the score alone says "slow", and nothing about why. The largest element is the author's portrait, a 1,723 KiB PNG shown at 319 px wide. Lighthouse estimates the largest savings from a modern format and a correct size, and a smaller one from render-blocking fonts. The JavaScript is only 82 KiB, so a "make the code faster" ticket would have been wasted. The estimates overlap, so they aren't added together.
- **Game, mobile:** the largest element is text the app draws itself, so LCP waits for about 515 KiB of JavaScript to run, and TBT is 403 ms. That's consistent with a heavy first load, but this check measures and doesn't prescribe. The fix belongs in its own ticket.

## What's proven, and what isn't

| Part | Status | What would prove it |
|---|---|---|
| Lighthouse, 3 runs on each of mobile and desktop, on two live sites, one pinned version | **Proven**, run for this doc | — |
| Median summary script, reading the LCP element and the biggest savings | **Proven**, run on the real reports above | — |
| Run-to-run spread | **Observed**: scores 41 to 59 on one page | — |
| CI gate: Lighthouse CI against a PR's testing deploy, failing over budget | **Not yet proven.** Its config format is documented ([configuration](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md)), but the assertions weren't run | One real PR where an over-budget change fails and a fixed one passes |
| Real-visitor data (LCP, INP, CLS) | **Not yet proven.** Cloudflare's docs say its Web Analytics reports all three ([docs](https://developers.cloudflare.com/web-analytics/data-metrics/core-web-vitals/)); not yet set up on a real site | Data from a live site, and whether the added script fits the budget |
| Pages behind a login, or reached through several steps | **Not yet proven** | A scripted flow measured the same way |
| Pages that call a metered third-party API (maps, payments) | **Deliberately not run**: each run spends quota | A stubbed or sandboxed run |
| Native mobile apps (startup time, dropped frames, app size) | **Not yet proven**; a different toolchain | A real run on a real app, as `mobile-agent-loop.md` asks for UI driving |

## Sources

- [Defining the Core Web Vitals metrics thresholds, web.dev](https://web.dev/articles/defining-core-web-vitals-thresholds)
- [Lighthouse performance scoring, Chrome for Developers](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)
- [Lighthouse variability, GitHub](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md)
- [Lighthouse CI configuration](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md) and [getting started](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md)
- [Cloudflare Web Analytics, Core Web Vitals](https://developers.cloudflare.com/web-analytics/data-metrics/core-web-vitals/)
