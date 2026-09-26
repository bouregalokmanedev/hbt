# 03 — Component / UI Element Inventory

UI building blocks are **not** formal reusable React components in the source — the "dc" runtime renders one pre-built HTML template per tool, and repeated elements are produced by `sc-for` loops over arrays built in `renderVals()`. The inventory below catalogues the **recurring UI patterns** (what a Next.js rebuild would componentise), each traced to its data source.

Colours are literal from source; see `07_DESIGN_SYSTEM.md`.

---

## 1. Shell components

| Pattern | Description | Source binding |
|---------|-------------|----------------|
| **Global left rail** | Collapsible icon rail (66↔206px), sectioned (top / SIMULATORS / LEARNING RECORD / footer), active bar + tint, optional labels, per-module % badge | `railTop/railSims/railLearn/railFoot`, `railItem()` |
| **Rail item** | Icon (two SVG paths from `I`), label, active fg/bg/bar, title | `railItem(id,label)` |
| **Top bar / module header** | Module icon, kicker ("MODULE 0X · …"), title, responsive show/hide | `modTitle/modKicker/modIcon*` |
| **Component-context bar** | "UNDER TEST" chip, ref badge, name, 5 tool-jump buttons, action (`⇄`/`+`) | `ctx*`, `ctxJumps` |
| **Component picker overlay** | Modal list of 11 components; each row: ref badge, name, system, 5 availability chips; search | `pickList`, `pickerDisplay` |
| **User menu** | Avatar + name + role, XP, dropdown, sign-out | `toggleUser`, `userMenuDisplay`, `signOut` |
| **Toast** | Single transient message, auto-dismiss 2.4 s | `toast`, `toastDisplay`, `say()` |
| **Module card** (hub) | Number, name/tag, title, desc, skill, progress %, level pill, last-activity, CTA (START/CONTINUE/REVIEW/LOCKED) | `mods[]` |
| **Compact row** (hub) | Same data, dense list layout | `hubRows` variant |
| **Coverage matrix cell** | ✓ / ↓ / — with colour set (ok/avail/none) | `cell()`, `garage[].cells` |
| **Pack chip** | Tool tag + coverage mark, clickable when installed | `packChips[]` |
| **Stat tile** | Label + value + unit | `stats[]` |
| **Certification card** | Ring mark, name, meta, status tag | `certs[]` |
| **Streak dots** | 7-day on/off dots | `streak[]` |
| **Report list row / detail** | Date, tool chips, outcome pill, score; detail: step rows (✓/!), verdict block | `reports[]`, `repSteps`, `repVerdict*` |
| **Settings segmented control** | Option pills, selected white w/ shadow, lockable | `segRow()`, `seg()` |
| **Settings toggle switch** | On/off, orange knob slide | `swRow()`, `sw()` |
| **Tool-jump button** | Enabled/disabled per component data availability | `ctxJumps[]`, `has()` |

---

## 2. Scanner components

| Pattern | Source |
|---------|--------|
| Grouped left nav (9 groups, icon+tag+label) | `nav`, `navDefs` |
| Breadcrumb bar | `crumb`, `crumbs` |
| Battery-voltage indicator (colour by threshold) | `volts`, `voltColor` |
| Pro/Training mode toggle | `setPro/setTraining` |
| Filter/segment "chip" (generic) | `chip(label,val,cur,set)` |
| Scan log line (status colour + tag) | `scanLog[]` |
| Progress bar (scan / ADAS) | `scanBarW`, `adasBarW` |
| **ECU network node** (SVG rect + stub to bus rail + DTC badge) | `netNodes[]`, `netRails[]` |
| Pan/zoom SVG transform + controls | `netTransform`, `zoomIn/Out/fitNet` |
| Sortable table header + rows (systems) | `sysHead`, `sysRows` |
| DTC row (expandable, severity colour, freeze-frame flag) | `dtcRows[]` |
| Tabbed detail panel (5 tabs) | `dtcTabs`, `tab*` flags |
| **Diagnostic-tree step** (measure → pass/fail, locked/active/done, feedback) | `treeSteps[]` |
| Live-data row (sparkline SVG, min/max, in/out-of-spec, select/pin) | `liveRows[]`, `sp()` |
| Multi-signal graph (polyline per signal, cursor line, legend) | `gSignals[]`, `cursorX` |
| ADAS item + checklist | `adasList`, `adasSteps` |
| History row | `histRows[]` |
| Training step / answer option / score bar | `tSteps`, `tAnswers`, `tScores` |
| AI assistant panel (chat bubbles + option buttons) | `aiLog`, `aiOptions` |
| Modal (clear codes / compare) | `modalClear/modalCompare` |
| Action bar (contextual per screen) | `actions`, `A()` |
| Metric tile / attention card / quick-jump tile | `ovMetrics`, `attention`, `jumps` |

