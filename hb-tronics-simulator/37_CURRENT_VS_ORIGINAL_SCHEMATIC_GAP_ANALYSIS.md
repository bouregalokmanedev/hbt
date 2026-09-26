# 37 — Current vs Original Schematic Gap Analysis

Current code inspected (read-only): `packages/sim-schematic/engine.ts (88)`, `packages/sim-schematic/index.ts`, `data/schematic/netlist.ts (248)`, `features/schematic/SchematicView.tsx (225)`, `features/schematic/hooks/useSchematicEngine.ts`, `messages/*/schematic.json`.

## Verdict: current implementation is a **thin synthetic placeholder** — architecture is right, data + behaviour are ~15% of source.

## What exists (reusable foundation)
- **Framework-free `SchematicEngine extends Engine<SchematicState>`** — zero React/DOM. ✅ correct architecture, keep the shell.
- Modes typed `study|trace|training|practice|exam`; `setMode/setView/selectCmp/selectWire/startTrace/traceNext/activeTraceCmp/inspectWire`. ✅ browse + trace-step skeleton.
- Registry/hook wiring (`getEngine("schematic")`), `focus INJ/COIL → trace` deep-link. ✅
- `messages/*/schematic.json` exists (keys: mode, view, trace, inspector, controls, legend) EN/AR/FR. ✅ partial chrome, must expand.
- Diagram asset **`diagram-r16.png` (4016×1479) already vendored**. ✅ (currently unused).

## What is wrong / fabricated (must replace)
| Area | Current | Authentic | Action |
|---|---|---|---|
| **Component data** | 48 synthetic nodes in a fake column grid | **57** with real image coords `x,y,w,h` in 4016×1479 | re-extract `CMP` verbatim |
| **Coordinates** | invented grid (`col()`, x=30…940) | image-absolute px centres | re-extract |
| **Pin table** | ~60 hand-authored `WIRES` with **fabricated** pins (B102–B105, B1–B8, A13–A19…) | **133** rows `[ecuPin,ecuColour,target,targetPin,targetColour]` | re-extract `W` verbatim |
| **Distinct ECU pins** | not modelled | **111** (A 34 / B 77) | derive from `W` |
| **Colours** | 11, key `LightGreen`; no `White/Black` | 12 incl. `Light Green` + `White/Black` split swatch | re-extract `COL` |
| **Colour mismatch** | absent | 9 rows, amber note | add |
| **Traces** | 3 × **3** steps, paraphrased | 3 × **6/7/5** steps, exact keys+colours+desc | re-extract `TRACES` |
| **Diagram render** | synthetic `<svg viewBox 1120×600>` node graph | raster `diagram-r16.png` + hotspot/SVG overlay | rebuild canvas |

## What is missing (must build)
- **Training** task engine (8 `TASKS`, click-to-answer, feedback, accuracy scoring, taskDone/attempts). Current: mode button exists, **no behaviour**.
- **Practice** deterministic pin-table MCQ generator (4 ECU-pin options, feedback). **Absent.**
- **Exam** (6 `EXAMQ`, label masking, answer collection, submit, scoring, restart). **Absent.**
- **Search palette** (⌘K, components+wires, ≤40, empty state). **Absent.**
- **Layers** system (11, 4 NO-DATA, per-type tinting). **Absent** (has a static legend instead).
- **Circuit view** (6-column synthesised graph). **Tab absent** (only schematic node-soup).
- **Connector modal** (A/B pinout grid). **Absent.**
- **Vehicle modal**, **bookmarks**, **recent**, **component filter list**, **sidebar** (systems/components/recent/progress/bookmarks). **Absent** (current has no sidebar).
- **Pin-table inspector** (rows, selected-wire block, shared-ground pins, related chips, OEM "not available", sheet summary, connector cards). Current inspector shows only `type` + `id`.
- **Pan/zoom on stage** (wheel-about-cursor, drag, minimap, fit/reset per view/device/layout). Current uses a generic `usePanZoom` on a small viewBox.
- **HUD** pill, **trace animation** (33 ms walk), Play/Pause.
- **Layout A/B/C** + **device desktop/tablet/mobile** emulation.
- **SessionResult**: engine **never calls `complete()`** — no Training/Practice/Exam result is committed. Must emit on completion.
- **Class-C content**: trace descs, task prompts/explanations, exam prompts, feedback, empty states, all modal/inspector prose in EN/AR/FR.

## What is different by design (keep)
- **Star topology on E1** — not a general graph. The future trace engine must resolve paths over the E1-hub netlist deterministically (traces are authored step lists, not BFS). Do **not** substitute generic graph traversal.
- **English-only source** → we add EN/AR/FR (canonical technical values stay LTR), consistent with the other four tools.
- **"Not available in uploaded project"** empty states are authentic and must be reproduced, not filled.

## Risk / infra notes
- Deep-i18n-fallback + `role=group` (not `img`) a11y lessons apply to hotspots/circuit nodes.
- Canvas is a `ltr-island` (never mirrors under RTL) — already the pattern.
- Large raster (4016×1479, 348 KB) — lazy/`priority` handling; hotspot layer is % of intrinsic px (Location pattern).
- Deterministic scoring (accuracy %) differs from Location/Oscilloscope point systems — mirror source exactly, do not port a points model.
- **No Scanner/Multimeter/Oscilloscope/Location changes** implied.

## Reuse vs replace
- **Reuse:** engine base class + registry/hook + mode/view/trace-step scaffold + Location-style image-hotspot rendering + `ltr-island` + pan/zoom lessons.
- **Replace:** `data/schematic/netlist.ts` entirely (re-extract CMP/W/TRACES/COL/TASKS/EXAMQ/LAYERS from source); the whole canvas (raster+overlay); the inspector; add sidebar, modals, layers, search, task engines, SessionResult.
