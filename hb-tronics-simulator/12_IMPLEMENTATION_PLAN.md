# 12 — Implementation Plan

**Purpose:** the build sequence for rebuilding the HB TRONICS Simulator on the target stack (Next.js 15+/React 19/TS/Tailwind/shadcn/Zustand/Framer Motion), grounded in analysis files `01`–`11` and the i18n spec `14`.

**Rules carried from the specs**
- The original HTML is the **visual source of truth**. No redesign.
- Preserve the five-layer separation (`10` §0): **UI · State · Simulation · Data · future API**. Engines stay framework-free.
- Preserve the source's two content classes (`14` §0): **Class A chrome = translatable keys**, **Class B technical data = canonical/English**. No literal English in reusable components.
- No backend. Repository interfaces stay static.
- **Definition of done for the whole project = `13_QA_CHECKLIST.md` passes.**

**Legend for each phase:** Tasks · Files affected · Dependencies · Expected result · Validation criteria.

---

## Phase 1 — Project Setup

**Tasks**
- Scaffold Next.js 15 App Router + React 19 + TypeScript (strict).
- Add Tailwind, shadcn/ui, Zustand, Framer Motion, next-intl, Zod.
- Configure path aliases + ESLint boundary rules (`packages/**` & `data/**` cannot import `react`/`next`; `features/**`/`app/**` cannot import engine internals; ban `pl-/pr-/left-/right-/text-left/right` in reusable UI per `14` §4).
- Create the empty layer skeleton from `11` (`app/`, `components/`, `features/`, `stores/`, `packages/`, `data/`, `lib/`, `styles/`, `messages/`, `public/`).
- Set up `[locale]` segment + `middleware.ts` locale negotiation (`en` default) and `lib/i18n/config.ts` (`en`,`ar`,`fr`, `dir()`).

**Files affected:** `package.json`, `next.config.ts`, `tsconfig.json`, `.eslintrc.cjs`, `tailwind.config.ts`, `components.json`, `middleware.ts`, `app/[locale]/layout.tsx`, `lib/i18n/*`, folder skeleton.

**Dependencies:** none (entry point).

**Expected result:** app boots at `/en`, renders a placeholder, lint enforces layer boundaries, `<html lang dir>` set from locale.

**Validation criteria:** `pnpm build` + `lint` + `typecheck` pass; visiting `/ar` sets `dir="rtl"`; an intentional `react` import inside `packages/**` fails lint.

---

## Phase 2 — Asset Migration

**Tasks**
- Run `scripts/extract-bundle.mjs` (dev-only) to decode the bundle per `01`/`05`; export the ~41 images and fonts.
- Place images in `public/assets/` (dedupe the repeated ~230 KB placeholders noted in `05`); wire `next/image`.
- Self-host IBM Plex Sans/Mono/Sans Condensed via `next/font/local`, subset to used weights (`05`/`07`); add **IBM Plex Sans Arabic** for `ar` chrome (`14` §15).
- Convert inline SVG path sets (`I`, Scanner `navDefs`, Multimeter `symbols`) into `components/icons/paths.ts` + `<Icon>`.

**Files affected:** `public/assets/**`, `styles/fonts.ts`, `components/icons/*`, `scripts/extract-bundle.mjs`.

**Dependencies:** Phase 1.

**Expected result:** all original raster/vector assets available locally; zero external CDN calls.

**Validation criteria:** every asset in `05` resolves; fonts render (Latin + Arabic); no 404s; Network panel shows no `unpkg`/`googleapis` requests.

---

## Phase 3 — Global Design System

**Tasks**
- Encode `07`/`09` tokens in `tailwind.config.ts`: brand `#F47822`, shell darks, 5 module accents, semantic status sets, neutrals, scope palette, wire colours; radius scale (2–14/50%/full); the 8 real shadow tokens; spacing literals; letter-spacing utilities.
- Define text presets matching real `font:` shorthands (eyebrow/label/body/heading/display/mono-value).
- Add Arabic type overrides: **letter-spacing reset for `:lang(ar)`**, larger line-height, optional size nudge (`14` §15). Enable Tailwind logical utilities.
- Build the single `statusColor()` helper (ok/warn/fault/none → fg/bg) reused across tools (`03`).

**Files affected:** `tailwind.config.ts`, `styles/globals.css`, `styles/type.ar.css`, `lib/tokens.ts`, `lib/status.ts`.

**Dependencies:** Phases 1–2.

**Expected result:** a token layer that reproduces the source's exact colours/radii/shadows/type with no inline literals.

**Validation criteria:** a token spot-check page renders swatches matching `07`/`09` hex values; `:lang(ar)` shows tracking removed; no hardcoded hex in components (lint/grep).

---

## Phase 4 — Application Shell

