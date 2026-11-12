# Figma Plugin — Draw a Design Brief Without the MCP's Limit

The reference behind [`/figma-plugin`](../skills/figma-plugin.md): why a local development plugin, the manifest, a code skeleton, the layout rules learned on a live run, how to check a script without Figma, and what's proven. The skill is the procedure; this is what it cites.

Figma facts below were read from Figma's developer docs on 2026-11-12 (sources at the end). Figma says it "may change rate limits at any time", so check the current page before relying on a number.

---

## Why a plugin

| Option | What the docs and the live run say |
|---|---|
| **Remote MCP server, `use_figma`** | The only MCP path that writes to the canvas. The write-to-canvas page lists Professional, Education, Organization and Enterprise plans, calls it a beta that is free during the beta and will become usage-based paid. The rate-limits page gives "up to 20 per month" for View and Collab seats and doesn't say when a limit resets or whether `use_figma` counts. On a Starter plan the live run hit "tool call limit" after a few calls, twice in three days |
| **Desktop MCP server** | Needs the Figma desktop app and a Dev or Full seat on Professional or above. Read-only: the page says it "doesn't support writing to the canvas" |
| **A community plugin or MCP bridge** | Several exist (a plugin plus a local socket server). Not used or evaluated here: it is third-party code that would run inside the person's Figma and talk to the agent |
| **A development plugin you write** | The docs say plugin development and testing needs the Figma desktop app, and say nothing about plans or seats. Live: it ran on a Starter plan with a full editing seat. No quota, readable before it runs, re-runnable |

A plugin script is the same Plugin API code an `use_figma` call runs, so a script written for one is close to a script written for the other. The differences are in "Rules" below.

## The plugin

Two files in a folder.

```json
{
  "name": "<descriptive name>",
  "id": "<a number-like id you make up>",
  "api": "1.0.0",
  "main": "code.js",
  "editorType": ["figma"],
  "documentAccess": "dynamic-page",
  "networkAccess": { "allowedDomains": ["none"] }
}
```

- `documentAccess: "dynamic-page"` is what Figma's manifest page says is required for new plugins (its field list also marks it optional, so the docs are ambiguous; the live run declared it and ran). With it, the code loads pages and nodes asynchronously: `figma.setCurrentPageAsync(page)` to switch, `loadAsync()` before reading another page's children, `figma.getNodeByIdAsync`, and `figma.loadAllPagesAsync()` before a document-wide search.
- `networkAccess` with `["none"]` keeps the plugin from reaching the internet. A plugin that draws a design has no reason to.
- `figma.closePlugin(message)` shows the message as a toast when the plugin closes. It is how the script reports back.

