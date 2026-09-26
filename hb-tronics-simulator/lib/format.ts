/**
 * Class-A localized formatting only (14 §17). Class-B technical values
 * (measurements, codes, VIN, units) are NEVER routed through here — they stay
 * canonical Western/English as data.
 */
export function formatDate(value: Date | number | string, locale: string): string {
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export function formatCount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}
