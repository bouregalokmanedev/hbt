# 09 — UI/UX Specification

**Scope:** Complete UI/UX specification for the HB TRONICS Simulator, derived from the decoded original HTML (`HB TRONICS SaaS Simulator (offline).html`) and analysis files `01`–`08`.
**Source of truth:** the original HTML. Every value below is traceable to inline styles / logic in the decoded shell (`app.html`) and the five tool bundles (`*.dc.html`), or is explicitly marked **NOT FOUND IN SOURCE**.
**Constraints honoured:** no new UX, no redesign, no improvements. Descriptive only.

> Method note: the app uses no CSS token variables — every style is an inline literal, frequently repeated. Where a "system" is described, it is a *reconstruction by frequency* of the literals actually present, not an invented scale. Counts (e.g. "×21") are occurrence counts in `app.html`.

---

# 1. Design Philosophy

The source expresses a single, consistent design language:

- **Professional diagnostic-instrument aesthetic.** The product presents as workshop equipment ("HB-OS 4.2.1 · COVERAGE 2026.7", "HB-LINK 3" VCI). Dense, information-rich, technical — closer to an OEM scan-tool UI than a consumer SaaS.
- **Dark shell, light workspaces.** The global chrome (login, rail, top bar) is near-black (`#0E1114` / `#131A26`); the working screens (hub, garage, reports, and the tools) are predominantly light surfaces (`#FFFFFF`, `#FBFCFD`) with a warm active tint (`#FFF9F4`). The Oscilloscope explicitly supports both dark and light and is driven to light by the shell.
- **Orange as the single brand accent.** `#F47822` marks the brand, active navigation, primary CTAs, and the "under test" context. Each tool additionally owns one accent (Scanner orange, Multimeter blue, Oscilloscope violet, Location green, Schematic red).
- **Monospace for data, sans for chrome.** IBM Plex Mono carries codes/readings/values; IBM Plex Sans carries labels and copy; Condensed for tight headings.
- **Uppercase micro-labels with wide tracking.** Eyebrow/kicker labels are small (8.5–12 px), 600 weight, uppercase, with wide letter-spacing (`.06em`–`.16em`).
- **Didactic tone.** Copy explains *why* at every step (fault descriptions, tree hints, coach text). The unifying idea is stated on login: *"Five specialised tools. One diagnostic bench."*
- **SVG-first.** Icons, gauges, network maps, waveforms and wiring are all inline SVG; no icon fonts or raster UI chrome.

---

# 2. Global Layout

## 2.1 Page dimensions
- Design canvas (`$preview`): **1440 × 900**.
- Login screen: `height:100vh; min-height:760px`.
- Body (bundler wrapper): `min-height:100vh`, centered flex, background `#0E1114`.
- The in-app layout fills the viewport; screens are `flex:1; min-height:0; overflow:auto`.

## 2.2 Main container
Two top-level states (`sc-if`):
- **`sLogin`** — full-screen login (§2.3).
- **`inApp`** — application frame: horizontal flex → **left rail** + **main column** (top bar + active screen).

## 2.3 Login layout
Split screen (`#0E1114`, `overflow:hidden`):
- **Left brand panel** — HB TRONICS SAAS SIMULATOR wordmark, tagline, description, three feature chips (OEM PROCEDURES / REAL WAVEFORMS / GUIDED FAULT TREES), version strip.
- **Right sign-in card** — "TECHNICIAN SIGN IN", "Welcome back", Work e-mail, Password, Keep me signed in, Forgot password, **Enter the simulator** (primary), workshop SSO, seat note.

## 2.4 Sidebar (global left rail)
- Width: **66 px collapsed ↔ 206 px expanded** (`railW`, controlled by `rail` + `railLabels`).
- Background: dark (rail surfaces `#14181C`/`#131A26`).
- Sections top→bottom:
  1. **Top:** Simulator Hub.
  2. **SIMULATORS** (label "SIM"/"SIMULATORS"): the 5 modules, each icon + name + `%` badge.
  3. **LEARNING RECORD** (label "REC"/"LEARNING RECORD"): Progress, Reports.
  4. **Footer:** Garage, Settings.
- Active item: fg `#FFFFFF`, bg `rgba(244,120,34,.14)`, left bar `#F47822`, weight 600; inactive fg `#9AA0A6`, weight 500.
- Collapse toggle glyph: `»` (collapsed) / `«` (expanded).