**Tasks**
- Build shell chrome (`02` global chrome, `03` shell components): `RailNav` (66↔206 px, sections top/SIMULATORS/LEARNING RECORD/footer, active bar `#F47822`), `TopBar` (`ModuleHeader` + `ComponentContextBar` + `UserMenu`), `ToastHost`, `CoverageGate`, `ComponentPicker`.
- Implement the `(app)` route-group layout wrapping in-app screens; login is separate.
- Wire shell to stores (Phase 9 stub first): `benchStore` (vehicle/focus/coverage), `uiStore` (toast/picker/menu/breakpoints), `settingsStore` (rail/labels/lang).
- All shell strings via `messages/en/shell.json` keys (`14` §3).

**Files affected:** `app/[locale]/(app)/layout.tsx`, `components/shell/*`, `stores/*` (stubs), `messages/en/shell.json`.

**Dependencies:** Phases 1–3.

**Expected result:** persistent rail + top bar + toast frame renders around a blank content slot; rail collapses/expands; picker/menu open.

**Validation criteria:** matches source shell visually at 1440×900; rail active states correct; toast auto-dismisses (2.4 s); RTL renders rail on the right with flipped collapse chevron (`14` §6/§8).

---

## Phase 5 — Navigation

**Tasks**
- Implement routing per `10` §3 under `[locale]`: `/hub /garage /progress /reports /settings` and `/tools/{scanner|multimeter|oscilloscope|location|schematic}` (+ Scanner `[[...screen]]`).
- Map all navigation paths from `04` §navigation / `09` §9: rail → screens, hub cards → tools (or gate), context tool-jumps (enabled by `has()`), Progress/Garage/Reports deep-links (set focus + navigate), user-menu sign-out, coverage-gate switch-to-Corolla.
- Preserve reading-direction-aware order for breadcrumbs/tabs (`14` §7).

**Files affected:** `app/[locale]/(app)/**/page.tsx`, `features/*/route.tsx`, `lib/navigation.ts`, `stores/uiStore.ts`.

**Dependencies:** Phase 4.

