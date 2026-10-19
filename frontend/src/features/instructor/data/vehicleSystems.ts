import { useSyncExternalStore } from "react";

export type SystemKey = "drivetrain" | "chassis" | "body";

export const SYSTEM_KEYS: readonly SystemKey[] = ["drivetrain", "chassis", "body"];

/** ECUs pre-seeded into the drivetrain system (matches a BMW-style scan tree). */
export const DEFAULT_DRIVETRAIN_ECUS: readonly string[] = [
    "Digital Engine Electronics",
    "EKPS",
    "Transmission Control Unit",
    "Car Access System",
    "Gear Selector Switch",
];

/** ECUs pre-seeded into the chassis system (matches a BMW-style scan tree). */
export const DEFAULT_CHASSIS_ECUS: readonly string[] = [
    "Integrated Chassis Management",
    "Stability Control DSC3",
    "Parking Brake",
    "Electronic Power Steering",
];

/** ECUs pre-seeded into the body system (matches a BMW-style scan tree). */
export const DEFAULT_BODY_ECUS: readonly string[] = [
    "Junction Box Electronics",
    "Transfer Box",
    "Crash Safety Module",
    "Allround-view Camera",
    "Central Gateway Module",
    "Parking Assistant",
    "Touchbox",
    "Roof Function Centre",
    "Instrument Panel",
    "Combox Emergency Call",
    "Control Display",
    "MINI Joystick",
    "Rear-lid Module",
    "Seat Memory, Driver",
    "Driver's Side Footwell Module",
    "Air Conditioning System",
];

/** Ordered defaults for a system key; empty for systems with no seed ECUs. */
export function defaultEcusFor(systemKey: SystemKey): readonly string[] {
    switch (systemKey) {
        case "drivetrain":
            return DEFAULT_DRIVETRAIN_ECUS;
        case "chassis":
            return DEFAULT_CHASSIS_ECUS;
        case "body":
            return DEFAULT_BODY_ECUS;
    }
}

export interface EcuInfo {
    systemName: string;
    programmingDate: string;
    manufactureDate: string;
    supplier: string;
    serialNumber: string;
}

export interface EcuDtc {
    id: string;
    code: string;
    desc: string;
    severity: string;
    /** Optional teaching note shown to students under the fault row. */
    note?: string;
}

export interface EcuPid {
    id: string;
    pid: string;
    label: string;
    unit: string;
    base: string;
}

/**
 * Live-data seed for "Digital Engine Electronics" — mirrors the real scan-tool
 * list (names, values and units as shown on the tester). `base` carries the
 * starting value so instructors can manipulate numbers and temperatures.
 */
