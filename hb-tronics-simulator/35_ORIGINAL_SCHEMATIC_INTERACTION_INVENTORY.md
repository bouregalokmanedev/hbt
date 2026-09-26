# 35 — Original Schematic Interaction Inventory

Every interactive handler in `Schematic.dc.html`, with its exact source effect. Classified: **[I]** interactive · **[S]** static/decorative · **[D]** data-driven · **[X]** disabled.

## Navigation / mode
| Control | Effect |
|---|---|
| Mode segmented (Study/Trace/Training/Practice/Exam) **[I]** | `setState({mode, sel:null, selWireIdx:null, feedback:null, tracePlaying: mode==='trace'})` |
| View tabs Schematic / Circuit **[I]** | `setState({view})` then `fitView({view})` (refits zoom to 4016×1479 or 1760×1560) |
| Layout A/B/C **[I]** | `setState({layout})` → re-measure + refit; changes inspector placement |
| Device desktop/tablet/mobile **[I]** | `setState({device})` → `rescale()` + refit; emulated shell size |
| Print / Export **[S]** | no handler |
| `focus` prop = `INJ`/`COIL` **[D]** | auto-enters `mode:'trace'`, `trace:'inj'|'ign'`, `tracePlaying:true` (deep-link from other tools) |

## Canvas
| Control | Effect |
|---|---|
| Hotspot click **[I]** | `pick(key)` → in Study/Trace: select + record recent(6); in Training (not revealed): `answerTask`; in Exam: `answerExam` |
| Hotspot hover **[I]** | `setState({hover})` → label + HUD |
| Wheel **[I]** | zoom about cursor, `z ∈ [0.08, 3]`, adjusts `tx,ty` |
| Pointer down/move/up **[I]** | pan (`tx,ty`), pointer capture |
| Zoom −/+ (bar & dock) **[I]** | `z ×0.8 / ×1.25`, clamped |
| Fit **[I]** | `fitView()` — recompute z + centre for current view/device/layout |
| Reset **[I]** | clear selection + refit |
| Minimap **[S]** | reflects viewport rect (display only) |
| Fullscreen glyph **[S]** | no handler |

## Trace mode
| Control | Effect |
|---|---|
| Trace picker (Injector 1 / Ignition coil 1 / CAN system 1) **[I]** | `setState({trace:id, tracePlaying:true})` |
| Play/Pause (bar, HUD, dock) **[I]** | toggle `tracePlaying` |
| Animation loop **[D]** | `traceT=(traceT+0.012)%1` every 33 ms; HUD shows `Step k/N — <desc> · <colour>` |

## Sidebar
| Control | Effect |
|---|---|
| Filter components **[I]** | `setState({filter})` → filters the 57-list by code+name substring |
| Vehicle-system row **[I]** | Engine management: none; ECU & connectors → open connector A modal; CAN network → select+focus CAN1; Power → select+focus F_EFI1 |
| Component list row **[I]** | `select(key)` + `focusOn(key)` (recentre/zoom) + close drawer |
| Recent chip **[I]** | select + focus |
| Bookmark row **[I][D]** | 3 fixed → select + focus (E1 / G_BA / R16) |
| Rail glyphs (collapsed) **[I]** | open drawer / search / layers / bookmark(G_BA) / recent[0] / Progress(=training) |

## Inspector
| Control | Effect |
|---|---|
| Pin-table row **[I]** | `setState({selWireIdx: toggle i})` → highlights that wire, shows "Selected wire" block |
| Related-component chip **[I]** | select + focus |
| ECU connector A/B card **[I]** | open connector modal |
| Clear (✕) **[I]** | `sel:null, selWireIdx:null` |
| OEM DATA fields **[X]** | static "Not available" |

## Task panels
| Control | Effect |
|---|---|
| **Training** canvas click **[D]** | `answerTask(key)`: `ok = key===TASKS[idx].a`; `attempts++`; `taskCorrect += ok`; `taskDone += ok`; feedback text (`Correct. <e>` / `Not this one. <code> — <name>. Try again.`). **No auto-advance; unlimited retries; no timer.** |
| Next task **[I]** | Training/Practice: `taskIdx=(idx+1)%len`, clear feedback/reveal/sel. Exam: advance question / submit / restart |
| Show answer **[I]** | reveal `TASKS[idx].a` / `EXAMQ[idx].a`, select+focus it, feedback = explanation |
| **Practice** choice (4 ECU-pin MCQ) **[I][D]** | `attempts++`, `taskCorrect += (opt===correctPin)`, feedback |
| **Exam** canvas click **[D]** | `answerExam(key)`: record `examAnswers[examIdx]=key`, `attempts++` (no immediate right/wrong) |
| Submit exam **[I]** | `examSubmitted=true`; prompt shows "Exam submitted — score <pct>" |

## Overlays
| Control | Effect |
|---|---|
| Search open (button / ⌘K) **[I]** | `showSearch:true` |
| Search query **[I][D]** | matches `CMP` (code+name) and `W` (pin+colour+target+"pin n"); ≤40 results; badge=kind |
| Search result **[I]** | close + select (+ wire idx if a WIRE) + focus |
| Connector modal open **[I]** | `showConnector:'A'|'B'` |
| Connector tab A/B **[I]** | switch connector |
| Connector pin cell **[I][D]** | close + select target + wire idx + focus |
| Layers toggle **[I][D]** | `layers[k]=!layers[k]` (4 NO-DATA rows are **[X]**) |
| Vehicle modal **[I]** | open/close (single Corolla) |
| Esc / scrim click **[I]** | close overlays |

## Scoring semantics (exact)
- **Training/Practice score** = `round(100 · taskCorrect / max(1, attempts))` %, shown as `scorePct`; progress bar = same. `attempts` and `taskCorrect` accumulate across tasks (accuracy, not per-task points).
- **Training** logs correct locates into `taskDone` (of 8).
- **Exam** collects answers; score = same accuracy formula over the 6 recorded picks after Submit.
- **Determinism:** Training tasks (8) and Exam questions (6) are **fixed, ordered arrays**. Practice question is **derived deterministically** from `taskIdx` (`pIdx = taskIdx % W.length`, target `W[pIdx*7 % len]`, distractors from fixed index arithmetic). **No randomness anywhere** — fully deterministic/data-driven.

## Not present (do NOT invent)
No multi-sheet navigation, no wire editing, no free-text answers, no networked data, no locale/RTL, no real Print/Export, no OEM metadata, no per-wire size/number, no timer.
