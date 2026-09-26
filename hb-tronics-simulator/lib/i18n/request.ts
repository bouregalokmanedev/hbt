import { getRequestConfig } from "next-intl/server";
import { defaultLocale, namespaces, isRoutableLocale, PSEUDO_LOCALE } from "./config";
import { pseudoCatalog } from "./pseudo";

/**
 * next-intl request config. Loads every namespace for the active locale and
 * merges them under their namespace key. Missing ar/fr keys fall back to en
 * (14 §18.5) via the merged English base.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isRoutableLocale(requested) ? requested : defaultLocale;

  const load = async (loc: string) => {
    const entries = await Promise.all(
      namespaces.map(async (ns) => {
        try {
          const mod = await import(`../../messages/${loc}/${ns}.json`);
          return [ns, mod.default] as const;
        } catch {
          return [ns, {}] as const;
        }
      }),
    );
    return Object.fromEntries(entries);
  };

  const base = await load(defaultLocale);

  // Pseudo-locale: synthesize from English at request time (14 §18.3).
  if (locale === PSEUDO_LOCALE) {
    const messages: Record<string, any> = {};
    for (const ns of namespaces) messages[ns] = pseudoCatalog((base as any)[ns] ?? {});
    return { locale, messages };
  }

  const active = locale === defaultLocale ? base : await load(locale);

  // Deep-merge active over English fallback, per namespace.
  const messages: Record<string, any> = { ...base };
  for (const ns of namespaces) {
    // Deep per-leaf fallback: any key missing in the active locale falls back to the
    // English base at any nesting depth (14 §18.5). A shallow merge would let a
    // partially-translated object (e.g. content.multimeter.<ref>) shadow its English
    // siblings; the deep merge keeps them. Active values always win at the leaf.
    messages[ns] = deepFallback((base as any)[ns], (active as any)[ns]);
  }

  return { locale, messages };
});

/** Merge `active` over `base`, recursing into plain objects; active leaves win,
 * base fills any key absent from active. Arrays and primitives are taken from
 * active when present, else base. */
function deepFallback(base: any, active: any): any {
  if (active === undefined) return base;
  if (base === undefined) return active;
  if (typeof base !== "object" || base === null || Array.isArray(base) || typeof active !== "object" || active === null || Array.isArray(active)) {
    return active;
  }
  const out: Record<string, any> = { ...base };
  for (const k of Object.keys(active)) out[k] = deepFallback(base[k], active[k]);
  return out;
}
