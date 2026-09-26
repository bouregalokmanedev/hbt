# 23 — Original Oscilloscope Screen Inventory

Every screen/state reachable in the authentic source. IDs match the source (`SCREENS`, `RTABS`).

## A. Top-level views (whole-screen `SCREENS`)
| # | id | name | contents |
|---|----|------|----------|
| A1 | library | **Library** | catalogue of the 7 exercises (component cards) → selecting one loads it |
| A2 | connect | **Connect** | probe-connection screen: assign probes (Ch A, Ch B, CLAMP, GND) to component terminals/pins |
| A3 | scope | **Scope** | the main workstation (default) — toolbar, waveform canvas, readout row, channel controls, left procedure sidebar, right info panel |
| A4 | compare | **Compare** | live capture vs uploaded reference overlay (side-by-side / overlaid canvases `cmpLive`,`cmpOverlay`) |
| A5 | tablet | **Tablet** | compact tablet-format rendering of the scope (`tablet` canvas) |

## B. Scope view — regions
| # | region | contents |
|---|--------|----------|
| B1 | Left sidebar | EXERCISE code/name/sub · **PROCEDURE n/7** checklist · MEASUREMENT prose · REFERENCE VALUES table · FAULT INJECTION chips (+ HEALTHY/FAULT ACTIVE state) |
| B2 | Toolbar row 1 | RUN/**STOP** · **SINGLE** · **AUTO SET** · **TIME/DIV − v +** · **TRIG ↓edge [level slider] nV** |
| B3 | Toolbar row 2 | **PERSIST** · **PEAK DET** · **REF** · **CURSORS** · **SAVE** (toggles show active state) |
| B4 | Waveform canvas | grid, Ch A/Ch B traces, REF overlay, cursor A/B verticals, trigger level (h-dashed) + trigger point marker, channel legend, `TRIG·AUTO`/sample-rate badges, `<timeDiv> · <window> · <code>` label |
| B5 | Readout row | V MAX · V MIN · V P-P · FREQ · DUTY · PULSE W · RISE · ΔT A→B · ΔV A→B |
| B6 | Channel controls | CH A: label · − vdiv + · coupling(DC/AC) · INV · ↓ off div ↑ ; CH B: same (when chB present) |

## C. Right panel tabs (`RTABS`)
| # | id | tab | contents |
|---|----|-----|----------|
| C1 | component | **Info** | component photo + caption · FUNCTION prose · LIVE STATE (animated readouts) · CONSTRUCTION bullets |
| C2 | pinout | **Pinout** | component pin diagram / pin list (n → name) |
| C3 | probes | **Probes** | probe assignment status (which probe on which terminal) |
| C4 | ref | **Ref** | uploaded reference images + captions + reference-values |
| C5 | ai | **AI** | contextual AI guidance (severity, head, why, next) |
| C6 | score | **Score** | procedure completion, **diagnosis submission** (pick the fault), score breakdown (25/20/15/15/25) |

## D. Dynamic states (per region)
- **Run/Stop**: live-scrolling vs frozen.
- **Triggered / not triggered**: `TRIG·AUTO` badge; trace stability.
- **SINGLE**: one frozen capture.
- **Fault active**: any of the per-component fault set (none = HEALTHY) — reshapes the waveform + live state.
- **Cursors on/off**: ΔT/ΔV populated when moved apart.
- **Persist on**: afterglow trails.
- **Coupling AC/DC**, **INV on/off**, **vertical offset** per channel.
- **Theme light/dark**.
- **Procedure step states**: each of 7 auto-ticks (done/undone).
- **Diagnosis**: unset / correct / incorrect.
- **Score**: 0–100 live.

## E. Empty / loading / error states
- **No component image**: Info shows "no component image uploaded for this exercise yet".
- **No signal / wrong probe**: trace flat at 0 V with noise; AI tab shows a CONNECTION ERROR card.
- **Not triggered**: free-run scroll (no stable capture).
- No spinner/loading screen in the source (synchronous canvas rendering).

## F. Counts
- **5** top-level views + **6** right-panel tabs = **11** distinct screen surfaces.
- **7** exercises × (7 procedure steps + fault set 5–8) — the Scope view multiplies across components and faults.
- **Responsive:** fixed desktop layout at all widths (375 → horizontal scroll, no mobile collapse) — matches Scanner/Multimeter; preserve, do not invent a mobile mode.
