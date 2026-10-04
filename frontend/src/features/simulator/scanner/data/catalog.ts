import { simulatorApi } from "@/features/simulator/api/simulator.api";
import {
    BRANDS,
    DTC_DETAIL,
    HEALTHY_PROFILE,
    LAST_SCAN,
    TREE,
    VEH,
    getVehicleProfile as staticProfile,
    type Dtc,
    type TreeStep,
    type VehicleProfile,
} from "./scanner.data";
import type { DtcDetail } from "./dtc.details";
import type { MeterProcedureComponent } from "@/features/simulator/multimeter/data/multimeter.data";
import { MM_PROCEDURES } from "@/features/simulator/multimeter/data/multimeter.data";
import type { ScopeExercise } from "@/features/simulator/oscilloscope/data/oscilloscope.data";
import { SCOPE_EXERCISES } from "@/features/simulator/oscilloscope/data/oscilloscope.data";
import type { LocComponent } from "@/features/simulator/location/data/location.data";
import { LOC_COMPONENTS } from "@/features/simulator/location/data/location.data";
import type { SchComponent, SchWire, SchTrace } from "@/features/simulator/schematic/data/schematic.data";
import { SCH_COMPONENTS, SCH_WIRES, SCH_TRACES } from "@/features/simulator/schematic/data/schematic.data";

export interface BackendCatalogVariant {
    id: string;
    name: string;
    engine_code: string | null;
    transmission: string | null;
    metadata: {
        vin?: string;
        odometer_km?: number;
        coverage?: Record<string, string>;
    } | null;
    packs: { id: string; code: string; version: string; manifest: unknown[] }[];
}

export interface BackendCatalogMake {
    id: string;
    name: string;
    models: { id: string; name: string; variants: BackendCatalogVariant[] }[];
}

let cache: BackendCatalogMake[] | null = null;
let inflight: Promise<BackendCatalogMake[]> | null = null;

export function fetchCatalog(): Promise<BackendCatalogMake[]> {
    if (cache) return Promise.resolve(cache);
    if (!inflight) {
        inflight = simulatorApi
            .catalog()
            .then((makes) => {
                cache = makes;
                return makes;
            })
            .catch(() => [])
            .finally(() => {
                inflight = null;
            });
    }
    return inflight;
}

export function getCachedCatalog(): BackendCatalogMake[] {
    return cache ?? [];
}

export interface BackendVehicleCard {
    key: string;
    name: string;
    engine: string;
    transmission: string;
    vin: string;
    odometerKm: number;
    coverage: "ok" | "avail" | "none";
}

/** Flatten published backend variants into gate cards for the given tool. Custom vehicles with zero packs appear as healthy (zero faults). */
export function backendVehicleCards(tool: "scanner" | "multimeter" | "oscilloscope" | "location" | "schematic" = "scanner"): BackendVehicleCard[] {
    const cards: BackendVehicleCard[] = [];
    for (const make of getCachedCatalog()) {
        for (const model of make.models) {
            for (const variant of model.variants) {
                const isCustom = (variant.metadata as Record<string, unknown> | null)?.custom === true;
                if (variant.packs.length === 0 && !isCustom) continue;
                const coverage = (variant.metadata?.coverage?.[tool] ?? "avail") as "ok" | "avail" | "none";
                cards.push({
                    key: `backend:${variant.id}`,
                    name: `${make.name} ${model.name} ${variant.name}`,
                    engine: variant.engine_code ?? "—",
                    transmission: variant.transmission ?? "—",
                    vin: variant.metadata?.vin ?? "—",
                    odometerKm: variant.metadata?.odometer_km ?? 0,
                    coverage,
                });
            }
        }
    }
    return cards;
}

function findVariant(id: string): BackendCatalogVariant | null {
    for (const make of getCachedCatalog()) {
        for (const model of make.models) {
            const hit = model.variants.find((v) => v.id === id);
            if (hit) return hit;
        }
    }
    return null;
}

