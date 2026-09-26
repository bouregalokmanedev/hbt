# 16 — Full HTML Fidelity Specification (Phase A master)

**Purpose.** Reconstruct the original *HB TRONICS SaaS Simulator (offline).html* as faithfully as possible inside the current Next.js/React architecture. The **original HTML is the primary product source of truth**; docs 01–15 remain the architectural foundation but are **not** the maximum scope. This document indexes the Phase A analysis; it changes **no production code**.

## Companion documents
- **17_ORIGINAL_SCREEN_INVENTORY.md** — every original screen/panel, with match status.
- **18_ORIGINAL_INTERACTION_INVENTORY.md** — every original interaction, with match status.
- **19_ORIGINAL_TOOL_SPECIFICATIONS.md** — per-tool field-level spec.
- **20_CURRENT_VS_ORIGINAL_GAP_ANALYSIS.md** — classified gaps + source conflicts (original wins).
- **21_FULL_RECONSTRUCTION_ROADMAP.md** — 13-phase plan, dependencies, effort, first step.

## How the original was authentically obtained (reproducible, non-destructive)
The offline HTML is a self-decoding bundle: `__bundler/manifest` (uuid→gzip+base64), `ext_resources` (url→uuid), `template`, `page_order`. Decoding (`scripts/extract-bundle.mjs`, read-only on the source) yields **5 tool documents** — `Scanner/Multimeter/Oscilloscope/Location/Schematic.dc.html` — plus the **`dc-runtime`** (`support.js`, needs `window.React`/`ReactDOM`) and React/ReactDOM UMD. A **QA harness** (in scratch, never in the app) serves each `.dc.html` with React injected before `support.js`; Playwright headless renders and screenshots them. Login + Hub render from the main bundle directly. **The original HTML was never modified; no production code was changed for QA.**

## Application map (discovered)
The original is a **full commercial diagnostic-training platform**, not the scoped core the current build implements:

| Tool | Original scope (evidence) |
|------|---------------------------|
| **Scanner** | "Diagnostic Workstation" hub: 3 hero panels + 10 function modules (ADAS, Immobilizer, TPMS, Software Update, ECU Programming, Knowledge Base…), recent sessions, Pro/Training, 11-item rail. |
| **Multimeter** | Physical **rotary-dial DMM** + **drag-drop probes**, clickable wiring diagrams, 6 component tabs, reference chart-tables, 11 components × 6-step procedures (54 steps), score+timer. |
| **Oscilloscope** | **Dark** four-channel lab: procedure checklist (n/7), reference-values table, full readout row, Info/Pinout/Probes/Ref/**AI/Score** tabs, 8 fault states, compare/upload. |
| **Location** | **115-component atlas** across **58 vehicle systems**, 8 category filters, 6 view tabs, search, favourites, Browse/Training/Quiz, rich detail panel + Practise. |
| **Schematic** | Full netlist workspace: **wire tracing + pin tables** (133 rows, 111 ECU pins, connectors A 34/B 77), Study/Trace/Training/Practice/**Exam**, layers, circuit view, column/dock layouts, responsive Desktop/Tablet/Mobile, print/export. |

## Headline conclusion
The current build is a **faithful reproduction of docs 01–15**, which are a **subset** of the original. Across every tool the pattern is identical: *original is a superset; docs captured a subset; current implemented the docs.* No irreconcilable conflicts were found. Reconstruction = **adopt the original's full scope while preserving the current build's net-additive strengths** (EN/AR/FR Class-C localization + drift tests, framework-free engines, InputSource/repository/session seams, RTL, a11y, PWA — none of which exist in the static original).

## Totals (Phase A discovery)
- **Original top-level screens/major states discovered:** ≈ **56** (excluding hundreds of per-component/per-system permutations).
- **Original interaction types discovered:** ≈ **90+**.
- **Current top-level screens:** ~11 (6 shell + 5 tools, each with sub-views).
- **Gap (top-level): ✅ 5 matched · 🟡 26 partial · 🔴 19 missing · ⚠️ 5 materially different.**
- **Estimated reconstruction effort:** app-scale program — **4 XL** tool rebuilds (Scanner/Multimeter/Location/Schematic) + **3 L** (Oscilloscope, interactions, engines) + **4 M** + **2 S**. Not a polish pass.
- **Dependency order:** Shell (done) → tools (engines interleaved) → main-shell rasters → interactions → i18n/RTL → visual QA → functional QA → sign-off.
- **First phase to begin:** **Phase 2 — Scanner** (largest, most-diverged, entry point; establishes the workstation/module patterns the other tools reuse).

## Status
Phase A (analysis + specification) **complete**. No production code modified. Implementation begins at Phase 2 per doc 21, on explicit go-ahead. Until the roadmap completes and the raster matrix is green, the product remains **PRODUCTION-CANDIDATE** for the original-fidelity goal (the current build remains functionally green and production-candidate for its own scope).
