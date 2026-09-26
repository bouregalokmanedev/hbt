# 30 — Location Data Model

## Component (Class-B unless noted)
```
Component {
  key        // unique (ref, or 'GP'+n for grounds)
  ref        // R7, L3, F12, GP4, E1…
  name       // "Ignition relay"
  cat        // 'Sensors' | 'Actuators' | 'ECUs' | 'Relays' | 'Fuses' | 'Ground points'
  kind       // 'sensor' | 'ecu' | 'ground' | 'relay' | 'fuse'
  view       // which atlas view shows it ('sensors'|'ecu'|'ground'|'fuse'|'system'|'vehicle')
  oem        // OEM reference (e.g. [R16])
  sys        // vehicle system ('Switching', 'Engine management — air intake', …)
  zone       // 'Engine compartment', 'Cylinder head', …
  loc        // (C) location prose
  mount      // (C) mounting prose (sensors)
  notes      // (C) learner notes prose
  img        // diagram asset (UNAVAILABLE)
  imgW,imgH  // diagram intrinsic size
  hot {x,y,w,h,W,H}  // IMAGE-RELATIVE hotspot rectangle within img (W×H)
  mini       // 4-view locator asset (UNAVAILABLE)
  related[]  // adjacent component refs
}
```
Built from compact source arrays (SENSORS/ECUS/GROUNDS/RELAYS/FUSES) + the `SLOC` metadata map (sys/zone/loc/mount per ref) + `sensorRel` adjacency.

## Registries needed
- **componentRegistry** — the 115 components (recoverable: SENSORS 10, ECUS 15, GROUNDS 19, RELAYS 15; Fuses 56).
- **categoryRegistry** — 8 categories with colour + count.
- **systemRegistry** — 58 vehicle systems (derived by grouping `sys`), with counts.
- **vehicle** — single Corolla context string (Class-B).
- **viewRegistry** — 6 views (id/label/asset/caption).

## State
- **browse**: `sel`, `view`, `zoom`, `cat`, `sys`, `search`, `favs[]`, `recent[]`, `outlines`, `dimOthers`.
- **training**: `tTarget`, `tScore`, `tAttempts`, `tHints`, `tVerdict`, `tReveal`, `tLog[]`, `difficulty`, `tasksDone`.
- **quiz**: `qList[]`, `qIdx`, `qScore`, `qTries`, `qElapsed`, `qOn`, results.
- **session**: SessionResult on quiz/training completion.

## Relationships
- Component → category (`cat`), → system (`sys`), → view (`view`), → zone (`zone`), → related[] components.
- System ← many components (grouping by `sys`).
- Favourite/recent = ref lists over the registry.
- Hotspot geometry is per-component, **relative to its (unavailable) diagram image**.

## Coordinate model
**Image-relative** (`hot.{x,y,w,h}` in the coordinate space of `hot.{W,H}` = the diagram's intrinsic pixels). To render, the diagram image is drawn at a fitted scale and the hotspot rectangle is transformed by the same scale. **Without the diagram images, absolute hotspot positions have no visual anchor** — only relative geometry survives.

## Class-B vs Class-C
- **Class-B:** key/ref/oem/cat/kind/view/sys/zone/hot/imgW/imgH/related/vehicle/counts.
- **Class-C (content namespace):** loc, mount, notes, training task text, quiz prompt, hints, verdict/result prose, difficulty descriptions.
