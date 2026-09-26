# 10 — Technical Architecture

**Purpose:** Architecture specification for rebuilding the HB TRONICS Simulator on the target stack. No implementation here — this defines *how* the app will be structured so the **simulator engine can evolve independently of the UI**.

**Grounding:** every architectural element maps to something that actually exists in the decoded original (analysis files `01`–`09`). No imaginary features. No backend is built (only integration points are marked).

## Target stack (fixed)
- **Next.js 15+** (App Router) · **React 19** · **TypeScript** (strict)
- **Tailwind CSS** (design tokens from `07`/`09`)
- **shadcn/ui** where a primitive fits (Dialog, DropdownMenu, Tabs, Switch, Slider, Tooltip, ScrollArea, Toast)
- **Zustand** only for genuinely shared/global state
- **Framer Motion** where the source animates
- **Three.js / React Three Fiber:** **NOT REQUIRED.** The source contains zero 3D — every visualization (ECU network, waveforms, wiring diagram, gauges, hotspots) is 2D inline SVG. R3F is intentionally excluded.

---

## 0. The five layers (mandatory separation)

The whole architecture exists to keep these apart. Data flows **down**; events flow **up**; the simulation core never imports React.

```
┌──────────────────────────────────────────────────────────────┐
│  UI LAYER            React 19 components, Tailwind, shadcn/ui, │
│  (framework)         Framer Motion. Renders state, emits       │
│                      intents. Knows nothing about physics.     │
├──────────────────────────────────────────────────────────────┤
│  STATE LAYER         Zustand stores (shared "bench") +         │
│  (orchestration)     React local state (per-screen ephemeral). │
│                      Bridges UI ↔ engine. No domain math.      │
├──────────────────────────────────────────────────────────────┤
│  SIMULATION LAYER    Pure TypeScript engines, one per tool +   │
│  (framework-free)    a shared core. Deterministic, testable,   │
│                      no React/DOM imports. This is the product.│
├──────────────────────────────────────────────────────────────┤
│  DATA LAYER          Typed, versioned datasets (vehicle,       │
│  (content)           netlist, DTCs, PIDs, waveform defs,       │
│                      coverage, procedures). Pure JSON/TS.      │
├──────────────────────────────────────────────────────────────┤
│  API LAYER (future)  Repository interfaces only. Today backed  │
│  (boundary)          by the static Data layer; later by HTTP.  │
└──────────────────────────────────────────────────────────────┘
```

**Golden rules**
1. `packages/sim-*` (simulation) may import only `packages/sim-core` and `data/*` types — never `react`, `next`, or anything in `app/` or `components/`.
2. `data/*` is inert content behind repository interfaces; nothing in Data imports engines or UI.
3. UI reads engine output through hooks/selectors; it never contains fault logic, waveform math, or scoring.
4. Replacing the static Data layer with a real API must require **zero** changes in UI or Simulation layers.

---

## 1. Application Architecture

