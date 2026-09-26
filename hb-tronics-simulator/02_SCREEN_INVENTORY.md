# 02 — Screen Inventory

All screens are source-verified. Shell screens come from `data-screen-label` markers and the `screen` state; tool screens come from each tool's `screen`/`view`/`mode`/`tab` state and screen-tab arrays.

Navigation is **state-driven, not URL-driven** — there is no router; screens toggle via `sc-if` on boolean flags. "NOT FOUND IN SOURCE" is used where a concept does not exist.

---

## A. App Shell screens

The shell renders a **Login** screen or the **in-app layout** (`inApp = screen !== 'login'`). The in-app layout is: **global left rail** + **top bar (module header + component-context bar + user menu)** + one active screen. The five tool modules render inside the content area via `<dc-import>`; if the active vehicle lacks coverage for that tool, the **Coverage gate** replaces it.

| # | Screen (label) | `screen` id | Purpose | Main sections | Key interactions | Navigation in |
|---|----------------|-------------|---------|---------------|------------------|---------------|
| 00 | **Sign in** | `login` | Marketing + technician login | Left brand panel (HB TRONICS SAAS SIMULATOR, tagline "Five specialised tools. One diagnostic bench.", feature chips OEM PROCEDURES / REAL WAVEFORMS / GUIDED FAULT TREES, "HB-OS 4.2.1 · COVERAGE 2026.7"); right sign-in card (Work e-mail, Password, Keep me signed in, Forgot password, **Enter the simulator**, Continue with workshop SSO) | `signIn()` → hub (any input; not validated) | app start (default) |
| 01 | **Simulator hub** | `hub` | Launchpad for the 5 tools on the active vehicle | Overall progress, 7-day streak, module cards **or** compact rows (toggle), active-vehicle summary + pack chips, "Scan this vehicle" / "Open wiring sheets" | Card CTAs (START/CONTINUE/REVIEW/LOCKED), `hubCards`/`hubRows` layout switch | rail "Simulator Hub", login |
| 02 | **Garage** | `garage` | Vehicle manager + coverage matrix | Active vehicle facts (VIN, engine, trans, odometer), 4-vehicle table with per-tool coverage cells (✓ / ↓ / —), install/request buttons, recent sessions | Switch active vehicle, install packs / request coverage (toast), VIN decode (toast) | rail footer |
| 03 | **Progress** | `progress` | Learning record dashboard | Overall %, per-module skill levels, stats (Sessions 34, Bench hours 21, Avg score 81, Faults found 19), certifications (3), weak-spots list, recommended path, coach message, focus panel | Weak-spot / path items deep-link into a tool with a preset component | rail "Progress" |
| 04 | **Reports** | `reports` | Session report viewer | Left list of 7 reports (date, tools, outcome PASS/FAULT, score); right detail (steps with ✓/! marks, verdict, meta) | Select report, **Re-open in tool**, **Export PDF** (toast) | rail "Reports"; deep-links from Progress & Garage |
| 05 | **Settings** | `settings` | Preferences | 4 groups: Training (Difficulty, Coaching hints, Component outlines), Instruments (Multimeter layout, Probe handling, Signal noise), Session (Random fault injection, Hub layout), Account & shell (Navigation labels, Interface language EN/AR/TR) | Segmented controls + toggles; AR/TR locked (toast); values feed tool props | rail footer |
| 10 | **Scanner module** | `scanner` | Host Scanner tool | `<dc-import name="Scanner" embedded>` full-bleed | (see §B) | rail SIM, hub card, context jump |
| 11 | **Multimeter module** | `multimeter` | Host Multimeter tool | `<dc-import name="Multimeter" …>` | (see §C) | rail SIM, hub card, context jump |
| 12 | **Oscilloscope module** | `oscilloscope` | Host Oscilloscope tool | `<dc-import name="Oscilloscope" …>` | (see §D) | rail SIM, hub card, context jump |
| 13 | **Location module** | `location` | Host Location tool | `<dc-import name="Location" …>` | (see §E) | rail SIM, hub card, context jump |
| 14 | **Schematic module** | `schematic` | Host Schematic tool | `<dc-import name="Schematic" …>` | (see §F) | rail SIM, hub card, context jump |
| 15 | **Coverage gate** | (any tool + `gate`) | Block a tool when the active vehicle lacks a data pack | Module icon/kicker, headline (pack not installed / no data), body copy, **Install data pack** or **Request coverage**, **Switch to Corolla** | `gateGo()` (toast), `gateSwitch()` → Corolla | shown instead of a tool when `veh.cov[tool] !== 'ok'` |

**Global chrome (present on every in-app screen):**
- **Left rail** — collapsible (66px ↔ 206px, `railLabels`/`rail`). Sections: top (Simulator Hub); SIMULATORS (the 5 modules with % badges); LEARNING RECORD (Progress, Reports); footer (Garage, Settings).
- **Component-context bar** — "UNDER TEST" chip with ref + name; 5 tool-jump buttons (SCN/DMM/OSC/LOC/WDG) enabled only where data exists; opens a **component picker** overlay (11 components).
- **Component picker overlay** — searchable list of 11 shared components with per-tool availability chips.
- **User menu** — avatar (H. Barakat, Master technician), XP total "4 820", sign-out.
- **Toast** — transient 2.4 s messages.

---

## B. Scanner tool — 14 internal screens (`screen` state)

Grouped nav (`groupOf`): Dashboard · Local Diagnostic (Select/Overview/Scan/Network) · System List (Systems/DTCs/DTC-detail) · Live Data (Livedata/Graph) · Training · ADAS · History · Reports · Settings.

