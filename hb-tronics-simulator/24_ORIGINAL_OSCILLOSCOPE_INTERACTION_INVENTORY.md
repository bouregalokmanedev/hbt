# 24 — Original Oscilloscope Interaction Inventory

Every evidenced interaction, with the engine effect. (Source: `6f804578….dc.html`.)

## Navigation
| Interaction | Effect |
|---|---|
| Click a top view tab (Library/Connect/Scope/Compare/Tablet) | `setState({screen})` |
| Click a right tab (Info/Pinout/Probes/Ref/AI/Score) | `setState({rtab})` |
| Theme toggle | light/dark, clears persist buffer |
| Select exercise in Library | load component, reset state |

## Probe connection (Connect / Probes)
| Interaction | Effect |
|---|---|
| Assign probe A / B / CLAMP / GND to a terminal | `probes{A,B,CLAMP,GND}` mapping; drives `wrongProbe()` + `probeOk` |
| Wrong terminal | flat/ናoise trace + AI CONNECTION ERROR + step 1 stays undone |

## Scope controls
| Interaction | Effect |
|---|---|
| RUN/STOP | `running` toggle |
| SINGLE | freeze one capture (`capOk`) |
| AUTO SET | auto-scale vdiv/timebase/trigger to the signal |
| TIME/DIV − / + | `timeDiv` step (span = ×10); `tOk` when matches component |
| TRIG edge (rising/falling) | `trigEdge`; `trigOk` needs correct edge |
| TRIG level slider | `trigLevel` (min…max, step); `trigOk` needs level inside signal band |
| PERSIST | afterglow buffer on/off (`persist`) |
| PEAK DET | peak-detect sampling toggle |
| REF | uploaded reference overlay on/off |
| CURSORS | show/hide cursors |
| SAVE | store the current capture |

## Channel controls (per channel A/B)
| Interaction | Effect |
|---|---|
| − / + V/div | `vdivA` / `vdivB`; `vOk` when Ch A matches component |
| Coupling DC/AC | `coupling{A,B}`; AC subtracts DC mean |
| INV | invert channel |
| ↓ / ↑ offset (div) | vertical position `off` |

## Cursors
| Interaction | Effect |
|---|---|
| Drag cursor A / B (screen-x) | `cA` / `cB` (0..1); ΔT = |cB−cA|·span, ΔV = sig(A,cB)−sig(A,cA); `measOk` when |cB−cA|>0.03 |

## Fault injection (left sidebar chips)
| Interaction | Effect |
|---|---|
| Click a fault chip (none/open/shortGnd/shortBat/highRes/weak/noise/poorGnd/dropout/intermittent/missing/coilWeak/injShort — per-component subset) | `setState({fault})`, clears persist; reshapes waveform via `sig()`; HEALTHY↔FAULT ACTIVE badge |

## Diagnosis & scoring (Score tab)
| Interaction | Effect |
|---|---|
| Pick a fault as the diagnosis | `diagnosis`; `diagOk` when === injected `fault`; step 7 ticks |
| (score recomputes live) | `score()` = 25+20+15+15+25 weighted by step checks |

## Compare
| Interaction | Effect |
|---|---|
| View live vs reference overlay | renders `cmpLive` + `cmpOverlay` canvases |

## Auto-detected procedure (no manual ticking)
Steps 1–7 tick automatically from `stepChecks()` as the learner performs the correct probe/vdiv/timebase/trigger/single/cursor/diagnosis actions (see doc 22 §7).

## Not present (do NOT invent)
- No free-text input, no manual step checkboxes, no networked data, no timed countdown, no mobile-specific gestures. Layout is fixed desktop.