## 2.5 Header (top bar)
Per in-app screen, contains:
- **Module header** — module icon (two-path SVG), kicker ("MODULE 0X · <TITLE>" or "HB TRONICS SAAS SIMULATOR"), module title. Kicker hidden below 1250 px.
- **Component-context bar** — "UNDER TEST" chip (hidden below 1200 px), ref badge (`#B4560F` on `rgba(244,120,34,.16)`), component name, action glyph (`⇄` when set, `+` when empty), and a row of 5 tool-jump buttons (hidden below 1080 px).
- **User menu** — avatar + name/role (text hidden below 1120 px), XP, dropdown (sign-out). "Change" link hidden below 1330 px.

## 2.6 Content areas
- Standard screen padding: **`26px 28px 32px`** (hub/garage/progress/settings); Settings `…40px`.
- Reports and the tool hosts are `display:flex; overflow:hidden` full-height (no scroll padding).
- Tool hosts render the imported component full-bleed (`width:100%;height:100%;flex:1;min-width:0`).

## 2.7 Panels
Recurring right-hand / detail panels: Reports detail, Scanner DTC-detail tabs, Oscilloscope right info panel (Info/Pinout/Probes/Ref/AI/Score), Multimeter component panel, Schematic inspector. Cards use white/near-white backgrounds, 1px light borders, radius 8–12 px, subtle shadows (§7).

## 2.8 Simulator workspace
Each tool occupies the full content area with its own internal chrome (tool nav/tabs/toolbar + workspace + side panel). Detailed in §10.

---

# 3. Color System

All values are literal from source. RGB shown where the source itself uses `rgba()`; otherwise HEX only (no RGB in source).

## 3.1 Brand & shell
| HEX | RGB / source form | Usage | Component examples |
|-----|-------------------|-------|--------------------|
| `#F47822` | `rgba(244,120,34,…)` used for tints | Brand orange; active nav; primary CTA; "under test"; toggle ON | Rail active bar, "Scan this vehicle" button, focus chip, switches |
| `#1A1206` | — | Text/icon on orange | CTA label on `#F47822` |
| `#0E1114` | — | App/login background (darkest) | Body, login canvas |
| `#131A26` | — | Dark card/base | Rail/top-bar surfaces, dark text base |
| `#14181C` | — | Dark surface | Rail, badges |
| `#1B2432` | — | Raised dark (scope) | Oscilloscope raised panels (dark theme) |
| `#E8EAED` | — | Light text on dark | Rail/top-bar text |
| `#F4F6F9` | — | Lightest text on dark | Scope text (dark) |
| `#9AA0A6` | — | Dim text on dark | Inactive rail labels |
| `#8C9AAF` | — | Dim (scope) | Scope secondary text |
| `#5F6570` | — | Muted dark | Secondary rail text |

## 3.2 Module accents (tint / tint-bg)
| Module | Tint HEX | Tint-bg HEX |
|--------|----------|-------------|
| Scanner (SCN) | `#F47822` | `#FFF1E4` |
| Multimeter (DMM) | `#1F6AE1` | `#EAF1FE` |
| Oscilloscope (OSC) | `#8B5CF6` | `#F2EDFE` |
| Location (LOC) | `#0E9F6E` | `#E7F7F0` |
| Schematic (WDG) | `#D92D20` | `#FDECEA` |

## 3.3 Semantic status (recurs in every tool)
| Meaning | Foreground | Background | Component examples |
|---------|-----------|-----------|--------------------|
| OK / pass / normal | `#0B7A3C`, `#12A150`, `#17A768` | `#EDF7F1`, `#F1F8F3` | PASS pill, coverage ✓, "IN SPEC" |
| Warning | `#B4560F`, `#F59E0B`, `#9A5B06` | `#FFF3E8`, `#FFF8EC` | Pending DTC, "BELOW TARGET", pack-available |
| Fault / fail / danger | `#B42318`, `#D92D20`, `#E23D3D` | `#FDECEA`, `#FDF2F1` | FAULT pill, "OUT OF SPEC", clear-codes |
| Selected (info) | `#1F6AE1` | `#EFF5FE` | Selected ECU/brand/answer |
| Muted / not-equipped | `#8A9099`, `#C2C8D0`, `#6B7280`, `#B6BDC7` | `#F5F6F7`, `#F7F8FA` | LOCKED, "—", not-equipped |

