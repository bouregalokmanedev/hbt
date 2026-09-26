# 13 — QA Checklist (New React App vs Original HTML)

**Authority:** the original `HB TRONICS SaaS Simulator (offline).html` is the source of truth. The rebuild is **not complete until every applicable item below passes**. Cross-references point to analysis files `01`–`11` and i18n `14`.

**How to use**
- Compare at the design size **1440 × 900** (the source `$preview`), then at each breakpoint.
- `[ ]` = pending · `[x]` = pass · `[N/A]` = not applicable · annotate any accepted deviation with a source justification.
- "Matches source" = same content, layout, colour, type, spacing, radius, shadow, state, and behaviour — not merely "looks similar".

---

## A. Global / Environment
- [ ] App loads with **no external network requests** (no `unpkg`, no `googleapis`) — all assets local (`05`).
- [ ] Fonts render as IBM Plex Sans / Mono / Sans Condensed (Latin) and IBM Plex Sans Arabic (`ar`) (`05`/`14`).
- [ ] No console errors/warnings on load or navigation.
- [ ] English UI at `/en` is visually identical to the original (no redesign).
- [ ] `<html lang>` and `dir` set correctly per locale (`en/fr`=ltr, `ar`=rtl) (`14`).

## B. Design System fidelity (`07`/`09`)
- [ ] Brand orange `#F47822`; shell dark `#0E1114`/`#131A26`/`#14181C` exact.
- [ ] Module accents exact: Scanner `#F47822`, Multimeter `#1F6AE1`, Oscilloscope `#8B5CF6`, Location `#0E9F6E`, Schematic `#D92D20` (+ tint-bg values).
- [ ] Semantic status colours exact (ok/warn/fault/selected/muted fg+bg sets).
- [ ] Border-radius set matches (8 px dominant; 2–14/50%/99 px used where source uses them).
- [ ] Shadows match the 8 real values (incl. focus ring `0 0 0 3px rgba(244,120,34,.15)`, modal `0 24px 60px rgba(19,26,38,.35)`).
- [ ] Type presets match real `font:` shorthands (sizes 7.5–26 px, weights 400/500/600, line-heights).
- [ ] Letter-spacing on uppercase Latin micro-labels matches (`.06em–.16em`).
- [ ] Wire-colour palette (`COL`) and scope palette exact.

## C. Application Shell (`02`/`03`)
- [ ] Left rail: collapsed **66 px** / expanded **206 px**; sections Top / SIMULATORS / LEARNING RECORD / footer in source order.
- [ ] Rail active state: fg `#FFFFFF`, bg `rgba(244,120,34,.14)`, left bar `#F47822`, weight 600; inactive `#9AA0A6`.
- [ ] Rail collapse toggle glyph `»`/`«` correct (and flipped in RTL, `14` §6/§8).
- [ ] Per-module `%` badges shown in rail.
- [ ] Top bar: module icon + kicker ("MODULE 0X · …") + title.
- [ ] Component-context bar: "UNDER TEST" chip, ref badge (`#B4560F`/`rgba(244,120,34,.16)`), name, action glyph (`⇄`/`+`), 5 tool-jump buttons.
- [ ] Component picker overlay: 11 components, search, per-tool availability chips, selected row `#FFF6EE`.
- [ ] User menu: H. Barakat / Master technician / XP "4 820" / sign-out.
- [ ] Toast: single message, auto-dismiss **2.4 s** (shell) / 2.2 s (Scanner).

## D. Screen-by-screen presence & content (`02`)
Shell:
- [ ] **Login** — brand panel (wordmark, tagline "Five specialised tools. One diagnostic bench.", chips OEM PROCEDURES/REAL WAVEFORMS/GUIDED FAULT TREES, "HB-OS 4.2.1 · COVERAGE 2026.7"), sign-in card (email, password, keep signed in, forgot, **Enter the simulator**, SSO, seat note).
- [ ] **Hub** — overall %, 7-day streak `[1,1,1,1,1,0,1]`, 5 module cards (numbers, tags, %s, level pills, CTAs START/CONTINUE/REVIEW/LOCKED), active-vehicle summary + pack chips, Cards↔Compact rows toggle.
- [ ] **Garage** — active vehicle facts (VIN, engine, trans, odometer), 4-vehicle coverage matrix (✓/↓/—), install/request, recent sessions.
- [ ] **Progress** — overall 58%, per-module levels, stats (34/21h/81/19), 3 certs, weak-spots, recommended path, coach, focus panel.
- [ ] **Reports** — 7 reports list (date/tools/outcome/score) + detail (steps ✓/!, verdict, meta), Re-open/Export.
- [ ] **Settings** — 4 groups (Training / Instruments / Session / Account & shell) with exact rows incl. **Interface language EN/AR/FR** (`14`; source planned TR — now FR).
- [ ] **Coverage gate** — icon/kicker, headline, body, Install/Request + Switch-to-Corolla.

