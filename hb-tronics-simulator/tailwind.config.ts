import type { Config } from "tailwindcss";

/**
 * Design tokens reconstructed literally from the decoded original
 * (docs 07_DESIGN_SYSTEM.md and 09_UI_UX_SPECIFICATION.md).
 * No value here is invented — every hex/radius/shadow traces to source.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand & shell (07 §2 / 09 §3.1)
        brand: {
          DEFAULT: "#F47822",
          on: "#1A1206", // text/icon on orange
        },
        shell: {
          bg: "#0E1114", // darkest — app/login background
          card: "#131A26", // dark card/base
          surface: "#14181C", // rail / badges
          raised: "#1B2432", // raised dark (scope)
          text: "#E8EAED",
          textHi: "#F4F6F9",
          dim: "#9AA0A6",
          dim2: "#8C9AAF",
          muted: "#5F6570",
        },
        // Per-module accents (07 §2 / 09 §3.2)
        mod: {
          scanner: "#F47822",
          scannerBg: "#FFF1E4",
          multimeter: "#1F6AE1",
          multimeterBg: "#EAF1FE",
          oscilloscope: "#8B5CF6",
          oscilloscopeBg: "#F2EDFE",
          location: "#0E9F6E",
          locationBg: "#E7F7F0",
          schematic: "#D92D20",
          schematicBg: "#FDECEA",
        },
        // Semantic status (09 §3.3)
        ok: { DEFAULT: "#0B7A3C", mid: "#12A150", bright: "#17A768", bg: "#EDF7F1", bg2: "#F1F8F3" },
        warn: { DEFAULT: "#B4560F", amber: "#F59E0B", deep: "#9A5B06", bg: "#FFF3E8", bg2: "#FFF8EC" },
        fault: { DEFAULT: "#B42318", red: "#D92D20", bright: "#E23D3D", bg: "#FDECEA", bg2: "#FDF2F1" },
        info: { DEFAULT: "#1F6AE1", bg: "#EFF5FE" },
        neutralx: {
          fg: "#8A9099",
          fg2: "#C2C8D0",
          fg3: "#6B7280",
          fg4: "#B6BDC7",
          bg: "#F5F6F7",
          bg2: "#F7F8FA",
        },
        // Light neutrals (09 §3.4)
        ink: "#131A26", // primary dark text on light
        paper: "#FFFFFF",
        paper2: "#FBFCFD",
        warmActive: "#FFF9F4",
        fill: "#F2F3F5",
        fill2: "#F5F6F8",
        line: "#E3E7ED",
        line2: "#D5DCE3",
        line3: "#EFF1F5",
        line4: "#EDEFF1",
      },
      fontFamily: {
        sans: ["var(--font-plex-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
        cond: ["var(--font-plex-cond)", "var(--font-plex-sans)", "sans-serif"],
      },
      borderRadius: {
        // 09 §6 actual values
        DEFAULT: "8px",
        sm: "6px",
        xs: "4px",
        "2xs": "2px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "14px",
        pill: "99px",
      },
      boxShadow: {
        // 09 §7 actual box-shadow values
        seg: "0 1px 2px rgba(19,26,38,.16)",
        raise1: "0 1px 2px rgba(19,26,38,.25)",
        card: "0 6px 20px rgba(19,26,38,.09)",
        panel: "0 12px 30px rgba(19,26,38,.3)",
        menu: "0 12px 32px rgba(19,26,38,.22)",
        modal: "0 24px 60px rgba(19,26,38,.35)",
        focus: "0 0 0 3px rgba(244,120,34,.15)",
      },
      letterSpacing: {
        // 09 §4.3 actual tracking values
        t1: ".06em",
        t2: ".07em",
        t3: ".08em",
        t4: ".1em",
        t5: ".11em",
        t6: ".12em",
        t7: ".14em",
        t8: ".16em",
        tight1: "-.01em",
        tight2: "-.02em",
      },
      transitionTimingFunction: {
        // 09 §12 easings
        smooth: "cubic-bezier(.2,0,0,1)",
        spring: "cubic-bezier(.4,1.4,.5,1)",
      },
    },
  },
  plugins: [],
};

export default config;
