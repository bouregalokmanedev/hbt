import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { namespaces, locales } from "@/lib/i18n/config";

const msgDir = fileURLToPath(new URL("../../messages/", import.meta.url));

function load(locale: string, ns: string): Record<string, unknown> {
  return JSON.parse(readFileSync(`${msgDir}${locale}/${ns}.json`, "utf8"));
}

/** Flatten nested keys to dotted paths for comparison. */
function keys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? keys(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );
}

describe("i18n key coverage", () => {
  it("every namespace JSON parses for all locales", () => {
    for (const locale of locales) {
      for (const ns of namespaces) {
        expect(() => load(locale, ns), `${locale}/${ns}`).not.toThrow();
      }
    }
  });

  it("ar and fr cover every en key (no missing translations)", () => {
    for (const ns of namespaces) {
      const enKeys = keys(load("en", ns)).sort();
      for (const locale of ["ar", "fr"]) {
        const locKeys = new Set(keys(load(locale, ns)));
        const missing = enKeys.filter((k) => !locKeys.has(k));
        expect(missing, `${locale}/${ns} missing: ${missing.join(", ")}`).toEqual([]);
      }
    }
  });

  it("technical Class-B tokens are not translated (codes stay canonical)", () => {
    // Column tags (SCN/DMM/…) are canonical instrument markings, identical across locales.
    for (const locale of locales) {
      const g = load(locale, "garage") as any;
      expect(g.columns.scanner).toBe("SCN");
      expect(g.columns.multimeter).toBe("DMM");
    }
  });
});
