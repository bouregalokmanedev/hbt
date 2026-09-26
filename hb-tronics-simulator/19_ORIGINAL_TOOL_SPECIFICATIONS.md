# 19 — Original Tool Specifications

Per-tool spec derived from authentic renders + `.dc.html` sources. Design tokens are the ones already verified in docs 03/07/09 (shell `#0E1114`, brand `#F47822`, ink `#131A26`, rail `#14181C`, IBM Plex Sans/Mono/Condensed) — the originals reuse them; only tool-interior composition differs. Each tool `.dc.html` links Google Fonts + `./support.js` (dc-runtime) and declares configurable props via `data-props`.

---

## 1. Scanner (`Scanner.dc.html`)
**Purpose:** professional OBD diagnostic workstation.
**Props (`data-props`):** `defaultMode` = pro | training (default pro); `scanSpeed` = 80–600 ms (default 200); `showAiAssistant` = bool (default true).
**Own rail (11):** Scanner home · Dashboard · Local Diagnostic · System List · Live Data · Training Simulator · ADAS Calibration · History · Reports · Settings · Diagnostic Assistant.
**Landing (SC-01) composition:** header "DIAGNOSTIC WORKSTATION / Select a diagnostic function" + right meta cards (VCI INTERFACE HB-LINK 3·BT, DIAGNOSTIC OS HB-OS 4.2.1·3 updates, COVERAGE 142 brands·2026.7); three hero panels — **Intelligent Diagnostic** (dark, Cloud Online), **Local Diagnostic** (orange, START HERE), **Reset & Service Functions** (38 routines); 10-card function grid (ADAS 2 due / Immobilizer & Keys / TPMS / Diagnostic History 184 / Software Update 742 / Vehicle Coverage / Training Simulator L2·68% / Knowledge Base / Other Modules / ECU Programming — HB PRO+ locked); RECENT SESSIONS (3 rows: vehicle, date/time/km/tech, DTC count); bottom bar (HB-LINK 3 connected · ignition ON · engine running | Vehicle coverage | Start local diagnostic →). Top: PROFESSIONAL/TRAINING toggle, VCI LINKED 13.9 V.
**Colors:** brand orange hero panel, dark intelligent panel, light cards; accent `#F47822`. **Typography:** Condensed for headings. **Responsive/RTL:** full-width workstation; RTL mirrors rail + cards.
**Dependencies:** vehicle context, DTC/live-data engines, scenario data.

---

## 2. Multimeter (`Multimeter.dc.html`)
**Purpose:** guided static measurement with a physical-DMM simulation.
**Left:** 11 components grouped (Air & fuel: L3, L1, A1, H3; Ignition: I1, I2; Position: X1, X7, G1; Emissions & temp: U1, T1), "0 of 11 cleared · 54 measurement steps", per-component progress (n/steps).
**Center:** COMPONENT DIAGNOSIS — ref badge + name, COMPLAINT banner, 6 tabs (Wiring diagram / ECU pin and connector / Location / Related parts / Repair Manuals / Component information); interactive wiring diagram (clickable pins, legend Component/Control unit/Wire, Reset / View wiring and pins / Extended wiring diagram, zoom −/+); step panel "Diagnosis n/6" with instruction, reference **chart-table** (Temp °C ↔ Resistance kΩ), "Does the resistance match?", YOUR MEASUREMENT (Red probe·pin, Black probe·pin, Rotary switch·function), Yes / No / Need a hint.
**Right:** **rotary-dial DMM** "HB TRONICS DMM-772 TRUE RMS" — LCD, rotary (OFF/Ω/mA/V~/V-/A/Hz), jacks (A/mA/COM/VΩ); "PROBES — DRAG ONTO A PIN" with draggable Red/Black probes; note "display only reads when both probes are seated and the rotary switch is on the right function".
**Mechanics:** rotary selection + probe **drag-drop** + pin seating gate the reading. Diagnosis/Progress top tabs, TIME + SCORE, Restart session / Print.
**RTL:** mirror; keep meter LTR (instrument). **Deps:** component pinouts, meter engine, wiring netlist.

---