- **Rendering:** App Router. The marketing **login** page can be a Server Component; the authenticated **application shell and all tools are Client Components** (heavy interactivity, timers, canvas/SVG, in-memory state) — matching the source, which is entirely client-side.
- **Shell:** persistent chrome (collapsible rail, top bar with module header + component-context bar + user menu, toast host) implemented as a **route-group layout** wrapping every in-app screen.
- **Tools:** five self-contained feature modules (Scanner, Multimeter, Oscilloscope, Location, Schematic), each = *UI package* + *sim engine package* + *data module*, mounted inside the shell.
- **The "single bench" contract** (the product's core, per `06`): one **active vehicle**, one **component-under-test (focus)**, one **learning record**, and **coverage gating** — all held in shared state and injected into every tool, exactly as the original `<dc-import>` props did (`focus`, `difficulty`, `noise`, `on-select`, etc.).
- **No SSR data fetching** initially (static content); the repository seam (§15) allows adding it later without touching tools.

---

## 2. Folder Structure (overview; full tree in `11_PROJECT_FILE_TREE.md`)

A **monorepo-style single Next.js app** with a clear package boundary between framework-free simulation/data and the React app:

```
app/                # Next.js routes (thin — compose features)
components/          # Shared UI kit + shadcn wrappers (no domain logic)
features/            # Per-tool React UI (Scanner, Multimeter, …)
stores/             # Zustand global stores (bench, settings, record, ui)
packages/           # FRAMEWORK-FREE: sim-core + sim-* engines
data/               # Typed datasets + repository interfaces
lib/                # utils, hooks, adapters (engine↔react bridge)
styles/             # Tailwind layer, tokens
public/assets/      # extracted images/fonts from the bundle
```

`packages/` and `data/` are the parts that can be extracted to real workspaces later; keeping them import-isolated now is what enables independent evolution.

---

## 3. Routing Architecture

The original is state-driven (`sc-if` on a `screen` string, no URL). The rebuild promotes screens to **real routes** so navigation is linkable and back/forward works, while tool-internal sub-screens use nested segments where they are meaningful and local UI state where they are ephemeral.

```
/                         → redirect to /login (or /hub if "signed in")
/login                    → Login (Server Component allowed)

(app)  ── route group, renders the Shell layout ──
  /hub                    → Simulator Hub
  /garage                 → Garage (vehicle manager)
  /progress               → Progress
  /reports                → Reports        (?r=<reportId> selects)
  /settings               → Settings

  /tools/scanner          → Scanner (default: dashboard)
    /tools/scanner/[screen]      dashboard|select|overview|scan|network|
                                 systems|dtcs|dtc/[code]|livedata|graph|
                                 training|adas|history|report|settings
  /tools/multimeter       → Multimeter   (?component=L3&view=diagnosis)
  /tools/oscilloscope     → Oscilloscope (?component=inj&screen=scope)
  /tools/location         → Location     (?mode=browse&view=fuse)
  /tools/schematic        → Schematic    (?mode=study&view=schematic)
```

**Routing rules**
- **Route** = a navigable, shareable place (shell screens; Scanner's major screens; the selected tool component).
- **Local state / query param** = ephemeral within-screen selection (active tab, filter, cursor, drag). Do not over-fragment into routes (Scanner has 14 screens but tabs/filters stay as state).
- **Coverage gate** is a guard rendered by the tool route when `bench.coverage(vehicle, tool) !== 'ok'` — it replaces the tool (as in source), it is not a separate URL.
- **Auth** is cosmetic in source; model a simple client "session" flag. Real auth is a future integration point (§15), implemented as middleware/route-guard later without touching tools.
- **Component-under-test** persists across tool routes via the bench store, and can be reflected in the URL query so a tool deep-links to a focus (mirrors the original context-bar jumps and Progress deep-links).

---

## 4. Component Architecture

Three tiers, matching the reuse observations in `03`:

1. **UI primitives (`components/ui/`)** — shadcn/ui wrappers styled to the design system: `Button`, `Dialog`, `DropdownMenu`, `Tabs`, `Switch`, `Slider`, `Tooltip`, `ScrollArea`, `Toast`. Zero domain knowledge.
2. **Shared domain components (`components/shared/`)** — the cross-tool patterns identified in `03`: `Chip`/`SegmentedControl`, `ToggleRow`, `StatTile`, `ProgressBar`, `StatusBadge` (ok/warn/fault/none → fg/bg via a single `statusColor()` helper), `PanZoomSvg` (used by Scanner network + Schematic), `SortableTable`, `GuidedStepList` (Scanner tree + Multimeter steps + Location quiz share this shape), `ScorePanel`, `AiChatPanel`, `HotspotLayer`, `Sparkline`, `Toast host`.
3. **Feature components (`features/<tool>/components/`)** — tool-specific views (e.g. `EcuNetworkMap`, `DtcDetailTabs`, `DmmBench`, `ScopeScreen`, `WiringCanvas`, `LocationStage`).

**Rendering contract:** every feature view is a **pure render of a view-model** produced by a hook that reads the engine + stores. This mirrors the source's `renderVals()` → template pattern: the `renderVals()` object becomes a typed `ViewModel`, and the `<x-dc>` markup becomes JSX. Components receive data + callbacks; they do not compute domain values.

**Shell components:** `RailNav`, `TopBar`, `ModuleHeader`, `ComponentContextBar`, `ComponentPicker`, `UserMenu`, `CoverageGate`, `ToastHost` — in `components/shell/`, driven by the bench/ui stores.

---

## 5. Feature Architecture

Each tool is a **vertical slice** with a strict internal boundary:

```
features/scanner/
  components/            # React views (dumb-ish, take view-models)
  hooks/                 # useScannerVm(): bridges engine + stores → ViewModel
  scanner.route.tsx      # composition for /tools/scanner/[screen]
  index.ts               # public surface

packages/sim-scanner/    # FRAMEWORK-FREE engine (no React)
  engine.ts              # ScannerEngine class/factory
  network.ts, dtc.ts, tree.ts, livedata.ts, adas.ts, training.ts
  types.ts

data/scanner/            # NODES, DTCS, PARAMS, TREE, HISTORY, ADAS_ITEMS, vehicleDb
```

- The **hook** (`useScannerVm`) is the only place feature UI meets the engine. It instantiates/subscribes to the engine, wires shared-bench props in, maps engine state → `ViewModel`, and exposes intent callbacks. Swapping the engine's internals never touches `components/`.
- **Prop contract from shell** (from `01`/`04`) is typed once and passed to every engine: `{ vehicle, focus, settings, scenarioId, onSelect }` (+ per-tool extras: Scanner `embedded`, Oscilloscope `theme`, Location `startScreen`, etc.).
- Tools are **independently loadable** (`next/dynamic`) so the shell stays light and each engine is code-split.

### 5.1 Engine lifecycle & ownership (review F1)
Engines are **not owned by React components**. They are created once per app session (per tool) in a `providers/EngineProvider` and held in a plain module-level **engine registry** outside the component tree; `useEngine` only *subscribes* a view to an engine's snapshot. Component unmount detaches the view, never the engine — so a running scan, an in-progress scored session, or a live remote feed survives navigation. No DI framework; the registry is a small keyed map hydrated by the provider.

---

## 6. State Architecture

Two kinds of state, deliberately separated:

### 6.1 Global / shared → **Zustand** (`stores/`)
Only what the source genuinely shares across screens/tools:
- **`benchStore`** — active `vehicle`, `focus` (component-under-test), `coverage(vehicle, tool)` selector, `setFocus`, `setVehicle`. This is the "single bench" (`04`/`06`).
- **`settingsStore`** — difficulty, hints, randomFault, outlines, noise, instrument, probeMode, language, hubLayout, railExpanded, railLabels — the `set` object from the shell, which feeds tool props.
- **`recordStore`** — learning record: reports, progress metrics, streak, certifications, weak-spots, recommended path. Exposes **`commitResult(result: SessionResult)`** — the defined write-path (review F2): when an engine finishes a scored session it emits `onComplete(SessionResult { tool, scenarioId, score, steps, verdict, at })`; the bridge routes it to `commitResult`, which appends to the record. Persistence is the future-API seam (§15); engines never import the store.
- **`uiStore`** — toast queue, component-picker open, user-menu open, active screen mirror, viewport width/breakpoints.

Stores hold **plain serialisable data + intent actions only**. No waveform math, no fault logic (that lives in engines).

**SSR / SaaS-safe instantiation (review F2):** stores are **not module-level singletons**. A `createStore()` factory is instantiated in a `providers/StoreProvider` — one instance per client, and (for any future SSR/multi-user rendering) a fresh instance per request — so state never leaks across requests or users.

### 6.2 Local / ephemeral → **React state inside engines/hooks**
Everything transient and tool-scoped: Scanner `scanIdx/livePlay/cursor/treeStep`, Multimeter `probes/mode/stepIdx/score`, Oscilloscope `timeDiv/trigLevel/fault/probes`, Location `qIdx/tHints`, Schematic `z/tx/ty/mode`. Held by the **engine instance** and surfaced through the feature hook. Not global — resetting a tool must not leak into others (matches source, where each `.dc.html` owns its state).

### 6.3 Engine ↔ React bridge
Engines are plain classes exposing `getState()`, `subscribe(listener)`, and intent methods. A tiny adapter (`lib/useEngine.ts`, e.g. `useSyncExternalStore`) subscribes React to an engine without the engine importing React. This is the seam that lets the simulation evolve independently.

---

## 7. Data Architecture

All domain content becomes **typed, versioned datasets** behind repository interfaces (from `05`/`06`):

- **Vehicle & coverage:** `vehicles[]`, `coverageMatrix` (per tool: ok/avail/none) — drives gating.
- **Shared components (`CTX`, 11):** canonical `ComponentRef` with per-tool ids (`loc/mm/scope/sch`) — the join key across tools.
- **Scanner:** `ecuNodes` (21, 3 buses), `dtcs` (8), `pids` (18), `diagnosticTrees`, `history`, `adasItems`, `vehicleDb` (brands/models/variants).
- **Multimeter:** `components[]` with pinouts, ECU pin links, guided steps (spec/good/bad/tables/fail).
- **Oscilloscope:** `components[]` with electrical params, specs, probe maps, fault sets, reference images, and **waveform generator definitions** (see §8 — the `fn` functions live in the engine, their parameters in data).
- **Location:** `sensors`, `ecus`, `grounds`, fuse/relay rectangles, `sloc` prose, image refs, coordinates.
- **Schematic:** `netlist` = `components (~55)` + `wires (~140)` + `traces (3)` + colour map.

**Normalisation:** ECU pin numbers already reconcile across Multimeter and Schematic in source (`06`), so define a **single normalized schema** (`Component`, `Pin`, `Wire`, `EcuPin`) and derive tool-specific views. Ship as TS/JSON under `data/`, validated by **Zod** schemas at module load (dev) so malformed content fails loudly. Every dataset carries a `version`/`coverage` field (e.g. "2026.7") for pack evolution (review F14).

### 7.1 Scenarios & Learning Modules (review F5)
The source hard-codes exercises (Scanner "Scenario 12", fixed faults/tree). To support **multiple scenarios** and **learning modules** without code changes, add two normalized content entities:
- **`Scenario`** — `{ id, tool, vehicleId, focusRef, seededFaults[], steps[], rubric, difficulty }`. Engines take a `scenarioId` and load the definition via a repository, turning fixed logic into **data-driven scenarios**.
- **`Module`** — `{ id, title, scenarioIds[], prerequisites[], certificationId? }` — the learning-curriculum wrapper that `progress`/`certs` reference by stable id.

All existing source content becomes the **seed set** (Scenario 12, the 5 tool modules, the 7 reports). Progress/scoring reference `scenarioId`/`moduleId`, not ad-hoc strings.

### 7.2 Content localization class (review F7)
Data holds **canonical values + stable ids only** — never learner-facing prose. Instructional prose that lives in source data/engines (DTC "possible causes", tree hints, step instructions, fail diagnoses, coach text, fault descriptions, the AI script) is **Class C: localizable content** (`14` §0), addressed by id in the message catalog (e.g. `oscilloscope.fault.{code}.desc`). Engines emit `{ id, values }`; the UI resolves the prose. Class-B (codes, pins, units, measurements) still never translates.

**Repository interfaces** (`data/repositories/`): `VehicleRepository`, `ComponentRepository`, `ScannerRepository`, `ScenarioRepository`, `ModuleRepository`, `RecordRepository`, … Each has a `StaticRepository` implementation reading the bundled datasets today; the interface is the future-API seam (§15). Interfaces are **identity-capable** (review F13): methods accept an optional `context: { userId?, tenantId? }` supplied by the future `lib/session`; `StaticRepository` ignores it, so UI/engines never change when SaaS identity arrives.

---

## 8. Simulator Architecture (the part that must evolve independently)

`packages/` contains **pure TypeScript engines**, one per tool + a shared core, with **no UI imports**.

### 8.1 `sim-core`
Reusable primitives extracted from repeated source logic:
- `Clock` — deterministic tick source (wraps `setInterval`/rAF; injectable for tests). Replaces the ad-hoc 420/200/90 ms timers.
- `signal/random` — seedable RNG for noise/random-walk (source uses `Math.random()`; make it seedable for determinism & replay).
- `statusColor()`, `spec compare`, `scoring`, `stepMachine` (guided-step state machine used by Scanner tree, Multimeter steps, Location quiz).
- `Engine` base: `getState/subscribe/dispatch(intent)` contract + snapshot for view-models, plus `onComplete(SessionResult)` for the record write-path (§6.1).
- **`InputSource` interface (review F4)** — the seam for real-time / WebSocket. An engine is driven by an `InputSource` (`subscribe(onTick|onMessage)`, `dispatch(intent)`), with a **`LocalClockSource`** today and a future **`RemoteChannelSource`** (WebSocket) later — the *same engine*, swappable driver. Inbound messages are **batched/coalesced to a frame** at this boundary so render frequency is decoupled from message frequency (review F9). The WS client itself is **not built now** — only the interface and the `data/transport/` boundary that will own it (§15).

### 8.2 Per-tool engines
| Engine | Core responsibilities (from `06`) |
|--------|-----------------------------------|
| `sim-scanner` | ECU network model, DTC set, live-PID random-walk stream, diagnostic-tree state machine, animated scan, ADAS run, training scenario, compare. |
| `sim-multimeter` | Per-component guided measurement, probe-target → reading resolution (mode+targets+step→good/bad), fault injection, scoring. |
| `sim-oscilloscope` | **Waveform synthesis** — per-component `fn(ch, phase)` generators + fault deformations + noise; trigger/timebase/cursor sampling; probe-connect validation; diagnosis scoring. |
| `sim-location` | Hotspot/target model, train & quiz state machines, scoring/timer. |
| `sim-schematic` | Netlist graph, wire/pin inspection, guided-trace playback, practice/exam scoring, pan/zoom math. |

### 8.3 Why this enables independent evolution
- Engines are **deterministic and unit-testable** without a DOM (feed a `Clock`, assert state). The source `renderVals()` logic ports almost verbatim into these engines.
- The UI depends only on the **engine's public snapshot + intents**, so waveform fidelity, fault models, or scoring can be rewritten (even swapped for a WASM/physics core later) with no UI change.
- Data-vs-behaviour split: waveform *shapes* are functions in the engine; waveform *parameters/specs* are data — so new components can be added as data where possible.

**3D:** none of these engines need 3D; all visualization output is 2D series/coordinates rendered as SVG. R3F remains excluded.

---

## 9. Asset Architecture

From `05`: extract the bundle's inlined assets to `public/`.
- **Fonts:** self-host IBM Plex Sans / Mono / Sans Condensed via `next/font/local` (subset to used weights: 400/500/600/700, 400/500/600, 600/700). Replaces the ~3 MB of inlined font CSS with subsetted woff2.
- **Images (~41):** `public/assets/` (component detail, vehicle views, fuse-box, references, injector/cam refs). Use `next/image`; dedupe the repeated ~230 KB placeholders noted in `05`; optimise.
- **Icons:** the inline SVG path sets (`I`, Scanner `navDefs`, Multimeter `symbols`) become a typed `icons/` module of path constants rendered by a single `<Icon>` — no icon font.
- **Manifest/decode tooling:** a one-off `scripts/extract-bundle.mjs` (dev only) reproduces the decode from `01`/`05`; not shipped to the client.

---

## 10. Styling Architecture

- **Tailwind CSS** with the design tokens from `07`/`09` encoded in `tailwind.config.ts`:
  - Colours: brand `#F47822`, shell darks, 5 module accents, semantic status sets, neutrals, scope palette, wire colours — as named tokens (no more inline literals).
  - Radius scale (2/3/4/5/6/7/8/9/10/11/12/14/50%/full), shadow tokens (the 8 real `box-shadow`s), spacing (the observed literals), letter-spacing utilities.
- **Typography:** Tailwind font families + a small set of text presets matching the real `font:` shorthands (eyebrow, label, body, heading, display, mono-value).
- **Theming:** the Oscilloscope's dark/light (`data-hb`) becomes a scoped `data-theme`/CSS-var context on the scope subtree; the rest of the app keeps its fixed dark-shell/light-workspace scheme (source is not globally theme-switchable — do not invent a global dark mode).
- **shadcn/ui** components are restyled to these tokens; no default shadcn look leaks through.
- **No CSS-in-JS runtime**; utility classes + a few CSS-var scopes for the canvas/scope palettes.

---

## 11. Responsive Architecture

Mirror the source exactly (`09` §11) — do **not** invent layouts the source lacks.
- The shell uses **JS width breakpoints** (1080/1120/1200/1250/1330) to progressively hide secondary chrome. Reproduce with a `useBreakpoint()`/container-query approach; where possible convert to CSS (`@container`/media) but preserve the same thresholds and the same elements hidden.
- Rail collapses 66↔206 px (user-controlled, not width-driven).
- Hub: Cards vs Compact rows (user toggle).
- **Tablet/Mobile:** the source has **no defined shell mobile/tablet layout** (`09` §11.2–11.3). Architecture keeps components fluid and documents this as an **open gap**, not a feature to fabricate. Location's `showMobile`/Schematic `device` flags are preserved as-is; a full mobile design is a future decision, not part of this rebuild's spec.

---

## 12. Performance Architecture

Driven by what the source actually does:
- **Code-split each tool engine + UI** via `next/dynamic`; the shell + hub load first.
- **Animation loops:** consolidate the per-tool timers (420/200/90 ms) onto `sim-core.Clock` using a single rAF where the screen is visible; pause when off-screen (source already gates the live stream by active screen).
- **SVG rendering:** the large canvases (ECU network, Schematic ~55 nodes/~140 wires, waveforms) render as memoised SVG; use `transform` for pan/zoom (as source does) rather than re-layout; virtualize long tables (systems/DTC/live-data) if needed.
- **View-model memoisation:** hooks compute view-models with `useMemo`/selector equality so a 420 ms tick only re-renders the subscribed panels (source recomputes everything in `renderVals()`; the rebuild should be more surgical).
- **Fonts:** subset + `next/font` to cut the bundle dramatically vs the 13 MB original.
- **No premature workers**; if waveform sampling becomes heavy, the engine boundary allows moving it to a Web Worker with no UI change.

## 13. Error Handling
- **Route/segment `error.tsx`** per route group and per tool, echoing the source's philosophy: *the simulator never invents readings* (`06`) — if a tool's data/coverage is missing, render the **Coverage Gate**, not fake data.
- **Data validation:** Zod-validate datasets at load; a schema failure surfaces a developer error boundary (dev) / graceful fallback (prod).
- **Engine guards:** engines return typed results; invalid intents are no-ops with a logged warning (never throw into render).
- **Global error boundary** in the shell for unexpected failures, styled like the source's error sink concept.
- The original bootstrap's resource-load error sink is not needed (no runtime bundle), but its intent (visible, non-fatal degradation) is preserved.

## 14. Loading States
- **Route-level `loading.tsx`** for each tool (skeletons matching the tool's frame).
- **Dynamic import fallbacks** for code-split engines/tools.
- **Streaming init:** engines expose an `isReady` snapshot (e.g. live-data buffers priming) so panels can show a lightweight placeholder, mirroring the source's initial buffer fill (`hist` seeded arrays).
- A **splash** equivalent to the bundler's "Unpacking…" is unnecessary; replace with standard skeletons.

### 14.1 Offline capability (review F9)
The original is fully offline (self-contained bundle); the rebuild preserves this with an **optional PWA layer** — an app-shell + static assets + datasets cached by a service worker (`public/manifest.webmanifest` + `next-pwa`/built-in SW). Because all content is static, offline needs **no sync or conflict-resolution logic**; offline write-back is deferred until a backend exists. This is the only added runtime technology, and it is justified by parity with the source.

## 15. Future Backend Integration Points
Marked, not built. Each is an interface today backed by static data:
- **Auth/session:** replace cosmetic login with real auth (middleware route-guard). Seam: `lib/session`.
- **Content/coverage packs:** `data/repositories/*` interfaces → HTTP later (vehicles, coverage matrices, per-tool datasets, waveform params). "Install data pack / Request coverage" actions (today toasts) become real calls.
- **Learning record persistence:** `recordStore` write-path → API (reports, progress, scores, streak). Today in-memory (source has none).
- **Report export/share/print:** currently toasts (`04`); become document-generation/link endpoints.
- **VIN decode / vehicle DB:** Scanner `autoVin` and brand/model/variant lists → external service.
- **Telemetry:** none in source; optional future hook at the store/engine boundary.

**Contract:** all of the above sit behind the Data/API layer. Swapping static → remote changes only `data/repositories/*` implementations. **UI and Simulation layers remain untouched** — which is the whole point of the separation in §0.

- **Real-time / WebSocket:** future `RemoteChannelSource` (§8.1) + `data/transport/` WS client feed engines live state; batched at the `InputSource` boundary. Interface only today.

---

## 16. Security Baseline (review F10)
No security surface exists in the static demo, but the future auth/API/WebSocket capabilities require documented constraints from the start (no security tech added now — only seams + rules):
- **No raw HTML injection.** The source used `sc-html`/`sc-raw`; the rebuild renders exclusively through components — **never `dangerouslySetInnerHTML`** — eliminating that XSS class.
- **CSP + no inline scripts** (Next.js defaults); assets are self-hosted (`05`), so no third-party script origins.
- **Auth tokens** (future) via **httpOnly, Secure cookies** at the `lib/session` seam — never `localStorage`/JS-readable storage.
- **Input validation at the boundary:** all future API/WS payloads validated with **Zod** in `data/repositories/*` / `data/transport/*` before reaching engines or stores.
- **Secrets/env are server-only;** no keys in client bundles.
- **Repository identity** (§7.2) carries `userId/tenantId` for future per-user authorization checks server-side.

## 17. Accessibility Baseline (review F12)
The source has essentially no a11y (`09` §13). The rebuild adopts a **WCAG 2.1 AA-oriented baseline that changes behaviour, not visuals** (so it never violates "no redesign"):
- **Semantic landmarks:** `nav` (rail), `main` (content), `dialog` (modals/picker), proper heading order.
- **Keyboard operability:** rail, tabs, segmented controls, and sliders operable by keyboard — native elements where possible, ARIA tab/menu patterns otherwise. Focus order follows the logical DOM (works in RTL).
- **Focus management:** move focus on route/screen change and on modal open/close; restore on close; visible focus ring (reuse the source's orange `0 0 0 3px rgba(244,120,34,.15)`).
- **Live regions:** `aria-live="polite"` for toasts. The 420 ms live-data stream is **not** announced (would be noise); instead an on-demand "read current values" affordance exposes them.
- **Non-visual alternatives for technical SVGs:** waveform / ECU-network / schematic canvases provide an accessible **data-table or text summary** of the underlying values so the content is not vision-only.
- **Reduced motion:** honour `prefers-reduced-motion` (`12` Phase 12).
- **Contrast:** audit the `07` token set against AA; document any intentional exceptions (e.g. decorative micro-labels).

---

## Traceability
Every layer, engine, store, dataset, and route above corresponds to a concrete element of the decoded original (analysis files `01`–`09`). No feature, technology, or backend was added beyond what the source demonstrates. See `11_PROJECT_FILE_TREE.md` for the concrete structure.
