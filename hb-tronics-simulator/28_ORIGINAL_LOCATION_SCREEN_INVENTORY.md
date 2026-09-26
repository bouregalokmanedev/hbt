# 28 — Original Location Screen Inventory

Every screen/state reachable in the authentic source (`8703b001….dc.html`).

## A. Modes (top toggle)
| # | mode | contents |
|---|------|----------|
| A1 | **Browse** | free exploration — sidebar + atlas + detail panel |
| A2 | **Training** | guided "Locate: X" tasks + progress + difficulty + attempt log |
| A3 | **Quiz** | timed questions + results/completion |

## B. Regions (shared across modes)
| # | region | contents |
|---|--------|----------|
| B1 | Left sidebar | search + "115 components in data set" · CATEGORIES (8 + counts) · VEHICLE SYSTEMS (58 + counts) · FAVOURITES |
| B2 | Atlas centre | breadcrumb · view tabs (6) · toolbar (Hotspot outlines, Dim others, zoom −/100%/+, FIT) · diagram + hotspot markers |
| B3 | Right panel | Browse → detail (OEM ref/reference/category/system/zone/location/vehicle/notes + Vehicle views + Practise this); Training → progress/difficulty/log; Quiz → question/result |

## C. Atlas views (6)
| id | tab | diagram (asset) |
|----|-----|-----------------|
| sensors | Sensors | per-component detail illustration `detail-<ref>.png` |
| ecu | ECUs | `map-ecu.png` (top view, LHD) |
| ground | Ground | `map-ground.png` |
| fuse | Fuse box | `fusebox-layout.png` |
| system | Systems | `fusebox-layout.png` (system trace) |
| vehicle | Vehicle | 4-view locator |

All view diagrams are **vendored in `public/assets/simulator/`** (fusebox-layout, map-ecu, map-ground, detail-<ref>×10, views-<ref>×10) — the atlas is image-recoverable (see doc 27 §7). The source harness shows only alt-text because the extraction *bundle* lacks them, but the repo has them.

## D. Component-category surfaces (sidebar filters)
All components (115) · Sensors (8) · Actuators (2) · ECUs/Modules (15) · Relays (15) · Fuses (56) · Ground points (19) · Vehicle systems (58 grouping).

## E. Dynamic states
| state | where | notes |
|---|---|---|
| idle / landing | Browse | default component selected, Fuse-box view |
| component selected | Browse | detail panel + hotspot highlighted |
| category filtered | sidebar | list narrows to category |
| system filtered | sidebar | list narrows to a vehicle system |
| search active | sidebar | filter by name/ref |
| favourite toggled | detail/sidebar | star; FAVOURITES list |
| view switched | atlas | 6 diagram views |
| zoom / FIT | atlas toolbar | `zoom` state |
| hotspot outlines on/off | atlas toolbar | outline rectangles |
| dim others on/off | atlas toolbar | non-selected hotspots dimmed |
| training task active | Training | "Locate: X", hint N/5, skip |
| training correct/wrong | Training | verdict + attempt log entry + score |
| training difficulty | Training | Easy/Medium/Hard/Expert |
| quiz running | Quiz | timer + current question |
| quiz answer (first/retry) | Quiz | 10 pts first try, fewer on retry |
| quiz results / completion | Quiz | score summary |
| Practise this | Browse→Training | starts a training task on the component |
| Vehicle views | detail | 4-view locator |

## F. Empty / no-result states
- Search with no match → empty component list (no results).
- Diagram image missing → the `alt` caption renders (this is the *permanent* state here, since assets are unavailable).
- Quiz/Training with no more tasks → completion summary.

## G. Counts
- **3** modes × **3** regions; **6** atlas views; **8** category filters + **58** system filters.
- **115** components in the advertised data set; explicitly array-defined: SENSORS 10, ECUS 15, GROUNDS 19, RELAYS 15 (+ Fuses 56).
- **Responsive:** fixed desktop layout at all widths (375 keeps 3 columns → horizontal scroll; no mobile collapse) — matches Scanner/Multimeter/Oscilloscope.