Run it: **Plugins → Development → Import plugin from manifest…** (the live run used this item; Figma's quickstart names the **Plugins → Development** menu), pick `manifest.json`, then run it from the same menu. **Cmd+Option+P** runs the last plugin again.

## Skeleton

Generic: replace the names in `CONFIG` with the file's own. Everything is plain Plugin API.

```js
const CONFIG = {
  page: '<page name>',
  collection: '<variable collection name>',
  owns: '<prefix>',            // every top-level node the script makes starts with this
  fonts: [['<Display family>', 'Bold'], ['<Body family>', 'Regular'], ['<Mono family>', 'Regular']],
  family: { display: '<Display family>', sans: '<Body family>', mono: '<Mono family>' },
};

function mkAuto(dir) {
  const f = figma.createFrame();
  f.layoutMode = dir; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
  return f;
}

async function main() {
  const page = figma.root.children.find(p => p.name === CONFIG.page);
  if (!page) throw new Error('No page named ' + CONFIG.page);
  await figma.setCurrentPageAsync(page);
  page.children.filter(n => n.name.indexOf(CONFIG.owns) === 0).forEach(n => n.remove());

  const collection = (await figma.variables.getLocalVariableCollectionsAsync()).find(c => c.name === CONFIG.collection);
  if (!collection) throw new Error('No variable collection named ' + CONFIG.collection);
  const vars = await Promise.all(collection.variableIds.map(id => figma.variables.getVariableByIdAsync(id)));
  const V = Object.fromEntries(vars.map(v => [v.name, v]));
  await Promise.all(CONFIG.fonts.map(([family, style]) => figma.loadFontAsync({ family, style })));
  const diag = [];

  // a fill bound to a variable; setBoundVariableForPaint returns a NEW paint
  const bind = (name, prefix = '') => {
    if (!V[prefix + name]) throw new Error('Missing variable ' + prefix + name);
    return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', V[prefix + name]);
  };

  function text(prefix, str, o) {
    const t = figma.createText();
    t.fontName = { family: CONFIG.family[o.f], style: o.s || 'Regular' };
    t.characters = str; t.fontSize = o.size;
    if (o.lh) t.lineHeight = { unit: 'PIXELS', value: o.lh };
    t.fills = [bind(o.c || 'text/primary', prefix)];
    try { t.setBoundVariable('fontFamily', V['font/' + o.f]); } catch (e) { diag.push('fontFamily not bound: ' + e.message); }
    if (o.wrap) t.textAutoResize = 'HEIGHT';
    if (o.name) t.name = o.name;
    return t;
  }

  function box(prefix, dir, o = {}) {
    const f = mkAuto(dir);
    f.name = o.name || 'frame'; f.itemSpacing = o.gap || 0;
    const p = o.pad || [0, 0, 0, 0];
    f.paddingTop = p[0]; f.paddingRight = p[1]; f.paddingBottom = p[2]; f.paddingLeft = p[3];
    f.fills = o.fill ? [bind(o.fill, prefix)] : [];
    if (o.stroke) { f.strokes = [bind(o.stroke, prefix)]; f.strokeWeight = 1; f.strokeAlign = 'INSIDE'; }
    if (o.r !== undefined) f.cornerRadius = o.r;
    if (o.main) f.primaryAxisAlignItems = o.main;
    if (o.cross) f.counterAxisAlignItems = o.cross;
    return f;
  }

  // FILL is only valid inside an auto layout parent, and only after the child is appended
  const add = (parent, node, fillW, fillH) => {
    parent.appendChild(node);
    if (fillW) node.layoutSizingHorizontal = 'FILL';
    if (fillH) node.layoutSizingVertical = 'FILL';
    return node;
  };

  // a component set with variants and one editable text; instances are made with instance()
  function makeKit(prefix, label) {
    const variants = ['closed', 'open'].map((state, i) => {
      const c = figma.createComponent();
      c.name = 'State=' + state; c.layoutMode = 'HORIZONTAL';
      c.paddingTop = c.paddingBottom = 11; c.paddingLeft = c.paddingRight = 14; c.cornerRadius = 8;
      c.fills = state === 'open' ? [bind('surface/tint', prefix)] : [];
      add(c, text(prefix, 'Label', { f: 'sans', size: 14, lh: 20 }), false);
      c.x = i * 240;
      return c;
    });
    const set = figma.combineAsVariants(variants, figma.currentPage);
    set.name = CONFIG.owns + ' Row/' + label;
    const key = set.addComponentProperty('Label', 'TEXT', 'Label');
    set.children.forEach(v => { v.findOne(n => n.type === 'TEXT').componentPropertyReferences = { characters: key }; });
    return set;
  }
  function instance(set, variant, texts) {
    const i = set.defaultVariant.createInstance();
    const keys = Object.keys(i.componentProperties);
    const map = Object.assign({}, variant);
    Object.entries(texts || {}).forEach(([n, v]) => { const k = keys.find(x => x.indexOf(n + '#') === 0); if (k) map[k] = v; });
    i.setProperties(map);
    return i;
  }

  // equal-height columns: hug, measure, then give every column the tallest height as a minimum
  function columns(prefix, kit, items) {
    const row = box(prefix, 'HORIZONTAL', { name: 'Columns', fill: 'surface/base', stroke: 'line/subtle', r: 16 });
    const cols = items.map(item => {
      const c = box(prefix, 'VERTICAL', { gap: 14, pad: [26, 22, 20, 22], main: 'SPACE_BETWEEN' });
      add(c, text(prefix, item.title, { f: 'display', s: 'Bold', size: 16, lh: 22 }), true);
      add(c, instance(kit, { State: 'closed' }, { Label: item.label }), true);
      add(row, c, true);
      return c;
    });
    const tallest = Math.max.apply(null, cols.map(c => c.height));
    cols.forEach(c => { try { c.minHeight = tallest; } catch (e) { c.primaryAxisSizingMode = 'FIXED'; c.resize(c.width, tallest); c.layoutSizingHorizontal = 'FILL'; } });
    diag.push('columns ' + cols.map(c => Math.round(c.height)).join('/') + ', row ' + Math.round(row.height));
    return row;
  }

  const kit = makeKit('', 'Light');
  const frame = box('', 'VERTICAL', { name: CONFIG.owns + ' Frame · Light', gap: 40, pad: [80, 80, 80, 80], fill: 'surface/page' });
  frame.resize(1280, 100); frame.counterAxisSizingMode = 'FIXED'; frame.primaryAxisSizingMode = 'AUTO';
  add(frame, columns('', kit, [{ title: 'One', label: 'All 2 items' }, { title: 'Two', label: 'All 7 items' }]), true);
  frame.x = 0; frame.y = 4000;
  figma.viewport.scrollAndZoomIntoView([frame]);
  return { diag };
}

main().then(r => figma.closePlugin('Drew the frames. ' + (r.diag[0] || '')))
  .catch(e => figma.closePlugin('Failed: ' + (e && e.message ? e.message : e)));
```

Extend it with one builder per frame and a placement loop. The live run had a data block (the facts, copied from verified sources), one `makeKit` per component, two frame builders (desktop and phone) and a plan array of `[theme prefix, kit, builder, options, width]`.

## Rules learned live

1. **`FILL` needs an auto layout parent and an appended child.** Set it after `appendChild`. Setting it before throws.
2. **`resize()` resets the sizing modes to fixed.** Call it first, then set `layoutSizing*`.
3. **Wrapping text needs `textAutoResize = 'HEIGHT'` and a width,** usually `FILL`. The default grows the text into one line.
4. **A hugging parent needs at least one child that defines its size.** In the live run a row of five columns, all set to fill the parent's height inside a parent that hugs its height, collapsed to the columns' padding (48 px) and clipped everything in them. The fix is the `columns` helper above: let the columns hug, measure, then give each the tallest height as a minimum. `minHeight` is documented on `FrameNode` for auto layout frames and their direct children; the fallback sets a fixed height.
5. **Absolute children** (arrows between columns, a badge on a corner): append, set `layoutPositioning = 'ABSOLUTE'`, then `x` and `y`, after the parent's size is known.
6. **Components:** `combineAsVariants`, then `addComponentProperty` (the key it returns ends in `#id`), then point the text node at it with `componentPropertyReferences`. Instances take `setProperties` with those keys; find them by prefix.
7. **Variables:** bind fills with `setBoundVariableForPaint` (it returns a new paint, so reassign). A dark theme held as a parallel group of variables is a second prefix, as in the skeleton. Binding a font family can fail on some values: catch it and report, don't stop.
8. **Fonts:** load every font and style before writing text. A family can lack a weight (a display family with no semibold): choose the nearest in the brief.
9. **Don't use an MCP environment's helpers.** `figma.createAutoLayout` is not in the public Plugin API (not on the `figma` object or `FrameNode` pages); `mkAuto` replaces it. Write plain API.
10. **Remove your own earlier output first,** by name prefix, so a re-run never draws twice and never touches the person's frames.

## Check without Figma

`node --check code.js` catches syntax. A small mock of the Plugin API catches typos, a missing variable, an `appendChild` on a text node and calls in the wrong order. A sketch:

```js
const fs = require('fs'), vm = require('vm');
class N {
  constructor(type) { this.type = type; this.children = []; this.width = 100; this.height = 40; this.name = ''; this.fills = []; this.componentProperties = {}; }
  appendChild(c) { if (this.type === 'TEXT') throw new Error('append to text'); c.parent && c.parent.children.splice(c.parent.children.indexOf(c), 1); c.parent = this; this.children.push(c); }
  resize(w, h) { this.width = w; this.height = h; }
  findOne(fn) { const w = n => { for (const c of n.children) { if (fn(c)) return c; const r = w(c); if (r) return r; } }; return w(this) || new N('TEXT'); }
  addComponentProperty(n) { return n + '#1:0'; }
  setBoundVariable() {}
}
const vars = ['text/primary', 'surface/base', 'surface/page', 'surface/tint', 'line/subtle', 'font/display', 'font/sans', 'font/mono'].map((n, i) => ({ id: 'v' + i, name: n }));
const page = new N('PAGE'); page.name = '<page name>';
const figma = {
  root: { children: [page] }, currentPage: page, setCurrentPageAsync: async () => {}, loadFontAsync: async () => {},
  variables: { getLocalVariableCollectionsAsync: async () => [{ name: '<variable collection name>', variableIds: vars.map(v => v.id) }], getVariableByIdAsync: async id => vars.find(v => v.id === id), setBoundVariableForPaint: (p, f, v) => ({ bound: v.name }) },
  createFrame: () => { const f = new N('FRAME'); f.parent = page; page.children.push(f); return f; },
  createText: () => new N('TEXT'), createComponent: () => new N('COMPONENT'),
  combineAsVariants: (nodes, parent) => { const s = new N('COMPONENT_SET'); s.children = nodes; s.defaultVariant = { createInstance: () => { const i = new N('INSTANCE'); i.componentProperties = { State: {}, 'Label#1:0': {} }; i.setProperties = () => {}; return i; } }; parent.children.push(s); return s; },
  viewport: { scrollAndZoomIntoView() {} }, closePlugin: m => console.log('closePlugin:', m),
};
vm.runInContext(fs.readFileSync(process.argv[2], 'utf8'), vm.createContext({ figma, console, Promise, Object, Array, Math, JSON, Error, String }));
```

The mock doesn't compute layout, so it can't see the collapse in rule 4 or anything else visual. That is why the skill's Step 7 asks the person for a screenshot.

## What's proven, and what isn't

| Claim | Status |
|---|---|
| A development plugin imports from a manifest and runs in the Figma desktop app, with a message on close | **Proven**, live, 2026-11-12, one design file, Starter plan, full editing seat |
| One run drew two component kits (variants, editable text) and ten frames: desktop and phone, light and dark | **Proven**, from the person's screenshot |
| Colours resolve from the file's variables, including a parallel dark group | **Proven** by outcome: the dark frames came out dark, which they would not with raw or missing fills |
| The collapse in rule 4 happened and the hug-and-minimum-height fix removed it | **Proven**, by the person's screenshots before and after. Which branch ran (`minHeight` or the fixed-height fallback) wasn't recorded |
| A static check and a mock run catch typos and ordering mistakes | **Proven**, and **also proven not to catch layout**: the collapsed columns passed it |
| A development plugin needs a particular plan or seat | **Not stated** in Figma's docs; only the Starter plan with a full seat was tried |
| Running a development plugin in the browser | **Not tried**; the docs say the desktop app is required |
| A plugin handing a rendered image back to the agent | **Not tried** |
| A file with several variable modes, FigJam, Slides | **Not tried** |

## Worked example

A portfolio site's methodology section: a five-stage pipeline in a row, a disclosure row at the bottom of each stage, an opened list of cards under the pipeline, a stage-to-stage highlight, and a phone layout that stacks the stages. Brief: ten frames (five desktop light states, two desktop dark, three phone) and two component kits (a disclosure row with three states, an item card with four). The first run drew all of it; the person's screenshot showed the pipeline collapsed; the script was fixed (rule 4), gained its self-cleanup and a diagnostics line, and the second run came out as intended. The facts in the cards (names, one-line descriptions, which workflow uses which skill) were read from the playbook's own files beforehand, not written in the script.

## Sources

Figma developer docs, read 2026-11-12 (through a research agent, not spot-checked page by page; where two statements on one page disagree, that is said above):

- Rate limits and access: https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/
- Write to canvas: https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/
- Desktop server: https://developers.figma.com/docs/figma-mcp-server/local-server-installation/
- Remote server installation: https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/
- Plugin quickstart: https://developers.figma.com/docs/plugins/plugin-quickstart-guide/
- Manifest: https://developers.figma.com/docs/plugins/manifest/
- Dynamic page loading: https://developers.figma.com/docs/plugins/migrating-to-dynamic-loading/
- `FrameNode` (`minHeight`, `layoutMode`): https://developers.figma.com/docs/plugins/api/FrameNode/
- `figma.closePlugin`: https://developers.figma.com/docs/plugins/api/properties/figma-closeplugin/
