# 08 — Technical Observations

Engineering notes for anyone who will later rebuild this (e.g. in Next.js). Observations only — no rebuild performed, original HTML unmodified.

---

## 1. Technology stack (as shipped)

| Layer | What it is |
|-------|-----------|
| Delivery | Single self-unpacking HTML "bundle" (13 MB). All resources base64/gzip-inlined; zero runtime network dependency. |
| View lib | React 18.3.1 (UMD, production) + ReactDOM 18.3.1 (UMD). |
| Framework | Custom **dc-runtime** (67.5 KB, built from TS via `bun`). Template-binding over React: pre-rendered `<x-dc>` HTML + `class Component extends DCLogic` logic + `renderVals()` value maps + `{{ }}`/`sc-*` directives. |
| Composition | `<dc-import name="…">` mounts each tool sub-bundle with props; the whole app is one page (`page_order: []`). |
| Authoring origin | A visual design/prototyping tool: each component declares a `data-props` editor schema (enum/boolean/string, sections, `$preview` size). This reads as an exported design prototype, not a hand-written production app. |

---

## 2. Notable strengths

- **True offline artifact:** opens from `file://` with no server, CDN, or API. Robust bootstrap with error sink, resource-load warnings, and a CSP-aware nested-page relay protocol (unused here).
- **Genuine domain simulation:** waveforms from math functions, a real harness netlist, cross-tool-consistent ECU pin numbers, guided fault trees with correct/incorrect branching. This is substantive engineering content, not lorem-ipsum.
- **Coherent product concept** cleanly expressed in state: one vehicle, one component-under-test, one learning record, coverage-gated tools.
- **Self-contained styling:** IBM Plex fully embedded; deterministic rendering.

---

## 3. Constraints / risks for a rebuild

- **No routing:** navigation is boolean `sc-if` on a `screen` string. A Next.js rebuild should introduce real routes (`/hub`, `/scanner`, `/scanner/dtcs`, …) and map the nested tool screens to nested routes or query state.
- **No persistence:** all state is in-memory; refresh resets everything. No `localStorage`/cookies/back-end. Progress/reports are hard-coded arrays. A real product needs a data layer + auth.
- **Auth is cosmetic:** login accepts anything → hub. SSO/forgot-password are toasts.
- **Inline everything:** styles, colours, and icon paths are inline literals repeated across tools — no shared tokens or component library. High duplication; a rebuild should extract a design-token set and a shared UI kit (see `03`/`07`).
- **dc-runtime is bespoke:** the `renderVals()` → template-binding pattern must be re-expressed as ordinary React/JSX components. The good news: each tool's `renderVals()` **already contains all the logic and data** in plain JS, so it ports directly; the `<x-dc>` HTML is the JSX to reconstruct.
- **Templates are large single blobs** (Scanner 189 KB HTML): componentisation is a manual decomposition job.
- **Bundle weight:** 13 MB is dominated by fonts (27 woff2 + ~3 MB of consolidated font CSS) and ~40 PNGs (several ~230 KB duplicates). A rebuild should subset fonts and deduplicate/optimise images.
- **Accessibility:** no ARIA roles/keyboard handlers observed; interactions are pointer + range-slider. Would need an a11y pass.
- **Responsiveness:** shell uses JS width breakpoints, not CSS media queries; no confirmed mobile layout for the shell (tools carry `device`/`showMobile` flags but full mobile design is **NOT FOUND IN SOURCE**).
- **i18n:** English-only; AR/TR are stubbed/locked. No i18n framework present.

---

## 4. Data model portability

The heavy lifting is already structured as plain arrays/objects that map cleanly to a schema:

| Source constant | Becomes |
|-----------------|---------|
| Shell `VEH`, `CTX`, `MODS`, `REPORTS` | vehicles, components, modules, reports tables |
| Scanner `NODES`, `DTCS`, `PARAMS`, `TREE`, `HISTORY`, `ADAS_ITEMS`, `BRANDS/MODELS/VARIANTS` | ECU network, fault codes, live PIDs, diagnostic trees, history, ADAS, vehicle DB |
| Multimeter `data[]` (12) | components + pinouts + measurement procedures |
| Oscilloscope `COMPONENTS[]` (7) + `fn()` | waveform component library + signal generators |
| Location `SENSORS/ECUS/GROUNDS/FRECT/RRECT/RELAYS/SLOC` | location atlas + hotspots |
| Schematic `CMP` (~55) + `W` (~140) + `TRACES` | netlist graph + guided traces |

These should be lifted into JSON/DB seed data; ECU pin numbers already reconcile across tools, so a single normalized component/pin/wire schema can back all five tools.

---

## 5. Reproducing the extraction

1. Take the 4 payload `<script>` tags (`__bundler/manifest|ext_resources|page_order|template`).
2. `JSON.parse` the template → real `app.html`.
3. Per manifest entry: base64-decode → gunzip if `compressed` → write; join names via `ext_resources`.
4. Each `.dc.html`: read `<x-dc>` (template markup) + `text/x-dc` (logic). The logic's `renderVals()` is the behaviour spec.

No code execution is needed to fully read the app; it is entirely static once decoded.

---

## 6. Open questions / gaps (explicitly unresolved from source)

- Original authoring tool's exact name/version — **NOT FOUND IN SOURCE** (only "dc-runtime" and `bun` build hint).
- Server/API contracts, real coverage-pack format, real auth — **NOT FOUND IN SOURCE** (all client-side placeholders).
- Two injector oscilloscope reference variants (`ref-inj-b/c.png`) are referenced but not obviously wired into a visible screen — likely alternate reference assets.
- Full mobile/responsive specification for the shell — **NOT FOUND IN SOURCE**.
- Any analytics/telemetry — **NOT FOUND IN SOURCE**.
