# 34 — Original Schematic Screen Inventory

Every surface reachable in `Schematic.dc.html`. Layout is a **top bar + sub bar + 3-region body** (sidebar · canvas · inspector) with overlays.

## A. Top bar (height 44)
`☰` menu · **SCHEMATIC** brand · **Search** button ("Search wire, pin, ECU, fuse, ground…", ⌘K) · **mode segmented control** (Study · Trace · Training · Practice · Exam) · **Layers** button (`n/11 layers`) · Print · Export (Print/Export are static, non-interactive).

## B. Sub bar (height 40)
Breadcrumb `Engine management / R16 — Ignition coil relay` + `SHEET 1/1 · UPLOADED` chip · **view tabs** (Schematic · Circuit view) · **LAYOUT** A/B/C · **device** desktop/tablet/mobile · (Trace mode only) **TRACE** trace-picker + Play/Pause · **zoom group** (`n/11 layers` label, −, `zoom%`, +, Fit, Reset).

## C. Left sidebar (width 264 full / 64 rail / 288 drawer / 0 hidden)
- **VEHICLE SYSTEMS** — 4 rows: Engine management (57), ECU & connectors (2), CAN network (2), Power distribution & grounds (11) + a dashed "not available" note (Transmission, ABS, Airbag, Body, Lighting, HVAC, Hybrid, EV, Comfort).
- **COMPONENTS ON SHEET** — count + filterable list of all 57 (`code · name · wireCount`).
- **RECENT** — chips of last-opened codes (empty state "Nothing opened yet.").
- **TRAINING PROGRESS** — big score %, attempts label, progress bar, "N of 8 training tasks located correctly."
- **BOOKMARKS** — 3 fixed (ECU E1 connector A pinout, Grounding point BA, Ignition coil relay R16).
- Top: **Filter components** input.

## D. Canvas (main)
### D1. Schematic view (default)
`diagram-r16.png` (4016×1479) on a pan/zoom stage + SVG overlay: trace `links` (glow + animated dash) and `traceDots`; **hotspots** (57 absolutely-positioned rects with hover labels); **exam masks** (black `?`/code chips over components in Exam mode). Minimap (bottom-left) with viewport rect. Floating zoom dock (bottom-right: −, zoom%, +, Fit, fullscreen glyph). Optional **HUD** pill (top-centre): trace step text / exam status / hover component name.
### D2. Circuit view
Synthesised column graph on a 1760×1560 board: 6 columns (POWER · RELAYS · ECU · SENSORS · ACTUATORS · GROUNDS), E1 as a tall central node, Bézier edges E1→each component coloured by wire colour, node click selects.

## E. Right inspector (width ~300–372; layout A side / B floating / C bottom dock / mobile bottom-sheet)
- **Task panel** (Training/Practice/Exam only): kicker, counter, prompt, feedback banner, choices (Practice), score bar + %, "Next task" + "Show answer".
- **Has-selection** state:
  - Header: code, type badge, name, ✕ clear; stats CONNECTIONS / ECU PINS / SHEET (R16).
  - **Selected wire** block (when a row is picked): swatch + colour, from-pin / to-pin rows, colour-mismatch note, "wire size/number — not available".
  - **Pin-table rows** list (`selWires`): swatch, ECU pin, label, target pin, mismatch dot. Title = "ECU PIN TABLE — ALL ROWS" for E1, else "PIN-TABLE ROWS". Empty → dashed "No pin-table rows…".
  - **Shared ground** block (ground selected): the ECU pins bonded at that ground.
  - **Related components** chips.
  - **OEM DATA** — 6 fields, all "Not available in uploaded project".
- **No-selection** state: "Select anything on the diagram" hint, **SHEET SUMMARY** (6 rows), **ECU CONNECTORS** A / B cards (pin counts).

## F. Overlays / modals
1. **Search palette** (⌘K) — query input, results (components + wires, kind badge, meta), "No match in uploaded project.", footer count. Searches the pin table only.
2. **Connector modal** — E1 connector A/B pinout grid (pin, colour swatch, target, colour), tabs A/B, "housing image/lock/location — not available".
3. **Vehicle modal** — single Corolla card + "No other vehicles available."
4. **Layers panel** (anchored top-right) — 11 toggles, 4 marked `NO DATA` (disabled).
5. **Drawer scrim** — mobile/narrow sidebar as overlay.

## G. Empty / no-data states (authentic, deliberate)
"Not available in uploaded project" appears for: OEM data (6 fields), wire size/number/circuit name, connector housing/lock/location, other vehicles, other vehicle systems, empty pin table, empty search, empty recents. These are **first-class designed states**, to be reproduced (as Class-C), not filled in.

## H. Modes as screen states
- **Study** — free browse/select/trace-by-click; no task panel.
- **Trace** — TRACE bar + Play/Pause + HUD step readout; animated guided path; dims non-trace components.
- **Training** — task panel with 8 prompts; click-to-answer on canvas; feedback + score.
- **Practice** — task panel with pin-table-generated MCQ (4 ECU-pin options); feedback + score.
- **Exam** — component labels masked (`?`/code chips); 6 questions; click-to-answer; submit → score; restart.

## Responsive (source-defined, NOT viewport media queries)
- **device** desktop (fills window) / tablet (1024×768 scaled) / mobile (390×844 scaled) — an emulated shell scaled by `fit`.
- **layout** A (sidebar+canvas+inspector) / B (canvas-first, floating inspector) / C (bottom inspector dock).
- Real window width also collapses the sidebar to a **rail (64)** below 1180 and **hidden (0)** below 980; inspector width = `clamp(300, 26vw, 372)`; mobile inspector = bottom sheet at 52% height. **No mobile-specific gestures beyond pan/zoom.** Do not invent a different mobile collapse.
