# 33 — Schematic Source Specification

**Source of truth:** `Schematic.dc.html` = extracted `by-uuid/da53bc93-b51a-4bd4-af1b-d44d9bebd850.html` (88.5 KB), the authentic offline tool. One `class Component extends DCLogic` (`renderVals()` pattern, same runtime family as the other four tools). Rendered diagram asset `assets/diagram-r16.png` **is vendored** at `public/assets/simulator/diagram-r16.png` — verified **4016×1479 px**, matching the source constants `IMG_W=4016, IMG_H=1479`. The tool is **image-recoverable**; no fabrication needed.

All counts below were extracted programmatically by evaluating the source `CMP`, `W`, `TRACES`, `TASKS`, `EXAMQ`, `LAYERS` arrays (`scratchpad/schem-counts.mjs`) — not read by eye.

## What the tool is
A **single-sheet wiring-diagram workspace** for one circuit: **R16 — Ignition coil relay**, on the **TOYOTA Corolla 1.6 16V VVT-i (1ZR-FE) 2013–2018**, "SHEET 1/1 · UPLOADED". It presents the R16 sheet as a large pannable/zoomable raster with an interactive hotspot + wire overlay, an ECU-centric **pin table**, a **layers** system, five **modes**, two **views** (Schematic image / synthesised Circuit graph), and search / connector / vehicle modals. It is explicitly a **single uploaded project** — most OEM metadata renders "Not available in uploaded project" (an authentic, deliberate empty-state, not missing work).

## Verified source counts (authoritative)
| Metric | Value |
|---|---|
| Components (`CMP`) | **57** |
| — by type | ecu 1 · relay 4 · fuse 7 · ground 4 · network 2 · connector 1 · module 6 · sensor 14 · actuator 14 · switch 4 |
| Pin-table rows (`W`) | **133** |
| Distinct ECU pins | **111** (connector A: 34 · connector B: 77) |
| Wire colours (`COL`) | 12 (Pink, Black, Red, Blue, Brown, White, Yellow, Green, Light Green, Violet, Grey, White/Black) |
| Colour-mismatch rows (join changes colour) | 9 |
| Guided traces (`TRACES`) | 3 — `inj` (6 steps), `ign` (7 steps), `can` (5 steps) |
| Training tasks (`TASKS`) | 8 |
| Exam questions (`EXAMQ`) | 6 |
| Layers (`LAYERS`) | 11 (7 active + 4 `NO DATA`: LIN, FlexRay, Wire numbers, Circuit names) |
| Components with no pin-table rows | 3 (F_EFIMAIN, F_STOP, G_EB) |

The "known characteristics" (~57 / ~133 / ~111) are therefore **confirmed exactly**: 57, 133, 111.

## Coordinate model
Each `CMP[key] = [code, name, type, x, y, w, h]` where `x,y` is the hotspot **centre** in the 4016×1479 image space; the hotspot rect renders at `left=x−w/2, top=y−h/2`. The E1 ECU is a tall band (`w=3414, h=92` at `y=1135`) spanning the sheet — every ECU wire visually returns to the `y=1135` ECU rail. Coordinates are **image-absolute px**, not percentages.

## Netlist row shape
`W[i] = [ecuPin, ecuColour, targetKey, targetPin, targetColour]` — e.g. `["B 20","Black","INJ1","2","Black"]`. Direction is ECU-pin → component-pin. `ecuColour !== targetColour` marks a **colour change at the joint** (9 rows). `wiresFor(key)` filters `W` by `targetKey`; `wiresFor('E1')` returns **all 133** (E1 is the hub). This is a **star/hub topology centred on E1**, not a general graph — every wire has exactly one ECU pin end and one component end.

## Vehicle / project context (Class-B)
`TOYOTA Corolla 1.6 16V VVT-i (1ZR-FE)`, `2013 – 2018`, breadcrumb `Engine management / R16 — Ignition coil relay`, `SHEET 1/1 · UPLOADED`, ECU connectors `A` and `B`, grounding points `AB · BA · BB · EB`, `2` CAN systems. Sheet summary values are all data-derived.

## Runtime / rendering
- `DCLogic` component, `state` object (see §36), `renderVals()` returns all template bindings.
- Pan/zoom on a transformed stage (`translate(tx,ty) scale(z)`), wheel-zoom around cursor, pointer-drag pan, minimap with viewport rectangle.
- Trace animation: `setInterval(33ms)` advances `traceT` 0→1; an orange dashed path with a moving dot walks the trace polyline.
- Keyboard: ⌘/Ctrl-K opens search; Esc closes all overlays.
- Device emulation (`desktop`/`tablet`/`mobile`) + layout (`A` three-column / `B` floating inspector / `C` bottom dock) are **in-app controls**, not viewport media queries (see §35, §34-responsive).

## Localisation
The source `.dc.html` is **English-only** (no locale switch, no RTL). All learner-facing strings are literals in the template/JS. Our reconstruction must externalise Class-C prose to `content.schematic.*` in EN/AR/FR (see §36 classification).
