# 18 — Original Interaction Inventory

Authentic interactions observed in the rendered original tools (harness) and declared in the `.dc.html` templates (`onClick`, `sc-for`, `data-dc-on`, `data-props`). Status vs current build: ✅ matched · 🟡 partial · 🔴 missing · ⚠️ differs.

---

## Global / shell
| Interaction | Original | Status |
|-------------|----------|--------|
| Rail navigation (SIM + REC + footer) | click icon → switch view | ✅ |
| Rail collapse/expand (`»`/`«`, 66↔206px) | toggle | ✅ |
| Component-context bar (UNDER TEST chip, ref badge, `⇄`/`+`, 5 tool-jump buttons) | click → jump tool with focus | ✅ |
| User menu (avatar, XP, sign-out, Change) | dropdown | ✅ |
| Vehicle selection / coverage gate | pick vehicle → gate uncovered tools | ✅ |
| Theme toggle (☀) | light/dark | 🟡 (current: partial) |
| Locale switch + RTL | EN/AR/FR | ✅ |

---

## Scanner
| Interaction | Original | Status |
|-------------|----------|--------|
| PROFESSIONAL / TRAINING mode toggle | switch scanner mode | 🔴 |
| "Select a diagnostic function" hero cards (Intelligent / Local / Reset & Service) | enter flow | 🔴 |
| Function grid (ADAS, Immobilizer, TPMS, History, Software Update, Coverage, Training, Knowledge Base, ECU Programming) | open module | 🔴 |
| "Start local diagnostic →" | begin full-system scan | 🟡 |
| ECU network map (pan/zoom, bus + status filter chips) | interact | ✅ |
| DTC list → 5-tab detail (Overview/Causes/Tree/Live/Repair) | tabs | 🟡 |
| Diagnostic tree: measure → reveal → pass/fail | step machine | ✅ |
| Live data: PID graphing | select/graph | 🟡 |
| Training scenario: guided steps + single-attempt scored answer | flow | 🟡 |
| ADAS calibration run (0→100 + checklist) | animate | 🟡 |
| Diagnostic Assistant (AI) scripted dialogue | ask | 🟡 |
| Recent sessions open/compare | click | 🔴 |
| Vehicle coverage matrix | view | 🟡 |

---

## Multimeter
| Interaction | Original | Status |
|-------------|----------|--------|
| Component select (11, grouped by system) | switch component | 🟡 (fewer) |
| **Rotary dial** (OFF/Ω/mA/V~/V-/A/Hz) | rotate to function | ⚠️ (dropdown) |
| **Drag Red/Black probe onto pin / jack** | drag-drop | 🔴 (click-place) |
| Reading only when both probes seated + correct function | validation | 🟡 |
| Step procedure (1..6 per component) | advance | 🟡 |
| Resistance/temperature chart-table reference | display | 🔴 |
| "Does it match?" Yes / No / **Need a hint** | judge + hint | 🟡 |
| Component tabs (Wiring / ECU pin / Location / Related parts / Repair Manuals / Component info) | tab switch | 🔴 |
| Wiring diagram: pin click, Reset, View wiring+pins, Extended diagram, zoom | interact | 🟡 |
| Diagnosis / Progress top tabs | tab | 🟡 |
| Restart session / Print | action | 🔴 |
| Score + timer | live | 🟡 |

---

## Oscilloscope
| Interaction | Original | Status |
|-------------|----------|--------|
| Top tabs Library / Connect / Scope / Compare / Tablet | switch | 🟡 |
| STOP / SINGLE / AUTO SET | run control | 🟡 |
| TIME/DIV −/+ | timebase | ✅ |
| Trigger: edge (↓ FALL), level slider | set | 🟡 |
| PERSIST / PEAK DET / REF / CURSORS / SAVE | toggles | 🟡 |
| Cursors A/B → ΔV, Δt | measure | ✅ |
| Channel A/B: V/div −/+, DC/AC, INV, position ↓↑ | set | 🟡 |
| **Fault injection** (8 states) | inject | ✅ |
| Right tabs Info/Pinout/Probes/Ref/**AI**/**Score** | switch | 🟡 |
| Procedure checklist tick-off (5/7) | guided | 🔴 |
| Submit diagnosis on Score tab | scored | 🟡 |
| Upload/compare reference waveform | compare | 🔴 |

---

## Location
| Interaction | Original | Status |
|-------------|----------|--------|
| Mode: Browse / Training / Quiz / Mobile preview | switch | 🟡 |
| Search components (115 in data set) | filter | 🔴 |
| **8 category filters** | filter | 🔴 |
| **58 vehicle-system** drill-down | select | 🔴 |
| View tabs: Sensors/ECUs/Ground/Fuse box/Systems/Vehicle | switch | 🟡 |
| Hotspot click → detail panel | select | ✅ |
| Hotspot outlines / Dim others toggles | toggle | 🟡 |
| Zoom −/+/FIT/100% | zoom | 🟡 |
| Favourites (star) | pin | 🔴 |
| "Vehicle views" / "**Practise this**" | action | 🔴 |
| Training: guided locate + hint | flow | 🟡 |
| Quiz: scored placement, tolerance retries | flow | ✅ |

---

## Schematic
| Interaction | Original | Status |
|-------------|----------|--------|
| Modes: Study / **Trace** / Training / Practice / **Exam** | switch | 🔴 |
| Search (⌘K) wire/pin/ECU/fuse/ground | find | 🔴 |
| Component select → **pin-table rows** | load | 🔴 |
| **Trace wire end-to-end** (click a row) | trace | 🔴 |
| LAYOUT: Schematic / Circuit view | switch | 🔴 |
| Column layout A/B/C + dock (three-column / canvas-first / bottom-dock) | arrange | 🔴 |
| **Layer control** (7/11 layers) | toggle layers | 🟡 |
| Pan / zoom (%, Fit, Reset) | navigate | ✅ |
| Vehicle-system filter (Engine mgmt/ECU/CAN/Power&grounds) | filter | 🟡 |
| Responsive: Desktop / Tablet 1024×768 / Mobile 390×844 | switch | 🟡 |
| Print / Export | output | 🔴 |
| Training progress (0 of 8 tasks, scored) | track | 🔴 |

---

## Interaction totals
- **Distinct original interaction types discovered: ≈ 90+** across the app (drag-drop, rotary dial, wire tracing, layer toggles, multi-mode training/practice/exam, pin-table loading, category/system drill-down, favourites, compare/upload, print/export, responsive-layout switching, etc.).
- **Genuinely novel mechanics not in the current build:** rotary-dial + probe drag-drop (Multimeter), wire end-to-end tracing + pin tables (Schematic), 115-component/58-system atlas with search+favourites (Location), the Scanner "diagnostic workstation" function hub, Oscilloscope procedure checklist + compare/upload, and Training/Practice/Exam scoring across tools.
