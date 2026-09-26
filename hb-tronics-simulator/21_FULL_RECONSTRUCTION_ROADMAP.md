# 21 — Full Reconstruction Roadmap

Phased plan to reconstruct the original HB TRONICS application inside the current Next.js/React architecture, **preserving** the current build's engines, i18n/RTL, seams, and tests (doc 20 §5). Effort is relative (S/M/L/XL). Dependencies flow top-down. Each phase: screens · components · data · engines · interactions · deps · tests · visual-QA.

**Guardrails:** framework-free engines (no react/next in `packages/**`,`data/**`); Class-C prose → `content` namespace EN/AR/FR; every new screen raster-diffed against the original via the QA harness; keep the full gate green (tsc/lint/vitest/playwright/build).

---

### Phase 1 — Main shell fidelity ✅ (done)
Login + Hub rebuilt & raster-verified EN/AR. Shell chrome (rail/top bar/context bar/user menu) verified. **Remaining:** obtain original-side rasters for Garage/Progress/Reports/Settings (needs a main-app dc driver — see Phase 7). Effort: **done** / S remaining.

### Phase 2 — Scanner full reconstruction (XL)
- Screens: SC-01 workstation landing, SC-02 function grid (ADAS/Immobilizer/TPMS/Software Update/Coverage/Training/Knowledge Base/ECU Programming-locked), SC-13 recent sessions, SC-14 status bar, Pro/Training toggle.
- Components: HeroPanel, FunctionCard, RecentSessionRow, StatusBar.
- Data: function-module registry, recent-sessions dataset, VCI/OS/coverage meta.
- Engines: extend scanner engine for mode + workstation state.
- Interactions: mode toggle, module open, start-local-diagnostic flow.
- Tests: nav to each module; Class-C coverage for new prose. QA: raster-diff SC-01/02 at 5 viewports EN/AR.

### Phase 3 — Multimeter full reconstruction (XL)
- Components: RotaryDial, DraggableProbe, PinnableWiringDiagram, ReferenceChartTable, ComponentTabs (6).
- Data: per-component pinouts + reference tables + related-parts/manuals/info content.
- Engines: reading resolution gated on (rotary function + both probes seated + correct pins); 6-step procedures × 11 components (54 steps).
- Interactions: rotary rotate, probe drag-drop, pin seat, hint, Yes/No judge, Progress tab.
- Tests: reading gate logic; step machine; Class-C for instructions/fails (already partly done). QA: raster-diff MM-01.

### Phase 4 — Oscilloscope full reconstruction (L)
- Convert scope workspace to **dark theme**; add procedure checklist (n/7), REFERENCE VALUES table, full readout row, AI + Score tabs, Compare/upload.
- Engines: extend waveform + scoring; reference-compare.
- QA: dark-theme raster-diff OS-01/02.

### Phase 5 — Location full reconstruction (XL)
- Data: **115-component atlas**, 58 vehicle systems, 8 categories, zone images.
- Components: SearchBox, CategoryFilter, SystemList, Favourites, DetailPanel (Vehicle views / Practise this), 6 view tabs.
- Engines: extend quiz/train for the full set.
- QA: raster-diff LO-01/02.

### Phase 6 — Schematic full reconstruction (XL)
- Engines: pin-table loader, **wire end-to-end trace**, layer model.
- Components: ModeBar (Study/Trace/Training/Practice/Exam), PinTable, LayerControl, LayoutSwitcher (columns/docks), CircuitView, Search.
- Data: full netlist (E1 133 pins, connectors A 34/B 77, grounds, CAN, fuses).
- QA: raster-diff SCH-01/02; responsive Desktop/Tablet/Mobile.

### Phase 7 — Main shell screens (M)
- Build a **main-app dc driver** (or extract the main template like the tools) to obtain original Garage/Progress/Reports/Settings rasters; then diff + align current implementations.
- Deps: QA harness extension for the main template.

### Phase 8 — Full interactions (L)
- Wire every interaction from doc 18 not covered above (compare/upload, print/export, favourites, responsive-layout switching, training/practice/exam scoring). Playwright interaction tests per tool.

### Phase 9 — State/engine expansion (L)
- Grow `packages/sim-*` for the new states (workstation modes, rotary/probe model, trace engine, atlas quiz, exam scoring). Keep framework-free; unit-test each.

### Phase 10 — i18n and RTL (M)
- Move all new learner-facing prose to `content` (EN/AR/FR); extend `content-classc.test.ts`. Verify RTL mirroring per new screen; keep instrument surfaces LTR (scope/meter/canvas).

### Phase 11 — Visual QA (M)
- Full raster-diff sweep: all screens × {1440,1280,1024,768,375} × {EN,AR} vs original via the harness. Fonts: inject local IBM Plex woff2 into the harness for exact type. Record pass/fail matrix.

### Phase 12 — Functional QA (M)
- E2E flows per tool (workstation→module, measurement gate, trace, quiz/exam scoring). Accessibility (axe) on every new screen. Coverage-gate + context propagation intact.

### Phase 13 — Production sign-off (S)
- Full gate green; raster matrix complete; gap-analysis items all ✅; update QA_SIGNOFF. Only then: PRODUCTION-READY.

---

## Dependency order
1 → (2,3,4,5,6 parallel where staffed) → 7 → 8 → 9 (interleaved with 2–6) → 10 → 11 → 12 → 13.
Engines (9) underpin 2–6, so grow them alongside each tool. Localization (10) follows each tool's content landing.

## Effort estimate (relative)
- XL: Scanner, Multimeter, Location, Schematic (4)
- L: Oscilloscope, Interactions, Engine expansion (3)
- M: Shell screens, i18n/RTL, Visual QA, Functional QA (4)
- S: Phase 1 remainder, Sign-off (2)
**Total: a multi-milestone program** — the tool layer alone is ~4 XL rebuilds. This is app-scale, not a polish pass.

## First phase to begin
**Phase 2 (Scanner)** — largest, most-diverged tool and the entry point to the diagnostic flow; establishes the workstation/module patterns the other tools reuse. Begin with SC-01 landing + SC-02 function grid behind the existing scanner route, raster-diffed against the harness render.