## 3.4 Light neutrals
| HEX | Usage |
|-----|-------|
| `#FFFFFF` | Card / screen base |
| `#FBFCFD` | Empty/panel base |
| `#FFF9F4` | Warm active row/panel |
| `#F2F3F5`, `#F5F6F8` | Subtle fills |
| `#E3E7ED`, `#D5DCE3`, `#EFF1F5`, `#EDEFF1` | Borders/dividers |
| `#131A26` | Primary dark text on light |

## 3.5 Oscilloscope dual palette (explicit tokens `PALETTE.dark`/`.light`)
Channel A `#ED7D1C` (light `#B85708`), B `#3B6FE0` (`#2C58BE`), C `#17A768` (`#0B7346`), REF `#8C9AAF`; scope screen `#080C13` / `#FFFFFF`; grid/cursor/trigger-line as `rgba` tints. `applyTheme()` sets `data-hb="light|dark"` on `<html>`.

## 3.6 Schematic wire colours (`COL`)
Pink `#F3A6C0`, Black `#1F242E`, Red `#E23D3D`, Blue `#2F6FE0`, Brown `#8A5A34`, White `#FFFFFF`, Yellow `#F0C419`, Green `#17A768`, Light Green `#86C562`, Violet `#8B5CF6`, Grey `#98A2B3`, White/Black `#E8EAEE`.

---

# 4. Typography

## 4.1 Families
- **`'IBM Plex Sans', sans-serif`** — primary UI (400/500/600/700).
- **`'IBM Plex Mono', monospace`** — codes, readings, numeric values (400/500/600).
- **`'IBM Plex Sans Condensed'`** — condensed headings (600/700).
- System fallback on bundler wrapper only: `-apple-system, BlinkMacSystemFont, sans-serif`.

## 4.2 Sizes / weights / line-heights (actual `font:` shorthands, by frequency in `app.html`)
| Shorthand (family abbreviated) | Typical use |
|--------------------------------|-------------|
| `600 8.5px/1` Sans (×17) | Micro eyebrow labels |
| `600 9px/1` Mono (×13) | Micro codes/values |
| `600 11.5px/1` Sans (×12) | Button/CTA labels |
| `600 12.5px/1` Sans (×9) | Section headings |
| `500 12.5px/1.3` Sans (×7) | Rail/nav labels |
| `600 10px/1` Mono (×7) | Small codes |
| `400 11.5px/1.45` Sans (×5) | Small body |
| `600 26px/1.15` Sans (×4) | Screen title (large) |
| `400 13px/1.5` Sans (×4) | Body copy |
| `400 12px/1.5` Sans (×4) | Small body copy |
| `600 24px/1` Sans (×2) | Display/number |
| `600 13.5px/1.3` Sans (×2) | Sub-heading |

Observed size range: **7.5 px → 26 px**. Weights used: **400, 500, 600** (700 declared in `@font-face`, used sparingly for display). Line-heights: **1, 1.15, 1.3, 1.45, 1.5, 1.6**.

## 4.3 Letter-spacing (actual values, by frequency across all templates)
`.1em` (×76), `.12em` (×44), `.06em` (×43), `.16em` (×35), `.11em` (×26), `.08em` (×23), `.14em` (×20), `-.02em` (×17), `.07em` (×16), `-.01em` (×12). Positive tracking on uppercase labels; slight negative tracking on large display text.

---

# 5. Spacing System

Reconstructed from literal values (no scale tokens exist).

## 5.1 Padding (most frequent in `app.html`)
`13px 14px` (×6) · `0 8px` · `5px 7px` · `12px 0` · `0 14px` · `0 12px` · `9px 10px` · `6px 9px` · `4px 5px` · `26px 28px 32px` (screen) · `18px 18px 8px` · `18px` · `0 16px`.

## 5.2 Gap (flex/grid)
`14px` (×12) · `9px` (×9) · `11px` (×8) · `8px` · `10px` · `6px` · `3px` · `12px` · `7px` · `4px`.

