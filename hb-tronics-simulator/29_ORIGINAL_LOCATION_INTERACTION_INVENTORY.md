# 29 — Original Location Interaction Inventory

Every evidenced interaction + engine effect (`8703b001….dc.html`).

## Mode / navigation
| Interaction | Effect |
|---|---|
| Browse / Training / Quiz toggle | `mode`; resets task/quiz state |
| View tab (Sensors/ECUs/Ground/Fuse box/Systems/Vehicle) | `view`; swaps diagram + hotspot set |
| Breadcrumb | reflects vehicle › zone › view › ref (display) |
| Tablet/settings glyph | (top-right; view/settings) |

## Sidebar
| Interaction | Effect |
|---|---|
| Search text | filters component list by name/ref/circuit |
| Category chip (8) | `cat` filter; list + counts |
| Vehicle-system row (58) | filter to that `sys` |
| Favourite star toggle | add/remove `favs`; FAVOURITES list |

## Atlas
| Interaction | Effect |
|---|---|
| Click a hotspot | `pick(key)` — Browse: select; Train/Quiz: `answer` |
| Zoom − / 100% / + / FIT | `zoom` |
| Hotspot outlines toggle | show/hide hotspot rectangles |
| Dim others toggle | dim non-selected hotspots |

## Detail panel (Browse)
| Interaction | Effect |
|---|---|
| Practise this | switch to Training targeting this component |
| Vehicle views | 4-view locator |
| Favourite star | toggle `favs` |

## Browse selection — `pick(key)`
Sets `sel`, `view = it.view`, `zoom = 1`, records `recent` (last 4). Detail panel + notes render.

## Training — `answer(key,'train')`
- Correct: `pts = max(2, 10 − tHints·2)`; `tScore += pts`; reveal; attempt-log entry (+pts, hints); `nextTask()` after 1.4 s.
- Wrong: `tAttempts++`; `tHints = min(3, tHints+1)`; verdict 'no' (0.9 s); log entry.
- Hint N/5, Skip task. Difficulty (Easy: hotspots outlined · Medium: no outlines · Hard: no hints · Expert: reference only).
- Progress: SCORE, WRONG PICKS, Tasks completed %.

## Quiz — `answer(key,'quiz')`
- Timed (`qElapsed`, 1 s tick). Target = `qList[qIdx]`.
- Correct: first try (`qTries===0`) → 10 pts; retries fewer. Advances; results/completion at end.

## Deterministic & data-driven
Targets are drawn from the 115-component dataset; scoring is deterministic (training 10 − 2/hint min 2; quiz 10 first-try). No random rules beyond target selection/order.

## Not present (do NOT invent)
No free-text answers, no multi-vehicle switching (single Corolla), no networked data, no mobile-specific gestures. Fixed desktop layout.
