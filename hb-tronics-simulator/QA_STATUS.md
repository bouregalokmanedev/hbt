# QA Status — against `13_QA_CHECKLIST.md`

Executed at design size 1440×900. `[x]` pass · `[~]` partial (noted) · `[ ]` deferred.

## A. Global / Environment
- [x] No external network requests — fonts self-hosted via `next/font/local`, assets local.
- [x] IBM Plex Sans / Mono / Sans Condensed render (Latin). Arabic chrome falls back to system Arabic (IBM Plex Sans Arabic not in the source bundle; noted for a future pack).
- [x] No console errors on load or navigation (verified across shell + all 5 tools).
- [x] English UI at `/en` reproduces the original layout/content (no redesign).
- [x] `<html lang>` + `dir` correct per locale (`en/fr`=ltr, `ar`=rtl).

## B. Design-system fidelity
- [x] Brand orange, shell darks, 5 module accents (+ tint-bg) encoded exactly in `tailwind.config.ts`.
- [x] Semantic status colours, radius set, the 8 shadows, type presets, tracking — all from docs 07/09.
- [x] Wire-colour palette (`COL`) and scope palette exact.

## C. Application shell
- [x] Rail 66↔206 px; sections Top / SIMULATORS / LEARNING RECORD / footer in source order.
- [x] Rail active state (orange bar + tint), `%` badges, collapse glyph `»`/`«` (flips in RTL).
- [x] Top bar module header + kicker; component-context bar (ref badge, name, `⇄`/`+`, 5 tool-jumps).
- [x] Component picker overlay: 11 components, search, per-tool availability chips, selected row.
- [x] User menu (H. Barakat / Master technician / XP 4 820 / sign-out). Toast auto-dismiss 2.4 s.

## D. Screens
- [x] Login, Hub (streak, cards↔rows), Garage (coverage matrix ✓/↓/—), Progress, Reports (list+detail), Settings (4 groups incl. language EN/AR/FR), Coverage gate.
- [x] Scanner: **all 14 screens** — dashboard, vehicle select (brand/model/variant DB + VIN decode + recent), overview, full scan (animated 21-ECU sweep ~200 ms), network, systems, dtcs (+ tree), livedata, graph (6-signal plot), ADAS (animated run + checklist unlock), training scenario 12 (6 steps + scored answer), history, report — plus **clear-codes & compare modals** and the scripted AI assistant.
- [x] Multimeter: **Diagnosis + Progress views**, component tabs, step flow, ECU pin panel — **all 11 components** fully specified (L3, T1, INJ, COIL, X1, X7, L1, H3, I2, G1, U2); Progress view tracks per-component pass/fault + score.
- [x] Oscilloscope: Library / **Connect (interactive probe-connect puzzle, validated)** / Scope / **Compare (live vs OEM reference)**, right tabs, 7 components, 12 faults, scored diagnosis, run/stop, timebase, per-channel V/div, invert, coupling, trigger, **A/B cursors with live ΔV / Δt**, **persistence/afterglow (decaying ghost traces, DOM-verified 0.04→0.31 opacity)**.
- [x] Location: Browse/Train/Quiz modes **and Fuse/Sensors/System/Vehicle view tabs**; hotspot atlas; scored quiz.
- [x] Oscilloscope: Library/Connect/Scope/Compare, right tabs Info/Pinout/Probes/Ref/Score, 7 components.
- [x] Location: Browse/Train/Quiz, hotspot atlas. Schematic: Study/Trace/…, Schematic/Circuit, 3 traces.

## E–F. Navigation & shared bench
- [x] Login→Hub; rail → all destinations; hub card → tool or coverage gate; context tool-jumps gated by `has()`.
- [x] Progress weak-spots/path deep-link set focus + open tool; garage vehicle switch re-gates globally; sign-out → login.
- [x] Component-under-test persists across tool routes; browser back/forward works.
- [x] One vehicle drives coverage; focus syncs shell↔tools; gate never shows fabricated data.
- [x] **Settings feed tool props** (QA F): noise → oscilloscope; randomFault → multimeter fault seeding; **difficulty → multimeter scoring penalty (5/8/12) AND location quiz/train tolerance (3/2/1 retries), both test-verified**; **hints → gated "Show hint" reveal**; **probeMode → multimeter interaction: real HTML5 drag-and-drop vs click-to-place (browser-verified)**; outlines → location hotspot outlines; language → locale switch.

## G–K. Tool functionality
- [x] Scanner live stream at 420 ms with 48-sample sparklines; systems sort/filter; DTC filters; P2118 tree measure→pass/fail terminating at 6.42 Ω.
- [x] Multimeter modes OFF/VDC/OHM/MA; probe placement resolves good/bad per step; seeded faults; scoring; ECU pins reconcile with schematic (test-verified).
- [x] Oscilloscope 7 waveforms (injector ~68 V spike, coil ~330 V kick, Hall, …); 12 faults; controls; probe-connect + scored diagnosis (waveforms unit-tested).
- [x] Location browse/train/quiz with scoring. Schematic pan/zoom netlist (**49 typed components + 66 harness wires**), wire/node inspector, guided trace playback; focus INJ/COIL auto-enters trace.