## 3. Oscilloscope (`Oscilloscope.dc.html`) — **dark theme**
**Purpose:** four-channel waveform lab with guided exercises.
**Top:** OSCILLOSCOPE · component · exercise id (e.g. INJ-01), SCORE x/100, tabs Library / Connect / Scope / Compare / Tablet.
**Left panel:** EXERCISE id, component title + descriptor, PROCEDURE checklist (e.g. 5/7 with tick states), MEASUREMENT prose, REFERENCE VALUES table (Rest voltage, Pull-down, Inductive spike, Peak/Hold current, Pulse width…), Source note, FAULT INJECTION chips (Healthy + 7 faults) with HEALTHY state badge.
**Center (dark scope):** channel legend (A driver 10 V/div, B current clamp 1 A/div, REF overlay), grid, cursors A/B, STOP/SINGLE/AUTO SET, TIME/DIV, TRIG (↓ FALL, level), PERSIST/PEAK DET/REF/CURSORS/SAVE; readout row V MAX/MIN/P-P, FREQ, DUTY, PULSE W, RISE, ΔT A→B, ΔV A→B; CH A/CH B controls (V/div −/+, DC, INV, position −3.0 div ↕).
**Right panel tabs:** Info (component image, FUNCTION, LIVE STATE bars: Pintle lift %, Winding current A, Inductive spike; CONSTRUCTION bullets) / Pinout / Probes / Ref / AI / Score.
**Colors:** dark workspace (`~#0E1114`/panels), trace orange + green, grid subtle. **RTL:** mirror chrome; keep scope LTR (waveform). **Deps:** waveform synth engine, fault model, cursor math, scenario rubric.

---

## 4. Location (`Location.dc.html`) — **115-component atlas**
**Purpose:** whole-vehicle component location atlas + train/quiz.
**Top:** LOCATION · "engine bay, fuse box, ECUs & ground points", modes Browse / Training / Quiz / Mobile preview.
**Left:** search ("115 components in data set"); CATEGORIES (All 115 / Sensors 8 / Actuators 2 / ECUs-Modules 15 / Relays 15 / Fuses 56 / Ground points 19 / Vehicle systems 58); VEHICLE SYSTEMS (58 systems, e.g. ABS 6, A/C 8, Charging, CVT, Cruise 13, Door lock 9, EPS 4, ESP 3, Headlights 10, Immobiliser 8, Navigation 3, Parking assist, Pre-crash 8, Smart entrance…); FAVOURITES.
**Center:** breadcrumb (Vehicle › Zone › Component), view tabs (Sensors/ECUs/Ground/Fuse box/Systems/Vehicle), Hotspot outlines + Dim others toggles, zoom −/100%/+/FIT, stage image + hotspots.
**Right:** detail panel — ref badge + category + name, Component / OEM ref / Reference / Category / Vehicle system / Zone / Location / Vehicle, NOTES; buttons Vehicle views + Practise this.
**RTL:** mirror; keep stage LTR (technical). **Deps:** 115-component dataset, zone images, quiz engine.

---

## 5. Schematic (`Schematic.dc.html`) — netlist workspace
**Purpose:** interactive wiring diagram with pin tables + wire tracing.
**Top:** SCHEMATIC, Search (⌘K), modes Study / Trace / Training / Practice / Exam, Layers / Print / Export.
**Sub-bar:** breadcrumb (system › component), SHEET 1/1 UPLOADED, LAYOUT (Schematic / Circuit view), columns A/B/C, dock (three-column / canvas-first / bottom-dock), layers (7/11), zoom % / Fit / Reset.
**Left:** Filter; VEHICLE SYSTEMS (Engine management 57, ECU & connectors 2, CAN network 2, Power distribution & grounds 11) + note "Transmission, ABS, Airbag, Body, Lighting, HVAC, Hybrid, EV, Comfort — not available in uploaded project"; COMPONENTS ON SHEET (57: E1 ECU 133, R16/R1/R15/R3, O7 fuses ×7, O8 grounds ×4, O2 CAN ×2, O6 diag connector, O19 cluster, G1, E19/E24/E25/E27, A1 ×4, I1 ×4, I2, L3…); RECENT; TRAINING PROGRESS (0% · 0 of 8).
**Center:** canvas (components + wires), pan/zoom.
**Right:** INFORMATION ("select anything… click a row to trace end to end"); SHEET SUMMARY (Components 57, Pin-table rows 133, ECU connectors A·B, Distinct ECU pins 111, Grounding AB·BA·BB·EB, CAN 2); ECU CONNECTORS (A — 34 pins, B — 77 pins).
**Responsive:** Desktop / Tablet 1024×768 / Mobile 390×844. **RTL:** mirror chrome; keep canvas LTR. **Deps:** full netlist (pins, connectors, grounds, CAN), trace engine, layers.

---

## Assets referenced by originals
Component reference photos, zone/location diagrams (engine bay, fuse box), wiring-diagram SVGs, oscilloscope reference images, DMM/scope device art. Many correspond to the extracted `assets/simulator/**` set (see doc 05 + the P6 review in `05_ASSET_INVENTORY.md §0.5.1`); the 115-component atlas and full netlist imply **substantially more art than currently vendored**.
