# 26 — Oscilloscope Implementation Plan (Phase 4)

Mirrors the proven Scanner→Multimeter pattern: **evidence → engine+data (tested headless) → decomposed UI on the engine → full trilingual content + QA**. Additive rebuild; retire the old simplified engine/data only once unreferenced.

## Architecture target
```
features/oscilloscope (UI, no logic)
        ↓
packages/sim-oscilloscope  (framework-free engine)
        ↓
data/oscilloscope (Class-B) + content.oscilloscope (Class-C)
        ↓
Repository / Scenario / SessionResult
```

## Required datasets (Class-B) — `data/oscilloscope/scope.ts`
Port verbatim from source doc 22: 7 components with `fn(ch,p)`, period/supply/pk, chA/chB{vdiv,off,unit,colorKey}, trig{level,edge,min,max,step}, `correct{A,B?,GND}`, pins[], specs[], faults[], anim config. All numeric constants + fault-transform constants are Class-B.

## Class-C content inventory (author EN→AR/FR at implementation)
Per component: `name?`, `sub`, `instruction`, `function`, `construction[]`, `photoCaption`, `refImages[].caption`, `specs` are Class-B (kept), fault **labels** + **descriptions** (`FAULTLBL`/`FAULTDESC`), procedure step wording (templated), AI hint prose (`sev/head/why/next` per state), diagnosis/verdict result text. Estimate ≈ 7 × (function + sub + instruction + ~4 construction + ~2 captions) + ~13 fault labels + ~13 fault descriptions + ~6 AI templates + procedure/score chrome ≈ **~120–150 EN strings** → ×3 locales. Register under `content.oscilloscope.*`; keep codes/units/Hz/V-div canonical.

## Milestones

### P4.1 — Engine + full dataset (headless, tested) — *no UI*
- New `packages/sim-oscilloscope/scopeEngine.ts` (framework-free): state (screen, rtab, running, single, timeDiv, vdivA/B, offA/B, couplingA/B, invA/B, trigLevel/edge, persist, peakDet, refOn, cursors cA/cB, probes{A,B,CLAMP,GND}, fault, diagnosis).
- Port `sig()` fault pipeline, `findTrigger()`, `measure()` (histogram/freq/duty/pw/rise), cursor ΔT/ΔV, `stepChecks()`, `score()`, `wrongProbe()`, `autoSet()`.
- `data/oscilloscope/scope.ts` with the 7 authentic components + `fn`.
- SessionResult on diagnosis submit.
- **Tests (headless):** waveform values at key phases, trigger crossing, each fault transform, measurement formulas (freq/duty/pw/rise) on known signals, stepChecks each gate, score weighting, wrong-probe penalty, all 7 datasets validate. Target ≥ 25 tests.
- Gate: tsc/lint/vitest green; Scanner+Multimeter untouched.

### P4.2 — UI reconstruction on the new engine
- Decompose into: `ScopeShell` (top view tabs + score), screens `Library / Connect / Scope / Compare / Tablet`, right-panel `InfoTab / PinoutTab / ProbesTab / RefTab / AiTab / ScoreTab`, and scope parts `Toolbar (RUN/STOP·SINGLE·AUTO SET·TIME/DIV·TRIG), OverlayBar (PERSIST/PEAK DET/REF/CURSORS/SAVE), WaveformCanvas, ReadoutRow, ChannelControls, ProcedureChecklist, FaultChips, ReferenceValues`.
- Canvas renderer for grid + dual trace + cursors + trigger marker + REF overlay + persistence (rAF via the injectable clock seam; no logic in React).
- Retire old `OscilloscopeEngine`/`waveforms.ts`/old data once unreferenced; migrate `oscFault.*` usage.

### P4.3 — Content + QA + acceptance
- Author full EN/AR/FR `content.oscilloscope.*`; extend `content-classc` + keep coverage parity strict (no exemptions — learn from Multimeter: author trilingual alongside UI).
- E2E: view/tab navigation, probe connect, run/stop/single, trigger, cursors→readouts, fault→waveform change, diagnosis→score, AUTO SET, RTL, a11y (multimeter lessons: interactive canvas/controls labelled, no nested-interactive).
- Raster EN+AR @ 1440/1280/1024/768/375 vs `orig-oscilloscope-1440.png` + breakpoint captures.
- Full gate green; no Scanner/Multimeter regressions.

## Estimated Phase 4 milestones
1. **P4.1** engine + dataset + headless tests.
2. **P4.2** UI (5 views + 6 tabs + canvas + procedure + scoring) on the new engine; retire old code.
3. **P4.3** trilingual content + tests + raster/RTL/a11y + acceptance.

(Optionally split P4.2 into 4.2a scope-core + 4.2b Library/Connect/Compare/Tablet if scope proves large.)

## Do-not
- Do not assume Multimeter behaviour (osc is time-domain waveform, not point measurement).
- Do not invent a mobile layout (source is fixed desktop).
- Do not modify Scanner; modify Multimeter only if a proven-safe shared-infra fix is required.
