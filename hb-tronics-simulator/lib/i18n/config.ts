/** i18n configuration (14 §1). English default; Arabic RTL; French LTR. */
export const locales = ["en", "ar", "fr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/**
 * `en-XA` is a hidden pseudo-localization QA locale (14 §18.3), reachable by URL
 * but not offered in the language switcher. Routable but not a shipping Locale.
 */
export const PSEUDO_LOCALE = "en-XA";
export const routableLocales = [...locales, PSEUDO_LOCALE] as const;

/** Text direction per locale (14 §2). */
export function dir(locale: string): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function isRoutableLocale(value: string): boolean {
  return (routableLocales as readonly string[]).includes(value);
}

/** Namespaces loaded from messages/<locale>/<ns>.json (14 §3). */
export const namespaces = [
  "common",
  "shell",
  "login",
  "hub",
  "garage",
  "progress",
  "reports",
  "settings",
  "scanner",
  "multimeter",
  "oscilloscope",
  "location",
  "schematic",
  "content",
] as const;
