# 22 — Oscilloscope Source Specification (authentic)

**Source of truth:** original tool `.dc.html` = `6f804578-de43-434b-a8b6-0829c0331008.html` (116 KB), plus the authentic 1440 render (`orig-tools/orig-oscilloscope-1440.png`) and breakpoint captures (`orig-osc-{1280,1024,768,375}.png`). This document records the **exact** behaviour observed in the source runtime. Nothing here is assumed from the current app.

## 1. Shell & top-level views
Top bar: `● OSCILLOSCOPE · <compName> · <code>` + `SCORE <n>/100` + 5 view tabs.
`SCREENS = [['library','Library'],['connect','Connect'],['scope','Scope'],['compare','Compare'],['tablet','Tablet']]` — the workstation switches whole-screen between these 5. A light/dark theme toggle exists (`theme`, `applyTheme`).

Right-panel tabs (Scope view): `RTABS = [['component','Info'],['pinout','Pinout'],['probes','Probes'],['ref','Ref'],['ai','AI'],['score','Score']]`.

## 2. Exercises / components (7) — Class-B data
`COMPONENTS = [inj, coil, cam, app, map, knock, lambda]`:

| id | code | name |
|----|------|------|
| inj | INJ-01 | Fuel Injector |
| coil | IGN-01 | Ignition Coil — Primary |
| cam | CMP-01 | Camshaft Position Sensor |
| app | APP-01 | Accelerator Pedal Position Sensor |
| map | MAP-01 | MAP Sensor |
| knock | KNK-01 | Knock Sensor |
| lambda | O2-01 | Oxygen Sensor |

Per component fields (Class-B unless noted):
`id, code, name, sub, activeLow, period(ms), supply(V), openA, pk, timeDiv(default ms/div),
chA{label,unit,vdiv,off,colorKey}, chB{...}?, trig{level,edge,min,max,step},
photo, photoCaption(C), refImages[]{src,caption(C)}, correct{A,B?,GND} (probe terminals),
pins[]{n,name}, faults[] (id subset), anim{...} (live-state config),
specs[]{k,v} (reference-values table, Class-B), instruction(C), function(C), construction[](C)`

**Waveform generator** — each component carries a pure closure `fn(ch, p)` returning the ideal signal value for channel `ch` at phase `p` (ms within `period`). Example (INJ Ch A): `12 V` rest → `-0.6 V` pull-down for `pw≈3.2 ms` → inductive spike `-0.6 + 68.6·(dt/0.05)` → decay `12 + 56·e^-(dt-0.05)/0.36`. Ch B (current): ramp to ≈3 A, hold ≈1.52 A with ripple, exponential decay. **This `fn` is the physics model and is the primary datum to port per component.**

Fault-description prose (Class-C): `FAULTDESC{coilWeak, injShort, …}`, `FAULTLBL{…}` labels.

## 3. Signal pipeline (engine)
`raw(ch,t)` → component `fn`. `sig(ch,t,fault)` wraps `raw` and applies, in order:
1. **Fault transform** (switch on fault):
   - `open`: v = (ch A? openA : 0)
   - `shortGnd`: v = 0 + noise·0.03
   - `shortBat`: v = supply (12)
   - `highRes`: v = rest + (v−rest)·0.55
   - `weak`: v = rest + (v−rest)·0.42
   - `noise`: v += rnd·pk·0.055
   - `poorGnd`: v += pk·0.06 + pk·0.03·sin(t·3.1)
   - `dropout`: every 3rd cycle → rest
   - `intermittent`: every 3rd super-cycle (period·3) → rest
   - `missing`: every 4th cycle → −0.85 (A) / 0 (B)
   - `coilWeak`: clip spike above 40 V to 40+(v−40)·0.16; Ch B ×0.72
   - `injShort`: Ch B ×1.85
   (rest = ch A? openA : 0)
2. **Wrong-probe penalty** (`wrongProbe()` from probe placement): supply pin → flat supply; ground/none → ~0 V noise.
3. **Coupling**: `coupling{A,B}` = AC → subtract `dcMean(ch)`.
4. **Baseline noise** `+= rnd·nAmp·noiseScale()`.

