# 06 — Simulator Functionality

The distinctive value of this application is the **simulation logic**, not the chrome. This file documents the data models and behaviours of each of the five tools plus the shared model. All values are literal from source (Toyota Corolla 1.6 16V VVT-i, engine **1ZR-FE**, 2013–2018 — plus a Camry ASV70 used inside the Scanner tool's own demo).

---

## 0. Shared "single bench" model (shell)

- **Vehicles (`VEH`, 4):** Corolla 1ZR-FE (INSTALLED, full coverage), Camry A25A-FKS (packs available), VW Golf CZCA (partial), Hyundai i30 D4FB (no coverage). Each has a per-tool coverage map (`ok`/`avail`/`none`) that gates the tools.
- **Shared components (`CTX`, 11):** X1 crank, X7 cam inlet, L3 MAF, L1 MAP, H3 throttle motor, I2 knock, T1 coolant, U2 post-cat O2, G1 accel pedal, INJ injector 1, COIL coil 1 — each with per-tool identifiers (`loc`, `mm`, `scope`, `sch`) so "focus" resolves correctly in every tool.
- **Reports (`REPORTS`, 7):** completed sessions with tools used, finding, PASS/FAULT, score, verdict, and step log — the learning record shown on Reports/Progress.
- **Progress metrics:** overall 58%, streak `[1,1,1,1,1,0,1]`, stats (34 sessions, 21 bench-hours, avg 81/100, 19 faults), 3 certifications, weak-spots, recommended path, coach text keyed to the active vehicle/focus.

---

## 1. Scanner (SCN) — diagnostic scanner

**Vehicle network model (`NODES`, 21 ECUs on 3 buses):**
- CAN-B (Body, 125 kbit/s): BCM, IPC, HVAC, IMMO, TPMS(warn), DDM, PDM(offline).
- CAN-C (Powertrain, 500 kbit/s): ECM(fault,3 DTC), TCM(warn), ABS(fault), SRS, EPS, EPB, SAS.
- CAN-FD (Chassis/ADAS, 2 Mbit/s): ADAS(fault,2), CAM-F, RAD-F, BSM-L/R, PDC, SVC(not equipped).
Protocols per node (UDS/ISO 14229, KWP2000, DoIP, LIN sub-bus). Status set: normal/fault/warn/none/offline.

**Fault codes (`DTCS`, 8):** P2118 (throttle actuator current), P0087 (fuel rail pressure low), P0504 (brake switch), C1201 (ESC), U0129 (lost comm w/ brakes), B1483 (camera calibration), P0741 (torque-converter), C2126 (TPMS battery) — each with status (Current/Stored/Pending/Intermittent), severity, occurrence count, first/last km+date, freeze-frame flag.

**Live parameters (`PARAMS`, 18 PIDs):** RPM, VS, ECT, EOT, VBAT, IAT, TPS, APP, FRP(warn), FRPD, LPP(fault), MAP, MAF, LAM, IGN, INJ, LOAD, IDL — each with range, step (random-walk amplitude), decimals, spec string, and optional fault state. Updated on a **420 ms timer** with a 48-sample history; battery voltage drives a coloured indicator.

**Diagnostic tree (`TREE`, 7 steps)** for P2118: supply voltage → connector → motor supply → ground resistance → CAN comms → **motor resistance (fails: 6.42 Ω vs 0.3–1.8 Ω spec)** → TP correlation. Interactive: reveal measurement, then learner judges PASS/FAIL; graded against the correct branch, terminates at the fault.

**Possible-causes ranking** (with % of confirmed fixes), test conditions, required tools, expected-vs-measured table.

**Training scenario 12** ("Intermittent power loss under load", fuel-pressure fault): 6 guided steps that jump into DTCs/livedata/graph/tree; single-attempt answer (correct: *restricted fuel filter starving the HP pump*); scored (accuracy 92, process 88, time 76) with tailored feedback.

**Other:** vehicle-selection database (28 brands, models, variants, VIN auto-decode), animated 21-node scan, pan/zoom ECU network map, sortable system list, ADAS calibration (6 items, animated run, pre-conditions), 5-session history, report, compare-with-previous, scripted AI assistant, Pro/Training modes.

---

## 2. Multimeter (DMM) — guided static measurement

**12 components (`data`)**, each: reference code, group, name, customer complaint + stored DTC, connector pin list, **pin-function map**, **ECU pin links** (which ECU pin each wire lands on), supply pins, and a **sequence of guided measurement steps**.

Each **step** carries: instruction text, meter **mode** (VDC / OHM / MA), **red/black probe targets** (connector pin `cN`, ECU pin `eBnn`, or ground `gnd`), expected **spec**, the **good** reading and a **bad** reading, unit, optional **spec table** (temperature→resistance or angle→voltage), and a **fail diagnosis** with repair action.

Example (MAF `L3`, 6 steps): air-temp resistance (2.21–2.69 kΩ @20°C) → 5 V ref @pin 2 → +12 V @pin 3 (fuse O7 / relay R1) → sensor earth @pin 5 → meter earth @pin 1 → signal continuity pin 4→ECU B92. Components covered: L3, L1, A1(injector), H3(throttle), I1(coil), I2(knock), X1(crank), X7(cam), G1(accel pedal, dual-track), U1(O2), T1(coolant).

**Bench mechanics:** rotary DMM (OFF/VDC/OHM/MA), drag red/black probes to targets (or click-to-place per settings), reading resolves from mode+targets+step, fault injected per component, score (start 100), elapsed timer, generated report, ECU-pin/connector tab.

---

## 3. Oscilloscope (OSC) — waveform lab

**7 components (`COMPONENTS`):** inj, coil, cam, app, map, knock, lambda. Each defines:
- Electrical params: period, supply, open-circuit level, peak, time/div, channel A/B (label, unit, V/div, offset), trigger (level, edge, min/max/step), coupling.
- **`fn(ch, p)`** — a math function generating the real waveform shape (e.g. injector: 12 V rest → pull-down → **inductive spike ~68 V** → exponential decay; peak-&-hold current ~3 A peak / ~1.5 A hold; coil: dwell, current limit ~7 A, **~330 V kick**, burn line).
- **Specs**, probe **instruction**, function explanation, bullet notes, connector + pins, ECU pins, **correct probe mapping** (`A/B/GND/CLAMP` → pins), allowed **fault list**, animation labels, probe notes, reference images.

**Fault set (12):** none, open, shortGnd, shortBat, highRes, weak, noise, poorGnd, dropout, intermittent, missing, coilWeak, injShort — each with a description; selecting one deforms the synthesised trace.

**Scope engine:** dual-channel polyline render sampled from `fn`, configurable noise (`signal-noise` prop, 0/1/2), trigger, cursors A/B with measurements, persistence, peak-detect, reference overlay, light/dark theme. Screens: Library, Connect (probe puzzle), Scope, Compare, Tablet. Right tabs: Info, Pinout, Probes, Ref, AI, Score. Learner connects probes correctly, reads the trace, and submits a diagnosis (scored).

---

## 4. Location (LOC) — component-location atlas

**Data:** 10 sensors/actuators (`SENSORS`) with image + hotspot coordinates; per-component prose (`SLOC`: zone, location, mount, system); 15 ECUs (`ECUS`) with coordinates & descriptions; ground points (`GROUNDS`); fuse-box rectangles (`FRECT`/`RRECT`); relays (`RELAYS`); circuit alias map (`ALIAS`); system category lists (ECC/PTC/ABSC/IMMO).

**Views:** Fuse box, Sensors (component detail image), Systems (trace overlay on fuse-box image), Vehicle (4-view locator `views-*.png`), plus ECU/ground map layers.

**Modes:**
- **Browse** — search/filter/zoom, click hotspot → detail panel, favourites & recent.
- **Train** — given a target component, click its correct location; hints cost score; reveal; verdict logged; tolerance from `difficulty` prop; `show-outlines` overlays.
- **Quiz** — shuffled target list, per-question scoring, tries, elapsed timer, running score/log.

Focus/`on-select` sync with the shell; sensors auto-switch to the Vehicle view.

---

## 5. Schematic (WDG) — wiring-diagram workspace

**Data — a genuine harness netlist:**
- **`CMP` (~55 components):** ECU E1 (huge, 3414 px wide), relays (R16 ignition-coil, R1 main, R15 fuel-injection, R3 fuel-pump), fuses (O7 group), grounds (AB/BA/BB/EB), CAN nodes, diagnostic connector O6, injectors 1–4, coils 1–4, sensors (I2, L3, L1, L11, T1, U1, U2, X1, X7, X8, X9, X2, X16), actuators (V1, H3, A5/A6/A8/A55, timing solenoids), switches (S1 brake, S3 clutch, S18 gear, S68), modules (E19/E24/E25/E27, D41 transmission) — each with canvas x/y/w/h and a type.
- **`W` (~140 wires):** each `[ECU-pin, colour, target-component, target-pin, target-colour]` — a real point-to-point harness (e.g. `B20 Black → INJ1 pin2`; `B57 Red → COIL1 A3`; `A13/A26 → CAN1 H/L`; grounds `B16/B51/B59 → G_BA`).
- **`COL`** wire-colour palette (Pink, Black, Red, Blue, Brown, White, Yellow, Green, Light Green, Violet, Grey, White/Black).
- **`TRACES` (3 guided circuits):** Injector 1, Ignition coil 1, CAN system 1 — ordered step lists (component, description, wire colour) for animated trace playback.

**Behaviour:** pan/zoom SVG canvas (default zoom 0.32), click component/wire to inspect endpoints & colour; modes Study / **Trace** (play a `TRACES` circuit) / Training / Practice / Exam (scored identification); Schematic↔Circuit views; layers, search, bookmarks, recent, progress. Focus `INJ`/`COIL` auto-enters trace mode.

---

## 6. Cross-tool data coherence (the headline feature)

The same component appears, correctly, in every tool:

| Component | Location (LOC) | Multimeter (DMM) | Oscilloscope (OSC) | Schematic (WDG) |
|-----------|:--:|:--:|:--:|:--:|
| MAF `L3` | hotspot + prose | 6-step measure, ECU B90/91/92/122 | — | node + wires B90/91/92/122 |
| Injector 1 `A1/INJ` | — | resistance/supply/current steps, B20 | peak-&-hold waveform | INJ1 pin2 → B20 |
| Coil 1 `I1/COIL` | — | supply/trigger, B57 | dwell/kick waveform | COIL1 A3 → B57, A2 → B102 |
| Cam inlet `X7` | hotspot | Hall signal, B82/113/114 | Hall waveform | X7 → B82/113/114 |

ECU pin numbers (e.g. B20, B57, B92, B113) are **identical** between the Multimeter test steps and the Schematic netlist — confirming a single underlying engineering dataset, not per-tool inventions.

**NOT FOUND IN SOURCE:** any real vehicle communication, real OBD data, or connection to physical hardware — every reading is synthesised/scripted for training.
