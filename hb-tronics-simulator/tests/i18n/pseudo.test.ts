import { describe, it, expect } from "vitest";
import { pseudoString, pseudoCatalog } from "@/lib/i18n/pseudo";

describe("pseudo-localization (en-XA)", () => {
  it("accents letters and expands length", () => {
    const out = pseudoString("Simulator Hub");
    expect(out).not.toBe("Simulator Hub");
    expect(out.length).toBeGreaterThan("Simulator Hub".length); // padded ~40%
  });

  it("preserves ICU placeholders verbatim", () => {
    const out = pseudoString("Component context set to {name}");
    expect(out).toContain("{name}");
  });

  it("preserves plural placeholders", () => {
    const out = pseudoString("{count, plural, one {# parameter} other {# parameters}}");
    expect(out).toContain("{count, plural, one {# parameter} other {# parameters}}");
  });

  it("leaves pure non-letter tokens (codes) unchanged", () => {
    expect(pseudoString("SCN")).not.toBe("SCN"); // letters → accented
    expect(pseudoString("13.92")).toBe("13.92"); // no letters → untouched
  });

  it("deep-transforms a catalog while keeping structure", () => {
    const cat = pseudoCatalog({ a: "Hello", nested: { b: "World {x}" } });
    expect((cat as any).nested.b).toContain("{x}");
    expect((cat as any).a).not.toBe("Hello");
  });
});
