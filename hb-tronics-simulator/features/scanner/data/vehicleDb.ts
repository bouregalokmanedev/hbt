/**
 * Local Diagnostic vehicle database (SC — "LOCAL DIAGNOSTIC / VEHICLE SELECTION").
 * Class-B canonical data: manufacturer names/codes/regions, models, year ranges,
 * engines, transmissions, VINs. All identifiers are canonical (never localized).
 * Mirrors the original's 4-column drill-down (Manufacturer → Model → Year·Engine·
 * Transmission → Profile). The brand list matches the source's visible set.
 */
export type Region = "JP" | "EU";
export interface Variant {
  years: string; // e.g. "2012 – 2026"
  engine: string;
  transmission: string;
}
export interface Model {
  model: string;
  years: string; // model production span
  variants: Variant[];
}
export interface Manufacturer {
  code: string; // 2-letter marque code
  name: string;
  region: Region;
  favourite: boolean;
  models: Model[];
}

export const MANUFACTURERS: Manufacturer[] = [
  {
    code: "TO", name: "Toyota", region: "JP", favourite: true,
    models: [
      { model: "Camry", years: "2012 – 2026", variants: [
        { years: "2018 – 2026", engine: "A25A-FKS 2.5", transmission: "8 AT" },
        { years: "2012 – 2017", engine: "2AR-FE 2.5", transmission: "6 AT" },
      ] },
      { model: "Corolla", years: "2013 – 2026", variants: [
        { years: "2013 – 2018", engine: "1ZR-FE 1.6", transmission: "6 MT" },
        { years: "2016 – 2019", engine: "2ZR-FXE 1.8 Hybrid", transmission: "e-CVT" },
      ] },
      { model: "Hilux", years: "2015 – 2026", variants: [{ years: "2015 – 2026", engine: "2GD-FTV 2.4 D", transmission: "6 AT" }] },
      { model: "Land Cruiser 300", years: "2021 – 2026", variants: [{ years: "2021 – 2026", engine: "V35A-FTS 3.5 TT", transmission: "10 AT" }] },
      { model: "RAV4", years: "2013 – 2026", variants: [{ years: "2013 – 2018", engine: "3ZR-FAE 2.0", transmission: "CVT" }] },
      { model: "Yaris", years: "2014 – 2026", variants: [{ years: "2014 – 2020", engine: "1NR-FE 1.3", transmission: "5 MT" }] },
      { model: "Prado", years: "2010 – 2026", variants: [{ years: "2015 – 2026", engine: "1GD-FTV 2.8 D", transmission: "6 AT" }] },
    ],
  },
  {
    code: "LE", name: "Lexus", region: "JP", favourite: true,
    models: [
      { model: "IS", years: "2013 – 2026", variants: [{ years: "2013 – 2026", engine: "2GR-FKS 3.5", transmission: "8 AT" }] },
      { model: "RX", years: "2015 – 2026", variants: [{ years: "2015 – 2022", engine: "2GR-FKS 3.5", transmission: "8 AT" }] },
    ],
  },
  { code: "HO", name: "Honda", region: "JP", favourite: false, models: [
    { model: "Civic", years: "2016 – 2026", variants: [{ years: "2016 – 2021", engine: "L15B7 1.5 T", transmission: "CVT" }] },
    { model: "CR-V", years: "2017 – 2026", variants: [{ years: "2017 – 2022", engine: "K20C4 1.5 T", transmission: "CVT" }] },
  ] },
  { code: "NI", name: "Nissan", region: "JP", favourite: false, models: [
    { model: "Qashqai", years: "2014 – 2026", variants: [{ years: "2014 – 2021", engine: "MR20DD 2.0", transmission: "CVT" }] },
  ] },
  { code: "MA", name: "Mazda", region: "JP", favourite: false, models: [
    { model: "Mazda3", years: "2013 – 2026", variants: [{ years: "2019 – 2026", engine: "PE-VPS 2.0", transmission: "6 AT" }] },
  ] },
  { code: "SU", name: "Subaru", region: "JP", favourite: false, models: [
    { model: "Forester", years: "2013 – 2026", variants: [{ years: "2018 – 2026", engine: "FB25 2.5", transmission: "CVT" }] },
  ] },
  { code: "VO", name: "Volkswagen", region: "EU", favourite: true, models: [
    { model: "Golf", years: "2012 – 2026", variants: [{ years: "2012 – 2019", engine: "CZCA 1.6 TDI", transmission: "7 DSG" }] },
    { model: "Passat", years: "2014 – 2026", variants: [{ years: "2014 – 2019", engine: "CRLB 2.0 TDI", transmission: "6 DSG" }] },
    { model: "Touareg", years: "2018 – 2026", variants: [{ years: "2018 – 2026", engine: "DFGA 3.0 V6 TDI", transmission: "8 AT" }] },
  ] },
  { code: "AU", name: "Audi", region: "EU", favourite: true, models: [
    { model: "A4", years: "2015 – 2026", variants: [{ years: "2015 – 2023", engine: "DETA 2.0 TDI", transmission: "7 S tronic" }] },
  ] },
  { code: "BM", name: "BMW", region: "EU", favourite: true, models: [
    { model: "320i (G20)", years: "2019 – 2026", variants: [{ years: "2019 – 2026", engine: "B48 2.0 T", transmission: "8 AT" }] },
    { model: "320d (F30)", years: "2011 – 2019", variants: [{ years: "2011 – 2015", engine: "N47D20 2.0 D", transmission: "8 AT" }] },
  ] },
  { code: "ME", name: "Mercedes-Benz", region: "EU", favourite: true, models: [
    { model: "C-Class (W205)", years: "2014 – 2021", variants: [{ years: "2014 – 2018", engine: "OM651 2.1 D", transmission: "7G-Tronic" }] },
  ] },
  { code: "PO", name: "Porsche", region: "EU", favourite: false, models: [
    { model: "Cayenne", years: "2010 – 2026", variants: [{ years: "2017 – 2026", engine: "3.0 V6 T", transmission: "8 Tiptronic" }] },
  ] },
  { code: "SK", name: "Skoda", region: "EU", favourite: false, models: [
    { model: "Octavia", years: "2013 – 2026", variants: [{ years: "2013 – 2020", engine: "CJSA 1.8 TSI", transmission: "7 DSG" }] },
  ] },
  { code: "RE", name: "Renault", region: "EU", favourite: false, models: [
    { model: "Clio", years: "2012 – 2026", variants: [{ years: "2012 – 2019", engine: "H4Bt 0.9 T", transmission: "5 MT" }] },
  ] },
  { code: "PE", name: "Peugeot", region: "EU", favourite: false, models: [
    { model: "308", years: "2013 – 2026", variants: [{ years: "2013 – 2021", engine: "EB2 1.2 T", transmission: "6 EAT" }] },
  ] },
  { code: "CI", name: "Citroën", region: "EU", favourite: false, models: [
    { model: "C4", years: "2010 – 2026", variants: [{ years: "2020 – 2026", engine: "EB2 1.2 T", transmission: "8 EAT" }] },
  ] },
  { code: "FI", name: "Fiat", region: "EU", favourite: false, models: [
    { model: "500", years: "2007 – 2026", variants: [{ years: "2015 – 2026", engine: "0.9 TwinAir", transmission: "5 MT" }] },
  ] },
];

/** Total brand count shown in the search hint (source: "142 brands"). */
export const BRAND_COUNT = 142;

/** Recently-used chips (source order). */
export const RECENT_USED = [
  { code: "TO", name: "Toyota Camry 2.5" },
  { code: "TO", name: "Toyota Camry 2.5" },
  { code: "VO", name: "Volkswagen Touareg 3.0" },
  { code: "BM", name: "BMW 320i (G20)" },
];
