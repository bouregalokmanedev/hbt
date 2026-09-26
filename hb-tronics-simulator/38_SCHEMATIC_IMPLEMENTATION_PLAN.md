# 38 — Schematic Implementation Plan

Additive reconstruction to the 5-layer architecture (UI → SchematicEngine → Netlist/Data → SessionResult), framework-free engine, EN/AR/FR, following the Location/Oscilloscope playbook. **No production code is written in this extraction phase** — this is the roadmap for Phase 6.1+.

## Guiding rules
- Re-extract **CMP / W / TRACES / COL / TASKS / EXAMQ / LAYERS verbatim** from `Schematic.dc.html` via a Node script (eval the source arrays → JSON → TS), exactly as done for Location's atlas — no transcription by hand, no fabrication.
- Preserve the **E1-hub star topology**; traces are authored step lists (not graph search).
- Reproduce authentic **"not available in uploaded project"** empty states as Class-C.
- Canvas is an `ltr-island`; hotspots are % of the 4016×1479 intrinsic px.
- Retire the synthetic `netlist.ts`/`SchematicView.tsx` only once the new path is green (additive, then delete).

## Milestones

### P6.1 — Engine + authentic data foundation (headless)
- Generate `data/schematic/netlist.ts` from source: `SCH_COMPONENTS` (57, `{key,code,name,type,x,y,w,h}`), `SCH_WIRES` (133, `{ecuPin,ecuColour,target,targetPin,targetColour,mismatch}`), `SCH_COLOURS` (12), `SCH_TRACES` (3, exact steps), `SCH_TASKS` (8), `SCH_EXAM` (6), `SCH_LAYERS` (11), `IMG_W/H`, derived helpers (`wiresFor`, `distinctEcuPins`, `connectorPins`, `sharedGround`, `relatedOf`, circuit-graph builder).
- Rebuild `SchematicEngine` (framework-free): state per source (`mode,view,sel,selWire,trace,traceStep/traceT,tracePlaying,layers,filter,query,taskIdx,taskDone,taskCorrect,attempts,feedback,revealed,examIdx,examAnswers,examSubmitted,recent,showSearch/Layers/Connector/Vehicle,drawer,layout,device,zoom,tx,ty`). Domain methods: select/pick, filter, search, trace control, layer toggles, **answerTask/answerPractice/answerExam** (exact accuracy scoring), next/reveal, connector/vehicle, and **`complete()` → SessionResult** on Training/Practice/Exam completion (`tool:'schematic'`, verdict content id).
- **Vitest** (~30): counts (57/133/111/A34/B77/12/9-mismatch/3-traces 6·7·5/8/6/11-4na), `wiresFor` hub, shared-net resolution, deterministic practice generator, training/exam scoring math, trace-step integrity, SessionResult emission. Headless, additive; old engine/data untouched.

### P6.2 — Full UI reconstruction on the engine
- New `features/schematic/` tree: shell (top bar + sub bar + 3-region body), `SchematicCanvas` (raster `diagram-r16.png` + SVG trace/wire overlay + 57 hotspots + exam masks + minimap + HUD + pan/zoom dock), `CircuitView` (6-column graph), `Sidebar` (systems/filterable components/recent/progress/bookmarks), `Inspector` (header/stats/selected-wire/pin-table rows/shared-ground/related/OEM-NA/sheet-summary/connector cards), `TaskPanel` (training/practice/exam), `LayersPanel`, `SearchPalette`, `ConnectorModal`, `VehicleModal`. Layout A/B/C + device desktop/tablet/mobile. All state via engine. Retire old view/data.
- **Playwright** (~12): loads (57/133), mode switches, select→pin-table, wire row→selected-wire+mismatch, trace play/step HUD, circuit view, search palette, layers toggle, connector modal, training answer+score, exam mask+submit, AR RTL canonical LTR.

### P6.3 — Content + finalization + QA
- Author `content.schematic.*` (trace descs, 8 task prompts+explanations, practice templates, 6 exam prompts, feedback, HUD, empty states, inspector/modal/sidebar/summary copy, verdicts) **EN/AR/FR strict parity**; extend `content-classc` + `coverage`.
- a11y (axe EN+AR: hotspots/rows/tabs/toggles/search/task controls, focus), RTL mirror (chrome mirrors, canvas `ltr-island`), raster QA at 1440/1280/1024/768/375 (device + layout states), regression gate (tsc/lint/vitest/playwright/build), no Scanner/Multimeter/Oscilloscope/Location regressions.

### P6.4 — Final audit (read-only)
Evidenced-scope acceptance mirroring the Location audit; verdict SCHEMATIC COMPLETE — EVIDENCED SCOPE.

## Class-C content inventory (author in P6.3)
Trace: 3 labels + 18 step descriptions. Tasks: 8 prompts + 8 explanations. Practice: 3 templates. Exam: 6 prompts. Feedback: ~5. HUD: 3 templates. Empty states: ~8. Inspector/modal/sidebar/summary labels: ~30. Verdicts: 6. Chrome (mode/view/layout/device/toolbar/legend): ~25. **≈110 Class-C strings × 3 locales.**

## Required assets
`diagram-r16.png` (4016×1479) — **already vendored**. No other assets required (circuit view is vector; no per-component images by source design). **Zero missing assets.**

## Estimated effort
- P6.1 Engine + data: **M** (data-gen script is the bulk; scoring/search/trace logic is well-scoped). Highest-value, lowest-risk.
- P6.2 UI: **L** (largest — raster canvas + pan/zoom + 5 modes + 2 views + sidebar + inspector + 4 overlays + layout/device matrix).
- P6.3 Content + QA: **M** (~110×3 strings + a11y/RTL/raster/regression).
- P6.4 Audit: **S**.
Overall the biggest tool after Scanner; the canvas/inspector breadth (not the data) dominates.

## Readiness for Phase 6.1
**READY.** Source fully extracted and counts verified (57/133/111); complete template, data arrays, scoring and trace algorithms captured; sole asset vendored and dimensionally confirmed (4016×1479); current placeholder audited; classification + content namespace defined; architecture target fixed. Phase 6.1 (Engine + Data) can begin with no open source questions.