function applyManifest(base: VehicleProfile, manifest: unknown): VehicleProfile {
    if (!Array.isArray(manifest)) return base;
    // Merge EVERY scanner entry in the pack (faultsToManifest emits one entry per fault).
    const entries = manifest.filter(
        (e): e is Record<string, unknown> =>
            !!e && typeof e === "object" && ("nodes" in e || "dtcs" in e || "pids" in e),
    );
    if (entries.length === 0) return base;

    type ScanEntry = {
        nodes?: { id: string; status: VehicleProfile["nodes"][number]["status"]; dtc: number }[];
        dtcs?: (Partial<Dtc> & { code: string; ecu: string; status: Dtc["status"] })[];
        pids?: { id: string; base: number; fault?: boolean }[];
        adasDone?: boolean[];
        /** Instructor-authored DTC dossiers (overview/causes/live/repair). */
        dtcDetails?: Record<string, Partial<DtcDetail>>;
    };

    const nodeMap = new Map(base.nodes.map((n) => [n.id, { ...n }]));
    const pidMap = new Map(base.pids.map((p) => [p.id, { ...p }]));
    let packDtcs: Dtc[] | null = null;
    let adasDone: boolean[] | undefined;
    const detailMap: Record<string, DtcDetail> = { ...(base.dtcDetails ?? {}) };

    for (const raw of entries) {
        const e = raw as ScanEntry;
        for (const n of e.nodes ?? []) {
            const cur = nodeMap.get(n.id);
            if (cur) {
                nodeMap.set(n.id, { ...cur, status: n.status, dtc: n.dtc });
            } else {
                nodeMap.set(n.id, { id: n.id, name: n.id, status: n.status, dtc: n.dtc } as VehicleProfile["nodes"][number]);
            }
        }
        if (e.dtcs !== undefined) {
            packDtcs = packDtcs ?? [];
            for (const d of e.dtcs) {
                packDtcs.push({
                    desc: "",
                    severity: "medium" as const,
                    count: 1,
                    firstKm: 0,
                    lastKm: 0,
                    freezeFrame: false,
                    ...d,
                });
            }
        }
        for (const p of e.pids ?? []) {
            const cur = pidMap.get(p.id);
            if (cur) {
                pidMap.set(p.id, { ...cur, base: p.base, fault: p.fault ?? cur.fault });
            } else {
                pidMap.set(p.id, { id: p.id, base: p.base, fault: p.fault } as VehicleProfile["pids"][number]);
            }
        }
        if (Array.isArray(e.adasDone)) adasDone = e.adasDone;
        if (e.dtcDetails && typeof e.dtcDetails === "object") {
            for (const [code, detail] of Object.entries(e.dtcDetails)) {
                if (detail && typeof detail === "object") {
                    detailMap[code] = { ...(detailMap[code] ?? ({} as DtcDetail)), ...(detail as DtcDetail) };
                }
            }
        }
    }

    return {
        nodes: Array.from(nodeMap.values()),
        // Pack dtcs replace base when the pack defines them (custom base is already []); otherwise keep base.
        dtcs: packDtcs ?? [...base.dtcs],
        pids: Array.from(pidMap.values()),
        adasDone: adasDone ?? [...base.adasDone],
        ...(Object.keys(detailMap).length > 0 ? { dtcDetails: detailMap } : {}),
    };
}

export interface TrainingStep {
    id: string;
    screen: string;
    label?: string;
    /** Per-step question — each step can ask something different. */
    question?: string;
    /** Per-step answers (exactly 4) — falls back to session-level options. */
    options?: [string, string, string, string];
    /** Per-step correct answer index 0–3 — falls back to session correctIndex. */
    correctIndex?: number;
}

export interface TrainingSession {
    id: string;
    title: string;
    description?: string;
    steps: TrainingStep[];
    /** Fallback diagnosis options when a step carries none. */
    options?: [string, string, string, string];
    correctIndex?: number;
    hintBudget?: number;
    passScore?: number;
    weights?: { accuracy: number; process: number; time: number };
}

function normalizeStepOptions(raw: unknown): [string, string, string, string] | undefined {
    if (!Array.isArray(raw) || raw.length !== 4 || raw.some((o) => typeof o !== "string" || !o)) return undefined;
    return raw as [string, string, string, string];
}

