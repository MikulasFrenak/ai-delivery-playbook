---
name: test-scaffold
disable-model-invocation: true
description: Scaffolds or updates a component/CT test driven by the issue tracker's own Test Case work items, written in user language rather than implementation detail. Use after creating or modifying a component. NEVER auto-invoke — only run when user explicitly types /test-scaffold.
---

# test-scaffold — Scaffold a Test Case–Driven Component Test

## Overview

After creating or modifying a component, run this skill to add a component/CT test — driven by the issue tracker's own **Test Case** work items (if this project's tracker has that work-item type) rather than invented from scratch. Test cases are the specification; the test implements them. If this project's tracker has no Test Case work-item type, skip straight to Step 4 and write the test directly from the component's behavior — the scaffolding pattern (Steps 4–7) still applies.

---

## Step 1: Identify the Component

If the user provided a component path, use it. Otherwise ask: _"Which component should I write a test for?"_

---

## Step 2: Fetch Existing Test Cases (Primary Path)

**Search the issue tracker before writing any test**, if it has a Test Case (or equivalent) work-item type. Test cases are the specification — the test implements them, not the other way around.

Search for test cases covering this component or feature area (adapt the query to this project's tracker and project key):

```
<issue-tracker MCP search tool>
jql/query: project = <PROJECT-KEY> AND issuetype = "Test Case" AND summary ~ "<feature area>"
```

**If test cases are found:**
- Read each one's description: extract Precondition, Steps, and Expected Result
- If this project uses a traceability code prefix in the summary (e.g. a QA case ID like `QA-042 - ...`), note it — it maps 1:1 to one test block
- Map each test case to one test block
- Translate each business-language step into the appropriate component assertion or interaction
- Proceed to Step 4 (Read the Component)

**If no test case is found → go to Step 3**

---

## Step 3: Create a New Test Case (Fallback Path)

When no relevant test case exists, create one **before** writing the test spec, if this project's tracker supports it.

### Test case language — user/business language only

Test cases must be readable by QA, product, and other stakeholders, not just developers. Write from the user's perspective — what they see and do — never from the implementation's perspective.

| Developer language ✗ | User language ✓ |
|---|---|
| Mount `Component` with a fully populated data prop | Open the view for a [user/entity] that has complete data for the day |
| `someCount: 0` | No [X] is recorded for this period |
| Call the `onToggle` prop | Click the row to expand its detail view |
| `expanded={false}` prop | The summary row is in its collapsed state |
| Render with `names: ['Example Name']` | The record has a [role] assigned |
| Mount with `loading={true}` | The data for this section is still loading |

### Find the next traceability code (if this project uses one)

Search for the highest existing code in the relevant area, increment by one. Skip this entirely if the project has no such convention — not every tracker needs one.

### Test case description format

Summary: `<code prefix if used> - <Feature> - <Section> - <short user-language description>`

Description:
```
**Precondition:**
<What state the system or data must be in, described as what a user would see, not as component props>

**Steps:**
1. <User action or observable state>
2. <Next step, if a different mounted state is needed>

**Expected Result:**
- Step 1: <What the user should see, written for a non-developer>
- Step 2: <What the user should see>

**Code:** `<path to spec file>`
```

### Create the issue

Use this project's issue-tracker MCP create-issue tool with the project key, issue type, summary, and description above.

### Traceability automation (if this project's tracker has one)

Some trackers have an automation rule that links a new Test Case into a Requirements Traceability Matrix (RTM) or equivalent, but can't be triggered via the MCP/API — only from the tracker's own UI. If this project has such a rule, **remind the user to run it manually** after creating the issue; don't assume the MCP can do it.

---

## Step 4: Read the Component

Read the component to understand:
- Props and their types
- Rendered output (key elements, states)
- The project's QA-selector convention (e.g. a `data-test`/`data-testid` attribute, imported from a shared selectors file — never inline strings)
- Loading / empty / error states
- Whether it depends on routing, i18n, or direct API calls

## Step 5: Check for an Existing Spec

Look for an existing spec file alongside the component. If found, update it rather than create a new one.

**File placement rule:**
- **Component-level spec** — lives next to the component, mounts it directly with props; doesn't need the parent view
- **View/integration spec** — lives next to the view, reserved for concerns that span multiple components or need shared state
- If an existing view spec has tests that only exercise one component in isolation, split those out into that component's own spec file

## Step 6: Choose a Pattern

Pick the pattern matching the component's needs. Use this project's actual component-testing framework and import path — the shapes below are illustrative (Playwright CT is a common choice, but substitute this project's own).

### Pattern 1 — Base (default, most cases)

For components with no router dependency, no i18n variants, no direct API calls.

```tsx
import { test, expect } from '<this project's test-utilities import>'
import { qa } from '<this project's QA-selectors file>'
import { MyComponent } from '.'

test.describe('MyComponent', () => {
  test('renders default state', async ({ mount, page }) => {
    await mount(<MyComponent prop="value" />)
    await expect(page.getByTestId(qa.myComponent.root)).toBeVisible()
  })

  // Add if applicable:
  test('renders loading state', async ({ mount, page }) => { /* ... */ })
  test('renders empty state', async ({ mount, page }) => { /* ... */ })
  test('renders error state', async ({ mount, page }) => { /* ... */ })
})
```

**Callback verification:** if this project's CT setup proxies through a separate process (e.g. a remote-browser grid), a Node-side callback counter may never see what happened in the real browser — see "Testing Infrastructure" in `AGENTS.md`/`CLAUDE.md` for the cross-process bridge quirk and the browser-side event-tracking workaround, if this project has documented one. Don't assume a plain `expect.poll(() => callCount)` works without checking first.

### Pattern 2 — Context Extension (i18n variants or routing)

Use when the component needs language-specific content tested, or depends on routing (`useParams`, `useNavigate`, `useSearchParams`, `Link`, or an internal hook that wraps any of these).

```tsx
import { test, expect } from '<this project's test-utilities import>'
import { MemoryRouter } from 'react-router-dom'   // if routing needed
import { qa } from '<this project's QA-selectors file>'
import { MyComponent } from '.'

test.describe('MyComponent', () => {
  test('shows correct text in [language]', async ({ mount, page }) => {
    await mount(
      <SomeI18nProviderForTests language="en">
        <MyComponent />
      </SomeI18nProviderForTests>
    )
    await expect(page.getByTestId(qa.myComponent.title)).toHaveText('Expected text')
  })

  test('renders with router context', async ({ mount, page }) => {
    await mount(
      <MemoryRouter initialEntries={['/some/path']}>
        <MyComponent />
      </MemoryRouter>
    )
    await expect(page.getByTestId(qa.myComponent.root)).toBeVisible()
  })
})
```

### Pattern 3 — API Mocking (components that fetch data)

Use when the component calls an API directly (e.g. via a data-fetching hook). Intercept the request before mounting, using whatever request-mocking utility this project provides.

```tsx
import { test, expect } from '<this project's test-utilities import>'
import { mockApi } from '<this project's API-mocking utility>'
import { qa } from '<this project's QA-selectors file>'
import { MyComponent } from '.'

const mockData = { items: [{ id: 1, name: 'Test' }] }

test.describe('MyComponent', () => {
  test('shows data after load', async ({ mount, page }) => {
    await mockApi(page, '/api/endpoint', mockData)
    await mount(<MyComponent />)
    await expect(page.getByTestId(qa.myComponent.row)).toBeVisible()
  })

  test('shows empty state when no data', async ({ mount, page }) => {
    await mockApi(page, '/api/endpoint', { items: [] })
    await mount(<MyComponent />)
    await expect(page.getByTestId(qa.myComponent.emptyState)).toBeVisible()
  })
})
```

> Check this project's own mocking-utility implementation for its exact signature before using it — don't assume the shape above matches.

---

## Step 7: Rules

- Always import QA selectors from the project's shared selectors file — never hardcode inline `[data-test="..."]`-style strings
- Use this project's real test-utilities import — not a generic framework import, if the project documents its own wrapper
- One behavior per test block
- Cover at minimum: default render, one key interaction, empty/loading/error states if they exist

## Step 8: Verify Config

Check this project's component-test config for the actual spec file naming pattern it picks up (e.g. `*.spec.tsx` vs `*.ct.tsx`) — don't assume.

## Step 9: Confirm

Tell the user:
1. Where the spec file was written and which test cases it covers
2. If a new tracker Test Case was created: the issue key/URL
3. If this project has a manual traceability-automation step (see Step 3): remind the user to run it
