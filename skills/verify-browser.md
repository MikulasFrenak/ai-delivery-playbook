---
name: verify-browser
disable-model-invocation: true
description: Verify a change in the live browser using Chrome DevTools MCP. Checks console errors, DOM structure, and takes screenshots. NEVER auto-invoke — only run when user explicitly types /verify-browser.
---

# verify-browser — Browser Verification via Chrome DevTools

## Overview

Use this skill after implementing a change to visually verify it in the running local dev environment. It uses the Chrome DevTools MCP to inspect the live page without manual browser switching.

This skill covers **web** (including a React Native app's own web build or an in-app WebView) — it doesn't apply to native RN screens, since there's no Chrome DOM to inspect there. Native mobile verification needs different tooling (a simulator/device + something like Flipper or the React Native DevTools) — this playbook doesn't have a dedicated skill for that yet.

**Prerequisites:** Chrome must be running with `--remote-debugging-port=9222`. The relevant dev server(s) must be running — for a micro-frontend setup, that includes both the shell/host app and the specific module's dev server.

**Follow the steps in order.**

---

## Workflow

### Step 1: Load Chrome DevTools Tools

Batch-load all needed schemas in a single `ToolSearch` call:

```
ToolSearch query="select:mcp__chrome-devtools__list_pages,mcp__chrome-devtools__take_screenshot,mcp__chrome-devtools__evaluate_script,mcp__chrome-devtools__list_console_messages,mcp__chrome-devtools__list_network_requests,mcp__chrome-devtools__navigate_page,mcp__chrome-devtools__press_key"
```

---

### Step 2: Find and Navigate to the Right Page

```
mcp__chrome-devtools__list_pages
```

Find the tab showing the app under test at its local dev URL. If not already there, navigate:

```
mcp__chrome-devtools__navigate_page { type: "url", url: "<target-route>" }
```

**Known routes** — maintain a table like this per project/package, or look the route up in that package's routing definitions file if it's not listed here:

| Module | URL |
|---|---|
| [module name] | `https://localhost:[port]/[path]` |

---

### Step 3: Dismiss Error Overlays

Dev-mode error overlays (e.g. Next.js, Vite) can appear for **any** unhandled error — including failures unrelated to your change, such as a sibling module/service not running locally. These are usually irrelevant to what you're verifying, but confirm via the console check before dismissing them as noise.

If an overlay is blocking the view:
1. Press `Escape` — this dismisses it without reloading
2. Take a screenshot to confirm the page is visible
3. Proceed to the console check to confirm the errors are unrelated

**Do not reload** — a reload may clear state needed for verification.

---

### Step 4: Check Console for Errors

```
mcp__chrome-devtools__list_console_messages { types: ["error", "warn"] }
```

Triage each message. Keep a running list of known-noisy patterns for this project (e.g. a manifest-fetch failure from an unrelated module, a UI library warning on initial render) and treat anything outside that list as a real signal:

| Source pattern | Action |
|---|---|
| [known noisy pattern, e.g. a sibling module's manifest fetch] | Ignore — expected when that module isn't running locally |
| [known benign framework warning] | Ignore if behavior is correct after load |
| `TypeError` / `Cannot read properties of undefined` | **Investigate** — likely a regression |
| Errors pointing to your modified files | **Fix before proceeding** |

---

### Step 5: DOM Inspection (Primary Verification)

**Always prefer DOM inspection over screenshots** — faster and more precise.

```js
// Check if an element with a test selector exists
() => !!document.querySelector('[data-test="your-qa-selector"]')

// Check text content of an element
() => document.querySelector('[data-test="your-qa-selector"]')?.textContent?.trim()

// List all data-test attributes on the page (useful for discovery)
() => Array.from(document.querySelectorAll('[data-test]')).map(e => e.dataset.test)

// Check an icon's SVG path (e.g. confirm the right icon variant rendered)
() => document.querySelector('.your-icon-class path')?.getAttribute('d')?.substring(0, 80)

// Check a form control's currently displayed value (adapt selector to your UI library)
() => document.querySelector('.your-select-class')?.textContent?.trim()

// Check computed color/style of an element
() => getComputedStyle(document.querySelector('.your-class')).color

// Check bounding rect (position/size)
() => document.querySelector('.your-target-class')?.getBoundingClientRect()

// Check a loading state is gone (adapt to your spinner class)
() => !document.querySelector('.your-spinner-class')
```

Relate what you find to what changed:
- **New icon:** confirm the SVG `<path d="...">` starts with the expected path from the component source
- **New text/label:** confirm the string appears in the DOM
- **Layout change:** check computed styles or bounding rects
- **State change:** check class names, `aria-*`, or `data-*` attributes

---

### Step 6: Screenshot (Fallback for Visual Layout)

Take a screenshot **only when DOM inspection is insufficient** — e.g. visual layout, icon appearance, overlapping elements, canvas/SVG rendering:

```
mcp__chrome-devtools__take_screenshot
```

---

### Step 7: Network Verification (API Changes Only)

If the change involves an API call (new endpoint, changed payload, cache invalidation):

```
mcp__chrome-devtools__list_network_requests { resourceTypes: ["fetch", "xhr"] }
```

Check:
- Correct endpoint was called
- Method matches (GET / POST / PUT / DELETE)
- Response status is 2xx
- The call fires **after** the triggering user action

---

### Step 8: Report

Summarise what was verified:

- **DOM / icons:** correct elements present, correct SVG paths ✅
- **Console:** no new errors ✅ (list any ignored warnings with reason)
- **Network:** correct endpoint and response ✅ (if applicable)
- **Screenshot:** attached for visual confirmation (if taken)

If anything fails, describe precisely (selector, actual vs. expected) so it can be fixed without re-running the full skill.
