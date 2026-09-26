# 01 — Application Analysis (Reverse Engineering)

**Source of truth:** `HB TRONICS SaaS Simulator (offline).html` (13,029,884 bytes / 392 lines on disk).
**Analysis date:** 2026-08-15
**Status:** Read-only reverse engineering. The original HTML was **not modified**. All extraction was performed on copies in a scratchpad directory.

> Note on filename: the brief referenced `HB TRONICS SaaS Simulator (offline)(1).html`. The file physically present in the project folder is `HB TRONICS SaaS Simulator (offline).html` (no `(1)` suffix). This is the file analysed.

---

## 1. What the outer file actually is

The 13 MB HTML file is **not** the application. It is a **self-unpacking "bundler" wrapper**. The visible outer document contains only:

- A loading shell (`#__bundler_thumbnail` splash with an inline SVG "HB" logo on `#0E1114`, and a `#__bundler_loading` "Unpacking…" status chip).
- A `<noscript>` fallback ("This page requires JavaScript to display.").
- A bootstrap `<script>` (lines 33–370) that, on `DOMContentLoaded`, reads embedded data blocks, decodes them into `blob:`/`data:` URLs, rebuilds the real document, and swaps it in via `document.open()/write()` style replacement.
- Four data carrier `<script>` tags at the end of the file (the real payload).

The bootstrap advertises itself in comments as a **"bundler"** with support for **nested page bundles (iframe targets)** using an `about:blank#<uuid>` relay protocol, a parent-chain text relay, and CSP-safe blob minting for `file://` / opaque origins. Only the single-page path is used here (`page_order` is empty).

### The four payload carriers

| Line | `<script type>` | Size | Contents |
|------|-----------------|------|----------|
| 377 | `__bundler/manifest` | ~12.6 MB | JSON map of `uuid → {mime, compressed, data(base64)}` — every embedded resource (CSS, HTML sub-apps, JS libs, images, fonts). |
| 381 | `__bundler/ext_resources` | 5,187 B | JSON array mapping original URLs / relative paths (`./Scanner.dc.html`, `assets/*.png`, Google Fonts URLs, unpkg URLs) → manifest `uuid`. |
| 385 | `__bundler/page_order` | `[]` | Empty — this is a single-page bundle (the 5 tools are imported components, not separate navigable pages). |
| 389 | `__bundler/template` | 119,947 B (JSON) → 114,279 B (HTML) | The **real application document**, JSON-string-encoded. |

### How the bootstrap rebuilds the app (observed in lines 33–370)

1. Parse `manifest`, `template`, `ext_resources`, `page_order`.
2. For each manifest entry: base64-decode → `gunzip` if `compressed:true` → create a `Blob` → `URL.createObjectURL`. Build `window.__resources = { <original-id> : blob:URL }`.
3. Substitute resource references inside the template with their blob URLs.
4. Replace the live document with the decoded template HTML.
5. If `window.Babel` is present, call `Babel.transformScriptTags()` (the app scripts are JSX-in-`text/babel` style, transformed by the custom runtime — see §4).

---

## 2. Decoded resource inventory (manifest: 83 entries)

| Type | Count | Notes |
|------|------:|-------|
| `text/html` (gzip) | 6 | Main template (113.5 KB) + 5 tool sub-apps (`Scanner`, `Multimeter`, `Oscilloscope`, `Location`, `Schematic` `.dc.html`). |
| `text/css` (gzip) | 6 | Google-Fonts CSS variants (IBM Plex families) — 15–19 KB each, plus 3 large webfont CSS blobs (~1.0–1.1 MB each). |
| `text/javascript` (gzip) | 3 | `dc-runtime` (67.5 KB), React 18.3.1 UMD (10.5 KB), ReactDOM 18.3.1 UMD (128.7 KB). |
| `image/png` | 40 | UI reference photos, fuse-box layouts, component detail/vehicle-view images, wiring diagram. |
| `image/jpeg` | 1 | `ref/knock/img.jpeg`. |
| `font/woff2` | 27 | IBM Plex Sans / Mono / Sans Condensed, multiple weights + unicode ranges (latin, latin-ext, cyrillic, vietnamese, greek). |

Original external origins recorded in `ext_resources` (all inlined, none fetched at runtime):
- `https://fonts.googleapis.com/css2?family=IBM+Plex+Sans…` (3 variants) and `fonts.gstatic.com` woff2 files.
- `https://unpkg.com/react@18.3.1/umd/react.production.min.js`
- `https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js`

---

## 3. Application architecture

The decoded application is a **single-page React 18 SaaS shell** hosting **five embedded diagnostic-tool sub-applications**. It is a **design/prototype demo** ("Bundled Page", `$preview` 1440×900) — a coverage-2026.7 marketing/training simulator for automotive technicians, themed around HB TRONICS.

```
Bundler wrapper (outer 13 MB HTML)
└── Decoded template  = App Shell (React, class "Component extends DCLogic")
    ├── Global left rail + top bar + component-context system + toast
    ├── Shell screens: Login, Hub, Garage, Progress, Reports, Settings, Coverage-gate
    └── <dc-import> embedded tool components (each its own .dc.html bundle):
        ├── Scanner      (SCN) — diagnostic scanner, 14 internal screens
        ├── Multimeter   (DMM) — guided static measurement, 12 components
        ├── Oscilloscope (OSC) — 7-component waveform lab
        ├── Location     (LOC) — component-location atlas + quiz
        └── Schematic    (WDG) — wiring-diagram workspace (~55 parts, ~140 wires)
```