---

## 3. Multimeter components

| Pattern | Source |
|---------|--------|
| DMM instrument face (rotary switch OFF/VDC/OHM/MA, display) | `mode`, symbols |
| Draggable probe leads (red/black) + drop targets (pins, ECU pins, ground) | `probes`, `drag`, `lead` |
| Connector diagram with numbered pins + pin-function callouts | `data[].pins/pinFn` |
| Component symbol (SVG two-path glyph) | `symbols{}` (11 glyphs) |
| ECU pin/connector panel | `data[].ecu` |
| Guided measurement step (instruction, spec, expected reading, spec table) | `data[].steps[]` |
| Spec/temperature-resistance table | `steps[].table` |
| Pass/fail feedback banner | `feedback` |
| Score + elapsed-timer chips | `score`, `elapsed` |
| Component tab strip (wiring/ecu/location/parts/manuals/info) | `tabDefs` |
| Progress view (per-component completion) | `view:'progress'` |
| Generated report card | `report` |

---

## 4. Oscilloscope components

| Pattern | Source |
|---------|--------|
| Screen tab bar (Library/Connect/Scope/Compare/Tablet) | `SCREENS`, `tabs` |
| Right info-panel tabs (Info/Pinout/Probes/Ref/AI/Score) | `RTABS`, `rtabs` |
| CRT-style graticule + dual-channel trace (SVG polylines) | `fn(ch,p)`, palette `COL` |
| Channel control block (V/div, offset, invert, coupling, enable) | `vdivA/B`, `offA/B`, `couplingA/B` |
| Trigger control (level slider, edge, min/max) | `trig`, `trigLevel/Edge` |
| Time-base control | `timeDiv` |
| Cursor pair (A/B) with measurements | `cA`, `cB`, `cursors` |
| Fault selector (dropdown of injected faults) | `fault`, `FAULTLBL`, `FAULTDESC` |
| Connect-the-probes puzzle (A/GND/CLAMP → correct pins) | `probes`, `correct` |
| Reference-image overlay | `refImages`, `showRef` |
| Spec list | `specs[]` |
| Component library grid | `COMPONENTS[]` |
| AI panel + Score panel | `rtab:'ai'`, `rtab:'score'` |
| Light/dark theme switch | `applyTheme()`, `PALETTE` |

---

## 5. Location components

| Pattern | Source |
|---------|--------|
| Image-map stage (component / fuse / vehicle / system views) | `view`, `stageSrc` |
| Hotspot rectangle (component, ECU, ground, fuse, relay) | `SENSORS`, `ECUS`, `GROUNDS`, `FRECT`, `RRECT` |
| Component detail panel (location, mount, system prose) | `SLOC` |
| Searchable/categorised component list | `query`, `cat` |
| Mode segment (Browse/Train/Quiz) | `mB/mT/mQ` |
| Training target + hint + reveal + verdict | `tTarget`, `tHints`, `tReveal`, `tVerdict` |
| Quiz runner (list, index, score, tries, timer, log) | `qList`, `qIdx`, `qScore` |
| Favourites / recent chips | `favs`, `recent` |
| Zoom control | `zoom` |
| View tab strip | view objects (`sensors/fuse/system/vehicle`) |

---

## 6. Schematic components

| Pattern | Source |
|---------|--------|
| Pan/zoom SVG canvas | `z`, `tx`, `ty` |
| Component node (typed: ecu/relay/fuse/ground/sensor/actuator/switch/module/network/connector) | `CMP{}` |
| Wire (coloured polyline, colour from `COL`) | `W[]`, `COL` |
| Wire/pin inspector panel | `sel`, `selWireIdx` |
| Mode segment (Study/Trace/Training/Practice/Exam) | `modes` |
| View toggle (Schematic/Circuit) | `setSchematic/setCircuit` |
| Guided trace player (stepped highlight) | `TRACES`, `trace`, `tracePlaying` |
| Left tool rail (systems, search, layers, bookmarks, recent, progress) | `railItems` |
| Search overlay / Layers panel / Drawer | `showSearch`, `showLayers`, `drawer` |
| Feedback banner (practice/exam) | `feedback` |
| Legend (type labels `TYPEL`) | `TYPEL` |

---

## Reuse observations for the rebuild

Cross-tool repeated patterns worth extracting into shared components in Next.js:
- **Chip/segment control**, **toggle switch**, **toast**, **progress bar**, **pan/zoom SVG canvas**, **filterable/sortable table**, **guided-step list with pass/fail**, **score panel**, **tabbed side panel**, **AI chat panel**, **hotspot/node overlay on an image or SVG**.
- **Colour-state helper** (ok/warn/fault/none → fg/bg) recurs in every tool with near-identical logic.

**NOT FOUND IN SOURCE:** a shared component library / design-token file; each tool re-declares its own colours and helpers inline.
