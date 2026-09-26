# 11 — Proposed Project File Tree

Concrete structure implementing `10_TECHNICAL_ARCHITECTURE.md`. Every directory traces to a real part of the decoded original (analysis files `01`–`09`). Nothing here is for an imaginary feature; no backend is implemented.

**Legend:** 🟦 UI (React) · 🟩 Simulation (framework-free TS) · 🟨 Data (content) · 🟧 State (Zustand) · ⬜ config/infra
The three parts that must evolve independently — **UI**, **Simulation**, **Data** — never import upward. `packages/` and `data/` contain **no React/Next imports**.

```
hb-tronics-simulator/
│
├─ ⬜ package.json
├─ ⬜ next.config.ts
├─ ⬜ tsconfig.json                     # path aliases enforce layer boundaries
├─ ⬜ tailwind.config.ts                # tokens from 07/09 (colors, radius, shadow, spacing)
├─ ⬜ postcss.config.mjs
├─ ⬜ components.json                    # shadcn/ui config
├─ ⬜ .eslintrc.cjs                      # rule: features/ & app/ cannot import from packages/ internals
│                                        #       packages/ & data/ cannot import react/next
├─ ⬜ README.md
│
├─ app/                                  # 🟦 ROUTING (thin — compose features only)
│  ├─ layout.tsx                         # root: fonts (next/font local), providers
│  ├─ globals.css                        # Tailwind layers + CSS-var scopes (scope palette)
│  ├─ page.tsx                           # → redirect /login | /hub
│  ├─ error.tsx  ·  not-found.tsx
│  │
│  ├─ login/
│  │  └─ page.tsx                        # Login (Server Component allowed)  [02 screen 00]
│  │
│  └─ (app)/                             # route group → renders Shell layout
│     ├─ layout.tsx                      # Shell: RailNav + TopBar + ToastHost   [02 global chrome]
│     ├─ hub/page.tsx                    #        Simulator Hub                   [02 #01]
│     ├─ garage/page.tsx                 #        Garage                          [02 #02]
│     ├─ progress/page.tsx               #        Progress                        [02 #03]
│     ├─ reports/page.tsx                #        Reports (?r=<id>)               [02 #04]
│     ├─ settings/page.tsx               #        Settings                        [02 #05]
│     └─ tools/
│        ├─ scanner/[[...screen]]/page.tsx     # Scanner 14 screens               [02 §B]
│        │  ├─ loading.tsx  ·  error.tsx
│        ├─ multimeter/page.tsx                # (?component=&view=)              [02 §C]
│        ├─ oscilloscope/page.tsx              # (?component=&screen=)            [02 §D]
│        ├─ location/page.tsx                  # (?mode=&view=)                   [02 §E]
│        └─ schematic/page.tsx                 # (?mode=&view=)                   [02 §F]
│
├─ components/                           # 🟦 SHARED UI KIT (no domain logic)
│  ├─ ui/                                # shadcn/ui wrappers, restyled to tokens
│  │  ├─ button.tsx  dialog.tsx  dropdown-menu.tsx  tabs.tsx
│  │  ├─ switch.tsx  slider.tsx  tooltip.tsx  scroll-area.tsx  toast.tsx
│  ├─ shell/                             # global chrome (driven by stores)      [02/03]
│  │  ├─ RailNav.tsx  TopBar.tsx  ModuleHeader.tsx
│  │  ├─ ComponentContextBar.tsx  ComponentPicker.tsx
│  │  ├─ UserMenu.tsx  CoverageGate.tsx  ToastHost.tsx
│  ├─ shared/                            # cross-tool patterns from 03
│  │  ├─ Chip.tsx  SegmentedControl.tsx  ToggleRow.tsx
│  │  ├─ StatTile.tsx  ProgressBar.tsx  StatusBadge.tsx
│  │  ├─ SortableTable.tsx  GuidedStepList.tsx  ScorePanel.tsx
│  │  ├─ AiChatPanel.tsx  PanZoomSvg.tsx  HotspotLayer.tsx  Sparkline.tsx
│  └─ icons/
│     ├─ Icon.tsx                        # renders a path-set by id
│     └─ paths.ts                        # I / navDefs / symbols path constants  [05]
│
├─ features/                             # 🟦 PER-TOOL UI (vertical slices)
│  ├─ scanner/
│  │  ├─ components/                     # EcuNetworkMap, DtcList, DtcDetailTabs,
│  │  │                                  # DiagnosticTree, LiveDataTable, SignalGraph,
│  │  │                                  # ScanLog, AdasPanel, TrainingScenario, ...
│  │  ├─ hooks/useScannerVm.ts           # bridges sim-scanner + stores → ViewModel
│  │  ├─ scanner.viewmodel.ts            # typed ViewModel (was renderVals())
│  │  └─ index.ts
│  ├─ multimeter/  (DmmBench, ProbeLayer, StepList, EcuPinPanel, ...)
│  ├─ oscilloscope/(ScopeScreen, ChannelControls, TriggerControls, ProbeConnect,
│  │                RefOverlay, FaultSelector, RightTabs, ...)
│  ├─ location/    (LocationStage, ViewTabs, ModeSegment, QuizRunner, TrainPanel)
│  └─ schematic/   (WiringCanvas, WireInspector, TracePlayer, ToolRail, ModeSegment)
│
├─ providers/                            # 🟦/🟧 lifecycle owners (review F1/F2)
│  ├─ EngineProvider.tsx                 # creates engines once → engine registry (outside tree) [F1]
│  ├─ StoreProvider.tsx                  # createStore() per client/request — no singletons      [F2]
│  └─ registry.ts                        # keyed engine map (plain module, no DI framework)
│
├─ stores/                               # 🟧 GLOBAL STATE (Zustand — shared only)
│  ├─ createStore.ts                     # factory (SSR/SaaS-safe; consumed by StoreProvider)     [F2]
│  ├─ benchStore.ts                      # active vehicle, focus (component-under-test), coverage  [04/06]
│  ├─ settingsStore.ts                   # difficulty, hints, noise, probeMode, rail, hubLayout... [04]
│  ├─ recordStore.ts                     # reports, progress, streak, certs; commitResult(SessionResult) [06/F2]
│  └─ uiStore.ts                         # toasts, picker/menu open, breakpoints                   [04/09]
│
├─ packages/                             # 🟩 SIMULATION (FRAMEWORK-FREE — no react/next)
│  ├─ sim-core/
│  │  ├─ engine.ts                       # Engine base: getState/subscribe/dispatch/onComplete
│  │  ├─ io.ts                           # InputSource: LocalClockSource | RemoteChannelSource   [F4]
│  │  ├─ clock.ts                        # deterministic tick (replaces 420/200/90ms timers) [04/12]
│  │  ├─ rng.ts                          # seedable noise / random-walk
│  │  ├─ stepMachine.ts                  # guided-step state machine (tree/steps/quiz)
│  │  ├─ scoring.ts  status.ts  specCompare.ts
│  │  ├─ result.ts                       # SessionResult type (engine → recordStore)             [F2]
│  │  └─ types.ts
│  ├─ sim-scanner/
│  │  ├─ engine.ts                       # orchestrates the sub-models
│  │  ├─ network.ts  dtc.ts  livedata.ts  tree.ts  adas.ts  training.ts  compare.ts
│  │  └─ types.ts
│  ├─ sim-multimeter/ (engine.ts, measurement.ts, faults.ts, scoring.ts, types.ts)
│  ├─ sim-oscilloscope/
│  │  ├─ engine.ts
│  │  ├─ waveforms.ts                    # per-component fn(ch,phase) generators   [06/08]
│  │  ├─ faults.ts                       # fault deformations + noise
│  │  ├─ sampling.ts                     # timebase/trigger/cursor sampling
│  │  └─ types.ts
│  ├─ sim-location/  (engine.ts, quiz.ts, training.ts, types.ts)
│  └─ sim-schematic/ (engine.ts, netlist.ts, trace.ts, exam.ts, types.ts)
│
├─ data/                                 # 🟨 CONTENT (typed, versioned; no logic; no prose)
│  ├─ schema/                            # Zod schemas + TS types (normalized)
│  │  ├─ component.ts  pin.ts  wire.ts  vehicle.ts  coverage.ts
│  │  ├─ scenario.ts  module.ts          # Scenario + Module content schema         [F5]
│  │  └─ version.ts                      # dataset version/coverage field           [F14]
│  ├─ scenarios/                         # data-driven exercises (seed: Scenario 12, …) [F5]
│  ├─ modules/                           # learning-module curriculum (scenarioIds, prereqs) [F5]
│  ├─ transport/                         # 🔌 future WebSocket client boundary (interface only) [F4]
│  ├─ shared/
│  │  ├─ vehicles.ts                     # VEH (4) + coverage matrix               [06]
│  │  ├─ components.ts                   # CTX (11) canonical refs + per-tool ids  [06]
│  │  └─ modules.ts                      # MODS (5)                                [01/06]
│  ├─ scanner/  (ecuNodes, dtcs, pids, trees, history, adas, vehicleDb)           [06]
│  ├─ multimeter/ (components: pinouts, ecuLinks, guided steps)                    [06]
│  ├─ oscilloscope/ (components: params, specs, probeMaps, faults, refImages,
│  │                 waveformParams)                                               [06]
│  ├─ location/ (sensors, ecus, grounds, fuseRects, relays, sloc, coords)         [06]
│  ├─ schematic/ (netlist: components ~55, wires ~140, traces 3, colorMap)        [06]
│  ├─ record/   (reports 7, progress, certs, weakSpots, path)  # seed content     [06]
│  └─ repositories/                      # 🟨/🟦 SEAM to future API (§15)
│     ├─ types.ts                        # Vehicle/Scanner/Scenario/Module/Record repos;
│     │                                  # identity-capable: ctx{ userId?, tenantId? }  [F13]
│     ├─ static/                         # StaticRepository impls (read bundled data)
│     └─ index.ts                        # provider (static today; HTTP later)
│
├─ lib/                                  # 🟦 bridges & utilities
│  ├─ useEngine.ts                       # useSyncExternalStore adapter (engine→react)
│  ├─ useBreakpoint.ts                   # 1080/1120/1200/1250/1330 thresholds     [09/11]
│  ├─ session.ts                         # cosmetic client session (future auth seam; httpOnly later) [F10]
│  ├─ format.ts  cn.ts                   # value formatting, class merge
│  └─ constants.ts
│
├─ styles/
│  ├─ tokens.css                         # CSS vars for scope dark/light (data-hb) [07/09]
│  ├─ type.ar.css                        # Arabic presets: no tracking, larger line-height [14]
│  └─ fonts.ts                           # next/font local IBM Plex (+ Sans Arabic, subset) [05/14]
│
├─ public/
│  ├─ manifest.webmanifest               # PWA (optional offline)                  [F9]
│  ├─ sw.js                              # service worker: app-shell + assets + datasets [F9]
│  └─ assets/                            # extracted from bundle (dedup/optimised) [05]
│     ├─ detail-*.png  views-*.png  fusebox-*.png  map-*.png  diagram-r16.png
│     ├─ inj-photo.png  ref-inj-*.png  ref-cam-hall.png
│     └─ ref/ (maf, throttle, app, cam, coolant, crank, o2, knock)
│
├─ scripts/
│  └─ extract-bundle.mjs                 # dev-only: reproduce decode from 01/05
│
└─ tests/                                # test matrix (review F11)
   ├─ unit/        (sim-* engines + sim-core; no DOM)                    [08]
   ├─ contract/    (engine → recordStore.commitResult)                  [F2]
   ├─ component/   (RTL render + axe a11y assertions)                   [F12/14]
   ├─ e2e/         (Playwright: navigation + bench flows)               [04]
   ├─ i18n/        (key-coverage + en-XA pseudo-loc)                    [14]
   └─ data/        (Zod dataset + scenario/module validation)          [F5/F14]
```

