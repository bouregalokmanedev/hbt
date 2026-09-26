# 20 — Current vs Original Gap Analysis

Compares the current Next.js build against the authentic original (docs 17–19). Classification per item: **Original-only** (in original, not built), **Doc-only** (in docs 01–15, not in original), **Current-only** (built, not in original), **True conflict** (all three disagree). **The original HTML is the final authority for this reconstruction.**

---

## 1. Headline finding
The current app is a **faithful reproduction of docs 01–15**, which are a **scoped analysis/subset** of the original. The original is a **full commercial diagnostic-training platform**; the current build implements a focused core. This is a **scope gap**, not a set of pixel defects — closing it requires new functionality (previously out of scope, now in scope per Phase A's product-direction change).

---

## 2. Screen-level classification (summary; detail in doc 17)

| Area | ✅ matched | 🟡 partial | 🔴 missing | ⚠️ differs |
|------|-----------|-----------|-----------|-----------|
| Shell (Login/Hub) | 2 | — | — | — |
| Shell (Garage/Progress/Reports/Settings) | — | 4 (original-side unrendered) | — | — |
| Scanner | — | 5 | 6 | 1 |
| Multimeter | 1 | 4 | 3 | 1 |
| Oscilloscope | 1 | 5 | 2 | 1 |
| Location | 1 | 4 | 3 | 1 |
| Schematic | — | 4 | 5 | 1 |

**Totals (top-level screens/panels): ✅ 5 · 🟡 26 · 🔴 19 · ⚠️ 5.**

---

## 3. Material differences (Original behavior → Current behavior → Missing → Required)

### Scanner
- **Diagnostic Workstation landing** → current opens a DTC dashboard directly. Missing: 3 hero panels + 10-card function grid + recent sessions + status bar. Required: build SC-01/SC-02/SC-13/SC-14; a Pro/Training toggle.
- **Function modules** (ADAS Calibration, Immobilizer, TPMS, Software Update, ECU Programming, Knowledge Base, Vehicle Coverage) → not implemented. Required: module screens + data (or documented "PRO+ locked" stubs matching the original's own locked ECU Programming card).

### Multimeter
- **Rotary dial + probe drag-drop** → current uses a mode dropdown + click-to-place. Required: rotary component, HTML5 drag-drop probes, pin-seating gate.
- **6 component tabs** (Wiring/ECU pin/Location/Related parts/Repair Manuals/Component info) → only wiring partial. Required: the 5 other tabs + data.
- **Reference chart-tables** (temp↔resistance) → missing. Required: per-step reference tables.

### Oscilloscope
- **Dark theme** → current is light. **True conflict?** No — the original scope workspace is dark; the current light theme is a Current-only deviation. Required: dark scope workspace.
- **Procedure checklist (n/7)** + REFERENCE VALUES table + Compare/upload + AI/Score tabs → missing/partial.

### Location
- **115 components / 58 systems / 8 categories / search / favourites** → current has 8 hotspots, 3 modes, 4 views. Required: full atlas dataset + category/system filters + search + favourites + Practise/Vehicle-views actions.

### Schematic
- **Trace mode + pin tables + Study/Practice/Exam + layers + circuit view + column/dock layouts + print/export** → current is a pan-zoom netlist. Required: pin-table engine, wire tracing, mode set, layer control, responsive layouts.

---

## 4. Conflicts between docs 01–15 and the original
| Item | Classification | Resolution (original wins) |
|------|----------------|----------------------------|
| Login split-screen orange panel | Doc **and** original agreed; current had diverged | Fixed — matches original. |
| Hub "5 in a row + session context + coach + continue-path" | Doc + original agreed; current had diverged | Fixed — matches original. |
| Oscilloscope **dark** workspace | Original = dark; current = light (docs ambiguous) | Adopt dark per original. |
| Scanner "diagnostic workstation" hub | Original-only (docs described the DTC core) | Adopt from original; docs were a subset. |
| Multimeter rotary + drag-drop | Original-only | Adopt from original. |
| Location 115-component atlas | Original-only (docs listed ~8) | Adopt from original. |
| Schematic trace/pin-tables/modes | Original-only | Adopt from original. |
| Class-C localization (EN/AR/FR), engines framework-free, repo/session seams | **Current-only strengths** — not in the static original | **Keep** — architectural value beyond the original. |

**No true irreconcilable conflicts found** — the pattern is consistently "original is a superset; docs captured a subset; current implemented the docs." The reconstruction adopts the original's scope while **retaining** the current build's architecture (framework-free engines, i18n/RTL, tests, seams).

---

## 5. Current-only strengths to preserve
- Full **EN/AR/FR Class-C localization** with drift-guard tests (the original ships English only).
- **Framework-free engines** (packages/sim-*) + InputSource + repository + session seams.
- **RTL** correctness + accessibility (axe-clean) + PWA.
- Reproducible **asset extractor** + this reverse-engineering harness.

These must survive the reconstruction — they are net additions over the original.