export const DDE_LIVE_DATA: readonly Omit<EcuPid, "id">[] = [
    // Screenshot 3 — main group
    { pid: "010C", label: "Engine speed", unit: "1/min", base: "2479.75" },
    { pid: "0105", label: "Coolant temperature", unit: "deg C", base: "-46.50" },
    { pid: "015C", label: "Engine oil temperature", unit: "deg C", base: "973.50" },
    { pid: "EMIS_STATUS", label: "Emissions warning light: Status", unit: "", base: "3" },
    { pid: "EMIS_DIST", label: "Emissions warning light: Distance travelled since activation", unit: "km", base: "N/A" },
    { pid: "MIL_STATUS", label: "Status, engine warning light", unit: "", base: "on" },
    { pid: "ENG_RUNTIME", label: "Operating time since engine start", unit: "sec", base: "250.50" },
    { pid: "ENG_HOURS", label: "Operating hour counter", unit: "Min", base: "1818.00" },
    { pid: "ENG_MODE", label: "Operating mode", unit: "", base: "38" },
    // Screenshot 1 — mixture / misfire group
    { pid: "O2_POST", label: "Oxygen sensor after catalytic converter: Air ratio value", unit: "", base: "3.01" },
    { pid: "MF_C2", label: "Misfire, cylinder 2: Counter", unit: "", base: "4113" },
    { pid: "MF_C1", label: "Misfire, cylinder 1: Counter", unit: "", base: "335" },
    { pid: "MF_C3", label: "Misfire, cylinder 3: Counter", unit: "", base: "14500" },
    { pid: "O2_PRE", label: "Oxygen sensor before catalytic converter: Air ratio value", unit: "", base: "0.15" },
    { pid: "MF_C4", label: "Misfire, cylinder 4: Counter", unit: "", base: "753" },
    { pid: "MIX_MULT", label: "multiplicative mixture adaptation", unit: "", base: "1.02" },
    { pid: "VVT_STATUS", label: "Valvetronic: Status", unit: "", base: "13" },
    { pid: "ALT_UTIL", label: "Alternator: Capacity utilization", unit: "%", base: "N/A" },
    // Screenshot 2 — rough running / knock group
    { pid: "RR_C1", label: "Rough running value, cylinder 1", unit: "1/s2", base: "4.45" },
    { pid: "RR_C2", label: "Rough running value, cylinder 2", unit: "1/s2", base: "17.78" },
    { pid: "RR_C3", label: "Rough running value, cylinder 3", unit: "1/s2", base: "0.01" },
    { pid: "RR_C4", label: "Rough running value, cylinder 4", unit: "1/s2", base: "1.34" },
    { pid: "TAP_STATUS", label: "Tapping noise: Status", unit: "", base: "255" },
    { pid: "KNK_C1", label: "Knock signal, cylinder 1", unit: "V", base: "0.89" },
    { pid: "KNK_C2", label: "Knock signal, cylinder 2", unit: "V", base: "48.44" },
    { pid: "KNK_C3", label: "Knock signal, cylinder 3", unit: "V", base: "0.75" },
    { pid: "KNK_C4", label: "Knock signal, cylinder 4", unit: "V", base: "125.41" },
];

/** Per-ECU seed data (keyed by the ECU card title). */
const ECU_SEEDS: Record<string, { liveData?: readonly Omit<EcuPid, "id">[] }> = {
    "Digital Engine Electronics": { liveData: DDE_LIVE_DATA },
};

export interface LiveDataParam {
    pid: string;
    label: string;
    unit: string;
    base: string;
    group: string;
}

/**
 * Curated live-data parameter library shown in the authoring picker. The
 * instructor selects a parameter (prefills PID/label/unit/default value) and
 * can still type fully custom parameters by hand.
 */