### Shared "single bench" model (the product's core idea)
The login tagline states it explicitly: *"Five specialised tools. One diagnostic bench."* The shell enforces three shared pieces of state that flow into every tool:

1. **One vehicle** — active vehicle (default Toyota Corolla 1.6 1ZR-FE) with a per-tool **coverage matrix**; tools without an installed data pack show a **coverage gate** instead of opening.
2. **One component under test** ("focus") — 11 shared components (`CTX` in shell). Selecting one in the shell scrolls each tool to that component; selecting inside a tool calls back (`on-select`) to update the shell.
3. **One learning record** — Progress + Reports screens aggregate sessions filed against the vehicle, not the tool.

### Prop contract (shell → tools), from `<dc-import>` tags
- **Scanner:** `embedded=true` (no props besides embedding).
- **Multimeter:** `focus`, `instrument`, `probe-mode`, `random-fault`, `hints`, `on-select`.
- **Oscilloscope:** `start-component`, `theme="light"`, `signal-noise`, `on-select`.
- **Location:** `start-screen="app"`, `focus`, `difficulty`, `show-outlines`, `on-select`.
- **Schematic:** `focus`.

---

## 4. The "dc" runtime (rendering framework)

`dc-runtime` (67.5 KB, header: *"GENERATED from dc-runtime/src/*.ts … Rebuild with `cd dc-runtime && bun run build`"*) is a **custom template-binding layer on top of React 18 UMD**. It is not a mainstream framework.

Key mechanics observed:
- Each component ships as a `.dc.html` fragment with a pre-rendered HTML **template** inside `<x-dc>…</x-dc>` and a **logic script** in `<script type="text/x-dc" data-dc-script data-props="{…}">`.
- The logic script defines `class Component extends DCLogic` with React-style `state`, `componentDidMount/Update/WillUnmount`, event handlers, and a **`renderVals()`** method that returns a flat object of binding values.
- The template binds via string-interpolation directives (`{{ value }}`) and custom attributes. Tokens seen in the runtime and templates:
  `sc-if`, `sc-for`, `sc-interp`, `sc-html`, `sc-placeholder`, `sc-missing`, `sc-host`, `sc-helmet`, `sc-shine`, `sc-camel-*` (e.g. `sc-camel-on-click`), `style-hover`, `hint-size`, `hint-placeholder-val`, `data-dc-tpl`, `data-dc-canvas`, `dc-import`.
- `data-props` on each component declares an **editor prop schema** (enum/boolean/string with defaults and sections) — indicating these were authored in a visual design tool with a props panel.

The shell's `data-props`:
- `startScreen` (enum: login, hub, scanner, multimeter, oscilloscope, location, schematic, progress, reports, settings, garage; default `login`)
- `railLabels` (boolean, default false)
- `hubLayout` (enum: Cards / Compact rows; default Cards)

---

## 5. Nature & fidelity of the simulation

This is **not** a mock-up with fake numbers only. The five tools contain **coherent, cross-referenced automotive engineering data** for one real-world vehicle (Toyota Corolla 1.6 16V VVT-i, engine **1ZR-FE**, 2013–2018):

- The **Schematic** holds an actual harness netlist: ~55 components with canvas coordinates and ~140 wires each `[ECU-pin, colour, target-component, target-pin, target-colour]`.
- The **Multimeter** holds pin-function maps and ECU pin links that **match the Schematic** (e.g. MAF `L3` pin 4 → ECU `B92`; injector `A1` pin 2 → `B20`), with real measurement specs and pass/fail branches.
- The **Oscilloscope** synthesises waveforms from **per-component math functions** (`fn(ch,p)`) — injector peak-&-hold, coil dwell/kick, Hall cam, etc. — with fault-injection that deforms the trace.
- The **Location** atlas places the same component refs on image maps with prose location descriptions.
- The **Scanner** models a 21-ECU / 3-bus (CAN-B/CAN-C/CAN-FD) network with DTCs, live PIDs (updated on a 420 ms timer), a diagnostic tree, ADAS calibration and a training scenario.

Component reference codes are **shared across all tools** (L3, L1, T1, I2, X1, X7, X8, U1/U2, H3, G1, A1/INJ, I1/COIL, etc.), which is what makes the "one component under test" concept work.

---

## 6. Extraction method (reproducible)

1. Isolated the four payload lines (378 manifest, 382 ext_resources, 386 page_order, 390 template).
2. `JSON.parse` the template line → wrote decoded `app.html` (114 KB).
3. For each manifest entry: base64 → `gunzip` (if compressed) → wrote to disk; CSS decoded to text, HTML/JS sub-apps decoded to `res_*` files, images/fonts measured only.
4. Split each `.dc.html`'s `text/x-dc` logic script into `src_*.js` for reading.

No runtime execution was required to read the source; everything is statically embedded.

---

## 7. Cross-reference to the other inventory files

- Screens → `02_SCREEN_INVENTORY.md`
- UI building blocks → `03_COMPONENT_INVENTORY.md`
- Events / state / navigation → `04_INTERACTION_INVENTORY.md`
- Images, fonts, libraries → `05_ASSET_INVENTORY.md`
- Simulator logic & data models → `06_SIMULATOR_FUNCTIONALITY.md`
- Colours, type, spacing → `07_DESIGN_SYSTEM.md`
- Tech-stack observations & risks → `08_TECHNICAL_OBSERVATIONS.md`
