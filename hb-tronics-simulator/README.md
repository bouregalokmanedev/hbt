# HB TRONICS SaaS Simulator — Production Rebuild

A faithful rebuild of the HB TRONICS diagnostic-training simulator on a modern,
maintainable stack. Five specialised tools on one shared diagnostic bench:
**Scanner · Multimeter · Oscilloscope · Location · Schematic**.

The original offline HTML export (`HB TRONICS SaaS Simulator (offline).html`) and the
binding specification (`01`–`15` docs) are the source of truth; this app reproduces
its UI, content and simulation behaviour without redesign.

## Stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript** (strict)
- **Tailwind CSS** — design tokens reconstructed from docs `07`/`09`
- **Zustand** — SSR-safe store factory (no singletons)
- **next-intl** — EN / AR (RTL) / FR from day one
- **Zod** — dataset validation
- **Vitest** — headless engine + data tests

## Run

```bash
pnpm install
pnpm dev          # http://localhost:3000  → /en/login
pnpm build        # production build (EN/AR/FR prerendered)
pnpm test         # 35 vitest tests: engine / data / component / i18n
pnpm test:e2e     # 7 Playwright E2E flows (auto-starts the prod server)
pnpm typecheck    # tsc --noEmit
pnpm lint         # layer-boundary + RTL lint rules
```

## Architecture — five layers, kept apart

Data flows **down**; events flow **up**; the simulation core never imports React
(doc `10` §0).

```
UI          app/ · components/ · features/     React 19 + Tailwind, renders view-models
State       stores/ · providers/               Zustand (SSR-safe factory) + engine registry
Simulation  packages/sim-*                      framework-free TS engines (headless, testable)
Data        data/                               typed, versioned, Zod-validated content
API (future) data/repositories/                 interface seam — static today, HTTP later
```

- **Engines** (`packages/sim-*`) are plain classes: `getState / subscribe / dispatch /
  onComplete`. They live in a module-level **registry** (`providers/registry.ts`) so a
  running scan or scored session survives navigation. The UI subscribes via
  `lib/useEngine.ts` (`useSyncExternalStore`) — the engine never imports React.
- **`InputSource`** (`packages/sim-core/io.ts`) is the real-time seam: `LocalClockSource`
  today, a future `RemoteChannelSource` (WebSocket) later — same engine, swappable driver.
- **`SessionResult` → `commitResult`** is the single write-path from an engine to the
  learning record (`recordStore`).
- **Boundary enforcement:** ESLint bans `react`/`next`/UI imports inside `packages/**`
  and `data/**` (`.eslintrc.cjs`).

## Simulation highlights (the product's real value)

- **Oscilloscope** — per-component waveform synthesis (`fn(ch, phase)`): injector
  peak-&-hold + ~68 V inductive spike, coil dwell/limit + ~330 V kick, Hall cam,
  MAP/APP/knock/lambda — plus 12 fault deformations and probe-connect scoring.
- **Multimeter** — guided measurement across 12 components; reading resolves from
  meter mode + probe targets + step; seeded faults; scoring. ECU pin numbers reconcile
  with the Schematic netlist (e.g. MAF L3 pin 4 → B92, INJ1 → B20).
- **Scanner** — 21-ECU / 3-bus network map, 8 DTCs, 18 live PIDs streaming at **420 ms**
  with 48-sample sparklines, and the interactive 7-step P2118 diagnostic tree that
  terminates at the 6.42 Ω motor-resistance fault.
- **Location** — hotspot atlas with browse / train / quiz modes and scored quiz.
- **Schematic** — pan/zoom netlist canvas (49 typed components, 66 coloured harness wires)
  with guided trace playback (Injector 1 / Ignition coil 1 / CAN 1).

## Internationalization & RTL

- Locale segment `app/[locale]`; `middleware.ts` negotiates EN/AR/FR.
- **Class A** chrome → `messages/<locale>/*.json` keys. **Class B** technical data
  (codes, pins, VIN, measurements, units) stays canonical/English everywhere.
- Arabic renders `dir="rtl"` with logical CSS properties (no UI duplication); technical
  SVG islands (waveforms, schematic, ECU map, sparklines) stay `dir="ltr"` and never mirror.
- **EN/AR/FR are fully translated** across every namespace; a key-coverage test enforces AR/FR parity with EN. Any missing key still falls back to `en`.

## Assets & offline

- IBM Plex fonts self-hosted via `next/font/local` from the extracted bundle — zero
  runtime external requests. Images/icons under `public/assets/`.
- Optional PWA (`public/manifest.webmanifest` + `public/sw.js`, registered in production
  only) caches the static app shell for offline parity.

## Project map

See `11_PROJECT_FILE_TREE.md` for the full tree and `13_QA_CHECKLIST.md` for the
acceptance checklist. `QA_STATUS.md` records the current pass state.
