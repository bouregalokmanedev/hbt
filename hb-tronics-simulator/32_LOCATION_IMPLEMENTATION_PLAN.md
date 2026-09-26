# 32 — Location Implementation Plan (Phase 5)

Mirrors the proven Scanner→Multimeter→Oscilloscope pattern: **evidence → engine+data (headless, tested) → decomposed UI on the engine → full trilingual content + QA**. Additive; retire the old simplified path once unreferenced.

## Architecture target
```
features/location (UI, no logic)
        ↓
packages/sim-location (framework-free engine)
        ↓
data/location (Class-B) + content.location (Class-C)
        ↓
Repository / SessionResult
```

## Datasets (Class-B) — `data/location/atlas.ts`
Port the recoverable component arrays: SENSORS 10, ECUS 15, GROUNDS 19, RELAYS 15 (+ Fuses 56 if their array is recoverable; else document the count and model what is defined). Each: key/ref/name/cat/kind/view/oem/sys/zone/hot{x,y,w,h,W,H}/related. Category + system registries derived. Single Corolla vehicle. **Do NOT invent components to reach 115** — carry exactly what the source defines; if only ~59 are array-defined with data, model those and record the shortfall.

## Assets decision
Diagram images **are vendored** in `public/assets/simulator/` (fusebox-layout, map-ecu, map-ground, detail-<ref>×10, views-<ref>×10) — the current data already references them and they resolve. **Use the image-based atlas** (view diagram + hotspot overlay by relative coords), exactly like the source. Components without their own detail image are hotspots on the shared view image — no fabrication needed. (Only note honestly: the vendored detail set covers the ~10 sensors; fuses/relays/grounds render as hotspots on the shared fusebox/ground diagrams.)

## Class-C content inventory (author EN/AR/FR)
Per component: `loc`, `mount` (sensors), `notes`. Plus training task templates, quiz prompt, hints, verdict/result prose, difficulty descriptions. Estimate ≈ (up to 115 × ~2–3) + ~20 chrome-prose → **large**; author trilingual alongside the UI (Oscilloscope lesson) to keep strict parity.

## Milestones

### P5.1 — Engine + dataset (headless, tested)
Extend `LocationEngine`: browse (select/view/zoom/cat/sys/search/favs/recent/outlines/dimOthers), training (difficulty Easy/Medium/Hard/Expert, hint 1/5 with `pts=max(2,10−hints·2)`, skip, attempt log, progress), quiz (timer, first-try 10 / retry scoring, results), SessionResult. `data/location/atlas.ts` with the recoverable 115-model + registries. Tests ≥ 25 (dataset validation, category/system counts, browse select, filters, search, favourites, training scoring + hints + difficulty, quiz first-try/retry, completion, result contract).

### P5.2 — UI reconstruction on the engine
Decompose: `LocationShell` (mode toggle + vehicle) + `Sidebar` (search/categories/systems/favourites) + `AtlasView` (6 views, hotspot canvas, zoom/FIT, outlines/dim) + `DetailPanel` (OEM/reference/category/system/zone/location/vehicle/notes + Practise-this/Vehicle-views) + `TrainingPanel` (task/difficulty/hint/skip/log/progress) + `QuizPanel` (question/timer/results). Retire the old view/data once unreferenced.

### P5.3 — Content + QA + acceptance
Full EN/AR/FR `content.location.*`; extend content-classc + strict parity (no fallback/exemption). E2E (mode/view/filter/search/favourite/select/training/quiz/completion), RTL, a11y (hotspot canvas labelling, keyboard). Raster EN+AR at 5 breakpoints vs `orig-location-*` (composition/behaviour — atlas imagery unavailable, documented). Full gate green; no Scanner/Multimeter/Oscilloscope regressions.

## Estimated effort / milestones
3 milestones (P5.1 engine+data+tests · P5.2 UI · P5.3 content+QA). Effort comparable to Oscilloscope, **plus** a large dataset (up to 115 components) and its trilingual `loc/mount/notes`. The atlas-asset gap reduces visual-fidelity effort but must be handled honestly (abstract hotspot board).

## Do-not
- Do not fabricate vehicle diagram imagery.
- Do not invent components to hit 115.
- Do not invent a mobile collapse (source is fixed desktop).
- Do not modify Scanner/Multimeter/Oscilloscope.