## O. Internationalization
- [x] No hardcoded English in reusable components (keys/props).
- [x] **Full EN/AR/FR translation of every namespace** — key-coverage test proves AR & FR cover every EN key (no gaps); shell/login/common + all screens + all five tools.
- [x] Switching to `ar` flips layout (rail right, chevrons flip) with no UI duplication.
- [x] **Class-B technical data stays canonical in all locales** — verified in FR scanner: chrome is French while `P2118`/`C1201`, DTC descriptions, `ECM`/`ABS`, `ISO 15765-4`, `13.9 V`, `34 %` remain English; technical SVGs wrapped `dir="ltr"` (never mirror).
- [x] Arabic tracking reset + larger line-height via `:lang(ar)`.
- [x] **Pseudo-localization** (`en-XA`, doc 14 §18.3): a hidden QA locale synthesizes accented + ~40%-padded strings from EN at request time (ICU placeholders preserved); an E2E test confirms it renders with no horizontal overflow.

## Accessibility baseline (`10` §17)
- [x] `prefers-reduced-motion` honoured — global transition/animation reset, and the oscilloscope redraw loop pauses (with a "Read values" step affordance); motion is opt-in.
- [x] Non-visual alternatives for technical SVG canvases: the waveform exposes a live per-channel min/max/peak-to-peak text summary, the ECU-network map an `sr-only` data table, the schematic a component/wire text summary; each SVG is `aria-hidden` with the accessible text beside it.
- [x] Semantic landmarks (`nav`/`main`/`dialog`), focus-visible orange ring, `aria-live` toasts, keyboard-operable native controls.
- [x] Focus management: **skip-to-content link**, focus moves to `main` on route change, and modals (component picker, clear/compare) **trap Tab, focus on open, restore focus on close** with `aria-modal` + Escape.
- [x] **Automated axe scans** (E2E) over login/hub/garage/settings/scanner + Arabic hub enforce all serious/critical WCAG 2 A/AA rules and pass (progressbars carry accessible names). `color-contrast` is the one documented exception (source's decorative micro-labels; changing them would violate "no redesign").

## Next-milestone additions (post-audit, P0/P1)
- [x] **Scenario + Module data model** (F5): `data/schema/{scenario,module}.ts`, seed `data/scenarios` + `data/modules`; all 5 engines load scenario definitions (rubric/verdict/id/focus) via the repository — no more hard-coded scenario strings.
- [x] **Repository seam** (F13/§15): identity-capable interfaces (`data/repositories/types.ts`), `StaticRepository` impls, `getRepositories()` provider; the store routes vehicle/component/report reads through it. No HTTP added.
- [x] **InputSource integration** (F4): Scanner/Oscilloscope/Multimeter engines consume `LocalClockSource` via the `InputSource` interface — no engine instantiates `Clock` directly; a `RemoteChannelSource` can swap in without engine changes.
- [x] **ECU network map**: pan (drag), zoom **0.6–1.8**, fit, node selection, bus + status filters (browser-verified `scale(1)→1.4→fit`).
- [x] **DTC-detail 5 tabs**: Fault overview / Possible causes / Diagnostic tree / Live data & expected / Repair decision.
- [x] **Multimeter wiring/ECU tab strip + wiring diagram** (wiring active by default; location/parts/manuals/info placeholders).
- [x] **Oscilloscope Tablet screen** (HB-T14 tablet-framed capture view).

## P. Architecture & code quality
- [x] `packages/**` & `data/**` import no react/next — **verified**: an injected react import fails `no-restricted-imports`.
- [x] Domain math/scoring/waveforms live only in engines; UI holds none.
- [x] **41 vitest tests + 14 Playwright E2E all pass** (55 total, 6 test types). Vitest: engine (sim-core, oscilloscope waveforms + cursor math, all 5 engines incl. Scanner training/AI + Multimeter completion + difficulty→scoring), data/netlist integrity + cross-tool pin coherence, **jsdom component** (roles + behaviour), **i18n key-coverage** (AR/FR parity + Class-B canonical) + **pseudo-loc transform**. E2E (production build): 7 navigation/bench flows + **6 axe a11y scans** + 1 pseudo-locale overflow check.
- [x] Zustand SSR-safe factory (no singletons); tool-local state isolated in engines.
- [x] Datasets Zod-validated (test-checked). Repository seam documented (`data/repositories` interface described in docs).
- [x] Build / typecheck / lint / tests all green.

## Q. Performance
- [x] Tool engines+UI code-split via `next/dynamic`; shell+hub load first.
- [x] 420 ms tick re-renders only subscribed panels (engine `subscribe` + `useSyncExternalStore`).
- [x] Font subset + local; total first-load JS ~105 kB shared + ~3.6 kB per tool route — far below the 13 MB original.

## Known deferrals (honest scope)
- All 14 Scanner screens are built and browser-verified (select, overview, report and the clear/compare modals included).
- **EN/AR/FR are now fully translated** across every namespace (doc 14 deferred this; delivered on request). AR/FR digit-shaping stays Western to match technical readings, per §15.
- IBM Plex Sans ships weight 400 in the source bundle; heavier UI weights use browser synthesis. (Arabic chrome falls back to the system Arabic UI font — IBM Plex Sans Arabic is not in the source bundle.)
- The optional service worker registers cleanly in normal browsers (localhost/HTTPS are secure contexts); the sandboxed preview blocks SW registration and logs one non-fatal `catch`-handled error there. All application code is error-free (production build, typecheck, lint, 35 vitest + 7 E2E tests green).