## Boundary enforcement (how independence is guaranteed)

| Rule | Enforced by |
|------|-------------|
| `packages/**` & `data/**` never import `react`/`next` | ESLint `no-restricted-imports` + tsconfig project refs |
| `features/**` & `app/**` never reach into `packages/**` internals — only public `index.ts` / engine snapshot | ESLint import rule |
| Domain math/scoring/waveforms live **only** in `packages/**` | code review + tests that import engines headlessly |
| Content has no behaviour — `data/**` exports data + types only | ESLint (no function-with-logic exports beyond factories) |
| Future API swap touches only `data/repositories/**` | repository interface is the sole seam |

## Layer summary

| Layer | Location | Imports allowed |
|-------|----------|-----------------|
| 🟦 UI | `app/`, `components/`, `features/`, `lib/` | stores, engine public API, data types, shared UI |
| 🟧 State | `stores/` | data types, engine public API (no UI) |
| 🟩 Simulation | `packages/` | `sim-core`, `data/*` **types** only |
| 🟨 Data | `data/` | Zod, own types (no engines, no UI) |
| 🔌 API (future) | `data/repositories/` | data types (impl swappable static→HTTP) |

This structure lets the **simulator engine evolve independently of the UI** (§8/§0 of `10`): engines are headless and unit-tested; UI consumes only their snapshots; content and the future API sit behind interfaces — so waveform fidelity, fault models, datasets, or a real backend can each change without touching the others.
