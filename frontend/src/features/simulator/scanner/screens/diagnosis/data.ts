import { fetchCatalog, type BackendCatalogVariant } from "@/features/simulator/scanner/data/catalog";

/* Diagnosis flow data: brand cards built strictly from the instructor's
    vehicle catalog (server) — no static filler brands — region grouping
    for the tablet's brand grid, and the vehicle profile rows shown in the
    confirm-popup. */

export type RegionKey = "asia" | "china" | "europe" | "america";
export type DiagnosisRegion = RegionKey | "mine";
export type DetectionMode = "auto" | "manual";

export interface VehicleProfileInfo {
    vin: string;
    series: string;
    year: string;
    transmission: string;
}

export interface DiagnosisVariant {
    id: string;
    model: string;
    name: string;
    years: string;
    profile: VehicleProfileInfo;
}

export interface DiagnosisBrand {
    id: string;
    name: string;
    version: string;
    region: RegionKey;
    obd2?: boolean;
    variants: DiagnosisVariant[];
}

/* ---- region grouping by brand name (catalog responses carry no country) ---- */

const REGION_TABLE: Record<RegionKey, string[]> = {
    asia: [
        "ACURA", "DAEWOO", "DAIHATSU", "GENESIS", "HONDA", "HYUNDAI", "INFINITI",
        "ISUZU", "KIA", "LEXUS", "MAHINDRA", "MARUTI", "MAZDA", "MITSUBISHI",
        "NISSAN", "PERODUA", "PROTON", "SSANGYONG", "SUBARU", "SUZUKI", "TATA",
        "TOYOTA",
    ],
    china: [
        "BAIC", "BYD", "CHANGAN", "CHERY", "DONGFENG", "FAW", "GAC", "GEELEY",
        "GEELY", "GREAT WALL", "HAVAL", "HONGQI", "JAC", "LEAPMOTOR", "LYNK & CO",
        "MG", "NIO", "SAIC", "XPENG", "ZEEKR",
    ],
    europe: [
        "ALFA ROMEO", "AUDI", "ASTON MARTIN", "BENTLEY", "BMW", "BUGATTI",
        "CITROEN", "DACIA", "FIAT", "JAGUAR", "LANCIA", "LAND ROVER",
        "MASERATI", "MERCEDES-BENZ", "MINI", "OPEL", "PEUGEOT", "PORSCHE",
        "RENAULT", "ROLLS-ROYCE", "ROVER", "SAAB", "SEAT", "SKODA", "SMART",
        "VAUXHALL", "VOLKSWAGEN", "VOLVO",
    ],
    america: [
        "BUICK", "CADILLAC", "CHEVROLET", "CHRYSLER", "DODGE", "FORD", "GMC",
        "HUMMER", "JEEP", "LINCOLN", "MERCURY", "OLDSMOBILE", "PONTIAC", "RAM",
        "SATURN", "TESLA",
    ],
};

export function regionOf(name: string): RegionKey {
    const u = name.trim().toUpperCase().replace(/\s+/g, " ");
    for (const key of ["asia", "china", "europe", "america"] as const) {
        if (REGION_TABLE[key].includes(u)) return key;
    }
    return "asia";
}

/* ---- generic OBD-II card (pinned first on every region tab) ---- */

export const OBD2_VARIANT: DiagnosisVariant = {
    id: "obd2",
    model: "OBD II",
    name: "Generic",
    years: "—",
    profile: { vin: "—", series: "OBD II", year: "—", transmission: "—" },
};

export const OBD2_BRAND: DiagnosisBrand = {
    id: "obd2",
    name: "OBD II",
    version: "V22.00",
    region: "asia",
    obd2: true,
    variants: [OBD2_VARIANT],
};

/* ---- catalog → brand cards ---- */

function yearText(v: BackendCatalogVariant): string {
    const md = (v.metadata ?? {}) as Record<string, unknown>;
    if (typeof md.modelYear === "string" && md.modelYear) return md.modelYear;
    if (typeof v.year_from === "number") {
        if (typeof v.year_to === "number" && v.year_to !== v.year_from) {
            return `${v.year_from}–${v.year_to}`;
        }
        return String(v.year_from);
    }
    return "—";
}

function toVariant(modelName: string, v: BackendCatalogVariant): DiagnosisVariant {
    const md = (v.metadata ?? {}) as Record<string, unknown>;
    const years = yearText(v);
    return {
        id: `backend:${v.id}`,
        model: modelName,
        name: v.name,
        years,
        profile: {
            vin: typeof md.vin === "string" && md.vin ? md.vin : "—",
            series:
                typeof md.modelSeries === "string" && md.modelSeries
                    ? md.modelSeries
                    : modelName,
            year: years,
            transmission: v.transmission ?? "—",
        },
    };
}

/** Brand cards for the diagnosis grid: ONLY the instructor-built vehicles
    from the server (plus the generic OBD II reader) — the static bench
    dataset never adds vehicles the instructor did not create. */
export async function loadDiagnosisBrands(): Promise<DiagnosisBrand[]> {
    const makes = await fetchCatalog();
    const out: DiagnosisBrand[] = [];

    for (const make of makes) {
        const variants: DiagnosisVariant[] = [];
        let packVersion: string | null = null;
        for (const model of make.models) {
            for (const v of model.variants) {
                const md = (v.metadata ?? {}) as Record<string, unknown>;
                const isCustom = md.custom === true;
                if (v.packs.length === 0 && !isCustom) continue;
                if (!packVersion) {
                    const pack = v.packs.find((p) => p.version);
                    if (pack) packVersion = pack.version;
                }
                variants.push(toVariant(model.name, v));
            }
        }
        if (variants.length === 0) continue;
        out.push({
            id: `make:${make.id}`,
            name: make.name.toUpperCase(),
            version: `V${packVersion ?? "1.0.0"}`,
            region: regionOf(make.name),
            variants,
        });
    }

    out.sort((a, b) => a.name.localeCompare(b.name));
    return [OBD2_BRAND, ...out];
}

/* ---- "My vehicles" — vehicles the student previously opened ---- */

const MY_VEHICLES_KEY = "hbt-scanner-my-vehicles";

export interface SavedVehicle {
    brandId: string;
    brandName: string;
    version: string;
    obd2?: boolean;
    variant: DiagnosisVariant;
}

export function loadMyVehicles(): SavedVehicle[] {
    try {
        const raw = localStorage.getItem(MY_VEHICLES_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as SavedVehicle[]).slice(0, 12) : [];
    } catch {
        return [];
    }
}

export function saveMyVehicle(vehicle: SavedVehicle): void {
    try {
        const rest = loadMyVehicles().filter((v) => v.variant.id !== vehicle.variant.id);
        localStorage.setItem(
            MY_VEHICLES_KEY,
            JSON.stringify([vehicle, ...rest].slice(0, 12)),
        );
    } catch {
        /* storage unavailable — the tab just stays empty */
    }
}

/** Rebuild a brand descriptor for a saved vehicle card. */
export function brandFromSaved(saved: SavedVehicle): DiagnosisBrand {
    return {
        id: saved.brandId,
        name: saved.brandName,
        version: saved.version,
        region: regionOf(saved.brandName),
        obd2: saved.obd2,
        variants: [saved.variant],
    };
}
