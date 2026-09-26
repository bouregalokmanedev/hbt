# 05 — Asset Inventory

All assets are **embedded** in the bundle manifest (base64, some gzip-compressed) and mapped to original paths/URLs by `ext_resources`. Nothing is fetched at runtime. 83 manifest entries total.

> **Update (physical extraction, verified on disk):** the reusable binary/vector assets have now been **physically extracted** from the bundle to `./assets/` (originals, not re-encoded). Section 0 below records the actual filesystem, provenance, usage, and required-flags. Sections 1–6 remain the analytical inventory. The original HTML was not modified.

---

## 0. Physical Extraction — `./assets/` (VERIFIED ON DISK)

**Extracted:** 40 images + 29 fonts + 10 icons + 1 logo = **80 files, ≈ 6.8 MB.**
**Method:** manifest base64 → gunzip (where compressed) → written unchanged. Icons/logo are faithful SVG copies of inline vector data. Decode reproducible via `scripts/extract-bundle.mjs` (per `01`/§this file).

### 0.1 Directory layout
```
assets/
├── README.md
├── images/        (empty — no general UI/marketing/background images exist in source)
├── icons/         10 × SVG   (shell nav/tool glyphs, viewBox 0 0 24 24)
├── svg/            1 × SVG   (brand splash logo)
├── fonts/         29 × woff2 (IBM Plex Mono/Sans/Sans Condensed subsets)
├── simulator/     32 × PNG/JPEG (diagnostic images, assets/-origin)
│   └── ref/        8 × PNG/JPEG (component reference photos, ref/-origin)
├── backgrounds/   (empty — backgrounds are solid CSS colours)
└── other/         (empty — no unreferenced/misc assets)
```

### 0.2 Images — provenance & usage (40 files → `assets/simulator/`)
| Extracted file | Original ref (`ext_resources`) | Type | Used by | Required |
|----------------|-------------------------------|------|---------|----------|
| `simulator/detail-{H3,I2,L1,L3,T1,U2,V1,X1,X7,X8}.png` (10) | `assets/detail-*.png` | PNG | Location — component detail view | Yes |
| `simulator/views-{H3,I2,L1,L3,T1,U2,V1,X1,X7,X8}.png` (10) | `assets/views-*.png` | PNG | Location — "4-view locator" | Yes* (see 0.5 — 1 unique image, 10 refs) |
| `simulator/fusebox-layout.png` | `assets/fusebox-layout.png` | PNG | Location (system view) / fuse box | Yes |
| `simulator/fusebox-location.png` | `assets/fusebox-location.png` | PNG | Location | Yes |
| `simulator/map-ecu.png` | `assets/map-ecu.png` | PNG | Location / Schematic overlay | Yes |
| `simulator/map-ground.png` | `assets/map-ground.png` | PNG | Location / Schematic overlay | Yes |
| `simulator/diagram-r16.png` | `assets/diagram-r16.png` | PNG | Schematic (relay R16) | Yes |
| `simulator/inj-photo.png` | `assets/inj-photo.png` | PNG | Oscilloscope (injector photo) | Yes |
| `simulator/ref-inj-voltage.png` | `assets/ref-inj-voltage.png` | PNG | Oscilloscope injector voltage ref | Yes |
| `simulator/ref-inj-d.png` | `assets/ref-inj-d.png` | PNG | Oscilloscope injector current ref | Yes |
| `simulator/ref-inj-b.png` | `assets/ref-inj-b.png` | PNG | Oscilloscope injector ref (variant) | Yes |
| `simulator/ref-inj-c.png` | `assets/ref-inj-c.png` | PNG | Oscilloscope injector ref (variant) | Yes |
| `simulator/ref-inj-current.png` | `assets/ref-inj-current.png` | PNG | Oscilloscope injector current ref | Yes |
| `simulator/ref-cam-hall.png` | `assets/ref-cam-hall.png` | PNG | Oscilloscope cam Hall ref | Yes |
| `simulator/ref/maf/7.png` | `ref/maf/7.png` | PNG | Multimeter/Location — MAF `L3` | Yes |
| `simulator/ref/throttle/1.png` | `ref/throttle/1.png` | PNG | Multimeter/Location — throttle `H3` | Yes |
| `simulator/ref/app/1.png` | `ref/app/1.png` | PNG | Multimeter/Location — accel pedal `G1` | Yes |
| `simulator/ref/cam/1.png` | `ref/cam/1.png` | PNG | Multimeter/Location — cam `X7` | Yes |
| `simulator/ref/coolant/4.png` | `ref/coolant/4.png` | PNG | Multimeter/Location — coolant `T1` | Yes |
| `simulator/ref/crank/3.png` | `ref/crank/3.png` | PNG | Multimeter/Location — crank `X1` | Yes |
| `simulator/ref/o2/6.png` | `ref/o2/6.png` | PNG | Multimeter/Location — O2 `U1/U2` | Yes |
| `simulator/ref/knock/img.jpeg` | `ref/knock/img.jpeg` | JPEG | Multimeter/Location — knock `I2` | Yes |

