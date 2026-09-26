# 31 — Current vs Original Location Gap Analysis

Current code inspected (read-only): `packages/sim-location/engine.ts (178)`, `data/location/index.ts (40)`, `features/location/LocationView.tsx (157)`, `hooks/useLocationEngine`.

## What already exists (reusable foundation)
- **Framework-free engine** `LocationEngine extends Engine<LocationState>` — modes `browse|train|quiz`, `selected/target`, quiz (`quizList/quizIdx/quizScore/quizTries/quizTriesThis/quizLog/maxTries`), verdict kinds (`trainCorrect/trainWrong/quizRetry/quizCorrect/quizReveal`), difficulty tolerance, SessionResult. ✅ correct architecture, reuse & extend.
- **Deterministic quiz/training** already matches the source shape (target from data, scored, retries by difficulty). ✅
- `data/location/index.ts` — `SENSORS` (8 hotspots) with `%` coords + Class-C `loc/mount` via `content.location.<ref>.*`. ✅ shape reusable; **must expand to the 115-component model**.
- `LocationView.tsx` — modes + views + hotspot overlay + detail panel + verdict prose. ✅ partial starting point.

## What is simplified / wrong (must correct)
| Area | Current | Authentic | Action |
|---|---|---|---|
| Component count | 8 sensors | **115** (SENSORS 10 + ECUS 15 + GROUNDS 19 + RELAYS 15 + FUSES 56) | expand dataset |
| Categories | none in sidebar | **8** (Sensors/Actuators/ECUs/Relays/Fuses/Ground points + All + Vehicle systems) | add |
| Vehicle systems | none | **58** grouping + counts | add |
| Views | 4 (vehicle/fuse/system/sensors) | **6** (+ ECUs, Ground) | add ecu, ground |
| Coordinates | `%` of stage | **image-relative** (x,y,w,h within img W×H) | re-derive |
| Detail fields | zone/location/mount/system | + OEM ref, Reference, Category, Vehicle, Notes | extend |
| Search | none | search components/refs | add |
| Favourites | none | favs + FAVOURITES list | add |
| Practise this / Vehicle views | none | present | add |
| Training difficulty | difficulty tolerance only | Easy/Medium/Hard/Expert (outlines/hints/reference) + Hint N/5 + Skip + attempt log + progress | extend |
| Quiz | present (simplified) | timed + first-try/retry scoring + results | align |
| Toolbar | outlines only | Hotspot outlines + Dim others + zoom/FIT | add |

## What is missing (must build)
- Sidebar category + system registries with counts; search; favourites.
- 115-component dataset (recoverable subset) + `SLOC` metadata; 6 views; related[].
- Detail panel OEM/Reference/Category/Vehicle/Notes; Practise-this / Vehicle-views.
- Training: difficulty modes, hint 1/5, skip, attempt log, progress %.
- Quiz: timer, first-try/retry scoring, results screen.
- Zoom/FIT + Dim-others.

## Assets — VENDORED IN REPO (not blocking)
The diagram assets are absent from the extraction *bundle* but **are vendored in `public/assets/simulator/`** (33 images: `fusebox-layout.png`, `map-ecu.png`, `map-ground.png`, `detail-<ref>.png` ×10, `views-<ref>.png` ×10, …). The current `data/location/index.ts` already points at `/assets/simulator/*.png`, which resolve. So the atlas can be **image-based** and reproduced. No fabrication needed; per-fuse/relay/ground items are hotspots on the shared view images (no per-item image required).

## i18n status
`content.location.<ref>.{location,mount}` + verdict kinds already localized EN/AR/FR for the 8 current sensors. Full 115-component `loc/mount/notes` + training/quiz/difficulty prose require authoring.

## Reuse vs replace
- **Reuse:** LocationEngine shell + quiz/training scoring + SessionResult; data Hotspot shape; LocationView mode/view/hotspot scaffolding.
- **Replace/expand:** dataset (8→115, image-relative coords), sidebar (categories/systems/search/favourites), detail panel, 6 views, training difficulty/hints/log, quiz timer/results, toolbar.

## Risk / infra notes
- Deep-i18n-fallback + `role=group`/`img` a11y lessons apply.
- **No Scanner/Multimeter/Oscilloscope changes** implied.
