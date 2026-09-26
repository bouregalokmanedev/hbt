# 04 — Interaction / State / Event Inventory

Everything here is state-driven React (via the `DCLogic` base). No URL routing, no forms POST anywhere, no network calls at runtime. Handlers are wired in templates through `sc-camel-on-click` / `style-hover` and the value objects returned by `renderVals()`.

---

## 1. Shell state model

```
state = {
  vw,                      // viewport width (responsive breakpoints)
  screen,                  // active screen (null → props.startScreen → 'login')
  focus: 'INJ',            // shared component under test (ref into CTX, 11 items)
  veh: 'corolla',          // active vehicle (into VEH, 4 items)
  rail: false,             // rail expanded
  picker: false,           // component picker overlay
  userMenu: false,         // user dropdown
  toast: null,             // transient message
  repIdx: 0,               // selected report
  set: { difficulty:'Medium', hints:true, randomFault:true, outlines:true,
         noise:'Normal', instrument:'Bench replica', probeMode:'Drag probes',
         lang:'EN', vehLock:true, hubLayout:null }   // settings → tool props
}
```

### Shell events / handlers
| Handler | Effect |
|---------|--------|
| `go(screen)` | Switch screen, close picker & user menu |
| `say(toast)` | Show toast for 2.4 s |
| `setFocus(ref)` | Set shared component under test |
| `setSet(k,v)` | Update a setting |
| `signIn()` / `signOut()` | login→hub / →login |
| `toggleRail()` | Expand/collapse rail |
| `openPicker/closePicker/clearFocus` | Component picker |
| `toggleUser()` | User dropdown |
| `gateGo/gateSwitch` | Coverage-gate actions |
| resize listener (rAF-throttled) | Updates `vw`; breakpoints at 1080/1120/1200/1250/1330 |

### Cross-tool data flow (the "single bench")
- **Shell → tool:** `focus` maps per tool → `mmFocus` (Multimeter), `scopeFocus` (Oscilloscope), `locFocus` (Location), `schFocus` (Schematic) via the `CTX` table's `mm/scope/loc/sch` columns.
- **Tool → shell:** each tool's `on-select` callback (`onSelectMm/Scope/Loc`) resolves back to a `CTX.ref` and calls `setFocus`, keeping the context bar in sync.
- **Settings → tool props:** `instrument`, `probeMode`, `randomFault`, `hints`, `difficulty`, `outlines`, `noise` (mapped 0/1/2) feed the `<dc-import>` props.
- **Coverage gating:** `gate = (tool screen) && veh.cov[tool] !== 'ok'` → renders Coverage gate instead of the tool.

### Responsive behaviour (shell)
Breakpoints via `vw`: context-jump row hidden < 1080; user text hidden < 1120; context kicker hidden < 1200; module kicker hidden < 1250; "change" link hidden < 1330. Rail collapses to 66px by default. `$preview` design size 1440×900. Mobile-specific layout: **NOT FOUND IN SOURCE** in the shell (tools have their own `device`/`showMobile` notions — see below).

---

## 2. Scanner interactions

State (excerpt): `screen, mode(pro/training), vehicle, sessionId, selBrand/Model/Variant, vin, scanIdx/scanning/scanDone/scanLog, zoom/panX/panY/drag/selEcu/netBus/netStatus, sysSort/sysDir/sysFilter/sysQ, dtcFilter/dtcQ/openDtc/activeDtc/dtcTab, treeStep/treeMeasured/treeVerdict/treeFeedback/treeDone, live/livePlay/liveSel/pins/recording, graphRange/cursor, adasSel/adasProg/adasRunning/adasDone, tStep/tHints/tAnswer/tDone, aiOpen/aiTurn/aiLog, modal, toast, volts`.