function normalizeSession(raw: unknown): TrainingSession | null {
    if (!raw || typeof raw !== "object") return null;
    const s = raw as Record<string, unknown>;
    if (typeof s.id !== "string" || !s.id || typeof s.title !== "string" || !s.title) return null;
    const sessionOptions = normalizeStepOptions(s.options);
    const sessionCorrect = typeof s.correctIndex === "number" && s.correctIndex >= 0 && s.correctIndex <= 3 ? s.correctIndex : undefined;
    const steps = Array.isArray(s.steps)
        ? (s.steps as unknown[])
            .filter((st): st is Record<string, unknown> => !!st && typeof st === "object")
            .filter((st) => typeof st.id === "string" && st.id)
            .map((st) => ({
                id: st.id as string,
                screen: typeof st.screen === "string" && st.screen ? (st.screen as string) : "training",
                label: typeof st.label === "string" ? st.label : undefined,
                question: typeof st.question === "string" && st.question ? (st.question as string) : undefined,
                options: normalizeStepOptions(st.options),
                correctIndex:
                    typeof st.correctIndex === "number" && (st.correctIndex as number) >= 0 && (st.correctIndex as number) <= 3
                        ? (st.correctIndex as number)
                        : undefined,
            }))
        : [];
    // Legacy sessions require session-level Q&A; new ones may put Q&A on every step.
    if (!sessionOptions && steps.every((st) => !st.options)) return null;
    const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
    const weights = s.weights as Record<string, unknown> | undefined;
    const w = weights && typeof weights === "object" ? weights : undefined;
    return {
        id: s.id,
        title: s.title,
        description: typeof s.description === "string" ? s.description : undefined,
        steps,
        options: sessionOptions,
        correctIndex: sessionCorrect,
        hintBudget: num(s.hintBudget),
        passScore: num(s.passScore),
        weights:
            w && num(w.accuracy) !== undefined && num(w.process) !== undefined && num(w.time) !== undefined
                ? { accuracy: num(w.accuracy)!, process: num(w.process)!, time: num(w.time)! }
                : undefined,
    };
}

/** The vehicle's training session — most recent pack first (one session per vehicle). */
export function getTrainingSession(key: string): TrainingSession | null {
    if (!key.startsWith("backend:")) return null;
    const variant = findVariant(key.slice("backend:".length));
    if (!variant) return null;
    for (let p = variant.packs.length - 1; p >= 0; p--) {
        const manifest = variant.packs[p].manifest;
        if (!Array.isArray(manifest)) continue;
        for (const entry of manifest) {
            if (!entry || typeof entry !== "object") continue;
            const list = (entry as { trainingSessions?: unknown }).trainingSessions;
            if (!Array.isArray(list)) continue;
            for (const raw of list) {
                const session = normalizeSession(raw);
                if (session) return session;
            }
        }
    }
    return null;
}

function normalizeTree(raw: unknown): TreeStep[] | null {
    if (!Array.isArray(raw)) return null;
    const steps = raw
        .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
        .filter((s) => typeof s.id === "string" && s.id)
        .map((s) => ({
            id: s.id as string,
            label: typeof s.label === "string" && s.label ? (s.label as string) : (s.id as string),
            measure: typeof s.measure === "string" ? (s.measure as string) : "—",
            expected: typeof s.expected === "string" ? (s.expected as string) : "—",
            ok: s.ok === true,
            terminal: s.terminal === true ? true : undefined,
        }));
    return steps.length > 0 ? steps : null;
}

/** Instructor-authored fault tree from the vehicle's pack (most recent first). */
export function getPackTree(key: string): TreeStep[] | null {
    if (!key.startsWith("backend:")) return null;
    const variant = findVariant(key.slice("backend:".length));
    if (!variant) return null;
    for (let p = variant.packs.length - 1; p >= 0; p--) {
        const manifest = variant.packs[p].manifest;
        if (!Array.isArray(manifest)) continue;
        for (const entry of manifest) {
            if (!entry || typeof entry !== "object") continue;
            const tree = normalizeTree((entry as { tree?: unknown }).tree);
            if (tree) return tree;
        }
    }
    return null;
}

function healthyTree(): TreeStep[] {
    return [
        { id: "supply", label: "Check system supply voltage", measure: "13.92 V", expected: "> 12.0 V", ok: true },
        { id: "ground", label: "Verify ground continuity", measure: "0.1 Ω", expected: "< 1.0 Ω", ok: true },
        { id: "can", label: "Confirm bus communication", measure: "No U-codes", expected: "Bus healthy", ok: true },
        { id: "system", label: "Full system health check", measure: "Pass", expected: "All systems OK", ok: true, terminal: true },
    ];
}

