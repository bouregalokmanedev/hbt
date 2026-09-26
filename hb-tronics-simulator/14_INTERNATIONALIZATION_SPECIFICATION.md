# 14 — Internationalization (i18n) Specification

**Purpose:** make the rebuilt HB TRONICS Simulator architecture **i18n-ready from day one** for **English (LTR)**, **Arabic (RTL)**, and **French (LTR)** — without redesigning the English UI, without translating content yet, and without duplicating the UI per language.

**Grounding & scope:** the original HTML is the visual source of truth. This spec extends `10_TECHNICAL_ARCHITECTURE.md` / `11_PROJECT_FILE_TREE.md`. No translations are produced here; only the architecture and requirements.

---

## 0. The one rule that governs everything (from the source)

The original already contains the language switcher and its governing principle. In Settings → *Account & shell* → **Interface language** the segmented control is `['EN','AR','TR']` with the hint:

> *"Platform chrome only — technical data stays in English. Arabic and Turkish ship with coverage 2026.9."*

and the shell fires the toast *"… interface ships with coverage 2026.9 — English only in this build."*

Therefore the architecture splits **all user-facing strings into three classes**:

| Class | Translated? | Examples (from source) |
|-------|-------------|------------------------|
| **A — Chrome / UI copy** | **Yes** (EN/AR/FR) | Nav labels, buttons ("Enter the simulator", "Run full scan"), headings, hints, toasts, empty states, settings labels, tab names. |
| **B — Canonical technical data** | **No — stays English/canonical** | DTC codes (`P2118`), ECU codes (`E1`, `B92`), pin numbers, wire colours as data, engine/VIN codes (`1ZR-FE`, `JTNBV58E90J123456`), protocol names (`ISO 15765-4`), measurement values & units (`13.92 V`, `0.3 – 1.8 Ω`), waveform specs. |
| **C — Localizable content** (review F7) | **Yes** (EN/AR/FR), **keyed by data id** | Learner-facing *prose* that lives in the source data/engine layer: DTC "possible cause" text, diagnostic-tree hints & step instructions, fail diagnoses, coach text, training feedback, the AI script, `FAULTDESC` fault descriptions. |

**Class C is the fix for a real i18n defect:** in the source this prose is English literals inside data/engines (`06`), which would leave Arabic/French users reading English instructions under a localized UI. The rule: **data holds the stable `id` + canonical values; the message catalog holds the translatable prose**, addressed by id — e.g. `oscilloscope.fault.{code}.desc`, `scanner.tree.{scenarioId}.step.{n}.hint`, `scanner.dtc.{code}.cause.{i}`. Engines emit `{ id, values }`; the UI resolves prose via keys. Class-B (codes, pins, units, measurements) still never translates.

This split cleanly protects the simulator engines: engine/data layers emit **canonical values + ids only**; the UI localizes both chrome (A) and content prose (C). See `10` §7.2.

> Source note: the original planned **TR (Turkish)**; this requirement replaces the third locale with **FR (French)**. TR is out of scope. The existing `['EN','AR','TR']` control becomes `['EN','AR','FR']`.

---

## 1. Supported Languages

| Locale | Code | Direction | Role | Font (chrome) |
|--------|------|-----------|------|---------------|
| English | `en` | **LTR** | **Default & source of truth** (matches original) | IBM Plex Sans / Mono / Sans Condensed |
| Arabic | `ar` | **RTL** | Full RTL support | IBM Plex Sans Arabic (chrome) + Latin mono for technical values |
| French | `fr` | **LTR** | Full LTR support (text-expansion aware) | IBM Plex Sans / Mono / Sans Condensed |

- `en` is the **fallback** for any missing key in `ar`/`fr`.
- Technical values remain Latin/Western regardless of locale (see §0, §17).

---

## 2. Language Switching Architecture

**Library:** **`next-intl`** (App Router–native, ICU MessageFormat, RTL-friendly, per-request locale, works with React 19 Server/Client Components). No custom i18n runtime.

**Locale routing (extends `10` §3):** add a locale segment.

```
/[locale]/...                     locale ∈ {en, ar, fr}
  /en/hub   /ar/hub   /fr/hub
  /en/tools/scanner ...           (all routes from file 10 nest under [locale])
```