Key interactive behaviours:
- **Live-data timer:** `setInterval(tick, 420 ms)` — only runs on livedata/graph/dtcDetail/overview and when `livePlay`. Random-walks each PID toward its base value, keeps a 48-sample history for sparklines; updates battery voltage.
- **Animated full scan:** `startScan()` steps through 21 ECUs on a timer (`scanSpeed` prop, default 200 ms), appending log lines with per-ECU status.
- **ECU network map:** mouse drag to pan (`onNetDown/Move/Up`), zoom 0.6–1.8, fit; bus & status filter chips dim non-matching nodes.
- **Sortable systems table:** click header to sort (toggles direction); filter chips; text search.
- **DTC diagnostic tree (7 steps):** per step, `measure(i)` reveals the reading, then `verdict(i, pass)` checks the learner's pass/fail call against `TREE[i].ok`; wrong → corrective feedback and retry; right → advance or terminate at the failed branch.
- **Live data:** toggle signal selection, pin, filter (all/selected/pinned/out-of-spec), search, record toggle, export CSV (toast).
- **Graph:** pause/resume, time-base 10/30/60 s, draggable cursor (range input 0–100), per-signal min/max autoscale.
- **ADAS:** `runAdas()` animates progress 0→100 (90 ms steps), unlocking checklist items at thresholds.
- **Training scenario 12:** 6 steps (`T_STEPS`) each deep-jumping into the relevant screen; hints; single-attempt answer from 4 options (`T_ANSWERS`, correct index 1); scored feedback (`tScores`, `tFeedback`).
- **AI assistant:** `aiAsk(answer)` plays a fixed 4-line fuel-pressure diagnostic script; option buttons drive turns.
- **Modals:** clear-codes confirm; compare-with-previous (DTC + parameter diffs).
- Contextual **action bar** per screen (`A()` pushes primary/secondary/danger buttons).

---

## 3. Multimeter interactions

State: `view(diagnosis/progress), compId, tab, stepIdx, open, probes{red,black}, drag, lead, mode(OFF/VDC/OHM/MA), faults{}, done{}, answers{}, hint, feedback, report, zoom, pinsOn, extended, elapsed, score, attempts, geom, compStart`.