## 5.3 Control heights
`38px` (×10, primary rows/inputs) · `34px` (×8, buttons/chips) · `32px` · `42px` · `46px` · `30px` · `27px` · `24px` · `20px`. Thin bars/dividers: `1px`, `4px`, `6px`, `7px`.

Effective informal scale: **3, 4, 5–6, 7–9, 10–14, 16, 18, 26–28, 32, 40 px**.

---

# 6. Border Radius

Actual values (frequency in `app.html`, tools similar):
| Radius | Frequency | Usage |
|--------|-----------|-------|
| `8px` | most common (×21 shell, ×62 tools) | Buttons, cards, chips |
| `12px` | ×12 | Cards / larger panels |
| `10px` | ×10 | Panels |
| `7px` | ×10 | Small buttons/chips |
| `4px` | ×10 | Tiny elements |
| `50%` | ×9 | Avatars, dots, circular icons |
| `9px` | ×6 | Cards |
| `6px` | ×3 (×32 tools) | Chips |
| `5px` | ×4 (×40 tools) | Small chips |
| `3px`, `2px` | — | Micro elements/bars |
| `99px` | ×2 | Full pills (toggles, streak) |
| `14px`, `11px` | ×2 | Large cards |

---

# 7. Shadows

Actual `box-shadow` values from source:
| Shadow | Usage |
|--------|-------|
| `0 1px 2px rgba(19,26,38,.16)` | Selected segmented-control pill |
| `0 1px 2px rgba(19,26,38,.25)` | Small raised element |
| `0 6px 20px rgba(19,26,38,.09)` | Card hover/raise |
| `0 12px 30px rgba(19,26,38,.3)` | Elevated panel |
| `0 12px 32px rgba(19,26,38,.22)` | Dropdown / menu |
| `0 24px 60px rgba(19,26,38,.35)` | Modal / overlay |
| `0 0 0 3px rgba(244,120,34,.15)` | Focus ring (orange) |
| `0 1px 4px rgba(0,0,0,0.12)` | Bundler loading chip (wrapper only) |

Base tint for elevation shadows is consistently `rgba(19,26,38,α)` (dark-navy), α scaling with elevation.

---

# 8. Components

Dimensions/styles below are literal where present; **NOT FOUND** marks unspecified attributes. States listed are those actually implemented in logic.

### 8.1 Rail item
- **Purpose:** primary navigation.
- **Dimensions:** rail 66/206 px wide; icon 24-viewport SVG.
- **Style:** icon + optional label (`500 12.5px`), `%` badge (Mono).
- **States:** active (fg `#FFFFFF`, bg `rgba(244,120,34,.14)`, bar `#F47822`, weight 600) / inactive (`#9AA0A6`, 500).
- **Interaction:** click → `go(id)`; `title` tooltip.
- **Responsive:** collapses to icon-only at 66 px.

### 8.2 Primary button / CTA
- **Purpose:** primary action.
- **Dimensions:** height ~34 px; padding `0 14px`.
- **Style:** bg `#F47822`, text `#1A1206`, `600 11.5px`, radius 8 px.
- **States:** default; `style-hover` variants (e.g. secondary buttons shift `border-color:#F47822`). Disabled/locked → grey set (`#F5F6F8`/`#8A9099`, "LOCKED").
- **Interaction:** click handler; hover transition `140ms`.

### 8.3 Secondary / outline button
- bg `#FFFFFF`, text `#131A26`, border `#D5DCE3`; danger variant text `#D92D20`, border `#F0C4C0`.

### 8.4 Segmented control (settings)
- **Purpose:** enumerated choice.
- **Style:** option pills; selected bg `#FFFFFF`, fg `#131A26`, shadow `0 1px 2px rgba(19,26,38,.16)`; unselected transparent, fg `#5A6672`; locked fg `#B6BDC7`.
- **Interaction:** click → `setSet(k,v)`; locked options show a toast.

### 8.5 Toggle switch
- **Dimensions:** knob travel `0 → 18px`.
- **Style:** track ON `#F47822` / OFF `#CBD2DB`; pill radius 99 px.
- **Interaction:** click → `setSet(k,!v)` (or `rail` toggle).

### 8.6 Module card (hub)
- **Purpose:** launch a tool.
- **Content:** number, name/tag, title, desc, skill, progress %, level pill (colour by pct: ≥80 green / ≥55 amber / else neutral), last-activity, CTA.
- **CTA states:** START / CONTINUE / REVIEW / LOCKED (colour + label from coverage + pct).
- **Responsive:** Cards ↔ Compact rows via hub layout toggle.

