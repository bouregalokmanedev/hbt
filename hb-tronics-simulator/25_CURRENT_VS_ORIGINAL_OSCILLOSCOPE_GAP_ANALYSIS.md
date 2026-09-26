# 25 — Current vs Original Oscilloscope Gap Analysis

Current code inspected (read-only): `packages/sim-oscilloscope/{engine.ts(239), sampling.ts(31), waveforms.ts(100)}`, `data/oscilloscope/components.ts(190)`, `features/oscilloscope/{OscilloscopeView.tsx(303), components/{ScopeScreen,CompareScreen,ProbeConnect}, hooks/useScopeEngine.ts}`.

## What already exists (reusable foundation)
- **Framework-free engine** `OscilloscopeEngine extends Engine<ScopeState>` (correct architecture, SessionResult wiring, InputSource/registry pattern). ✅ keep the shell.
- `ScopeState` already has: `timeDiv, vdivA, vdivB, trigLevel, trigEdge, fault, diagnosis, score, cursors, cA, cB`. ✅ reuse & extend.
- Setters: `setTimeDiv, setVdiv, setTrigger, setTrigEdge, toggleCursors`, `cursorReadout(ΔV/ΔT)`. ✅ reuse.
- `data/oscilloscope/components.ts` has the **7 correct components** (inj/coil/cam/app/map/knock/lambda) with chA/chB/trigger/faults skeleton. ✅ reuse the shape; **re-derive values from source**.
- `features/oscilloscope` has `ScopeScreen`, `CompareScreen`, `ProbeConnect`. ✅ partial reuse.

## What is simplified / wrong (must correct)
| Area | Current | Authentic | Action |
|---|---|---|---|
| Waveform model | `waveforms.ts` generic generators | per-component `fn(ch,p)` physics closures | **replace** with authentic `fn` per component |
| Channel vdiv/offset | e.g. inj vdiv 20, offset 0 | inj vdiv **10**, off **−3** | re-derive all from source |
| Faults per component | subset (e.g. inj 6) | authentic sets (inj 8: +shortBat, +noise) | re-derive |
| Fault application | (simplified) | exact `sig()` transforms (12 fault cases + wrong-probe + coupling + noise) | **replace** with authentic transforms |
| Trigger | level/edge only | `findTrigger()` crossing + `tOffset = trig − 0.2·span` | extend |
| Measurements | cursor ΔV/ΔT only | full auto-row: Vmax/Vmin/Vpp/Freq/Duty/PulseW/Rise (histogram threshold) | **add** `measure()` |

## What is missing (must build)
- **Views:** Library (catalogue), Tablet — not present. Connect/Compare partial.
- **Right-panel tabs:** Info / Pinout / Probes / Ref / AI / Score — none as a tab system.
- **Toolbar:** RUN/STOP present-ish; **SINGLE, AUTO SET, PERSIST, PEAK DET, REF, SAVE** missing.
- **Channel controls:** coupling DC/AC, INV, vertical offset — missing.
- **Procedure checklist (7 steps)** + `stepChecks()` auto-detection — missing.
- **Scoring** (25/20/15/15/25) — `score` field exists but not the weighted `score()`; **diagnosis-on-Score-tab** flow missing.
- **AI tab** contextual hints — missing.
- **Live-state animation** (Info tab: pintle lift / winding current / spike, etc.) — missing.
- **Probe model** (`probes{A,B,CLAMP,GND}` + `wrongProbe()` penalty + `correct{A,B,GND}` per component) — missing.
- **Reference overlay / persistence / peak-detect** rendering — missing.
- **Canvas rendering** parity (grid, dual trace, cursors, trigger marker, REF, persist, tablet/compare canvases).

## What can be reused vs replaced
- **Reuse:** engine class shell + SessionResult path; component list shape; ScopeState core fields; cursor ΔV/ΔT; ProbeConnect/ScopeScreen/CompareScreen as starting points.
- **Replace:** waveform generation (`fn`), fault application (`sig`), measurement (`measure`), all component numeric values, and most of the UI (needs 5 views + 6 tabs + procedure + scoring + toolbar/channel controls).

## i18n status
No oscilloscope Class-C content exists yet in `content.oscilloscope.*` (only `oscFault.*` exists, referenced by content-classc). Full trilingual authoring required at implementation time.

## Risk / infra notes
- Rendering is **canvas-based** in the source. The reconstruction can keep canvas (perf) or SVG; canvas matches the source and animation model best.
- Deep-i18n-fallback fix + `role="group"` SVG-a11y lesson from Multimeter apply.
- **No Scanner/Multimeter changes** are implied by this work.