## 4. Trigger & timebase
- `span = timeDiv · 10` (10 horizontal divisions).
- `findTrigger()`: scan 900 samples over `period`; return first crossing of `trigLevel` with the selected edge (rising/falling) on Ch A; null if none.
- `frame()`: if running & triggered → `tOffset = trig − 0.2·span` (trigger sits 20 % in); if running & not triggered → free-run scroll; measurements throttled to ~120 ms.
- Modes: RUN/STOP toggle, **SINGLE** (freeze a capture), **AUTO SET** (auto-scale V/div, timebase, trigger to the signal). Trigger badge shows `TRIG · AUTO` / level.

## 5. Auto-measurements (readout row) — computed, not authored
`measure()` samples 1400 pts of Ch A over `span`:
- **Vmax/Vmin/Vpp/mean** — min/max/range/mean.
- **Threshold** — 48-bin histogram → two dominant levels → `mid` (falls back to (min+max)/2).
- **Freq** — mean period between up-crossings of `mid` → `1000/per` Hz (kHz above 1000).
- **Duty** — fraction above `mid`, inverted when `activeLow` → %.
- **Pulse width** — longest contiguous run in the active state → ms.
- **Rise** — 10 %→90 % time of the first rising edge.
- **ΔT A→B** = |cB − cA|·span; **ΔV A→B** = sig(A,cB) − sig(A,cA) (cursor values).
Formatting: `fmt` (2 dp <10 else 1 dp), `fmtT` (µs<1 ms, ms<1000, else s).

## 6. Cursors, channels, overlays
- Cursors A/B are vertical (screen-x fractions `cA,cB` 0..1); drive ΔT/ΔV.
- Channels: `vdivA,vdivB` (V/div), `off` (vertical position, divisions), `coupling` DC/AC, `INV` invert, per-channel colour.
- Overlays/toggles: **PERSIST** (afterglow buffer `persistBuf`), **PEAK DET**, **REF** (uploaded reference overlay), **CURSORS**, **SAVE**.

## 7. Procedure (7 steps) + auto-detection
`stepChecks()` computes each step's `ok` live (no manual ticking):
1. **probeOk** — `probes.A===correct.A && (!correct.B || probes.B===correct.B) && probes.GND===correct.GND`
2. **vOk** — `|log2(vdivA / chA.vdiv)| < 1.01`
3. **tOk** — `|log2(timeDiv / comp.timeDiv)| < 1.01`
4. **trigOk** — `trigEdge===trig.edge && trigLevel within [min+8%·pp, max−8%·pp]`
5. **capOk** — `!running || persist` (froze a capture)
6. **measOk** — `|cB − cA| > 0.03` (cursors used)
7. **diagOk** — `diagnosis === fault` (correct fault chosen on Score tab)

Step labels are generated from component data (Class-C wording, but templated from Class-B values).

## 8. Scoring & diagnosis
`score() = (probeOk?25) + (vOk&&tOk?20) + (trigOk?15) + (measOk?15) + (diagOk?25)` → 0–100 (matches `SCORE n/100`). Diagnosis = learner picks a fault on the **Score** tab; `diagOk` when it equals the injected `fault`.

## 9. AI tab (Class-C hints)
`ai()` returns `{sev, head, why, next}` contextual guidance: connection errors (wrong/absent probe), within-spec, or fault-specific coaching. All prose is Class-C.

## 10. Live state (Info tab)
`anim{...}` per component drives a small animated readout (e.g. INJ: **Pintle lift %**, **Winding current A**, **Inductive spike** indicator) synced to the waveform phase. Class-B labels + computed values; construction bullets are Class-C.

## 11. Rendering
Waveforms draw to `<canvas>` (`drawCanvas` for `scope/cmpLive/cmpOverlay/tablet/preview`) — grid, traces, cursors, trigger marker, reference overlay, persistence. **Canvas-based**, not SVG.

## 12. Class-B vs Class-C split
- **Class-B (canonical):** component ids/codes, period/supply/pk, channel vdiv/unit/offset, trigger level/edge/min/max/step, `correct` terminals, pins, `specs` reference values, the `fn` waveform math, all fault transform constants, measurement formulas, score weights.
- **Class-C (localise EN/AR/FR):** component `name`?/`sub`/`instruction`/`function`/construction bullets, `photoCaption`, `refImages[].caption`, `FAULTLBL`/`FAULTDESC`, procedure step wording, AI hint prose, verdict/diagnosis result text. (Codes like INJ-01, V/div, Hz, terminal names stay canonical LTR.)