### 8.7 Component-context bar & picker
- **Context chip:** ref badge `#B4560F`/`rgba(244,120,34,.16)`, name, border `rgba(244,120,34,.34)` when set.
- **Tool-jump buttons (5):** enabled (active orange / available light) vs disabled (`not-allowed`, muted) per `has(component,tool)`.
- **Picker overlay:** modal list of 11 components; selected row bg `#FFF6EE`; per-tool availability chips; search. Shadow `0 24px 60px rgba(19,26,38,.35)`.

### 8.8 Coverage matrix cell (garage)
- **Marks:** `✓` ok (`#0B7A3C`/`#EDF7F1`), `↓` available (`#B4560F`/`#FFF3E8`), `—` none (`#C2C8D0`/`#F7F8FA`).

### 8.9 Toast
- **Purpose:** transient confirmation.
- **Behaviour:** single message, auto-dismiss **2.4 s** (shell) / 2.2 s (Scanner); `toastDisplay` block/none.
- **Style:** dark chip (exact box: elevated dark surface).

### 8.10 Report row / detail
- Row: date, tool chips (colour per tool), outcome pill (PASS green / FAULT red), score; selected row bg `#FFF9F4`, mark `#F47822`.
- Detail: step rows with ✓ (`#0B7A3C`) or ! (`#B42318`) dots, verdict block tinted by outcome.

### 8.11 Chip (generic filter/segment, tools)
- Selected bg `#14181C`, fg `#fff`; unselected bg `#fff`, fg `#5F6570`, border `#D5D9DD`. Used for bus/status/DTC/live filters.

### 8.12 Scanner ECU network node
- SVG rect `116 × 38`, stub to bus rail, DTC badge; selected stroke `#1F6AE1` sw 3; dimmed opacity `.2` when filtered out; fill by status colour.

### 8.13 Diagnostic-tree step (Scanner)
- States: locked / active (`#F47822` dot, bg `#FFFDFA`) / done (green/red dot + PASS/FAIL). Measure button → reveal reading → PASS/FAIL buttons → feedback banner (green `#F1F8F3` / red `#FDF2F1`).

### 8.14 Live-data row (Scanner)
- Sparkline SVG, value (Mono), min/max, spec status ("IN SPEC"/"BELOW TARGET"/"OUT OF SPEC"), select checkbox (`#1F6AE1` when on), pin toggle (`#F47822` when pinned).

### 8.15 DMM instrument + probes (Multimeter)
- Rotary switch (OFF/VDC/OHM/MA), digital display, draggable red/black leads onto pins/ECU-pins/ground; reading resolves from mode+targets+step.

### 8.16 Oscilloscope scope + controls
- Graticule + dual-channel polylines; per-channel V/div, offset, invert, coupling (AC/DC), enable; trigger level slider + edge; cursors A/B; persistence; peak; reference overlay; fault selector; probe-connect puzzle.

### 8.17 Schematic canvas node / wire
- Typed nodes (ecu/relay/fuse/ground/sensor/actuator/switch/module/network/connector) with type label (`TYPEL`); wires coloured from `COL`; click to inspect endpoints/pins.

### 8.18 Location hotspot
- Rectangular hotspot over image/fuse/vehicle view; hover highlight; selected → detail panel; training/quiz target overlay.

---

# 9. Navigation

**Model:** state-driven; no URL router; screens toggle via `sc-if`. Global rail + context bar + hub cards are the entry points.

## 9.1 Shell navigation paths
- **Login → Hub:** `signIn()` (Enter the simulator / SSO — no validation).
- **Rail:** Simulator Hub · Scanner · Multimeter · Oscilloscope · Location · Schematic · Progress · Reports · Garage · Settings (each `go(id)`).
- **Hub card CTA →** corresponding tool (or coverage gate if not `ok`).
- **Context bar tool-jumps →** open a tool focused on the current component (enabled only where data exists; else toast).
- **Progress deep-links →** weak-spots / recommended path set a focus and jump into a tool (e.g. `setFocus('COIL'); go('oscilloscope')`).
- **Garage session rows →** open Reports; **switch active vehicle** changes coverage/gating globally.
- **Reports "Re-open in tool" →** the report's first tool.
- **User menu → Sign out →** Login.
- **Coverage gate → Switch to Corolla** or Install/Request (toast).

