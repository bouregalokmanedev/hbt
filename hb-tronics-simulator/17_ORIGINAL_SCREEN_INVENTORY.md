# 17 — Original Screen Inventory

**Source of truth:** `HB TRONICS SaaS Simulator (offline).html` (the offline bundle), rendered authentically via the QA harness (extracted `*.dc.html` + `dc-runtime` + React UMD). Evidence: direct renders at 1440×900, nav/control enumeration, and `.dc.html` source markup.

> Method note — how the originals were obtained (reproducible):
> 1. `node scripts/extract-bundle.mjs --out <dir>` → yields 5 `*.dc.html` tool documents, the `dc-runtime` (`by-uuid/7475b929….js` = `support.js`), and React/ReactDOM UMD.
> 2. For each tool: inject `<script src=react.js></script><script src=react-dom.js></script>` before the existing `./support.js` tag; serve over HTTP; Playwright-render (`waitForTimeout(3500)`).
> 3. Main-app screens (login/hub done) render from the bundle directly; garage/progress/reports/settings are client-routed in the main dc app (navigation not automatable — see doc 20).

Legend for STATUS vs current build: ✅ matched · 🟡 partial · 🔴 missing · ⚠️ materially different.

---

## A. Main application shell

| ID | Name | Route/State | Layout | Status |
|----|------|-------------|--------|--------|
| S-01 | **Login** | `/login` | Split screen: orange brand panel (left) + dark sign-in form (right) | ✅ (rebuilt & raster-verified EN/AR) |
| S-02 | **Hub** ("Choose your simulator") | `/hub` | Kicker+heading+subtitle, 2 stat cards, 5 module cards in a row, Session context + Coach, Continue-your-path | ✅ (rebuilt & raster-verified EN/AR) |
| S-03 | **Garage** | `/garage` | Vehicle library + coverage matrix | 🟡 original-side render not obtainable (main-app nav) |
| S-04 | **Progress** | `/progress` | Overall + module levels + certs + weak spots + path + coach | 🟡 same |
| S-05 | **Reports** | `/reports` | Report list + detail (steps, verdict) | 🟡 same |
| S-06 | **Settings** | `/settings` | App/sim settings | 🟡 same |
| S-07 | Top bar (module header + component-context bar + user menu) | global | — | ✅ chrome verified via S-01/S-02 diffs |
| S-08 | Left rail (66px, SIM + REC sections, collapse) | global | — | ✅ chrome verified |
| S-09 | Coverage gate | modal/inline | blocks uncovered tools | 🟡 |

---

## B. Scanner (`Scanner.dc.html`, 189 KB — the largest tool)

Own 11-item left rail + top "PROFESSIONAL / TRAINING" toggle + "VCI LINKED 13.9 V".

| ID | Screen | Evidence | Status |
|----|--------|----------|--------|
| SC-01 | **Diagnostic Workstation** ("Select a diagnostic function") — 3 hero panels (Intelligent / **Local Diagnostic** / Reset & Service) + function grid + recent sessions | rendered | 🔴 **missing** (current jumps straight to a DTC dashboard) |
| SC-02 | Function grid cards: **ADAS Calibration** (2 due), **Immobilizer & Keys**, **TPMS**, **Diagnostic History** (184 sessions), **Software Update** (742), **Vehicle Coverage**, **Training Simulator** (64 scenarios), **Knowledge Base**, **Other Modules**, **ECU Programming** (HB PRO+ locked) | rendered | 🔴 missing |
| SC-03 | Dashboard | rail | ⚠️ differs |
| SC-04 | Local Diagnostic (full-system scan → ECU network → DTCs → live data → reports) | rail | 🟡 partial |
| SC-05 | System List | rail | 🟡 |
| SC-06 | Live Data (PIDs, graphing) | rail | 🟡 |
| SC-07 | Training Simulator (64 scenarios · exams) | rail | 🟡 (current has 1 scenario) |
| SC-08 | ADAS Calibration | rail | 🟡 |
| SC-09 | History (compare sessions) | rail | 🔴 |
| SC-10 | Reports | rail | 🟡 |
| SC-11 | Settings (scanSpeed, defaultMode pro/training, showAiAssistant — from `data-props`) | rail | 🔴 |
| SC-12 | Diagnostic Assistant (AI) | rail | 🟡 |
| SC-13 | Recent Sessions list (per-vehicle, DTC counts, tech) | rendered | 🔴 |
| SC-14 | Bottom status bar ("HB-LINK 3 connected · ignition ON · engine running", Vehicle coverage, Start local diagnostic →) | rendered | 🔴 |