- **Elapsed timer:** `setInterval(+1 s)`.
- **Fault injection:** `ensureFault(compId)` seeds an unknown fault per component (gated by the shell's `randomFault` prop).
- **Probe placement:** drag red/black leads onto pins / ECU pins / ground; the active `mode` (rotary switch) + probe targets determine the displayed reading (`good` vs `bad` per step). `probe-mode` prop switches between "Drag probes" and "Click to place".
- **Guided steps:** each step has an expected `spec`, a `good`/`bad` reading, an optional spec **table** (temperature→resistance, angle→voltage), and a `fail` diagnosis string. Learner works down the steps; wrong reading path leads to the fail branch.
- **Scoring:** `score` starts 100, decremented on `attempts`; report generated on completion.
- **Focus sync:** reacts to `props.focus` changes (jump to component, reset step/probes) and calls `props.onSelect` when the local component changes.
- Component switching resets the bench (probes, mode OFF, score 100, timer).
- `measure()` re-computes bench geometry on resize (`geom`).

---

## 4. Oscilloscope interactions

State: `screen, compId, rtab, running, timeDiv, vdivA/B, offA/B, enA/B, invA/B, couplingA/B, trigLevel, trigEdge, persist, peak, showRef, cursors, cA, cB, fault, probes, held, diagnosis, tick, theme`.

- **Waveform synthesis:** each component defines `fn(ch, p)` returning the instantaneous value for channel A/B at phase `p`; the scope samples across the time base to draw polylines. Noise added per `signal-noise` prop (`rnd()`).
- **Fault injection:** selecting a `fault` from the component's allowed list deforms the waveform (open/short-to-gnd/short-to-bat/high-res/weak/noise/dropout/coilWeak/injShort/etc.), each with a `FAULTDESC`.
- **Scope controls:** run/stop, time/div, per-channel V/div, offset, invert, enable, coupling AC/DC (knock forced AC), trigger level (slider, component-specific min/max/step) & edge, persistence, peak-detect, cursors A/B.
- **Connect-the-probes puzzle:** place A / GND / CLAMP (and B where present) on the correct connector/ECU pins (`correct{}`); wrong wiring changes/kills the trace.
- **Reference overlay:** toggle uploaded reference images (`refImages`).
- **Diagnosis:** submit a fault diagnosis; scored on the Score tab.
- **Focus / theme sync:** `hbFocus(id)` jumps to a component and resets scope defaults; `applyTheme()` sets `data-hb` on `<html>`; shell passes `theme="light"`.

---

## 5. Location interactions

State: `screen, mode(browse/train/quiz), view(fuse/sensors/system/vehicle/ecu/ground), sel, hover, query, cat, zoom, favs, recent, showMobile, difficulty, outlines, dim, allCircuits, tTarget/tHints/tScore/tAttempts/tLog/tVerdict/tArea/tReveal, qOn/qList/qIdx/qScore/qLog/qTries/qElapsed`.

- **Browse:** search + category filter; click a hotspot (`select(key)`) to open the detail panel; hover highlight; zoom; view switch; favourites & recent.
- **Train mode:** `startTraining(target)` picks a target component; learner must click the correct hotspot; hints reduce score; reveal shows the answer; verdict logged.
- **Quiz mode:** `startQuiz()` builds a shuffled list; per question the learner clicks the location; `answer(key, mode)` scores, tracks tries and elapsed, advances to next; final score/log.
- **Focus sync:** on `props.focus` change, selects the component and switches to `vehicle` view if it is a sensor; `props.difficulty` / `show-outlines` feed training tolerance and outline overlays; `on-select` reports selections back to the shell.
- `showMobile` / `device`: a mobile-preview affordance exists (details of the responsive layout beyond this flag: **NOT FOUND IN SOURCE**).

---

## 6. Schematic interactions

State (excerpt): `z, tx, ty, mode(study/trace/training/practice/exam), view(schematic/circuit), theme, layout, device, sel, selWireIdx, trace, tracePlaying, drawer, showSearch, showLayers, recent, feedback, …`.

- **Canvas:** pan (`tx/ty`), zoom (`z`, default 0.32), fit-to-view per view; click component (`select`) or wire (`selWireIdx`) to inspect pin/colour/endpoints.
- **Modes:** Study (free inspect); **Trace** (guided step-by-step highlight of a circuit from `TRACES` — Injector 1 / Ignition coil 1 / CAN system 1 — with play); Training/Practice/Exam (scored identification, `feedback`).
- **Left tool rail:** vehicle systems drawer, search overlay, layers toggle, bookmarks (jumps to `G_BA`), recent, progress (→ training mode).
- **Focus sync:** `props.focus` of `INJ`/`COIL` maps to trace `inj`/`ign` and auto-enters Trace mode playing.
- **View toggle:** Schematic ↔ Circuit re-fits the canvas.

---

## 7. Global interaction facts

- **Persistence:** none observed — no `localStorage`/`sessionStorage`/cookies; all state is in-memory React state. Refresh resets to `startScreen`. (**NOT FOUND IN SOURCE:** any persistence layer.)
- **Networking:** none at runtime — every resource is a blob from the bundle; all "Export/Share/Print/Install/Request" actions only fire toasts. (**NOT FOUND IN SOURCE:** any `fetch`/XHR/WebSocket to a live API.)
- **Auth:** login accepts anything and routes to hub; not validated.
- **Animations:** CSS hover states (`style-hover`), timers (scan 200 ms, live 420 ms, ADAS 90 ms, multimeter/oscilloscope tick timers), progress bars, rAF-driven resize/geometry, `sc-shine` effect in the runtime, waveform redraw loop.
- **Keyboard / accessibility:** explicit keyboard handlers or ARIA roles: **NOT FOUND IN SOURCE** (interactions are pointer/click and range-slider based; `title` attributes are used for tooltips).