| Screen | Purpose | Highlights |
|--------|---------|-----------|
| `dashboard` | Session home | Vehicle summary, MIL/battery/protocol/bus-load metrics, attention list, 6 quick-jump tiles, recent sessions |
| `select` | Vehicle selection | Brand list (28 brands, favourites, search), model list, variant list, VIN auto-identify, recent vehicles |
| `overview` | Vehicle overview | Profile facts, comms rows, scan counts, "Run full scan" |
| `scan` | Full system scan | Animated per-ECU scan log (21 nodes), progress %, result summary |
| `network` | ECU network map | Pan/zoom SVG of 21 ECUs on 3 CAN rails, bus/status filter chips, selected-ECU panel |
| `systems` | System list | Sortable/filterable 21-row table (ECU, system, bus, status, DTC count, last scan) |
| `dtcs` | Fault codes | 8 DTC rows, filter chips (All/Current/Stored/Pending), expandable, search |
| `dtcDetail` | DTC detail | 5 tabs: Fault overview, Possible causes, **Diagnostic tree** (7-step interactive), Live data & expected values, Repair decision |
| `livedata` | Live data | 18 PIDs streaming (4 Hz), select/pin/filter/search, record, export CSV |
| `graph` | Graph view | Up to 6 signals plotted, time-base chips (10/30/60 s), draggable cursor, pause/resume |
| `training` | Training simulator | Scenario 12 "Intermittent power loss under load"; 6 guided steps, hints, single-attempt multiple-choice answer, scored feedback |
| `adas` | ADAS calibration | 6 calibration items, animated progress run, pre-conditions checklist |
| `history` | Diagnostic history | 5 past sessions (vehicle, VIN, km, tech, DTC/fault counts, status), compare |
| `report` | Diagnostic report | Draft report, share/print/export PDF |
| `settings` | Scanner settings | (flag `sSettings`) — settings surface within the tool |

Modals: **Clear codes** confirm, **Compare with previous** (DTC + parameter diff). Floating **AI assistant** panel (scripted 4-turn fuel-pressure dialogue). Mode toggle **Pro / Training**.

---

## C. Multimeter tool — 2 views + 6 component tabs

- **Views** (`view`): `diagnosis` (bench) and `progress`.
- **Diagnosis view tabs** (`tab`): `wiring` (Wiring diagram), `ecu` (ECU pin & connector) — both active; `location`, `parts`, `manuals`, `info` present but flagged inactive/placeholder.
- **Bench workspace:** rotary DMM (modes OFF/VDC/OHM/MA), draggable red/black probes onto connector pins / ECU pins / ground, live reading, guided step list, per-step spec table, hint, fail diagnosis, score/elapsed, generated report.
- **12 components** cycled through the bench: L3, L1, A1 (Injector 1), H3, I1 (Coil 1), I2 (Knock), X1 (Crank), X7 (Cam inlet), G1 (Accel pedal), U1 (O2), T1 (Coolant). (Grouped: Air & fuel / Ignition / Position sensors / Emissions & temperature.)

---

## D. Oscilloscope tool — 5 screens + 6 right-panel tabs

- **Screens** (`SCREENS`): `library`, `connect`, `scope`, `compare`, `tablet`.
- **Right-panel tabs** (`RTABS`): `component` (Info), `pinout`, `probes`, `ref`, `ai`, `score`.
- **7 components:** inj (Fuel Injector), coil (Ignition Coil primary), cam (Camshaft sensor), app (Accelerator pedal), map (MAP), knock (Knock), lambda (Oxygen sensor).
- **Scope screen:** dual-channel A/B trace, time/div, V/div, offset, invert, coupling AC/DC, trigger level/edge, persistence, peak-detect, cursors, reference-image overlay, fault selector, connect-the-probes puzzle, diagnosis submission. Light/dark theme (shell passes `light`).

---

## E. Location tool — 1 app screen, 3 modes, 5 views

- **Modes** (`mode`): `browse`, `train`, `quiz`.
- **Views** (`view`): `fuse` (fuse box), `sensors` (component detail image), `system` (systems trace), `vehicle` (4-view locator), `ecu`/`ground` (map layers).
- Content: 10 sensors/actuators, 15 ECUs, ground points, relays, fuse-box rectangles (`FRECT`/`RRECT`) — all with coordinates. Prose location + mount + system per component. Training targets and a scored quiz (list, index, score, tries, elapsed, verdict log). Favourites & recent.

---

## F. Schematic tool — 1 canvas, 5 modes, 2 views

- **Modes** (`mode`): `study`, `trace`, `training`, `practice`, `exam`.
- **Views** (`view`): `schematic`, `circuit`.
- Canvas: pan/zoom (`z`, `tx`, `ty`) over ~55 components; click component/wire to inspect; layers, search, bookmarks, recent, progress drawer. Guided **traces** (Injector 1, Ignition coil 1, CAN system 1) with step playback. Practice/exam scoring, feedback.

---

## Screen-count summary

| Area | Distinct screens/views |
|------|------------------------|
| Shell | 7 primary (login, hub, garage, progress, reports, settings, gate) + 5 tool hosts |
| Scanner | 14 screens + 2 modals + AI panel |
| Multimeter | 2 views × up to 6 tabs, 12 components |
| Oscilloscope | 5 screens × 6 right tabs, 7 components |
| Location | 3 modes × 5 views |
| Schematic | 5 modes × 2 views |

**NOT FOUND IN SOURCE:** password reset flow, SSO provider flow, account creation, real authentication, any server/back-end screen, billing/checkout screens.
