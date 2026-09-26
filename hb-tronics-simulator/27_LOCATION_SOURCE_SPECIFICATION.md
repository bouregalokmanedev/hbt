# 27 — Location Source Specification (authentic)

**Source of truth:** original tool `.dc.html` = `8703b001-a3de-45e8-b48f-1080eac32ed7.html` (112 KB), the authentic 1440 render (`orig-tools/orig-location-1440.png`) + breakpoint/mode captures (`orig-loc-{1280,1024,768,375,training,quiz}.png`). Records the exact behaviour observed in the source runtime.

## 1. Shell
Top bar: `● LOCATION · Component location · engine bay, fuse box, ECUs & ground points` + **Browse / Training / Quiz** mode toggle + a tablet/settings glyph. Vehicle context: **TOYOTA Corolla 1.6 16V VVT-i (1ZR-FE) 2013–2018** (single vehicle).

## 2. Layout (3-column)
- **Left sidebar:** search box ("Search components, refs, cir…" + "115 components in data set") · **CATEGORIES** (colour-dot list + counts) · **VEHICLE SYSTEMS · 58 systems** (scroll list, per-system count) · **FAVOURITES** (starred components).
- **Centre (atlas):** breadcrumb (`vehicle › zone › view › ref · name`) · **view tabs** (Sensors/ECUs/Ground/Fuse box/Systems/Vehicle) · toolbar (☑ Hotspot outlines, ☑ Dim others, − 100% + zoom, FIT) · the diagram canvas with hotspot markers.
- **Right panel (detail):** ref chip + category + name + favourite star · **Vehicle views** + **Practise this** buttons · detail fields (Component, OEM ref, Reference, Category, Vehicle system, Zone, Location, Vehicle) · **NOTES** (Class-C prose).

## 3. Categories (8) — component counts
`All components 115 · Sensors 8 · Actuators 2 · ECUs / Modules 15 · Relays 15 · Fuses 56 · Ground points 19 · Vehicle systems 58`. (8+2+15+15+56+19 = **115**; "Vehicle systems 58" is a cross-cutting grouping, not part of the 115.)

## 4. Vehicle systems (58)
A flat list (ABS 6, Adaptive headlights 2, Audio system 3, Automatic air conditioning 8, Automatic light unit 3, Charging 2, Charging system 1, …) — each component carries a `sys` field; the list groups by it with counts.

## 5. Views (6) — `viewDefs`
```
sensors : src null                       cap 'Component detail illustration'
ecu     : src assets/map-ecu.png         cap 'Top view, LHD — control units'
ground  : src assets/map-ground.png      cap 'Top view, LHD — ground points'
fuse    : src assets/fusebox-layout.png  cap 'Fuse and relay box in engine compartment'
system  : src assets/fusebox-layout.png  cap 'Vehicle system trace'
vehicle : src null                       cap '4-view locator'
```
Each view renders a **diagram image** with **hotspot rectangles** overlaid; the selected component's hotspot is highlighted, others dimmed (Dim others) / outlined (Hotspot outlines).

## 6. Dataset (Class-B) — built from compact arrays
`this.SENSORS / ECUS / GROUNDS / RELAYS` (+ Fuses) arrays, mapped to component objects:
- **SENSORS** (10 = Sensors 8 + Actuators 2): `[ref, name, cat, imgW, imgH, hotX, hotY, hotW, hotH]` → `{key,ref,name,cat,view:'sensors',kind:'sensor', img:'assets/detail-<ref>.png', hot:{x,y,w,h,W:imgW,H:imgH}, oem:ref, sys, zone, loc, mount, mini:'assets/views-<ref>.png', related, notes}`. `sys/zone/loc/mount` come from the **`SLOC`** metadata map keyed by ref.
- **ECUS** (15): `[ref, name, locText, hotX, hotY, hotW, hotH]` → `{cat:'ECUs', view:'ecu', img:'assets/map-ecu.png' (1000×557), hot, sys:'Control units', zone:locText.split(',')[0], loc:locText, notes}`.
- **GROUNDS** (19): `[num, …]` → `{key:'GP'+num, ref:num, name:'Ground point '+num+' […', cat:'Ground points', …}`.
- **RELAYS** (15) + **FUSES** (56): analogous compact arrays (ref like R7/F…, name, position/zone, hotspot on the fuse-box layout).
- `sensorRel` = a related-component adjacency map.

**Coordinates are IMAGE-RELATIVE**: `hot.{x,y,w,h}` are pixel/normalised rectangles *within* the diagram image of size `hot.{W,H}` — meaningless without the diagram image.

## 7. Assets — VENDORED IN REPO (recoverable)
The diagram images are **absent from the extraction bundle** (`manifest.json`), so the source harness renders only the `alt` text (e.g. "FUSE AND RELAY BOX IN ENGINE COMPARTMENT"). **However, they were vendored into the repo in an earlier phase** — `public/assets/simulator/` holds **33 images**: `fusebox-layout.png`, `fusebox-location.png`, `map-ecu.png`, `map-ground.png`, `detail-<ref>.png` ×10 (H3/I2/L1/L3/T1/U2/V1/X1/X7/X8), `views-<ref>.png` ×10, `diagram-r16.png`, plus the oscilloscope refs. So the Location tool **can** be image-based: the 6 views map to the vendored diagrams, and per-component hotspots overlay on them.
- **Recoverable now:** the shared view diagrams (fuse/ecu/ground) + the ~10 sensor detail/locator images.
- **Not vendored:** individual per-fuse / per-relay / per-ground-point detail illustrations (there are up to 56 fuses etc.) — but these **do not need** individual images: they are hotspots on the shared `fusebox-layout.png` / `map-ground.png`, positioned by their relative coords. So no image is missing that the atlas actually requires.

## 8. Modes
- **Browse:** click a component (sidebar / hotspot / favourite) → `pick(key)` sets `sel`, switches to its `view`, records `recent` (last 4). Detail panel + notes shown.
- **Training:** a task "Locate: <component>"; click the right hotspot. `answer`: correct → `pts = max(2, 10 − tHints·2)`, reveal, log, `nextTask()` after 1.4 s; wrong → `tAttempts++`, `tHints = min(3, +1)`, verdict 'no' 0.9 s. Progress: SCORE, WRONG PICKS, Tasks completed %, ATTEMPT LOG. **Difficulty** (Easy: hotspots outlined · Medium: no outlines · Hard: no hints · Expert: reference only). Hint N/5, Skip task.
- **Quiz:** timed (`qElapsed`), a `qList` of targets; `answer`: first try (`qTries===0`) → 10 pts, retries fewer; results/completion screen.

## 9. Interactions
`pick(key)`, mode switch, view switch, category filter, system filter, search, favourite toggle (`favs`), zoom (`zoom`, FIT/100%/±), Hotspot-outlines toggle, Dim-others toggle, "Practise this" (→ training on that component), "Vehicle views", hint, skip, quiz submit/answer.

## 10. Class-B vs Class-C
- **Class-B (canonical):** ref, oem, category, `sys`, `zone`, hotspot coords, view ids, vehicle id/string, counts.
- **Class-C (localise):** `loc` (location prose), `mount`, `notes`, training task wording, quiz question/prompt, hints, verdict/result prose, difficulty descriptions.
