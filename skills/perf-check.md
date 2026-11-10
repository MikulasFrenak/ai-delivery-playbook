---
name: perf-check
disable-model-invocation: true
description: Measures every page of a site the same way (pinned Lighthouse, mobile and desktop, several runs, the median), compares the result with a budget or a /define-slo target, and reads the causes instead of reporting only a score. Web pages only; the CI gate, real-visitor data and native mobile apps are marked not yet proven. NEVER auto-invoke — only run when user explicitly types /perf-check.
---

# perf-check — Measure Every Page the Same Way

## Overview

A performance ask ("it has to be fast on phones") is only useful once it's a number, measured the same way on every page, and compared with a target. This skill runs that measurement and, more importantly, reads **why** a page is slow, because a score alone doesn't say whether to fix an image, a font or the JavaScript.

It pairs with [`docs/web-performance.md`](../docs/web-performance.md) (thresholds, lab versus field, a worked example) the way `define-slo` pairs with `docs/sla-framework.md`. Targets come from [`/define-slo`](./define-slo.md) when there is one.

**Never auto-invoke.** It sends real requests to real sites.

---

## Inputs

- The site: a list of URLs, a sitemap, or a base URL to discover pages from
- Where it runs: production, staging, or a PR's testing deploy. **Say which.**
- The target: a `/define-slo` Reliability Target from the task file, the client's own numbers, or neither, in which case the defaults in Step 6 apply and the report says so
- Whether a task file exists to append the report to

## Output

A **Performance Report**: per-page, per-profile medians, a verdict against the budget, the top causes for every miss, the field-data status, and what wasn't measured. Appended to the task file if one exists, otherwise given in the conversation. The skill changes nothing in the site under test; each fix is a ticket of its own.

## Guardrails

- **Only sites the user owns or has permission to test.** Never run it against a third party's site.
- **Prefer a testing deploy or staging for client work.** Production runs show up as visits in analytics and can hit rate limits.
- **A page that calls a metered third-party API (maps, payments, an LLM) spends real quota on every run.** Run it once, stub the API, or leave it out and say so.
- **One report at a time on a machine, and nothing heavy running.** Parallel runs disturb each other.
- **Never invent a budget.** If there's no target, use the stated defaults and label them as defaults.
- **A lab result is not an SLO result.** Say so in the report. Field data is a separate question (Step 8).
- **Don't drop a failed run silently.** Re-run it, or report fewer runs.
- **Pages behind a login, and flows that need several steps, aren't covered here.** Say so rather than measuring the login page and calling it done.

---

## Workflow

### Step 1: Confirm Scope

Ask for what's missing: which URLs, which environment, who owns the site, and whether any page calls a metered API. Repeat the list back before running anything.

### Step 2: Build the Page List

In order of preference: the URLs the user gave; `sitemap.xml` (`curl -s <base>/sitemap.xml`); the router's routes; the navigation. Each distinct page is one URL. Anchors within a page (`#about`) are not pages.

If the site has many pages, ask which matter (entry pages, the main journeys) instead of running everything.

### Step 3: Pin the Method