## 9.2 Tool-internal navigation
- **Scanner:** grouped left nav (Dashboard / Local Diagnostic {Select→Overview→Scan→Network} / System List {Systems→DTCs→DTC-detail} / Live Data {Livedata→Graph} / Training / ADAS / History / Report / Settings); breadcrumb bar; contextual action bar; `back()` map; 5 DTC-detail tabs; modals.
- **Multimeter:** view toggle (Diagnosis / Progress); component tabs (Wiring / ECU pin — active; Location/Parts/Manuals/Info — placeholder); step-by-step flow.
- **Oscilloscope:** screen tabs (Library / Connect / Scope / Compare / Tablet); right tabs (Info / Pinout / Probes / Ref / AI / Score).
- **Location:** mode segment (Browse / Train / Quiz); view tabs (Fuse / Sensors / System / Vehicle).
- **Schematic:** mode segment (Study / Trace / Training / Practice / Exam); view toggle (Schematic / Circuit); tool rail (systems / search / layers / bookmarks / recent / progress).

## 9.3 Back / history
No browser-history integration. Scanner has an internal `back()` screen-order map. Other tools rely on tabs/segments. Browser back/forward behaviour: **NOT FOUND IN SOURCE** (single blob document).

---

# 10. Simulator Workspace

Common shape per tool: **tool nav/tabs** (left or top) → **main workspace / visualization** → **side panel(s)** → **action/feedback bar**.

## 10.1 Scanner
- **Workspace:** varies per screen — dashboard tiles, vehicle DB lists, animated scan log, pan/zoom **ECU network SVG** (large viewBox), sortable system table, DTC list, DTC-detail tabs, live-data table, multi-signal graph.
- **Toolbar/controls:** grouped nav, breadcrumb, Pro/Training toggle, battery-voltage indicator, contextual action bar, filter chips, zoom controls, cursor slider, record/export.
- **Visualizations:** ECU network map, sparklines, multi-signal polyline graph with cursor, progress bars.
- **Measurement areas:** live PID table (18 params, 4 Hz), expected-vs-measured tables, diagnostic tree.
- **Feedback areas:** tree feedback banners, training score panel + tailored feedback, AI assistant panel, toasts, modals.

## 10.2 Multimeter
- **Workspace:** bench with connector diagram (numbered pins + callouts), component symbol, DMM instrument.
- **Toolbar/controls:** rotary switch (OFF/VDC/OHM/MA), draggable probes (or click-to-place), component tabs, hint toggle.
- **Visualizations:** component SVG glyph, ECU pin/connector map, spec/temperature tables.
- **Measurement areas:** live reading display; per-step spec vs reading.
- **Feedback areas:** pass/fail banner, score + elapsed, generated report, fail-diagnosis text.

## 10.3 Oscilloscope
- **Workspace:** scope screen (graticule + dual-channel traces), reference-image overlay.
- **Toolbar/controls:** time/div, per-channel V/div, offset, invert, enable, coupling, trigger level slider + edge, persistence, peak, cursors, run/stop, fault selector, probe-connect (Connect screen), theme.
- **Visualizations:** synthesized waveforms (per-component `fn`), cursor measurements.
- **Measurement areas:** cursor readouts, spec list (Info/Pinout tabs).
- **Feedback areas:** Score tab, AI tab, diagnosis submission.

## 10.4 Location
- **Workspace:** image-map stage (fuse / sensor detail / systems / 4-view vehicle) with hotspots.
- **Controls:** mode segment, view tabs, search + category filter, zoom, favourites/recent, hint/reveal (train).
- **Visualizations:** annotated images, hotspot rectangles, outlines overlay.
- **Feedback areas:** training verdict, quiz score/log/timer.

## 10.5 Schematic
- **Workspace:** pan/zoom SVG canvas (very large viewBox, default zoom 0.32) of ~55 nodes + ~140 coloured wires.
- **Controls:** mode segment, view toggle, tool rail (systems/search/layers/bookmarks/recent/progress), trace player.
- **Visualizations:** wiring diagram, guided-trace highlight, legend.
- **Feedback areas:** inspector panel, practice/exam feedback.

