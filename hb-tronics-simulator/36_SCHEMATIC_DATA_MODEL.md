# 36 — Schematic Data Model

Complete authentic data model, extracted verbatim from `Schematic.dc.html` (`scratchpad/schem-counts.mjs` verifies every count).

## Components — `CMP` (57)
`CMP[key] = [code, name, type, x, y, w, h]` — `x,y` = hotspot **centre** in 4016×1479 image px.

- **Keys vs codes:** the object key (e.g. `F_INJEFIB`, `INJ1`) is the internal id; `code` (e.g. `O7`, `A1`) is the printed callout. Fuses share code `O7`; injectors share `A1`; coils `I1`; grounds `O8` — codes are **not unique**, keys are.
- **Types (10):** `ecu`(1: E1) · `relay`(4: R16,R1,R15,R3) · `fuse`(7: INJ/EFI-B, EFI-MAIN, EFI 1, IGN, ETCS, MIR-HTR, STOP) · `ground`(4: AB,BA,BB,EB) · `network`(2: CAN1,CAN2) · `connector`(1: O6 DLC) · `module`(6: O19,E19,E24,E25,E27,D41) · `sensor`(14) · `actuator`(14) · `switch`(4: S1,S3,S18,S68).
- E1 is a **band** (`x=1968,y=1135,w=3414,h=92`) — the ECU rail every wire returns to (`y=1135`).
- `TYPEL` maps type→display (ECU/RELAY/FUSE/GROUND/SENSOR/ACTUATOR/SWITCH/MODULE/CAN/CONNECTOR). `SYSOF` maps type→system bucket (power/can/ecu).

## Pin table — `W` (133 rows)
`W[i] = [ecuPin, ecuColour, targetKey, targetPin, targetColour]`
Example: `["B 20","Black","INJ1","2","Black"]`, `["A 50","Brown","R16","2","White/Black"]`.
- **Direction:** ECU pin → component pin. Always one ECU end (connector A/B) + one component end.
- **111 distinct ECU pins**: connector **A** = 34, connector **B** = 77.
- **9 colour-mismatch rows** where `ecuColour !== targetColour` (colour changes at a joint) — surfaced with an amber dot + note.
- **Shared nets** are expressed by repeated `ecuPin` OR repeated `targetKey/targetPin`: e.g. ground `G_BA` takes ECU `B 16`, `B 51`, `B 59`; `A 50` bonds `R15/R16/R1` + `G_AB`; coil supply `B 102` feeds all four coils. There is **no separate net id** — a "net" is the set of rows sharing an endpoint.
- `wiresFor(key)`: `key==='E1'` → all 133; else rows with `targetKey===key`.
- Derived: `selPinCount` = distinct `ecuPin` among a component's rows; connector pin counts = distinct `A*`/`B*`.

## Colours — `COL` (12)
Pink `#F3A6C0` · Black `#1F242E` · Red `#E23D3D` · Blue `#2F6FE0` · Brown `#8A5A34` · White `#FFFFFF` · Yellow `#F0C419` · Green `#17A768` · Light Green `#86C562` · Violet `#8B5CF6` · Grey `#98A2B3` · White/Black `#E8EAEE` (rendered as a diagonal split swatch).

## Guided traces — `TRACES` (3)
`{id, label, steps:[[cmpKey, description, colour], …]}`
- `inj` "Injector 1" — 6 steps (F_INJEFIB → E1 A1 feed → R15 → E1 B20 driver → INJ1 → G_BA via B16).
- `ign` "Ignition coil 1" — 7 steps (F_IGN → E1 A37 → R16 → E1 B102 supply → COIL1 → E1 B57 IGT → G_AB via A50).
- `can` "CAN system 1" — 5 steps (E1 A13 CAN-H → CAN1 H → E1 A26 CAN-L → CAN1 L → O6 pin13 via A23).
- The trace polyline routes each step centre through orthogonal mid-points; E1 steps snap to `y=1135`.

## Training tasks — `TASKS` (8)
`{p:prompt, a:answerKey, e:explanation}`. Answer keys: F_EFI1, R16, G_BA, L3, INJ1, CAN1, G1, R1. `e` is a Class-C teaching explanation.

## Exam questions — `EXAMQ` (6)
`{p, a}`. Answers: R15, G_AB, X1, F_IGN, H3, E24. Prompts are "Identify the highlighted <type>" (labels masked).

## Layers — `LAYERS` (11)
`[key, label, na]`: labels, pins, colours, grounds, power, canh, canl (**active**, default on except lin/flexray/wirenum/circuit); lin, flexray, wirenum, circuit (**na=1**, NO DATA). Default `layers` state enables labels/pins/colours/grounds/power/canh/canl. Layer effects: `labels`→hotspot labels; `pins`→(reserved); `colours`→wire swatch/edge colour vs grey; `grounds`/`power`/`canh|canl`→type-tinted idle hotspot outlines.

## Circuit-view graph (synthesised, not stored)
6 columns POWER/RELAYS/ECU/SENSORS/ACTUATORS/GROUNDS; grouping: fuse→POWER, relay→RELAYS, sensor|switch→SENSORS, actuator|module|network|connector→ACTUATORS, ground→GROUNDS, E1→ECU. Edges = `W` rows E1↔target, Bézier, coloured by wire colour. Purely derived from `CMP`+`W`.

## Sheet summary (derived)
Components 57 · Pin-table rows 133 · ECU connectors "A · B" · Distinct ECU pins 111 · Grounding points "AB · BA · BB · EB" · CAN systems 2.

## Classification

### Class-B (canonical technical — LTR, never localised)
Component keys & codes, names (technical identifiers), types, `x/y/w/h` coordinates, `IMG_W/IMG_H`, ECU pin ids (A/B n), pin numbers, wire colours + hex, `targetKey/targetPin`, connector ids (A/B), ground ids (AB/BA/BB/EB), CAN ids, trace step colours/keys, all counts, the R16 sheet / vehicle string / VIN-class descriptors.

### Class-C (learner-facing prose — EN/AR/FR via `content.schematic.*`)
- Mode names & purposes; view/layout/device labels; toolbar/legend labels.
- Trace step **descriptions** (3 traces × their steps) and trace labels.
- Training **prompts** + **explanations** (8×2), Practice generated-prompt template + feedback templates, Exam prompts (6).
- Feedback strings ("Correct.", "Not this one…", "Incorrect — check…"), HUD templates, score/attempts/progress labels.
- All **empty-state** prose ("Not available in uploaded project", "No match…", "Nothing opened yet.", "Select anything on the diagram", etc.).
- Inspector section headings, connector/vehicle modal copy, sidebar section headers, bookmark labels.

### Proposed content ID namespace
`content.schematic.mode.{study,trace,training,practice,exam}`, `.view.*`, `.trace.<id>.label`, `.trace.<id>.step.<n>`, `.task.<n>.{prompt,explain}`, `.practice.{prompt,correct,wrong}`, `.exam.<n>.prompt`, `.feedback.*`, `.hud.*`, `.na.*`, `.inspector.*`, `.summary.*`, `.verdict.{training,practice,exam}.{pass,retry}`.

## Assets
- **`diagram-r16.png`** — 4016×1479, **vendored** at `public/assets/simulator/diagram-r16.png`. Sole raster; used for schematic stage + minimap. No per-component images (source shows "component image — not available"). Circuit view is vector. **No missing assets.**