All 40 image references in `ext_resources` resolve to a physical file (**0 missing**).

### 0.3 Fonts (29 files → `assets/fonts/`)
Distinct woff2 = **29 / 29** manifest font resources extracted. Naming = `IBM-Plex-<Family>-<weight>-<subset>.woff2` from the source `@font-face` declarations.
| Family | Weights (physically embedded) | Subsets | Count | Required |
|--------|-------------------------------|---------|------:|----------|
| IBM Plex Mono | 400, 500, 600 | latin, latin-ext, cyrillic, cyrillic-ext, vietnamese | 15 | Yes (subset to used weights in Project B) |
| IBM Plex Sans | 400 (+ 500/600/700 declared, see note) | latin, latin-ext, cyrillic, cyrillic-ext, vietnamese, greek | 6 | Yes |
| IBM Plex Sans Condensed | 600, 700 | latin, latin-ext, cyrillic-ext, vietnamese | 8 | Yes |

**Note:** the source stylesheets declare IBM Plex Sans at 400/500/600/700, but Google's subsetter emits **29 distinct physical woff2** total; some weight declarations share the same underlying file, so a filename reflects its *primary* `@font-face` declaration, not an exclusive weight. Project B will self-host via `next/font/local` and subset to the weights it renders (`07`/`10`). Arabic (`14`) will add **IBM Plex Sans Arabic** — **not present in this bundle** and to be sourced separately.

### 0.4 Icons & logo (11 files)
| Extracted file | Original reference | Type | Used by | Required |
|----------------|--------------------|------|---------|----------|
| `icons/{hub,scanner,multimeter,oscilloscope,location,schematic,progress,reports,garage,settings}.svg` (10) | inline `path` data in app source object `I` | SVG (reconstructed, viewBox 0 0 24 24) | Shell rail / module headers | Yes (reusable; or keep as inline path constants per `10` §9) |
| `svg/hb-logo-splash.svg` | outer HTML `#__bundler_thumbnail` splash | SVG (original markup) | Brand / loading splash | Optional (brand mark; login uses text wordmark) |

### 0.5 Duplicates (documented, not fabricated)
- **`simulator/views-*.png` (10) are byte-identical** (same SHA1) — the source stores **1 unique** "4-view locator" placeholder under 10 component names/uuids. All 10 kept so every app reference resolves to a file; **9 are redundant-but-referenced** copies (expect replacement by real art in Project B). No *other* duplicates exist; all other 30 images are unique.
- No duplicate files were created beyond what the source itself references.

### 0.5.1 Current-build wiring review — Final Hardening P6 (2026-08-16)

Audited every extracted image against the code that actually references it (`grep` of `/assets/**` string + dynamic refs across `app/`, `features/`, `data/`). **22 images are extracted-and-documented but not yet wired into the current build's screen/component subset.** Per the hardening rule *"only remove when documentation proves it unnecessary,"* **none were deleted** — each is either a documented screen asset or a documented source-of-truth placeholder. Classification:

| Asset(s) | Count | Referenced now | Classification / decision |
|----------|-------|----------------|---------------------------|
| `views-{H3,I2,L1,L3,T1,U2,V1,X1,X7,X8}.png` | 10 | No | **Redundant placeholder** — verified byte-identical (md5 `2e94ccc3…`), 1 unique + 9 copies, backing the documented "4-view locator" Location sub-view (02/06) that is not built in the current subset. **Keep** as source-of-truth; flagged for de-dup once real per-component art lands. |
| `detail-V1.png`, `detail-X8.png` | 2 | No | **Documented screen asset** (05 §0.2 "Location — component detail", required=Yes) for components not in the current Location hotspot set (`data/location`). **Keep** — wiring these two follows the identical pattern as the 8 live `detail-*`. |
| `ref/cam/1.png`, `ref/coolant/4.png`, `ref/crank/3.png`, `ref/maf/7.png`, `ref/throttle/1.png` | 5 | No | **Documented component ref photos** (05 §0.2 "Multimeter/Location — <component>", required=Yes) for components the current Multimeter/Location subset doesn't surface. **Keep.** |
| `ref-inj-c.png`, `ref-inj-d.png` | 2 | No | **Documented injector reference variants** (the oscilloscope injector component wires `ref-inj-voltage/current/b`; `-c/-d` are further documented variants). **Keep.** |
| `diagram-r16.png`, `inj-photo.png`, `map-ground.png` | 3 | No | **Documented schematic/injector/ground-map imagery** from the extracted bundle; belong to documented detail/schematic states not in the current subset. **Keep** pending their screen. |

Outcome: **0 deleted, 22 retained with corrected provenance.** The prior claim (README note 3 / §0.7-3) that "every `views-*` name is referenced" was **stale** and is corrected here — those names await the 4-view-locator screen. No genuinely-orphaned asset (extracted but absent from all documentation) was found.

### 0.6 Embedded assets intentionally NOT extracted
| Item | Why not a file asset |
|------|----------------------|
| 1×1 transparent spacer GIF (`data:image/gif;base64,R0lGOD…`, 4 uses) | Placeholder spacer, not reusable content. |
| React 18.3.1 / ReactDOM UMD, `dc-runtime` JS | Libraries/framework → Project B uses npm (React 19). |
| 5 × `*.dc.html` sub-apps | Application **code**, not assets (analysed in `01`/`06`). |
| 6 × Google-Fonts CSS stylesheets | Superseded by `next/font/local`; only the woff2 they reference are assets. |
| Multimeter `symbols` glyphs (11) | Inline SVG path data with non-standard viewBox — kept inline (per `10` §9) to avoid guessing dimensions. |

### 0.7 Verification (all pass)
1. **Every referenced asset has a physical file** — 40/40 image refs resolve; 29/29 fonts extracted. ✅
2. **No important embedded asset missed** — completeness sweep of manifest (83 entries) + `data:` URIs + `url()` refs across all 6 decoded documents; only the trivial spacer GIF is uncatalogued (documented above). ✅
3. **No unnecessary duplicates** — only the source's own 10-way identical `views-*` placeholder is retained (required by name); flagged, not fabricated. ✅
4. **`./assets/` is copy-ready for Project B** — originals preserved, provenance recorded, structure matches the target layout. ✅

---

## 1. JavaScript libraries (3)

| Library | Original URL | Decoded size | Role |
|---------|--------------|-------------:|------|
| React | `https://unpkg.com/react@18.3.1/umd/react.production.min.js` | 10.5 KB | UMD React 18.3.1 |
| ReactDOM | `https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js` | 128.7 KB | UMD ReactDOM 18.3.1 |
| dc-runtime | (bundled, no ext URL) `uuid 7475b929…` | 67.5 KB | Custom template-binding runtime "GENERATED from dc-runtime/src/*.ts … `bun run build`" |

**NOT FOUND IN SOURCE:** Babel standalone as a manifest asset — the bootstrap references `window.Babel` defensively (`if (window.Babel) Babel.transformScriptTags()`), but no Babel library appears in the manifest. The `text/x-dc` scripts are interpreted by dc-runtime, not by Babel.

---

## 2. Embedded HTML sub-apps (6, gzip)

| Resource | Original path | Decoded size |
|----------|---------------|-------------:|
| Main template | (`__bundler/template`) | 114.3 KB |
| Scanner | `./Scanner.dc.html` | 189.4 KB |
| Multimeter | `./Multimeter.dc.html` | 107.0 KB |
| Oscilloscope | `./Oscilloscope.dc.html` | 116.2 KB |
| Location | `./Location.dc.html` | 112.8 KB |
| Schematic | `./Schematic.dc.html` | 88.5 KB |