function deriveTreeFromProfile(profile: VehicleProfile): TreeStep[] {
    const severityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const primary =
        [...profile.dtcs].sort((a, b) => (severityRank[a.severity] ?? 3) - (severityRank[b.severity] ?? 3))[0] ??
        profile.dtcs[0];
    if (!primary) return healthyTree();

    const detail = DTC_DETAIL[primary.code];
    const faultPids = profile.pids.filter((p) => p.fault);
    const steps: TreeStep[] = [
        {
            id: "supply",
            label: `Check supply voltage at ${primary.ecu}`,
            measure: "13.90 V",
            expected: "> 12.0 V",
            ok: true,
        },
        {
            id: "ground",
            label: `Ground reference at ${primary.ecu}`,
            measure: "0.2 Ω",
            expected: "< 1.0 Ω",
            ok: true,
        },
        {
            id: "signal",
            label: `Signal path for ${primary.code} (${primary.ecu})`,
            measure: "In range",
            expected: "Within specification",
            ok: true,
        },
    ];

    if (detail?.liveExpected?.length) {
        for (const le of detail.liveExpected) {
            steps.push({
                id: `pid-${le.pid.replace(/\s+/g, "-").toLowerCase()}`,
                label: `Measure ${le.pid}`,
                measure: le.measured,
                expected: le.expected,
                ok: le.ok,
                terminal: le.ok ? undefined : true,
            });
        }
    } else if (faultPids.length > 0) {
        for (const p of faultPids.slice(0, 2)) {
            steps.push({
                id: `pid-${p.id.toLowerCase()}`,
                label: `Measure ${p.name}`,
                measure: `${p.base} ${p.unit}`,
                expected: p.spec,
                ok: false,
                terminal: true,
            });
            break;
        }
    } else {
        steps.push({
            id: "confirm",
            label: `Confirm root cause for ${primary.code}`,
            measure: "Out of specification",
            expected: "Within specification",
            ok: false,
            terminal: true,
        });
    }

    if (!steps.some((s) => s.terminal || !s.ok)) {
        const last = steps[steps.length - 1];
        steps[steps.length - 1] = { ...last, ok: false, terminal: true };
    }
    if (!steps.some((s) => s.terminal)) {
        const failIdx = steps.findIndex((s) => !s.ok);
        if (failIdx >= 0) steps[failIdx] = { ...steps[failIdx], terminal: true };
        else {
            const last = steps[steps.length - 1];
            steps[steps.length - 1] = { ...last, terminal: true };
        }
    }
    return steps;
}

/**
 * Vehicle-aware fault tree: instructor pack tree wins, otherwise derive from
 * the vehicle's primary DTC / fault PIDs so each vehicle gets a distinct path.
 */
export function resolveTreeSteps(profile: VehicleProfile, packTree?: TreeStep[] | null): TreeStep[] {
    if (packTree && packTree.length > 0) return packTree;
    // Built-in Corolla P2118 bench keeps the authored 7-step path when it has faults matching TREE.
    if (profile.dtcs.some((d) => d.code === "P2118") && profile.pids.some((p) => p.fault && p.id === "FRP")) {
        return TREE;
    }
    return deriveTreeFromProfile(profile);
}

/** Built-in scenario-12 content used when no instructor session exists. */
export const DEFAULT_TRAINING_OPTIONS: [string, string, string, string] = [
    "Restricted fuel filter",
    "HP pump failure",
    "Injector leak",
    "MAP sensor",
];
export const DEFAULT_TRAINING_CORRECT = 0;
export const DEFAULT_TRAINING_WEIGHTS = { accuracy: 92, process: 88, time: 76 };

/** True once the backend catalogue has been fetched at least once. */
export function isCatalogWarm(): boolean {
    return cache !== null;
}

/**
 * Resolve any lab vehicle key to its fault profile. Backend keys
 * (`backend:<uuid>`) merge the variant's first published pack over the
 * static base; static keys use the built-in profiles. Returns null when a
 * backend key cannot be resolved yet (catalogue still loading) — callers
 * must wait for a warm catalogue instead of falling back silently.
 */