export const LIVE_DATA_LIBRARY: readonly LiveDataParam[] = [
    // Engine & mixture
    { pid: "010C", label: "Engine speed", unit: "1/min", base: "2479.75", group: "engine" },
    { pid: "0105", label: "Coolant temperature", unit: "deg C", base: "90.00", group: "engine" },
    { pid: "015C", label: "Engine oil temperature", unit: "deg C", base: "105.00", group: "engine" },
    { pid: "010F", label: "Intake air temperature", unit: "deg C", base: "35.00", group: "engine" },
    { pid: "0142", label: "Battery voltage", unit: "V", base: "14.20", group: "engine" },
    { pid: "0111", label: "Throttle position", unit: "%", base: "18.40", group: "engine" },
    { pid: "0110", label: "Mass air flow", unit: "g/s", base: "12.60", group: "engine" },
    { pid: "010A", label: "Fuel rail pressure", unit: "kPa", base: "45200", group: "engine" },
    { pid: "0107", label: "Long term fuel trim, bank 1", unit: "%", base: "3.10", group: "engine" },
    { pid: "0106", label: "Short term fuel trim, bank 1", unit: "%", base: "-1.60", group: "engine" },
    { pid: "013C", label: "Catalyst temperature, bank 1 sensor 1", unit: "deg C", base: "612.00", group: "engine" },
    { pid: "AMB_TEMP", label: "Ambient temperature", unit: "deg C", base: "24.00", group: "engine" },
    { pid: "010D", label: "Vehicle speed", unit: "km/h", base: "0.00", group: "engine" },
    { pid: "INJ_TIMING", label: "Injection timing", unit: "deg", base: "8.20", group: "engine" },
    { pid: "BOOST", label: "Boost pressure target", unit: "kPa", base: "180.00", group: "engine" },
    // Mixture / air ratio (from the scan tool)
    { pid: "O2_PRE", label: "Oxygen sensor before catalytic converter: Air ratio value", unit: "", base: "0.99", group: "mixture" },
    { pid: "O2_POST", label: "Oxygen sensor after catalytic converter: Air ratio value", unit: "", base: "1.00", group: "mixture" },
    { pid: "MIX_MULT", label: "multiplicative mixture adaptation", unit: "", base: "1.02", group: "mixture" },
    { pid: "MIX_ADD", label: "additive mixture adaptation", unit: "", base: "0.04", group: "mixture" },
    { pid: "VVT_STATUS", label: "Valvetronic: Status", unit: "", base: "13", group: "mixture" },
    { pid: "ALT_UTIL", label: "Alternator: Capacity utilization", unit: "%", base: "42", group: "mixture" },
    // Misfire counters
    { pid: "MF_C1", label: "Misfire, cylinder 1: Counter", unit: "", base: "0", group: "misfire" },
    { pid: "MF_C2", label: "Misfire, cylinder 2: Counter", unit: "", base: "0", group: "misfire" },
    { pid: "MF_C3", label: "Misfire, cylinder 3: Counter", unit: "", base: "0", group: "misfire" },
    { pid: "MF_C4", label: "Misfire, cylinder 4: Counter", unit: "", base: "0", group: "misfire" },
    { pid: "MF_CURRENT", label: "Misfire: Current driving cycle", unit: "", base: "0", group: "misfire" },
    // Rough running
    { pid: "RR_C1", label: "Rough running value, cylinder 1", unit: "1/s2", base: "0.45", group: "rough" },
    { pid: "RR_C2", label: "Rough running value, cylinder 2", unit: "1/s2", base: "0.38", group: "rough" },
    { pid: "RR_C3", label: "Rough running value, cylinder 3", unit: "1/s2", base: "0.52", group: "rough" },
    { pid: "RR_C4", label: "Rough running value, cylinder 4", unit: "1/s2", base: "0.41", group: "rough" },
    // Knock
    { pid: "KNK_C1", label: "Knock signal, cylinder 1", unit: "V", base: "0.85", group: "knock" },
    { pid: "KNK_C2", label: "Knock signal, cylinder 2", unit: "V", base: "0.91", group: "knock" },
    { pid: "KNK_C3", label: "Knock signal, cylinder 3", unit: "V", base: "0.78", group: "knock" },
    { pid: "KNK_C4", label: "Knock signal, cylinder 4", unit: "V", base: "0.88", group: "knock" },
    { pid: "TAP_STATUS", label: "Tapping noise: Status", unit: "", base: "0", group: "knock" },
    // Status / counters
    { pid: "EMIS_STATUS", label: "Emissions warning light: Status", unit: "", base: "0", group: "status" },
    { pid: "EMIS_DIST", label: "Emissions warning light: Distance travelled since activation", unit: "km", base: "0", group: "status" },
    { pid: "MIL_STATUS", label: "Status, engine warning light", unit: "", base: "off", group: "status" },
    { pid: "ENG_RUNTIME", label: "Operating time since engine start", unit: "sec", base: "0.00", group: "status" },
    { pid: "ENG_HOURS", label: "Operating hour counter", unit: "Min", base: "0.00", group: "status" },
    { pid: "ENG_MODE", label: "Operating mode", unit: "", base: "0", group: "status" },
];

export interface EcuActuator {
    id: string;
    name: string;
    description: string;
}

export interface EcuNode {
    id: string;
    name: string;
    info: EcuInfo | null;
    dtcs: EcuDtc[];
    liveData: EcuPid[];
    actuators: EcuActuator[];
}