---

## 3. Fonts (27 × woff2)

Font family: **IBM Plex** (self-hosted via inlined Google-Fonts CSS + gstatic woff2).

- **IBM Plex Sans** — weights 400/500/600/700
- **IBM Plex Mono** — weights 400/500/600
- **IBM Plex Sans Condensed** — weights 600/700

Each weight ships multiple unicode-range subsets (latin, latin-ext, cyrillic, cyrillic-ext, greek, vietnamese) → 27 woff2 files (1.3 KB–44.6 KB). Six inlined CSS blobs carry the `@font-face` rules; three are the small `css2?family=…` variants (15–19 KB) and three are large consolidated webfont CSS (~1.0–1.1 MB each).

Original CSS URLs (all IBM Plex families):
`https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&…` (with/without `IBM+Plex+Sans+Condensed`).

---

## 4. Images (41: 40 PNG + 1 JPEG)

Referenced from source across tools. Original paths from `ext_resources`:

### Location / shared reference photos
| Path | Used by |
|------|---------|
| `assets/fusebox-layout.png` | Location (system view), fuse box |
| `assets/fusebox-location.png` | Location |
| `assets/map-ecu.png` | Location / Schematic overlays |
| `assets/map-ground.png` | Location / Schematic overlays |
| `assets/diagram-r16.png` | Schematic / relay R16 |

### Component detail images `assets/detail-*.png`
`detail-I2, detail-X7, detail-X8, detail-L3, detail-T1, detail-U2, detail-V1, detail-X1, detail-L1, detail-H3` (knock, cam×2, MAF, coolant, O2, purge, crank, MAP, throttle).

### Vehicle-view images `assets/views-*.png`
`views-X8, views-L3, views-I2, views-U2, views-V1, views-L1, views-X1, views-T1, views-X7, views-H3` (4-view locators per component).

### Oscilloscope reference/photo images
| Path | Purpose |
|------|---------|
| `assets/inj-photo.png` | Injector component photo |
| `assets/ref-inj-voltage.png` | Injector control-voltage reference trace |
| `assets/ref-inj-d.png` | Injector peak-&-hold current reference |
| `assets/ref-inj-b.png`, `assets/ref-inj-c.png` | Injector reference variants |
| `assets/ref-cam-hall.png` | Cam Hall reference trace |

### Multimeter / Location component ref images `ref/*`
`ref/maf/7.png`, `ref/throttle/1.png`, `ref/app/1.png`, `ref/cam/1.png`, `ref/coolant/4.png`, `ref/crank/3.png`, `ref/o2/6.png`, `ref/knock/img.jpeg`.

> Note: the manifest holds 41 image blobs; `ext_resources` lists ~40 image paths. Several large PNGs (~230 KB) share identical byte sizes (repeated placeholder/vehicle-view art). Exact 1:1 filename→blob confirmation for every image was done via `ext_resources`; any image blob without an `ext_resources` name is an internally-referenced duplicate. Two injector reference variants (`ref-inj-b/c`) are referenced in code but map through `ext_resources` — treated as present.

---

## 5. Inline SVG assets (not files)

Heavily used instead of icon files:
- **Shell icon set `I`** — 10 two-path glyphs (hub, scanner, multimeter, oscilloscope, location, schematic, progress, reports, garage, settings).
- **Scanner nav icons** — 9 inline SVG paths; ECU-network map is fully SVG-drawn; sparklines & graphs are SVG polylines.
- **Multimeter `symbols`** — 11 component glyphs (maf, map, ntc, coil, inj, lambda, knock, ind, hall, pot2, motorpot).
- **Oscilloscope** — graticule + waveform polylines generated from math functions.
- **Schematic** — entire wiring diagram is SVG (nodes + coloured wire polylines), ~55 components / ~140 wires.
- **Bootstrap splash** — inline "HB" logo SVG.

---

## 6. Colours / brand marks

Brand orange **`#F47822`** (logo), dark shell **`#0E1114`**. Full palette in `07_DESIGN_SYSTEM.md`.

**NOT FOUND IN SOURCE:** video, audio, Lottie/JSON animations, icon-font files, favicon file (bootstrap uses inline SVG splash only).
