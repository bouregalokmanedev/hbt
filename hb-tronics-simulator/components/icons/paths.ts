/**
 * Inline SVG path sets extracted from the source (05 §5, assets/icons/*.svg).
 * Rendered by <Icon>. viewBox 0 0 24 24, two-path stroke glyphs.
 */
export interface IconGlyph {
  paths: string[];
}

export const icons: Record<string, IconGlyph> = {
  hub: { paths: ["M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"] },
  scanner: {
    paths: [
      "M7.5 3h9a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
      "M9 7.5h6M9 11h4M9 17h6",
    ],
  },
  multimeter: {
    paths: ["M12 5a7 7 0 0 1 7 7H5a7 7 0 0 1 7-7z", "M12 12l4.2-3M6 16.5h12M8 20h8"],
  },
  oscilloscope: {
    paths: ["M3 12h2.6l2-5.4L11 17l2.2-7.4L15.4 14H21", "M3 4h18v16H3z"],
  },
  location: {
    paths: [
      "M12 21s-6.2-5.6-6.2-10.4A6.2 6.2 0 0 1 18.2 10.6C18.2 15.4 12 21 12 21z",
      "M12 12.4a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z",
    ],
  },
  schematic: {
    paths: ["M3 7h4M7 7v10M7 12h5M17 5h4M17 5v6M17 11h-5", "M12 9.5h1.6v5H12z"],
  },
  progress: { paths: ["M4 20V11M9.5 20V5M15 20v-6.5M20.5 20V8", "M2 20h20"] },
  reports: { paths: ["M6.5 3h7l4 4v14h-11z", "M9.5 12h5M9.5 16h3.5"] },
  garage: { paths: ["M3 10.5 12 4.5l9 6V20H3z", "M7 20v-6h10v6"] },
  settings: {
    paths: [
      "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z",
      "M12 2.5v2.4M12 19.1v2.4M4.8 4.8l1.7 1.7M17.5 17.5l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.8 19.2l1.7-1.7M17.5 6.5l1.7-1.7",
    ],
  },
  // Utility glyphs used by shell chrome
  search: { paths: ["M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", "M20 20l-4-4"] },
  close: { paths: ["M6 6l12 12M18 6L6 18"] },
  chevron: { paths: ["M9 5l7 7-7 7"] },
  check: { paths: ["M5 12.5l4.5 4.5L19 7"] },
  plus: { paths: ["M12 5v14M5 12h14"] },
  swap: { paths: ["M7 7h11l-3-3M17 17H6l3 3"] },
  user: { paths: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 20c0-3.3 3.6-5 8-5s8 1.7 8 5"] },
  bolt: { paths: ["M13 2L4 14h6l-1 8 9-12h-6z"] },
};

export type IconId = keyof typeof icons;