---

## C. Multimeter (`Multimeter.dc.html`, 107 KB)

Top: "Sensor & actuator diagnosis · digital multimeter", TIME + SCORE, Diagnosis/Progress tabs. Left: **11 components** grouped by system (Air & fuel / Ignition / Position sensors / Emissions & temperature), "0 of 11 cleared · **54 measurement steps**", per-component progress.

| ID | Screen/Panel | Evidence | Status |
|----|--------------|----------|--------|
| MM-01 | Component Diagnosis view (per component) | rendered | ⚠️ differs |
| MM-02 | Component tabs: **Wiring diagram · ECU pin and connector · Location · Related parts · Repair Manuals · Component information** (6 tabs) | rendered | 🔴 only wiring partial |
| MM-03 | Interactive **wiring diagram** with clickable pins, Reset/View wiring/Extended diagram, zoom, legend (Component/Control unit/Wire) | rendered | 🟡 |
| MM-04 | **Rotary-dial DMM** (HB TRONICS DMM-772 TRUE RMS): OFF/Ω/mA/V~/V-/A/Hz, COM/VΩ jacks | rendered | ⚠️ current uses a mode dropdown |
| MM-05 | **Drag-and-drop probes** (Red/Black → onto pins) | rendered | 🔴 current is click-to-place |
| MM-06 | Step procedure panel ("Diagnosis 1/6"), resistance/temperature **chart tables**, "Does it match?", YOUR MEASUREMENT readout, Yes/No/**Need a hint** | rendered | 🟡 partial |
| MM-07 | Progress tab (per-component clear state) | tab | 🟡 |
| MM-08 | Restart session / Print | controls | 🔴 |
| MM-09 | Complaint banner per component | rendered | ✅ (localized) |

Components (11): L3 MAF, L1 MAP, A1 Injector 1, H3 Throttle, I1 Ignition coil 1, I2 Knock, X1 Crank, X7 Cam, G1 Accelerator pedal, U1 Oxygen, T1 Coolant.

---

## D. Oscilloscope (`Oscilloscope.dc.html`, 116 KB) — **dark-themed**

Top: OSCILLOSCOPE · component · exercise id, SCORE x/100, tabs **Library · Connect · Scope · Compare · Tablet**.

| ID | Screen/Panel | Evidence | Status |
|----|--------------|----------|--------|
| OS-01 | **Scope** workspace (dark) — dual-channel grid, TIME/DIV, TRIG (FALL, level), STOP/SINGLE/AUTO SET, PERSIST/PEAK DET/REF/CURSORS/SAVE | rendered | ⚠️ current is light-themed & simpler |
| OS-02 | Left **procedure checklist** (e.g. 5/7 steps) + MEASUREMENT text + REFERENCE VALUES table + Source note | rendered | 🔴 missing |
| OS-03 | Full **readout row**: V MAX/MIN/P-P, FREQ, DUTY, PULSE W, RISE, ΔT A→B, ΔV A→B | rendered | 🟡 partial |
| OS-04 | Channel controls: CH A / CH B, V/div, DC/AC, INV, position ↓↑ | rendered | 🟡 |
| OS-05 | Right panel tabs: **Info · Pinout · Probes · Ref · AI · Score** | rendered | 🟡 (no AI/Score parity) |
| OS-06 | Info: component image, FUNCTION prose, **LIVE STATE** bars (Pintle lift, Winding current, Inductive spike), CONSTRUCTION bullets | rendered | 🟡 |
| OS-07 | **Fault injection** chips: Healthy · Open circuit · Short to ground · Short to battery · High resistance · Dropout · Noise · Injector winding | rendered | ✅ (faults localized) |
| OS-08 | Library / Connect / Compare / **Tablet** tabs | rendered | 🟡 |

---

## E. Location (`Location.dc.html`, 113 KB) — **115-component atlas**

Top: LOCATION · "engine bay, fuse box, ECUs & ground points", modes **Browse · Training · Quiz · Mobile preview**. Search ("115 components in data set"). Breadcrumb Vehicle › Zone › Component.

| ID | Screen/Panel | Evidence | Status |
|----|--------------|----------|--------|
| LO-01 | Browse (stage + hotspots) | rendered | ⚠️ current has 8 hotspots vs 115 |
| LO-02 | **8 category filters**: All (115), Sensors (8), Actuators (2), ECUs/Modules (15), Relays (15), Fuses (56), Ground points (19), Vehicle systems (58) | rendered | 🔴 |
| LO-03 | **58 vehicle systems** list (ABS, Adaptive headlights, Audio, A/C, Charging, CVT, Cooling fan, Cruise, Door lock, EBD, Sunroof, EPS, ESP, Fog, Headlights, Heated mirrors, Hill-holder, Immobiliser, Lane detection, Navigation, Parking assist, Pre-crash, Smart entrance…) | rendered | 🔴 |
| LO-04 | **6 view tabs**: Sensors · ECUs · Ground · Fuse box · Systems · Vehicle | rendered | 🟡 (current: 4) |
| LO-05 | Right detail panel: OEM ref, Reference, Category, Vehicle system, Zone, Location, Vehicle, NOTES + **Vehicle views** + **Practise this** | rendered | 🟡 |
| LO-06 | Favourites list | rendered | 🔴 |
| LO-07 | Training mode (guided locate) | mode | 🟡 |
| LO-08 | Quiz mode (scored) | mode | ✅ (logic present) |
| LO-09 | Hotspot outlines / Dim others toggles, zoom/FIT | controls | 🟡 |

---

## F. Schematic (`Schematic.dc.html`, 89 KB) — full netlist workspace

Top: SCHEMATIC, Search (⌘K), modes **Study · Trace · Training · Practice · Exam**, Layers · Print · Export.

| ID | Screen/Panel | Evidence | Status |
|----|--------------|----------|--------|
| SCH-01 | Study mode (browse sheet) | rendered | ⚠️ current is a simpler pan-zoom |
| SCH-02 | **Trace** mode (click component → pin-table rows → trace wire end-to-end) | rendered | 🔴 |
| SCH-03 | Training / Practice / **Exam** modes (0 of 8 training tasks, scored) | rendered | 🔴 |
| SCH-04 | LAYOUT: Schematic / **Circuit view**; columns A/B/C; docks (three-column / canvas-first / bottom-dock) | rendered | 🔴 |
| SCH-05 | **Layer control** (7/11 layers), zoom %, Fit, Reset | rendered | 🟡 |
| SCH-06 | Left: Filter, VEHICLE SYSTEMS (Engine mgmt 57, ECU & connectors 2, CAN 2, Power & grounds 11), COMPONENTS ON SHEET (57), RECENT, TRAINING PROGRESS | rendered | 🟡 |
| SCH-07 | Right: INFORMATION + **SHEET SUMMARY** (Components 57, **Pin-table rows 133**, ECU connectors A·B, **Distinct ECU pins 111**, Grounding AB·BA·BB·EB, CAN 2) + **ECU CONNECTORS** (A 34 pins / B 77 pins) | rendered | 🔴 |
| SCH-08 | Netlist components (E1 ECU 133 pins, R16/R1/R15/R3 relays, O7 fuses, O8 grounds, O2 CAN, A1 injectors ×4, I1 coils ×4, I2, L3…) | rendered | 🟡 partial netlist |
| SCH-09 | Responsive layouts: **Desktop / Tablet 1024×768 / Mobile 390×844** | control | 🟡 |
| SCH-10 | Print / Export | controls | 🔴 |

---

## Summary counts

- **Main-app screens:** 6 primary (Login, Hub, Garage, Progress, Reports, Settings) + shared chrome.
- **Tool top-level screens/major panels:** Scanner ~14 · Multimeter ~9 (×11 components) · Oscilloscope ~8 · Location ~9 (×115 components / 58 systems) · Schematic ~10.
- **Distinct original screens/major states discovered: ≈ 56** (excluding per-component/per-system permutations, which run into the hundreds).
- Full field-by-field per screen is in doc 19; interactions in doc 18; gap classification in doc 20.