export function resolveVehicleProfile(key: string): VehicleProfile | null {
    if (key.startsWith("backend:")) {
        if (!isCatalogWarm()) return null;
        const variant = findVariant(key.slice("backend:".length));
        if (!variant) return null;
        // Custom vehicles with no pack yet → healthy full copy (21 ECUs, 0 DTCs), not corolla's 8 DTCs
        if (variant.packs.length === 0) {
            return HEALTHY_PROFILE;
        }
        // Most recent pack that contains scanner data takes precedence (instructor's custom over seeder demo)
        let manifest: unknown = null;
        for (let i = variant.packs.length - 1; i >= 0; i--) {
            const m = variant.packs[i].manifest;
            if (Array.isArray(m) && m.some((e: unknown) => { const rec = e as Record<string, unknown>; return rec && typeof rec === "object" && ("nodes" in rec || "dtcs" in rec || "pids" in rec); })) {
                manifest = m;
                break;
            }
        }
        if (!manifest) manifest = variant.packs[variant.packs.length - 1].manifest;
        const isCustom = (variant as unknown as { metadata?: Record<string, unknown> }).metadata?.custom === true;
        const base = isCustom ? HEALTHY_PROFILE : staticProfile("corolla");
        return applyManifest(base, manifest);
    }
    return staticProfile(key);
}

/** Lab-specific manifest resolvers — search packs most-recent-first for the requested tool key. */
function findPackEntry(vehicleKey: string, key: string): Record<string, unknown> | null {
    if (!vehicleKey.startsWith("backend:")) return null;
    if (!isCatalogWarm()) return null;
    const variant = findVariant(vehicleKey.slice("backend:".length));
    if (!variant) return null;
    for (let p = variant.packs.length - 1; p >= 0; p--) {
        const manifest = variant.packs[p].manifest;
        if (!Array.isArray(manifest)) continue;
        for (let i = manifest.length - 1; i >= 0; i--) {
            const entry = manifest[i];
            if (!entry || typeof entry !== "object") continue;
            const rec = entry as Record<string, unknown>;
            if (key in rec && Array.isArray(rec[key]) && (rec[key] as unknown[]).length > 0) return rec;
            if (key === "schematic" && (Array.isArray(rec.components) || Array.isArray(rec.wires) || Array.isArray(rec.traces))) return rec;
        }
    }
    return null;
}

export function getMultimeterProceduresForVehicle(vehicleKey: string): MeterProcedureComponent[] | null {
    const entry = findPackEntry(vehicleKey, "procedures");
    const list = entry?.procedures as unknown[] | undefined;
    if (!Array.isArray(list) || list.length === 0) return null;
    const packProcs = list.filter((p): p is MeterProcedureComponent => !!p && typeof p === "object" && "ref" in (p as Record<string, unknown>) && "steps" in (p as Record<string, unknown>));
    if (!packProcs.length) return null;
    // New vehicle = healthy full copy (all 11) + pack's procedures (new or override). Don't display only the pack.
    const map = new Map(MM_PROCEDURES.map((p) => [p.ref, p]));
    for (const proc of packProcs) map.set(proc.ref, proc);
    return Array.from(map.values());
}

export function getScopeExercisesForVehicle(vehicleKey: string): ScopeExercise[] | null {
    const entry = findPackEntry(vehicleKey, "exercises");
    const list = entry?.exercises as unknown[] | undefined;
    if (!Array.isArray(list) || list.length === 0) return null;
    const packEx = list.filter((e): e is ScopeExercise => !!e && typeof e === "object" && "id" in (e as Record<string, unknown>));
    if (!packEx.length) return null;
    const hydrated = packEx.map((ex) => {
        if (typeof (ex as unknown as { fn?: unknown }).fn === "function") return ex;
        const template = SCOPE_EXERCISES.find((s) => s.id === ex.id);
        return template ? { ...template, ...ex, fn: (ex as unknown as { fn?: unknown }).fn ?? template.fn } : ex;
    }).filter(Boolean) as ScopeExercise[];
    const map = new Map(SCOPE_EXERCISES.map((e) => [e.id, e]));
    for (const ex of hydrated) map.set(ex.id, ex);
    return Array.from(map.values());
}

export function getLocationComponentsForVehicle(vehicleKey: string): LocComponent[] | null {
    const entry = findPackEntry(vehicleKey, "components") ?? findPackEntry(vehicleKey, "locationComponents");
    if (!entry) return null;
    const list = (entry.components ?? (entry as Record<string, unknown>).locationComponents) as unknown[] | undefined;
    if (!Array.isArray(list) || list.length === 0) return null;
    const packComps = list.filter((c): c is LocComponent => !!c && typeof c === "object" && "key" in (c as Record<string, unknown>));
    if (!packComps.length) return null;
    const map = new Map(LOC_COMPONENTS.map((c) => [c.key, c]));
    for (const comp of packComps) map.set(comp.key, comp);
    return Array.from(map.values());
}