---

# 11. Responsive Behavior

**Mechanism:** the shell uses **JavaScript width breakpoints** on `state.vw` (rAF-throttled resize), not CSS media queries. Design target 1440×900.

## 11.1 Desktop
- **≥ 1330 px:** everything visible ("Change" link shown).
- **1250–1329 px:** "Change" link hidden.
- **1200–1249 px:** module kicker hidden.
- **1120–1199 px:** context "UNDER TEST" kicker hidden.
- **1080–1119 px:** user-menu text hidden.
- **< 1080 px:** context tool-jump row hidden.
- Rail defaults to collapsed (66 px); can expand to 206 px (independent of width).
- Hub can render as Cards or Compact rows (user toggle, not width-driven).

## 11.2 Tablet
- No dedicated tablet layout in the shell; behaviour is the continuum of the breakpoints above (progressively hiding secondary chrome as width shrinks toward ~1080 px).
- Tools carry `device`/`showMobile` flags (Schematic `device:'desktop'`; Location `showMobile`) but a defined **tablet** layout is **NOT FOUND IN SOURCE**.

## 11.3 Mobile
- A full mobile layout for the shell is **NOT FOUND IN SOURCE**. Login sets `min-height:760px`; the app is authored at 1440×900.
- Location exposes a `showMobile` affordance and Schematic a `device` state, but concrete mobile breakpoints/layouts are **NOT FOUND IN SOURCE**.

---

# 12. Animation

Actual transitions/animations found:
- **Shell hover/transition:** `transition:transform 140ms`, `transition:border-color 140ms, box-shadow 140ms`, `transition:background 140ms`; hover states via `style-hover` (e.g. secondary button border → `#F47822`).
- **Tool transitions (literal):** `width 400ms cubic-bezier(.2,0,0,1)`, `transform 400ms cubic-bezier(.2,0,0,1)`, `transform .28s cubic-bezier(.4,1.4,.5,1)` (springy), `width .25s cubic-bezier(.2,0,0,1)`, `width .3s`, `width .2s linear`, `width .12s linear`, `transform .18s`, `opacity .15s, background .15s`.
- **Timed / data animations:**
  - Scanner live-data stream: `setInterval` **420 ms** random-walk; animated full scan **~200 ms/ECU**; ADAS progress **90 ms** steps.
  - Multimeter & Oscilloscope: elapsed/redraw timers; scope re-renders waveform continuously while `running`.
  - Progress bars (scan / ADAS / score) animate width.
- **Runtime effect:** `sc-shine` shimmer present in dc-runtime.
- **Bootstrap:** splash SVG + "Unpacking…" status during unbundling.

Named CSS keyframe animations beyond transitions: **NOT FOUND IN SOURCE** (motion is transitions + JS timers).

---

# 13. Accessibility

Traceable patterns:
- **`title` attributes** used for tooltips on rail items, tool-jump buttons, pack chips, and network nodes (e.g. "Open <tool> on this component" / "No data for this component in <tool>").
- **`cursor` semantics** communicate availability: `pointer` vs `not-allowed` / `default` on disabled jumps and chips.
- **Colour + symbol redundancy:** status is conveyed by both colour and glyph/text (✓ / ↓ / — / "IN SPEC" / "OUT OF SPEC" / "PASS" / "FAULT"), reducing colour-only reliance.
- **`<noscript>` fallback** in the wrapper ("This page requires JavaScript to display.").
- **Range inputs** (graph cursor, trigger level) are native and keyboard-operable by default.

**Not present / NOT FOUND IN SOURCE:**
- ARIA roles/labels/landmarks, `alt` text strategy for the SVG/image workspaces, focus-visible styling beyond the orange focus-ring shadow, keyboard navigation for the custom rail/tabs/canvas, skip links, reduced-motion handling, screen-reader announcements for toasts/live data.
- No stated WCAG target or contrast audit.

---

## Traceability note
Every colour, radius, shadow, font, spacing, dimension, breakpoint, transition, and interaction above is drawn from the decoded `app.html` and the five `*.dc.html` bundles (analysis files `01`–`08`). Items not evidenced in source are labelled **NOT FOUND IN SOURCE**. No values were invented, and no design changes were proposed.