| Part | Setting |
|---|---|
| Tool | Lighthouse, **one pinned version**. Its scoring weights change between versions, so scores from different versions don't compare. Use the project's pinned version if it has one |
| Profiles | Mobile (Lighthouse's default) and desktop (`--preset=desktop`) |
| Runs | 3 per page and profile; 5 when a result is close to a limit |
| Aggregate | The median |
| Conditions | Sequential, one at a time, on a quiet machine |

### Step 4: Run

Write the results to a folder, one file per run, named `<page>-<mobile|desktop>-<n>.json`:

```bash
OUT=perf-runs; mkdir -p "$OUT"
LH="lighthouse@12.8.2"   # the pinned version
run() {   # run <label> <url>
  for i in 1 2 3; do
    npx --yes "$LH" "$2" --quiet --output=json --output-path="$OUT/$1-mobile-$i.json" \
      --only-categories=performance,accessibility,best-practices,seo \
      --chrome-flags="--headless=new --no-sandbox" >/dev/null 2>&1; echo "$1 mobile $i exit=$?"
  done
  npx --yes "$LH" "$2" --preset=desktop --quiet --output=json --output-path="$OUT/$1-desktop-1.json" \
    --only-categories=performance,accessibility,best-practices,seo \
    --chrome-flags="--headless=new --no-sandbox" >/dev/null 2>&1; echo "$1 desktop 1 exit=$?"
}
run home https://example.com/        # one line per page
```

Check every `exit=` line. A page takes roughly a minute per run. Run it in the background and wait for it to finish; don't start a second batch meanwhile.

### Step 5: Summarise

Save this as `perf_summary.py` and run `python3 -I perf_summary.py perf-runs`. Pass the target's numbers if there are any (`--score 90 --lcp 2500 --cls 0.1 --tbt 200` are the defaults):

```python
import glob, json, os, re, statistics, sys

args = sys.argv[1:]
folder = args.pop(0)
budget = {"score": 90, "lcp": 2500, "cls": 0.1, "tbt": 200}
while args:
    key = args.pop(0).lstrip("-")
    budget[key] = float(args.pop(0))

groups = {}
for path in sorted(glob.glob(os.path.join(folder, "*.json"))):
    match = re.match(r"(.+)-(mobile|desktop)-\d+\.json$", os.path.basename(path))
    if not match:
        continue
    report = json.load(open(path))
    groups.setdefault((match.group(1), match.group(2)), []).append(report)

def metric(report, audit):
    return report["audits"][audit].get("numericValue") or 0

def kib(report, kind):
    items = report["audits"]["resource-summary"]["details"]["items"]
    return sum(i["transferSize"] for i in items if i["resourceType"] == kind) / 1024

versions = {r["lighthouseVersion"] for reports in groups.values() for r in reports}
print(f"Lighthouse {', '.join(sorted(versions))}\n")
print("| Page | Profile | Runs | Score | LCP | CLS | TBT | Weight | JS | Within budget |")
print("|---|---|---|---|---|---|---|---|---|---|")
medians = {}
for (label, profile), reports in sorted(groups.items()):
    score = statistics.median(r["categories"]["performance"]["score"] * 100 for r in reports)
    lcp = statistics.median(metric(r, "largest-contentful-paint") for r in reports)
    cls = statistics.median(metric(r, "cumulative-layout-shift") for r in reports)
    tbt = statistics.median(metric(r, "total-blocking-time") for r in reports)
    weight = statistics.median(metric(r, "total-byte-weight") for r in reports) / 1024
    js = statistics.median(kib(r, "script") for r in reports)
    misses = [name for name, ok in (("score", score >= budget["score"]), ("LCP", lcp <= budget["lcp"]),
                                    ("CLS", cls <= budget["cls"]), ("TBT", tbt <= budget["tbt"])) if not ok]
    verdict = "yes" if not misses else "no: " + ", ".join(misses)
    print(f"| {label} | {profile} | {len(reports)} | {score:.0f} | {lcp/1000:.1f} s | {cls:.3f} | {tbt:.0f} ms | {weight:,.0f} KiB | {js:,.0f} KiB | {verdict} |")
    medians[(label, profile)] = min(reports, key=lambda r: abs(r["categories"]["performance"]["score"] * 100 - score))

print("\nCauses, from the run closest to the median score:")
for (label, profile), report in sorted(medians.items()):
    audits = report["audits"]
    try:
        node = audits["largest-contentful-paint-element"]["details"]["items"][0]["items"][0]["node"]
        lcp_element = (node.get("snippet") or node.get("nodeLabel") or "")[:90]
    except (KeyError, IndexError):
        lcp_element = "not reported"
    savings = sorted(
        ((a.get("details", {}).get("overallSavingsMs", 0) or 0, a["title"]) for a in audits.values()
         if a.get("details", {}).get("type") == "opportunity"), reverse=True)[:3]
    print(f"- {label} {profile}: LCP element {lcp_element}")
    for ms, title in savings:
        if ms > 0:
            print(f"    - {title}: about {ms/1000:.1f} s")
```

Also report each page's per-run scores. A wide spread (the example in the doc ranged from 41 to 59) means the number is soft: say so, or run 5.

### Step 6: Compare with the Target

Use, in this order, and **say which**:

1. The task file's `/define-slo` Reliability Target.
2. Numbers the client gave.
3. The defaults: Core Web Vitals "good" values (LCP ≤ 2.5 s, CLS ≤ 0.1), TBT ≤ 200 ms as the lab stand-in for INP, and a score of 90. These are a starting point, not an answer.

A budget (a lab limit) and an SLO (a field target) are different things. The comparison here is against a budget.

### Step 7: Read the Causes

For each page that misses, name the top causes in plain words, from the Causes list: what the largest element is, what's render-blocking, what's heavy (images, fonts, JavaScript), and what shifts. Lighthouse's savings estimates overlap, so don't add them up. Check the largest element's real size on screen before blaming its file size.

One cause per line, each phrased as a finding with its evidence, not as a fix to be made. The measurement stays separate from the repair.

### Step 8: State the Field-Data Status

Follow `/define-slo` Step 4: is real-visitor data being collected for these pages? If not, write "not instrumented" next to every SLO row, because a lab run can't show whether the SLO is met. Don't recommend a vendor unprompted. If the project already has a real-user source, name it.

### Step 9: Write the Report

```markdown
## Performance Report

**Scope:** [pages, environment, date, Lighthouse version, runs per page and profile]
**Target:** [from /define-slo, the client, or the defaults]

[the table from Step 5]

**Run-to-run spread:** [per-run scores for any page where it matters]

| Page | Profile | Cause | Evidence |
|---|---|---|---|
| [e.g. home] | Mobile | [e.g. the main image is a 1.7 MB PNG shown at 319 px] | [the Causes line] |

**Field data:** [collected / not instrumented]
**Not measured:** [login-gated pages, metered pages left out, native apps, ...]
```

Append it to `<package-root>/tasks/TICKET-ID.md` if the file exists. Suggest a ticket per cause group, and don't write the fixes into this report.

### Step 10: Report

Tell the user: the table, the verdict per page, the top causes, what the lab can't tell them, and which parts of this procedure haven't been proven yet (below).

---

## What's not yet proven

Say these when they're relevant, and don't present them as part of the procedure above:

- **A CI gate** (Lighthouse CI against a PR's testing deploy, failing over budget). The config format is documented, but its assertions haven't run here.
- **Real-visitor data.** Not set up and checked on a real site.
- **Native mobile apps** (startup time, dropped frames, app size). A different toolchain.

See [`docs/web-performance.md`](../docs/web-performance.md) for what would prove each.
