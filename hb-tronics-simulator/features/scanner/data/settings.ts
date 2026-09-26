/**
 * Scanner Settings (SC, doc 17/21). The authentic original is a read-only
 * two-card info panel — VCI Interface (device / firmware / link) and Units and
 * Locale (pressure / temperature / distance). There are NO interactive controls
 * in the source (verified against the original DOM: no <select>/<input>), so this
 * is display-only canonical data. All values are Class-B canonical technical
 * readouts (kept LTR / untranslated); row labels + card headers are chrome.
 */
export interface SettingRow {
  id: string; // content id for the row label (chrome)
  value: string; // Class-B canonical technical value
  ok?: boolean; // render the value in the "good/green" tone (Link signal)
}

/** VCI Interface card — connection + firmware status. */
export const VCI_INTERFACE: SettingRow[] = [
  { id: "device", value: "HB-LINK 3 · SN 3A19-0442" },
  { id: "firmware", value: "2.8.4 · up to date" },
  { id: "link", value: "Bluetooth 5.2 · −48 dBm", ok: true },
];

/** Units and Locale card — measurement unit readouts. */
export const UNITS_LOCALE: SettingRow[] = [
  { id: "pressure", value: "bar" },
  { id: "temperature", value: "°C" },
  { id: "distance", value: "km" },
];
