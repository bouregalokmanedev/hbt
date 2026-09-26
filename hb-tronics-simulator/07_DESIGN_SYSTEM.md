# 07 — Design System

Extracted from inline styles in the decoded templates and the colour objects in each tool's logic. There is **no central token file**; colours and type are declared inline per element, so this is a *reconstruction* of the de-facto system. Values are literal from source.

---

## 1. Typography

**Families (self-hosted IBM Plex, inlined woff2):**
- `'IBM Plex Sans', sans-serif` — primary UI text (weights 400/500/600/700).
- `'IBM Plex Mono'` — codes, readings, technical values (400/500/600).
- `'IBM Plex Sans Condensed'` — condensed headings/labels (600/700).

**Observed usage patterns (from inline `font:` shorthands):**
- Kickers / eyebrow labels: 600, ~11–12 px, letter-spacing, uppercase.
- Rail labels: 500/600, 12 px.
- Body copy: 400, ~14–14.5 px, line-height ~1.6, `text-wrap:pretty`.
- Buttons/CTAs: 600, ~11.5 px.
- Large display (login): bold, condensed.
- Technical readings (meter/scope/DTC codes): IBM Plex Mono.

Exact type scale token set: **NOT FOUND IN SOURCE** (no `--font-size-*` variables; sizes are inline literals).

---

## 2. Colour palette

### Brand & shell
| Role | Hex |
|------|-----|
| Brand orange (primary) | `#F47822` |
| Brand orange on-dark text | `#1A1206` |
| Shell background (dark) | `#0E1114` |
| Rail / dark surfaces | `#14181C`, `#131A26`, `#1B2432` |
| Dark text | `#E8EAED`, `#F4F6F9` |
| Dark dim text | `#9AA0A6`, `#8C9AAF`, `#5F6570` |

### Per-module accent (tint / tint-bg)
| Module | Tint | Tint bg |
|--------|------|---------|
| Scanner (SCN) | `#F47822` | `#FFF1E4` |
| Multimeter (DMM) | `#1F6AE1` | `#EAF1FE` |
| Oscilloscope (OSC) | `#8B5CF6` | `#F2EDFE` |
| Location (LOC) | `#0E9F6E` | `#E7F7F0` |
| Schematic (WDG) | `#D92D20` | `#FDECEA` |

### Status / semantic (recurs in every tool)
| Meaning | Foreground | Background |
|---------|-----------|-----------|
| OK / normal / pass | `#0B7A3C` / `#12A150` / `#17A768` | `#EDF7F1` / `#F1F8F3` |
| Warning | `#B4560F` / `#F59E0B` | `#FFF3E8` / `#FFF8EC` |
| Fault / fail / danger | `#B42318` / `#D92D20` / `#E23D3D` | `#FDECEA` / `#FDF2F1` |
| Selected (info) | `#1F6AE1` | `#EFF5FE` |
| Muted / not-equipped | `#8A9099` / `#C2C8D0` / `#6B7280` | `#F5F6F7` / `#F7F8FA` |

### Light-surface neutrals
Backgrounds `#FFFFFF`, `#FBFCFD`, `#FFF9F4` (warm active), `#F2F3F5`; borders `#E3E7ED`, `#D5DCE3`, `#EFF1F5`.

### Oscilloscope theming (full dual palette)
The scope ships an explicit **`PALETTE.dark` / `PALETTE.light`** token set (`applyTheme()` sets `data-hb` on `<html>`): channel colours A `#ED7D1C` / B `#3B6FE0` / C `#17A768` / REF `#8C9AAF`, scope screen `#080C13`(dark)/`#FFFFFF`(light), grid/cursor/trigger-line tints, etc. The shell passes `theme="light"`.

### Wire-colour palette (Schematic `COL`)
Pink `#F3A6C0`, Black `#1F242E`, Red `#E23D3D`, Blue `#2F6FE0`, Brown `#8A5A34`, White `#FFFFFF`, Yellow `#F0C419`, Green `#17A768`, Light Green `#86C562`, Violet `#8B5CF6`, Grey `#98A2B3`, White/Black `#E8EAEE`.

---

## 3. Spacing, radius, elevation

Inline literals (no token variables):
- **Padding:** screen content `26px 28px 32px` / `…40px`; chips/buttons `0 14px`; card padding varied.
- **Control heights:** buttons/chips ~34 px.
- **Radius:** 6–8 px on buttons/chips/toasts; larger on cards; pill toggles fully rounded.
- **Elevation:** subtle shadows, e.g. selected segment `0 1px 2px rgba(19,26,38,.16)`; splash chip `0 1px 4px rgba(0,0,0,.12)`.
- **Rail width:** 66 px collapsed ↔ 206 px expanded.
- **Toggle knob travel:** 0 → 18 px; on-colour `#F47822`, off `#CBD2DB`.

Exact spacing scale / radius tokens: **NOT FOUND IN SOURCE** (all inline).

---

## 4. Iconography

- **No icon font / SVG icon files.** All icons are **inline SVG paths** declared in JS objects:
  - Shell `I` (10 two-path glyphs), Scanner `navDefs` (9 paths), Multimeter `symbols` (11 component glyphs).
- Simple, 24-viewport, stroke-style line icons; two paths per icon (outline + detail).

---

## 5. Layout system

- **Flexbox-based** app shell: fixed left rail + flexible content column; screens are `flex:1; min-height:0; overflow:auto`.
- Tools render **full-bleed** (`width:100%;height:100%`) inside the content area.
- Hub supports two layouts: **Cards** and **Compact rows** (toggle).
- Responsive by JS breakpoints (1080/1120/1200/1250/1330) rather than CSS media queries in the shell; design canvas 1440×900.

---

## 6. Voice / content tone

Professional workshop/technician register: "OEM PROCEDURES", "REAL WAVEFORMS", "GUIDED FAULT TREES", "HB-OS 4.2.1 · COVERAGE 2026.7", "Five specialised tools. One diagnostic bench." Copy is didactic (each fault/step explains *why*). English only in this build (AR/TR flagged as "ships with coverage 2026.9").

---

## 7. Brand facts (from source)

- Product: **HB TRONICS SaaS Simulator**; version string "HB-OS 4.2.1", coverage "2026.7".
- Persona: **H. Barakat**, "Master technician", seat 04 of 12, XP 4 820.
- Hardware brand references: "HB-LINK 3" VCI (BT 5.2), "HB-T14 target board".