**Expected result:** every screen reachable by route; deep-links preserve component-under-test; browser back/forward works (improvement over source's stateful nav, same destinations).

**Validation criteria:** all paths in `02`/`09` navigable; coverage gate replaces a tool when `coverage(vehicle,tool)!==ok`; focus persists across tool routes; no dead links.

---

## Phase 6 — Screen Implementation

**Tasks**
- Build shell screens (`02`): **Login** (split brand/sign-in, feature chips, version strip), **Hub** (overall/streak, module cards + compact-rows toggle, active-vehicle summary + pack chips), **Garage** (coverage matrix, vehicle switch, install/request), **Progress** (metrics, certs, weak-spots, path, coach), **Reports** (list + detail with steps/verdict), **Settings** (4 groups incl. Interface language EN/AR/FR).
- Render from typed view-models (ported from source `renderVals()`), reading seed data (Phase 7 data) + stores.
- All copy via keys; technical values as Class-B props.

**Files affected:** `app/[locale]/login/page.tsx`, `(app)/**/page.tsx`, `features/shell-screens/*`, `messages/en/{login,hub,garage,progress,reports,settings}.json`, `data/shared/*`, `data/record/*`.

**Dependencies:** Phases 4–5, 7 (shared components + seed data).

**Expected result:** all seven non-tool screens match the source in content and layout.

**Validation criteria:** side-by-side with source: sections, data values, colours, states (locked/active) match; settings toggles/segments mutate `settingsStore`; AR/FR locale switch works (chrome only).

---

## Phase 7 — Reusable Components

**Tasks**
- Build shadcn wrappers (`components/ui`): Button, Dialog, DropdownMenu, Tabs, Switch, Slider, Tooltip, ScrollArea, Toast — restyled to tokens.
- Build shared domain components (`03`): `Chip`/`SegmentedControl`, `ToggleRow`, `StatTile`, `ProgressBar`, `StatusBadge`, `SortableTable`, `GuidedStepList`, `ScorePanel`, `AiChatPanel`, `PanZoomSvg`, `HotspotLayer`, `Sparkline`.
- Seed typed datasets + Zod schemas (`data/**`) from `06`: vehicles/coverage, CTX(11), MODS(5), scanner (nodes/dtcs/pids/tree/history/adas/vehicleDb), multimeter components, oscilloscope components+waveform params, location atlas, schematic netlist, reports(7).

**Files affected:** `components/ui/*`, `components/shared/*`, `data/**`, `data/schema/*`.

**Dependencies:** Phase 3.

**Expected result:** a complete UI kit + validated content backing every screen/tool.

**Validation criteria:** Zod validates all datasets at load; each shared component has all source-observed states; no English literals inside them (keys/props only).

---

## Phase 8 — Simulator UI

**Tasks**
- Build the five tools' feature UI (dumb views over view-models), per `02`/`10` §5:
  - **Scanner:** 14 screens (dashboard, select, overview, scan, network map, systems, dtcs, dtc-detail 5 tabs, livedata, graph, training, adas, history, report) + modals + AI panel + Pro/Training toggle + battery indicator.
  - **Multimeter:** DMM bench, connector diagram, probe layer, tabs, step list, progress view.
  - **Oscilloscope:** scope screen (graticule + dual trace), channel/trigger/cursor controls, screens (Library/Connect/Scope/Compare/Tablet), right tabs (Info/Pinout/Probes/Ref/AI/Score), ref overlay, fault selector, light/dark.
  - **Location:** image-map stage, mode/view tabs, quiz/train panels, favourites/recent.
  - **Schematic:** pan/zoom wiring canvas, inspector, mode/view segments, trace player, tool rail.
- Technical canvases wrapped `dir="ltr"` (`14` §13).

**Files affected:** `features/{scanner,multimeter,oscilloscope,location,schematic}/components/**`, tool `messages/en/*.json`.

**Dependencies:** Phases 3, 7.

**Expected result:** every tool renders its screens/controls visually matching the source (static, pre-engine).

**Validation criteria:** each tool screen matches source layout/colours/tabs; canvases render with placeholder/sample data; RTL keeps canvases LTR while chrome flips.

---

## Phase 9 — Simulator State (engines + stores)

**Tasks**
- Implement `sim-core` (`Clock`, seedable RNG, `stepMachine`, `scoring`, `Engine` base) and the five framework-free engines (`sim-scanner/-multimeter/-oscilloscope/-location/-schematic`) porting `renderVals()` logic from source (`06`/`08`).
- Implement `lib/useEngine.ts` (`useSyncExternalStore` bridge) so features subscribe to engine snapshots.
- Finalize Zustand stores (`benchStore/settingsStore/recordStore/uiStore`); wire settings → tool props (difficulty/noise/hints/probeMode/instrument/outlines).

**Files affected:** `packages/**`, `lib/useEngine.ts`, `stores/**`, `features/*/hooks/use*Vm.ts`.

**Dependencies:** Phases 7–8.

**Expected result:** tools driven by real deterministic engines; shared bench state flows into every tool; tool selections call back to update focus.

**Validation criteria:** engine unit tests pass headlessly (no DOM); waveform/PID/DTC/tree/quiz outputs match source values; changing vehicle/focus/settings propagates correctly; engines contain zero React imports.

---

## Phase 10 — Simulator Interactions

**Tasks**
- Wire all interactions from `04`: Scanner (animated scan ~200 ms, live stream 420 ms gated by active screen, network pan/zoom, sortable tables, DTC tree measure→pass/fail, live-data select/pin/filter/record/export, graph cursor/pause/timebase, ADAS run 90 ms, training single-attempt scoring, AI script, clear/compare modals).
- Multimeter (rotary mode, drag/click probes, step resolution good/bad, fault injection, scoring, report).
- Oscilloscope (run/stop, timebase/vdiv/offset/invert/coupling, trigger, cursors, probe-connect puzzle, fault deform, diagnosis).
- Location (browse/train/quiz, hotspot select, hints/reveal, quiz scoring/timer).
- Schematic (pan/zoom, inspect node/wire, trace playback, practice/exam scoring).

**Files affected:** `packages/**` (intent handlers), `features/*/components/**` (event wiring), `stores/**`.

**Dependencies:** Phase 9.

**Expected result:** every documented interaction functions as in the source.

**Validation criteria:** each behaviour in `04` reproduced; toasts fire on Export/Share/Install/Request (no backend); focus round-trips (tool `on-select` → context bar → other tools).

---

## Phase 11 — Responsive Implementation

**Tasks**
- Implement the source's JS width breakpoints (1080/1120/1200/1250/1330) via `useBreakpoint()` expressed with **logical** properties so RTL hides the correct chrome (`09` §11, `14` §14).
- Rail collapse (user), Hub Cards↔Compact rows (user).
- Apply FR/AR expansion handling: fluid/min-content widths + ellipsis-with-tooltip on chrome labels (`14` §16).
- Preserve "no defined tablet/mobile shell" — do not invent layouts; keep components fluid.

**Files affected:** `lib/useBreakpoint.ts`, `components/shell/*`, `components/shared/*`, feature layouts.

**Dependencies:** Phases 4–10.

**Expected result:** chrome hides/shows at the exact source thresholds in both directions; long FR/AR labels degrade gracefully.

**Validation criteria:** at 1329/1249/1199/1119/1079 px the same elements hide as in source; RTL hides inline-end equivalents; no clipping/overflow with pseudo-loc (+35%).

---

## Phase 12 — Animation

**Tasks**
- Reproduce source transitions with Framer Motion / CSS: shell `140ms` (transform/border-color/box-shadow/background); tool transitions (`width/transform` cubic-bezier `.2,0,0,1`, springy `.28s .4,1.4,.5,1`, linear variants) per `09` §12.
- Timer-driven motion via `sim-core.Clock` (single rAF, pause off-screen): scan/live/ADAS/waveform redraw; progress-bar width; `sc-shine` shimmer equivalent.
- Direction-aware transforms (toggle knob, slide) sign-flip in RTL (`14` §12).
- Respect `prefers-reduced-motion` (additive; document as enhancement, not a source feature).

**Files affected:** `components/**`, `packages/sim-core/clock.ts`, `lib/motion.ts`.

**Dependencies:** Phases 8–11.

**Expected result:** motion timing/easing matches the source; no jank; loops pause when hidden.

**Validation criteria:** transition durations/easings match `09` §12; live stream updates at 420 ms; RTL knob travels correct direction; reduced-motion disables non-essential animation.

---

## Phase 13 — Visual QA

**Tasks**
- Execute the visual sections of `13_QA_CHECKLIST.md` against the original at 1440×900 (and the breakpoints).
- Side-by-side each screen/tool for colour, type, spacing, radius, shadow, icon, state fidelity.
- RTL visual pass (rail side, flipped chevrons, LTR technical islands, Arabic tracking).

**Files affected:** (fixes across `components/**`, `features/**`, `styles/**`).

**Dependencies:** Phases 6–12.

**Expected result:** pixel-faithful parity with the source for EN; correct mirroring for AR.

**Validation criteria:** all Visual items in `13` checked; documented diffs resolved or justified as source-accurate.

---

## Phase 14 — Functional QA

**Tasks**
- Execute the functional sections of `13`: navigation paths, shared-bench flow, coverage gating, every tool's interactions, settings→prop propagation, toasts, modals, engine outputs vs source.
- Engine unit + integration tests; dataset validation; i18n key-coverage check + pseudo-loc.

**Files affected:** `tests/**`, fixes across `packages/**`, `features/**`, `stores/**`.

**Dependencies:** Phase 13.

**Expected result:** behaviour matches the source end-to-end.

**Validation criteria:** all Functional items in `13` pass; test suite green; no missing translation keys for rendered chrome; Class-B values never translated.

---

## Phase 15 — Performance Optimization

**Tasks**
- Code-split each tool engine+UI (`next/dynamic`); ensure shell+hub load first.
- Memoize view-models/selectors so a 420 ms tick re-renders only subscribed panels; memoize SVG canvases; virtualize long tables if needed.
- Confirm font subsetting; optimize/dedupe images; audit bundle vs the 13 MB original baseline.
- Consolidate timers onto one Clock/rAF; pause off-screen.

**Files affected:** `app/**` (dynamic imports), `features/**`, `styles/fonts.ts`, `next.config.ts`.

**Dependencies:** Phase 14.

**Expected result:** smooth interaction, small initial payload, no wasted renders.

**Validation criteria:** Lighthouse/Perf: no long-task regressions during live stream; tool bundles lazy-loaded; total transferred far below original; steady 60fps on waveform/pan-zoom on target hardware.

---

## Phase 16 — Final Cleanup

**Tasks**
- Remove scaffolding/dead code/placeholders; verify no English literals in reusable components (grep/lint); verify layer-boundary lint clean.
- Complete `en` message catalog; stub `ar`/`fr` files with fallback (no translation yet, per scope).
- Docs: README (run/build, extraction script, layer map), update `11` if structure drifted.
- Final full run of `13_QA_CHECKLIST.md`.

**Files affected:** repo-wide, `README.md`, `messages/**`.

**Dependencies:** Phase 15.

**Expected result:** clean, documented, spec-compliant codebase ready for translation + future backend.

**Validation criteria:** **`13_QA_CHECKLIST.md` fully passes** (definition of done); build/lint/typecheck/tests green; boundaries enforced; i18n scaffolding present without translations.

---

## Phase dependency graph

```
1 → 2 → 3 → 4 → 5 → 6
         ↘ 7 ↗        ↘
              8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16
```
(7 depends on 3; 6 & 8 depend on 7. 9 depends on 7–8. 10+ are sequential.)

## Cross-cutting invariants (every phase must uphold)
1. Source HTML is visual truth — no redesign.
2. UI/State/Simulation/Data/API stay separated; engines framework-free.
3. Class-A chrome = keys; Class-B technical data = canonical/English.
4. No new features, no extra tech, no backend.
5. Not done until `13_QA_CHECKLIST.md` passes.