export function getSchematicDataForVehicle(vehicleKey: string): { components: SchComponent[]; wires: SchWire[]; traces: SchTrace[] } | null {
    const entry = findPackEntry(vehicleKey, "schematic");
    if (!entry) return null;
    const comps = entry.components as unknown[] | undefined;
    const wires = entry.wires as unknown[] | undefined;
    const traces = entry.traces as unknown[] | undefined;
    if (!Array.isArray(comps) && !Array.isArray(wires) && !Array.isArray(traces)) return null;
    // Merge on top of healthy full copy so the lab is complete, not empty
    const compMap = new Map(SCH_COMPONENTS.map((c) => [c.key, c]));
    if (Array.isArray(comps)) for (const c of comps.filter((x): x is SchComponent => !!x && typeof x === "object" && "key" in (x as Record<string, unknown>))) compMap.set((c as SchComponent).key, c as SchComponent);
    const wireMap = new Map(SCH_WIRES.map((w) => [w.ecuPin + "|" + w.target + "|" + w.targetPin, w]));
    if (Array.isArray(wires)) for (const w of wires.filter((x): x is SchWire => !!x && typeof x === "object" && "ecuPin" in (x as Record<string, unknown>))) wireMap.set((w as SchWire).ecuPin + "|" + (w as SchWire).target + "|" + (w as SchWire).targetPin, w as SchWire);
    const traceMap = new Map(SCH_TRACES.map((t) => [t.id, t]));
    if (Array.isArray(traces)) for (const t of traces.filter((x): x is SchTrace => !!x && typeof x === "object" && "id" in (x as Record<string, unknown>))) traceMap.set((t as SchTrace).id, t as SchTrace);
    return {
        components: Array.from(compMap.values()),
        wires: Array.from(wireMap.values()),
        traces: Array.from(traceMap.values()),
    };
}

/** Display name for any lab vehicle key (static or backend). */
export function vehicleDisplayName(key: string): string {
    if (key.startsWith("backend:")) {
        const variant = findVariant(key.slice("backend:".length));
        if (variant) return variant.name;
    }
    return key;
}

/** Short human label for the lab chrome, e.g. "Toyota Corolla 1ZR-FE". */
export function practiceCarName(key: string): string {
    if (key.startsWith("backend:")) {
        const variant = findVariant(key.slice("backend:".length));
        if (variant) return variant.engine_code ? `${variant.name} · ${variant.engine_code}` : variant.name;
        return key;
    }
    const vehicle = VEH.find((v) => v.id === key);
    if (!vehicle) return key;
    const words = vehicle.name.split(" ");
    const model = words.length >= 2 ? `${words[0]} ${words[1]}` : vehicle.name;
    return vehicle.engine ? `${model} ${vehicle.engine}` : model;
}

export interface LabVehicleFacts {
    title: string;
    meta: string;
}

/** Title + meta line for the workspace vehicle strip, resolved per vehicle. */
export function vehicleFacts(key: string): LabVehicleFacts {
    if (key.startsWith("backend:")) {
        const variant = findVariant(key.slice("backend:".length));
        if (variant) {
            const km = variant.metadata?.odometer_km ?? 0;
            return {
                title: variant.name,
                meta: `${variant.metadata?.vin ?? "—"} · ${km.toLocaleString()} km · ${LAST_SCAN}`,
            };
        }
        return { title: key, meta: LAST_SCAN };
    }
    const vehicle = VEH.find((v) => v.id === key);
    if (!vehicle) return { title: key, meta: LAST_SCAN };
    let years = "";
    for (const brand of BRANDS) {
        for (const model of brand.models) {
            const hit = model.variants.find((v) => v.engine === vehicle.engine);
            if (hit) {
                years = ` · ${hit.years}`;
                break;
            }
        }
        if (years) break;
    }
    return {
        title: `${vehicle.name}${years}`,
        meta: `VIN ${vehicle.vin} · ${vehicle.odometerKm.toLocaleString()} km · ${LAST_SCAN}`,
    };
}