Scanner (14): dashboard, select, overview, scan, network, systems, dtcs, dtc-detail (5 tabs), livedata, graph, training, adas, history, report — all present with source content.
Multimeter: diagnosis + progress views; tabs (wiring/ecu active; location/parts/manuals/info placeholders); 12 components.
Oscilloscope: Library/Connect/Scope/Compare/Tablet; right tabs Info/Pinout/Probes/Ref/AI/Score; 7 components.
Location: Browse/Train/Quiz; views Fuse/Sensors/System/Vehicle.
Schematic: Study/Trace/Training/Practice/Exam; Schematic/Circuit views.
- [ ] All of the above screens present and content-accurate.

## E. Navigation (`04`/`09` §9)
- [ ] Login → Hub via Enter the simulator / SSO.
- [ ] Rail navigates to all 10 destinations.
- [ ] Hub card → tool (or Coverage gate when `coverage(vehicle,tool)!==ok`).
- [ ] Context tool-jumps enabled only where `has(component,tool)`; disabled show toast.
- [ ] Progress weak-spots / path deep-link set focus + open correct tool.
- [ ] Garage vehicle switch changes coverage/gating globally.
- [ ] Reports "Re-open in tool" opens the report's first tool.
- [ ] Sign-out → Login.
- [ ] Component-under-test persists across tool routes; browser back/forward works.

## F. Shared "single bench" behaviour (`06`)
- [ ] One active vehicle drives coverage everywhere.
- [ ] One component-under-test (focus) syncs shell → tool (`mm/scope/loc/sch` ids) and tool → shell (`on-select`).
- [ ] Settings feed tool props (difficulty, hints, randomFault, outlines, noise, instrument, probeMode).
- [ ] Coverage gate blocks tools without an installed pack; never shows fabricated data.

## G. Scanner functional (`06` §1 / `04` §2)
- [ ] Live-data stream updates at **420 ms**, only on relevant screens & when playing; 48-sample sparklines.
- [ ] Full scan animates through 21 ECUs (~200 ms each) with correct per-ECU status.
- [ ] ECU network: pan (drag), zoom 0.6–1.8, fit; bus/status filters dim non-matching nodes.
- [ ] Systems table sorts (toggle direction) and filters/searches.
- [ ] DTC list: 8 codes, filter chips, expand, search.
- [ ] Diagnostic tree (7 steps): measure→reveal→PASS/FAIL judged vs correct branch; wrong→corrective feedback; terminates at fault (motor resistance 6.42 Ω).
- [ ] Live data: select/pin/filter/search/record/export CSV (toast).
- [ ] Graph: up to 6 signals, timebase 10/30/60 s, draggable cursor, pause/resume.
- [ ] ADAS: animates 0→100 (90 ms), checklist unlocks at thresholds.
- [ ] Training scenario 12: 6 steps, single-attempt answer (correct = restricted fuel filter), scores (92/88/76) + feedback.
- [ ] AI assistant plays the fixed 4-line fuel-pressure script.
- [ ] Clear-codes and Compare modals behave as source.
- [ ] Pro/Training toggle; battery-voltage indicator colour by threshold.

## H. Multimeter functional (`06` §2)
- [ ] 12 components load with correct pinouts, ECU pin links, complaints/DTCs.
- [ ] Rotary switch modes OFF/VDC/OHM/MA affect readings.
- [ ] Probes drag (or click-to-place per settings) onto pins/ECU-pins/ground; reading resolves good/bad per step+mode+targets.
- [ ] Spec tables (temp→resistance, angle→voltage) render where present.
- [ ] Fault injection seeded per component (gated by `randomFault`).
- [ ] Scoring (start 100) + elapsed timer; fail-diagnosis text correct; report generated.
- [ ] ECU pin numbers match Schematic (e.g. L3 pin4→B92, INJ1 pin2→B20).

## I. Oscilloscope functional (`06` §3)
- [ ] 7 components synthesize correct waveforms via `fn(ch,phase)` (injector peak&hold ~3A/~1.5A + ~68 V spike; coil dwell/limit ~7A/~330 V kick; Hall cam; etc.).
- [ ] Fault selector deforms trace per fault (open/short/highRes/weak/noise/dropout/coilWeak/injShort…).
- [ ] Controls: run/stop, timebase, per-channel V/div, offset, invert, enable, coupling AC/DC (knock forced AC), trigger level+edge, persistence, peak, cursors A/B.
- [ ] Connect-the-probes puzzle validates A/GND/CLAMP(+B) vs `correct{}`.
- [ ] Reference-image overlay toggles; specs list correct.
- [ ] Diagnosis submission scored; light/dark theme (`data-hb`) — shell passes light.