export interface VehicleSystems {
    variantId: string;
    systems: Record<SystemKey, EcuNode[]>;
    updatedAt: string;
    /** Bumped when seed data changes so old localStorage trees get backfilled. */
    seedVersion?: number;
}

const STORAGE_KEY = "hbt-scanner-vehicle-systems";

/** Current seed data version — bump when adding new seeded content. */
export const SEED_VERSION = 1;

export function makeId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `vs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** A fresh systems tree: every system is pre-seeded with its default ECUs. */
export function defaultSystems(variantId: string): VehicleSystems {
    const build = (key: SystemKey): EcuNode[] =>
        defaultEcusFor(key).map((name) => ({
            id: makeId(),
            name,
            info: null,
            dtcs: [],
            liveData: (ECU_SEEDS[name]?.liveData ?? []).map((pid) => ({ ...pid, id: makeId() })),
            actuators: [],
        }));

    return {
        variantId,
        systems: {
            drivetrain: build("drivetrain"),
            chassis: build("chassis"),
            body: build("body"),
        },
        updatedAt: new Date().toISOString(),
        seedVersion: SEED_VERSION,
    };
}

/** Backfill seeded content into trees saved by older versions (non-destructive). */
function migrateSeeds(all: Record<string, VehicleSystems>): Record<string, VehicleSystems> {
    let changed = false;
    const next: Record<string, VehicleSystems> = {};
    for (const [variantId, tree] of Object.entries(all)) {
        if (!tree?.systems || (tree.seedVersion ?? 0) >= SEED_VERSION) {
            next[variantId] = tree;
            continue;
        }
        const systems = { ...tree.systems };
        for (const key of SYSTEM_KEYS) {
            systems[key] = (systems[key] ?? []).map((ecu) => {
                const seed = ECU_SEEDS[ecu.name]?.liveData;
                if (!seed || ecu.liveData.length > 0) return ecu;
                changed = true;
                return { ...ecu, liveData: seed.map((pid) => ({ ...pid, id: makeId() })) };
            });
        }
        next[variantId] = { ...tree, systems, seedVersion: SEED_VERSION };
        changed = true;
    }
    return changed ? next : all;
}

let cache: Record<string, VehicleSystems> | null = null;
const listeners = new Set<() => void>();

function load(): Record<string, VehicleSystems> {
    if (cache) return cache;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : {};
        cache = parsed && typeof parsed === "object" ? migrateSeeds(parsed as Record<string, VehicleSystems>) : {};
    } catch {
        cache = {};
    }
    return cache;
}

function persist(next: Record<string, VehicleSystems>) {
    cache = next;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // Quota exceeded — keep the in-memory copy so the session still works.
    }
    for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export const vehicleSystemsStore = {
    getSystems(variantId: string): VehicleSystems {
        const all = load();
        if (all[variantId]) return all[variantId];
        // Cache the default in-memory (without notifying) so useSyncExternalStore
        // gets a stable reference across snapshots.
        const def = defaultSystems(variantId);
        all[variantId] = def;
        return def;
    },
    saveSystems(systems: VehicleSystems): void {
        const all = { ...load(), [systems.variantId]: { ...systems, updatedAt: new Date().toISOString() } };
        persist(all);
    },
    mutateSystems(variantId: string, fn: (systems: VehicleSystems) => VehicleSystems): void {
        const current = vehicleSystemsStore.getSystems(variantId);
        vehicleSystemsStore.saveSystems(fn(current));
    },
    /** Test helper: wipe the store between tests. */
    reset(): void {
        cache = null;
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // ignore
        }
        for (const listener of listeners) listener();
    },
};

export function useVehicleSystems(variantId: string): VehicleSystems {
    return useSyncExternalStore(
        subscribe,
        () => vehicleSystemsStore.getSystems(variantId),
        () => vehicleSystemsStore.getSystems(variantId),
    );
}
