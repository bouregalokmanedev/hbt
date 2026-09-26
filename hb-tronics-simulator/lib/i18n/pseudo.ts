/**
 * Pseudo-localization (14 §18.3). Generates an `en-XA` catalog from English to
 * catch truncation, string concatenation and hardcoded strings before real
 * translation. Accents letters and pads ~40% while preserving ICU placeholders
 * (`{name}`, `{count, plural, ...}`) and non-letter tokens.
 */
const MAP: Record<string, string> = {
  a: "á", b: "ƀ", c: "ç", d: "ð", e: "é", f: "ƒ", g: "ĝ", h: "ĥ", i: "í", j: "ĵ",
  k: "ķ", l: "ł", m: "ɱ", n: "ñ", o: "ó", p: "þ", q: " q", r: "ř", s: "š", t: "ť",
  u: "ú", v: "v", w: "ŵ", x: "x", y: "ý", z: "ž",
  A: "Á", B: "Ɓ", C: "Ç", D: "Ð", E: "É", F: "Ƒ", G: "Ĝ", H: "Ĥ", I: "Í", J: "Ĵ",
  K: "Ķ", L: "Ł", M: "Ϻ", N: "Ñ", O: "Ó", P: "Þ", Q: "Q", R: "Ř", S: "Š", T: "Ť",
  U: "Ú", V: "V", W: "Ŵ", X: "X", Y: "Ý", Z: "Ž",
};

/**
 * Pseudo-localize a single string. Only letters OUTSIDE any `{…}` ICU segment
 * are accented — brace depth is tracked so nested plural/select messages
 * (`{count, plural, one {…} other {…}}`) are preserved verbatim.
 */
export function pseudoString(input: string): string {
  let depth = 0;
  let letters = 0;
  let body = "";
  for (const ch of input) {
    if (ch === "{") depth++;
    else if (ch === "}") depth = Math.max(0, depth - 1);
    if (depth === 0 && ch !== "{" && ch !== "}" && MAP[ch]) {
      body += MAP[ch];
      letters++;
    } else {
      body += ch;
    }
  }
  // Pad to simulate ~40% expansion (FR/AR growth) without touching placeholders.
  const pad = "·".repeat(Math.max(1, Math.round(letters * 0.4)));
  return letters > 0 ? `${body}${pad}` : body;
}

/** Deep pseudo-localize a message catalog. */
export function pseudoCatalog(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") out[k] = pseudoString(v);
    else if (v && typeof v === "object" && !Array.isArray(v)) out[k] = pseudoCatalog(v as Record<string, unknown>);
    else out[k] = v;
  }
  return out;
}

export const PSEUDO_LOCALE = "en-XA";