## J. Location functional (`06` §4)
- [ ] Browse: search/filter/zoom; hotspot select → detail (location/mount/system prose); favourites/recent.
- [ ] Views: Fuse / Sensors / System / Vehicle render correct images/hotspots.
- [ ] Train: target → click correct hotspot; hints reduce score; reveal; verdict logged; tolerance per difficulty; outlines per setting.
- [ ] Quiz: shuffled list, per-question scoring, tries, elapsed timer, running score/log.
- [ ] Sensor focus auto-switches to Vehicle view; `on-select` syncs shell.

## K. Schematic functional (`06` §5)
- [ ] Canvas renders ~55 typed components + ~140 coloured wires from netlist; default zoom 0.32.
- [ ] Pan/zoom; click component/wire → inspector (endpoints, pins, colour).
- [ ] Modes Study/Trace/Training/Practice/Exam; views Schematic/Circuit re-fit.
- [ ] Guided traces (Injector 1 / Ignition coil 1 / CAN 1) play stepwise.
- [ ] Focus INJ/COIL auto-enters Trace mode; tool rail (systems/search/layers/bookmarks/recent/progress) works.

## L. Reusable component states (`03`)
- [ ] Buttons: default/hover/disabled(locked) colours match; primary `#F47822`/`#1A1206`.
- [ ] Segmented control: selected white + shadow `0 1px 2px rgba(19,26,38,.16)`; locked `#B6BDC7` + toast.
- [ ] Toggle switch: ON `#F47822` / OFF `#CBD2DB`, knob travel 18 px (direction-aware in RTL).
- [ ] Chips: selected `#14181C`/white vs unselected white/`#5F6570`.
- [ ] Status badges: colour+glyph redundancy (✓/↓/—/!) matches.
- [ ] Coverage cells, pack chips, stat tiles, cert cards, streak dots, report rows match.

## M. Responsive (`09` §11 / `14` §14)
- [ ] ≥1330: all chrome visible; <1330 "Change" hidden.
- [ ] <1250: module kicker hidden.
- [ ] <1200: context "UNDER TEST" kicker hidden.
- [ ] <1120: user-menu text hidden.
- [ ] <1080: context tool-jump row hidden.
- [ ] Rail collapse (user) and Hub Cards↔Compact rows (user) work.
- [ ] Same elements hide in RTL (logical inline-end).
- [ ] No dedicated tablet/mobile layout invented (source has none) — components remain fluid without breakage.

## N. Animation (`09` §12)
- [ ] Shell transitions 140 ms (transform/border-color/box-shadow/background).
- [ ] Tool transitions use correct easings (cubic-bezier .2,0,0,1; springy .28s .4,1.4,.5,1; linear variants).
- [ ] Timer-driven motion: scan/live/ADAS/waveform run at correct intervals; progress bars animate width.
- [ ] Loops pause when screen hidden; no runaway timers.
- [ ] Reduced-motion respected (enhancement) without breaking required feedback.

## O. Internationalization readiness (`14`)
- [ ] No hardcoded English inside reusable components (grep/lint clean).
- [ ] All rendered chrome strings resolve to semantic keys; missing-key check clean for `en`.
- [ ] Switching to `ar` flips layout (rail right, chevrons flipped) with **no UI duplication**.
- [ ] Technical **Class-B** data stays canonical/English in all locales (DTCs, pins, VIN, measurements, units).
- [ ] Technical visualizations (waveforms, schematic, ECU map, sparklines, hotspots) **do not mirror** in RTL (`dir="ltr"` islands).
- [ ] Arabic tracking reset (no letter-spacing); Arabic line-height increased.
- [ ] Directional icons flip in RTL; non-directional icons/tool glyphs do not.
- [ ] Pseudo-localization (+~35%) causes no clipping/overflow.
- [ ] Dates/counts localize via Intl; measurements/units do not.

## P. Architecture & code-quality gates (`10`/`11`)
- [ ] `packages/**` (engines) and `data/**` import no `react`/`next` (lint + build).
- [ ] Domain math/scoring/waveforms live only in engines; UI holds none.
- [ ] Engines unit-tested headlessly; outputs match source values.
- [ ] Zustand holds only shared serialisable state; tool-local state isolated (no cross-tool leakage on reset).
- [ ] Datasets Zod-validated at load.
- [ ] Future-API seam: swapping a `StaticRepository` requires no UI/engine change.
- [ ] Build/lint/typecheck/tests all green.

## Q. Performance (`10` §12)
- [ ] Tool engines+UI code-split; shell+hub load first.
- [ ] A 420 ms tick re-renders only subscribed panels (no full-tree re-render).
- [ ] Large SVGs (network/schematic/waveform) render/pan/zoom at ~60 fps on target hardware.
- [ ] Fonts subset; images optimised/deduped; total payload far below the 13 MB original.

---

## Sign-off
- [ ] Every applicable item above is `[x]` or a justified `[N/A]`.
- [ ] All accepted deviations are documented with a source reference.
- [ ] **Only when this checklist passes is the implementation considered complete.**
