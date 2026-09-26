import localFont from "next/font/local";

/**
 * Self-hosted IBM Plex families from the extracted bundle assets (05 §0.3, 10 §9).
 * Fully offline — zero runtime external requests (QA A).
 *
 * Note (justified deviation): the source bundle physically ships IBM Plex Sans
 * only at weight 400 (05 §0.3); heavier UI weights are produced by the browser's
 * default weight synthesis. Condensed (600/700) and Mono (400/500/600) ship as
 * real weights and are used verbatim for headings and technical readings.
 */
export const plexSans = localFont({
  src: [{ path: "../assets/fonts/IBM-Plex-Sans-400-latin.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-plex-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const plexMono = localFont({
  src: [
    { path: "../assets/fonts/IBM-Plex-Mono-400-latin.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/IBM-Plex-Mono-500-latin.woff2", weight: "500", style: "normal" },
    { path: "../assets/fonts/IBM-Plex-Mono-600-latin.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
  fallback: ["monospace"],
});

/**
 * IBM Plex Sans Arabic (OFL, IBM Corp.) — the family-matching Arabic face for the
 * `ar` locale (14 §15). Only the *Arabic* Unicode subset ships (Latin glyphs keep
 * coming from {@link plexSans}), and only two real weights — 400 for body, 600 for
 * headings — so there are no redundant weight files. `preload: false` keeps these
 * out of the critical path on EN/FR pages: the browser fetches them only when
 * Arabic glyphs are actually rendered (i.e. the `ar` locale). See globals.css,
 * where `html[lang="ar"]` folds `--font-plex-arabic` into the sans/cond stacks.
 */
export const plexArabic = localFont({
  src: [
    { path: "../assets/fonts/IBM-Plex-Sans-Arabic-400-arabic.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/IBM-Plex-Sans-Arabic-600-arabic.woff2", weight: "600 700", style: "normal" },
  ],
  variable: "--font-plex-arabic",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});

export const plexCond = localFont({
  src: [
    { path: "../assets/fonts/IBM-Plex-Sans-Condensed-600-latin.woff2", weight: "600", style: "normal" },
    { path: "../assets/fonts/IBM-Plex-Sans-Condensed-700-latin.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-plex-cond",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const fontVariables = `${plexSans.variable} ${plexMono.variable} ${plexCond.variable} ${plexArabic.variable}`;
