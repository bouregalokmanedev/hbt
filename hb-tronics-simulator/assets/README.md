# /assets/ — Extracted asset bundle (Project B ready)

Physical assets extracted from `HB TRONICS SaaS Simulator (offline).html` (the offline bundle).
All files here are **originals decoded from the bundle manifest** (base64 → gunzip where applicable) — not re-encoded, resized, or converted. Total ≈ 6.8 MB.

The original HTML was **not modified** during extraction.

## Structure
```
assets/
├── images/        (empty — see note 1)
├── icons/         10 shell nav/tool icons (SVG, reconstructed from inline path data — note 2)
├── svg/           1 brand logo (SVG, from the bundle splash)
├── fonts/         29 woff2 (IBM Plex Mono / Sans / Sans Condensed subsets)
├── simulator/     40 diagnostic images (PNG/JPEG) used inside the 5 tools
│   └── ref/       8 component reference photos (original ref/<component>/ paths)
├── backgrounds/   (empty — see note 1)
└── other/         (empty — see note 1)
```

## Notes
1. **Empty dirs are intentional.** This app has no general UI images, no marketing imagery, and no background-image files (backgrounds are solid CSS colours). Every raster asset is diagnostic/simulator content → `simulator/`. The empty `images/`, `backgrounds/`, `other/` folders are kept only to present the requested structure.
2. **`icons/`** are reconstructed from the inline SVG `path` data in the app source (object `I`), viewBox `0 0 24 24`. They are not discrete files in the original (the original renders them inline), but they are faithful 1:1 vector copies and are reusable in Project B.
3. **`simulator/views-*.png` (10 files) are byte-identical** — the source stores one "4-view locator" placeholder under 10 component-specific names (verified: all 10 share md5 `2e94ccc3…`, so they are **1 unique image + 9 redundant copies**). The documented "4-view locator" Location sub-view is **not implemented in the current build** (Location renders the map + `detail-*` component view), so none of the 10 are referenced at runtime today. They are retained as extracted source-of-truth placeholders for that documented screen and are expected to be replaced by real per-component art. See the P6 asset review in `../05_ASSET_INVENTORY.md` §0.6.
4. **Not extracted (by design):** a 1×1 transparent spacer GIF embedded as a `data:` URI (a placeholder, not an asset); React/ReactDOM UMD and `dc-runtime` JS (libraries/framework, not assets — Project B uses npm); the 5 `*.dc.html` sub-apps (code); the Google-Fonts CSS stylesheets (superseded by `next/font/local`).

Full provenance and per-asset "required" flags: see `../05_ASSET_INVENTORY.md`.