- **Negotiation & default:** `middleware.ts` (next-intl) resolves locale from URL → cookie (`NEXT_LOCALE`) → `Accept-Language` → default `en`.
- **Persistence:** selected locale stored in cookie + `settingsStore.language` (mirrors the source's `set.lang`).
- **Switcher UI (already exists in source):** the Settings *Interface language* segmented control drives the switch; selecting a locale navigates to the same route under the new `[locale]` and updates the cookie. (Optionally also surfaced in the user menu — not required by source.)
- **Document attributes:** root layout sets `<html lang={locale} dir={dir(locale)}>` where `dir('ar') = 'rtl'`, else `'ltr'`.
- **No UI duplication:** one component tree; locale + direction are context/attributes, never forked layouts.

**Provider placement:** `NextIntlClientProvider` in the `[locale]` layout wraps the shell; Server Components read messages via `getTranslations()`.

---

## 3. Translation Key Structure

**Semantic, namespaced keys** (never English text as a key). One namespace per feature area; ICU for interpolation/plurals.

```
messages/
  en/  common.json shell.json login.json hub.json garage.json progress.json
       reports.json settings.json scanner.json multimeter.json
       oscilloscope.json location.json schematic.json
  ar/  (same files)
  fr/  (same files)
```

**Naming convention:** `namespace.section.element[.state]`, camelCase leaves.

```jsonc
// common.json
{
  "action": { "start": "Start", "stop": "Stop", "reset": "Reset",
              "next": "Next", "previous": "Previous", "confirm": "Confirm",
              "cancel": "Cancel", "export": "Export", "close": "Close" },
  "status": { "pass": "Pass", "fault": "Fault", "warning": "Warning",
              "inSpec": "In spec", "outOfSpec": "Out of spec" }
}
// shell.json
{
  "rail": { "hub": "Simulator Hub", "progress": "Progress", "reports": "Reports",
            "garage": "Garage", "settings": "Settings" },
  "context": { "underTest": "Under test", "noComponent": "No component",
               "pick": "Choose a component" },
  "toast": { "contextSet": "Component context set to {name}",
             "vehicleSwitched": "Active vehicle switched to {vehicle}" }
}
// scanner.json
{
  "nav": { "dashboard": "Dashboard", "livedata": "Live Data", "dtcs": "Fault codes" },
  "livedata": { "selectedCount": "{count, plural, one {# parameter} other {# parameters}} selected" }
}
```

Requested canonical examples (`simulator.start`, `.stop`, `.reset`, `.next`, `.previous`) map to `common.action.*` and are reused everywhere — the guiding pattern for the whole app.

**Interpolation:** all dynamic values (component names, counts, vehicle names) pass as ICU arguments — **never string-concatenated**. This directly replaces the source's `'Component context set to ' + c.name` style, which is not translatable.

**Rules**
- **No hardcoded English in any reusable component** (`components/**`, `features/**`). Every visible Class-A string comes from a key.
- **Class-B technical values are passed as data props / ICU args**, not translated (e.g. `t('livedata.reading', { value: '13.92 V' })` where `value` is canonical).
- Keys are stable IDs; English copy can change without renaming keys.

---

## 4. RTL / LTR Architecture

- **Direction source of truth:** `<html dir>` set per locale; components never hardcode `left`/`right`.
- **CSS logical properties everywhere:** `margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `border-inline-*`, `text-align: start/end`.
- **Tailwind:** enable logical utilities (Tailwind v3.3+ `ps-*`/`pe-*`/`ms-*`/`me-*`/`start-*`/`end-*`, `text-start/end`) — **ban** `pl-*/pr-*/left-*/right-*/text-left/right` in reusable components (lint rule). Direction-conditional styling via `rtl:`/`ltr:` variants only where logical props are insufficient.
- **Flex/grid:** rely on `flex-direction` + writing direction to auto-flip; avoid absolute L/R positioning; use `order` sparingly and direction-aware.
- **Transforms:** any `translateX` used for motion/knobs must be sign-flipped in RTL (see §12).
- **Technical canvases are LTR islands** (see §13): wrapped in `dir="ltr"` so their internal coordinates never mirror.

---

## 5. Direction-Aware Layout

- Shell frame (rail + content) flips as a whole: in **RTL the rail is on the right**, content on the left — achieved by `flex-direction` honouring `dir`, not by reordering markup.
- Screen padding `26px 28px 32px` expressed as `padding-block`/`padding-inline` so insets follow direction.
- Alignment tokens use `start/end`; "leading" chrome (icons, badges) sits at inline-start in both directions.
- Overflow/scroll containers use logical scroll; scrollbars follow direction automatically.

---

## 6. Sidebar (Rail) Behavior

- **Position:** inline-start → renders **right in RTL**, left in LTR.
- **Active indicator bar:** on the inline-start edge of the item (flips with direction).
- **Collapse toggle glyph** (`»` collapsed / `«` expanded in source) is **direction-sensitive**: swap glyphs in RTL so the chevrons point the correct way (collapse points toward the screen edge).
- **Width behaviour** (66↔206 px) unchanged; label reveal uses inline sizing.
- **% badges & icons:** icons do not mirror; the numeric `%` badge stays Western numerals, aligned to inline-end of the row.

---

## 7. Navigation Behavior

- **Breadcrumbs** (Scanner): separators (`/`, `›`) reverse order and the chevron flips in RTL; crumb order follows reading direction.
- **Back/forward affordances** (Scanner `back()`, CTA arrows): the arrow glyph flips (see §8); the *action* (which screen is "back") is unchanged.
- **Tab strips** (DTC-detail, Oscilloscope screens/right-tabs, Multimeter tabs, Location/Schematic modes): tab order follows reading direction; active underline unaffected; keyboard arrow-key navigation respects direction.
- **Context-bar tool jumps:** button row order follows direction; enabled/disabled logic unchanged.
- **Focus order / tab index:** follows DOM (which stays logical), so it reads correctly in both directions.

---

## 8. Icons Requiring RTL Handling

**Mirror in RTL** (directional):
- Rail collapse chevrons `»` / `«`.
- Breadcrumb chevrons `›`.
- CTA / navigation arrows: "Enter the simulator →", "Change component →", "Choose a component →", "View 8 fault codes →", "Continue diagnosis →", Progress path arrows.
- Context action `⇄` (swap) and any "next/previous" step arrows.
- Back/forward controls.

**Do NOT mirror** (non-directional — mirroring would corrupt meaning):
- Tool glyphs (`I` set: scanner, multimeter, oscilloscope, location, schematic, hub, progress, reports, garage, settings).
- Status marks (✓, ↓, —, !), component symbols (Multimeter `symbols`), search/settings/user icons.
- **All technical SVGs**: waveforms, ECU network map, wiring diagram, gauges, sparklines, hotspot overlays (see §13).

**Implementation:** a small allow-list (`icons/directional.ts`) marks which icon ids receive `rtl:-scale-x-100`; everything else never flips. Reusable `<Icon>` reads this list.

---

## 9. Tables

Applies to Scanner system list, DTC list, live-data table, history, coverage matrix, garage.
- **Text columns:** `text-align: start`; header order follows direction.
- **Numeric / code / measurement columns (Class-B):** content stays **LTR** and is aligned consistently (e.g. inline-end for magnitudes) — codes like `P2118`, `B92`, `13.92 V` must read left-to-right even inside an RTL table row. Wrap such cells in `dir="ltr"`.
- **Sortable headers:** sort-direction arrows (↑/↓) are vertical → no mirroring; the header label localizes.
- **Column-flip:** achieved by direction, not by reordering the data model.

---

## 10. Forms

Applies to login (email/password), Scanner VIN/search/filter inputs, quiz answers, settings.
- **Labels & help text:** localized, `text-align: start`.
- **Inputs with Latin/technical content** (email, password, **VIN**, search for codes, numeric fields): `dir="ltr"` on the input so caret, selection, and placeholder behave correctly even in an RTL page (bidi isolation).
- **Placeholders:** localized (Class A) unless they show canonical examples (a VIN pattern stays Latin).
- **Validation messages:** localized keys.
- **Checkbox/label order** ("Keep me signed in"): control at inline-start, label follows — flips with direction.

---

## 11. Modals

Applies to component picker, Scanner Clear-codes / Compare, coverage gate, user menu.
- **Alignment & padding:** logical properties; content aligns to `start`.
- **Close button:** inline-end corner in both directions (flips position with direction).
- **Dropdown/menu anchoring** (user menu, filter chips): anchor to inline-start/end appropriately so menus don't overflow the viewport edge in RTL.
- **Overlay/backdrop & shadows:** unchanged (shadows from `07`/`09` are symmetric enough; the elevation shadow offset `0 …` has no horizontal bias).
- **Titles/actions:** localized; primary/secondary button order follows platform reading direction.

---

## 12. Simulator Controls

- **Toggle switches:** knob `translateX(0 → 18px)` becomes **direction-aware** — in RTL the "on" position and knob travel mirror (`translateX(-18px)` or logical equivalent). ON colour/semantics unchanged.
- **Segmented controls / chips:** option order follows reading direction; selected pill styling unchanged.
- **Rotary DMM switch (Multimeter):** a physical dial — **does not localize its rotation**; its **labels** (OFF/VDC/OHM/MA) stay as canonical instrument markings (Class B), only surrounding helper text localizes.
- **Sliders (Oscilloscope trigger level, Scanner graph cursor):** value semantics are tied to the **LTR visualization**, so the **slider track stays LTR** (min→max left→right) even in RTL, to remain consistent with the waveform/graph it controls. Its label localizes; its numeric readout stays Western.
- **Probe drag targets, connect-the-probes puzzle:** operate in the LTR technical canvas (§13) — unmirrored; instruction text localizes.
- **Action bars / buttons** (Run scan, Record, Export, Next/Previous step): labels via `common.action.*`; button-row order follows direction.

---

## 13. Charts & Visualizations (critical rule)

**All technical visualizations remain LTR and are never mirrored**, because they encode physical/electrical reality and, in several cases, real OEM diagram coordinates:

| Visualization | Behaviour in RTL |
|---------------|------------------|
| **Oscilloscope waveforms** | Time axis stays **left→right**; traces, cursors, trigger unmirrored. |
| **Scanner live-data sparklines & multi-signal graph** | Time flows **left→right**; unmirrored. |
| **ECU network map** | Fixed layout/coordinates; unmirrored (pan/zoom unchanged). |
| **Schematic wiring diagram** | Uses real component coordinates & harness netlist (`06`); **must not mirror** — mirroring would invert the diagram vs the real vehicle. |
| **Location image maps / hotspots** | Anchored to photographs; unmirrored (LHD note in source stays as data). |
| **Gauges / progress bars** | Progress-bar *fill* may follow direction if it is a pure UI meter; **data gauges tied to a scale stay LTR**. |

**Implementation:** each canvas/SVG root gets `dir="ltr"`. Only the **surrounding chrome** (titles, axis *labels*, legends, tab names, tooltips) is localized and direction-aware. Legends and tooltips localize their label text but keep canonical values/units.

---

## 14. Responsive Behavior (with i18n)

- The source's **JS width breakpoints** (1080/1120/1200/1250/1330 — `09`/`10`) are **direction-agnostic** and reused unchanged; they hide *inline-end/secondary* chrome, expressed logically so the correct elements hide in RTL.
- **Text expansion (FR/AR) interacts with breakpoints:** longer strings can overflow fixed small widths sooner. Architecture requires **fluid/min-content sizing and truncation with tooltip** on chrome labels rather than fixed pixel widths, so expansion degrades gracefully instead of clipping. (Does not change the breakpoint values; changes how labels fit within them.)
- Tablet/Mobile shell layout remains **NOT DEFINED IN SOURCE** (`09` §11) — i18n does not add one; it only ensures whatever exists is direction-aware.

---

## 15. Arabic Typography Requirements

- **Font:** **IBM Plex Sans Arabic** for Arabic chrome (keeps brand consistency with the Latin IBM Plex families). Fallback: Noto Sans Arabic. IBM Plex Mono has **no Arabic** — acceptable because technical values shown in mono are Latin (Class B).
- **No letter-spacing / tracking on Arabic:** the source applies wide `letter-spacing` (`.06em–.16em`) to uppercase Latin micro-labels. Arabic is a **connected script with no uppercase** — letter-spacing **breaks glyph joins** and must be **disabled for `:lang(ar)`** (reset tracking to `normal`). Uppercase transforms are likewise a no-op/removed for Arabic.
- **Line-height:** Arabic needs more vertical room (diacritics/ascenders); increase line-height for Arabic text presets (the source's tight `/1` labels need a larger min line-box in `ar`).
- **Font size:** Arabic often needs a slightly larger optical size than Latin at the same nominal px for legibility — allow a per-locale type-scale nudge in the Arabic preset (chrome only).
- **Weights:** map to available IBM Plex Sans Arabic weights (400/500/600/700).
- **Numerals:** default to **Western (Latin) digits** in chrome to match technical readings and avoid mixing; optionally support Arabic-Indic digits for pure chrome counts via `Intl` (§17) — but **never** for Class-B technical values.
- **Bidi safety:** wrap any embedded Latin code inside Arabic sentences with bidi isolation (`dir="ltr"` span / `⁦…⁩`) so codes like `P2118` don't reorder.

---

## 16. French Text Expansion Considerations

- Expect **+15–30%** length vs English. The source is dense with fixed small elements (rail label at 206 px, chips, 8.5–12 px buttons).
- **Requirements:**
  - Chrome labels use **min-content / flexible widths + `text-overflow: ellipsis` with a Tooltip** (title) fallback — never hard truncation without recourse.
  - Multi-line wrapping allowed on headings/coach text (`text-wrap: pretty` already used in source login).
  - Buttons/chips size to content (`padding-inline` based) rather than fixed width where possible.
  - Verify longest strings against the responsive breakpoints (a FR label may push the rail/top-bar to hide secondary chrome slightly earlier — acceptable, same mechanism).
- Pseudo-localization (§18) simulates +30–40% to catch overflow before real FR copy exists.

---

## 17. Date / Number Formatting

Two regimes, matching §0:

- **Class A (localized) — via `Intl` / next-intl formatters:**
  - **Dates** in reports/history ("31 Jul 2026", "27 Jul 2026 · 12:18") → `Intl.DateTimeFormat` per locale (fr: `31 juil. 2026`; ar: Arabic month/format, optionally Arabic-Indic digits).
  - **Counts** in chrome ("34 sessions", "{count} parameters") → `Intl.NumberFormat` + ICU plurals (AR has a richer plural system — ICU handles it).
- **Class B (canonical — NOT localized):**
  - **Measurements, specs, readings, ranges** (`13.92 V`, `0.3 – 1.8 Ω`, `2.35 kΩ`, `284 bar`) keep **Western digits, `.` decimal, canonical units** regardless of locale. These are OEM technical values (`06`) and are treated as data, not prose.
  - **Codes / identifiers** (DTCs, ECU pins, VIN, engine codes) are never reformatted.
- **Formatting lives in `lib/format` + next-intl**, so a component asks for a formatted *chrome* value and gets locale-correct output, while technical values pass through untouched.

---

## 18. Future Localization Workflow

1. **Author in keys:** developers add `en` keys as they build; English copy taken verbatim from the source (English remains source of truth). No literal strings in components (lint-enforced).
2. **Message extraction:** script validates that every rendered Class-A string resolves to a key; missing/unused keys reported in CI.
3. **Pseudo-localization locale (`en-XA`)**: auto-generated (accents + ~35% padding + RTL-marker variant) to catch truncation, concatenation, and hardcoded strings **before** real translation.
4. **Translator handoff:** per-namespace JSON (`ar/*.json`, `fr/*.json`) with English source + context notes; ICU placeholders preserved. Class-B glossary marks terms that must stay English.
5. **Fallback:** missing `ar`/`fr` keys fall back to `en`; CI warns on incomplete namespaces.
6. **RTL QA:** run `ar` with visual review of rail-on-right, flipped chevrons, LTR technical islands, table/number alignment, Arabic tracking reset.
7. **Continuous:** keys are stable; adding a locale later = add `messages/<locale>/` + register in the locale list + confirm `dir`. No UI changes.

---

## 19. Impact on the architecture files (`10` / `11`)

**Additions (extend, do not replace):**

```
app/
  [locale]/                     # NEW segment wrapping all (app) & login routes
    layout.tsx                  # <html lang dir>, NextIntlClientProvider
messages/                       # 🟨 translation resources (en/ar/fr × namespaces)
  en/  ar/  fr/                  # chrome (A) + content (C) namespaces; loaded PER ROUTE
                                 #   (lazy-load only the active namespaces, not all tools) (F7/perf)
lib/i18n/
  config.ts                     # locales=['en','ar','fr'], default='en', dir()
  request.ts                    # next-intl getRequestConfig
  format.ts                     # Intl wrappers (Class-A only)
  directional-icons.ts          # RTL-flip allow-list  (§8)
middleware.ts                   # locale negotiation/redirect
styles/
  type.ar.css                   # Arabic presets: no tracking, larger line-height (§15)
tailwind.config.ts              # enable logical utilities; add :lang(ar) tracking reset
```

**Store/data touchpoints:**
- `settingsStore.language` drives the switch (already the source's `set.lang`).
- **Data layer unchanged in substance:** datasets remain canonical/English (Class B). Only `messages/` holds translatable chrome. **Simulation engines and data need no i18n awareness** — they emit canonical values; localization happens strictly in the UI layer. This preserves the `10` §0 separation: i18n is a UI-layer concern bolted to the existing seams, not a cross-cutting rewrite.

**Guarantees**
- One component tree; English UI visually unchanged (LTR `en` renders exactly as the source).
- EN→LTR, AR→RTL, FR→LTR via `<html dir>` + logical CSS + one message catalog — **no UI duplication**.
- Technical fidelity preserved: all engineering data stays English/canonical, exactly as the original states.
