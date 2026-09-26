import { Car, CheckCircle2, Download, Lock, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { readVehicleItem, writeVehicleItem } from "@/features/simulator/lib/vehicleStorage";

import { VEH, type Coverage } from "../data/scanner.data";
import { backendVehicleCards, fetchCatalog, type BackendVehicleCard } from "../data/catalog";

const DOWNLOADED_KEY = "hbt:scanner-downloaded";
const COMING_SOON_KEY = "hbt:gate-coming-soon-target";
const COMING_SOON_MS = 7 * 24 * 60 * 60 * 1000;

type GateKind = "ready" | "download" | "none" | "coming";

interface GateVehicle {
    id: string;
    name: string;
    sub: string;
    vin: string;
    km: number;
    coverage: Coverage;
}

function readDownloaded(): Set<string> {
    try {
        const raw = readVehicleItem(DOWNLOADED_KEY);
        if (!raw) return new Set();
        const parsed: unknown = JSON.parse(raw);
        return new Set(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []);
    } catch {
        return new Set();
    }
}

function writeDownloaded(ids: Set<string>): void {
    try {
        writeVehicleItem(DOWNLOADED_KEY, JSON.stringify([...ids]));
    } catch {
        // Storage unavailable — session-only downloads.
    }
}

function comingSoonTarget(): number {
    const fallback = Date.now() + COMING_SOON_MS;
    try {
        const raw = window.localStorage.getItem(COMING_SOON_KEY);
        if (raw) {
            const n = Number(raw);
            if (Number.isFinite(n) && n > 0) return n;
        }
        window.localStorage.setItem(COMING_SOON_KEY, String(fallback));
        return fallback;
    } catch {
        return fallback;
    }
}

function coverageKind(coverage: Coverage, downloaded: boolean): GateKind {
    if (coverage === "none") return "none";
    if (coverage === "ok") return "ready";
    // "avail" becomes ready once the student downloads the pack.
    return downloaded ? "ready" : "download";
}

function coverageTone(kind: GateKind): string {
    if (kind === "ready") return "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
    if (kind === "download") return "bg-amber-500/15 text-amber-700 dark:bg-amber-300/20 dark:text-amber-300";
    if (kind === "coming") return "bg-[#F47822]/10 text-[#F47822]";
    return "bg-[#3A3A3A]/[.06] text-[#3A3A3A]/40 dark:bg-white/[0.07] dark:text-white/40";
}

function formatRemaining(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
}

function VehicleCard({
    vehicle,
    kind,
    downloading,
    onSelect,
    onDownload,
}: {
    vehicle: GateVehicle;
    kind: GateKind;
    downloading: boolean;
    onSelect: (vehicleId: string) => void;
    onDownload: (vehicleId: string) => void;
}) {
    const { t } = useTranslation();
    const badgeKey =
        kind === "ready" ? "ok" : kind === "download" ? "avail" : "none";
    return (
        <div className="rounded-[20px] border border-[#3A3A3A]/10 bg-white p-4 dark:border-white/10 dark:bg-[#1b1b20]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#3A3A3A] dark:text-white">{vehicle.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[#3A3A3A]/50 dark:text-white/50">{vehicle.sub}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider ${coverageTone(kind)}`}>
                    {t(`simulator.scannerLab.gate.${badgeKey}`)}
                </span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                <span dir="ltr">{vehicle.vin}</span> · <span dir="ltr">{vehicle.km.toLocaleString()} km</span>
            </p>
            {kind === "none" ? (
                <button
                    type="button"
                    disabled
                    aria-disabled
                    title={t("simulator.scannerLab.gate.blocked")}
                    className="mt-3 inline-flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#3A3A3A]/20 bg-[#3A3A3A]/[.04] px-4 py-2.5 text-xs font-black text-[#3A3A3A]/45 dark:border-white/15 dark:bg-white/[0.04] dark:text-white/45"
                >
                    <Lock className="h-4 w-4" />
                    {t("simulator.scannerLab.gate.locked")}
                </button>
            ) : kind === "download" ? (
                <button
                    type="button"
                    onClick={() => onDownload(vehicle.id)}
                    disabled={downloading}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#E96D18] disabled:opacity-70"
                >
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {downloading
                        ? t("simulator.scannerLab.gate.downloading")
                        : t("simulator.scannerLab.gate.downloadAction")}
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => onSelect(vehicle.id)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-black text-white transition hover:bg-black"
                >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {t("simulator.scannerLab.gate.readyAction")}
                </button>
            )}
        </div>
    );
}

function CategoryCard({
    kind,
    titleKey,
    count,
    children,
}: {
    kind: GateKind;
    titleKey: string;
    count?: number;
    children: React.ReactNode;
}) {
    const { t } = useTranslation();
    return (
        <section className="flex min-w-0 flex-col rounded-[22px] border border-[#3A3A3A]/10 bg-[#F8F9FB] p-3 dark:border-white/10 dark:bg-white/[0.03]">
            <header className="mb-3 flex items-center justify-between gap-2 px-1">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider ${coverageTone(kind)}`}>
                    {kind === "none" ? <Lock className="h-3 w-3" /> : kind === "download" ? <Download className="h-3 w-3" /> : kind === "ready" ? <CheckCircle2 className="h-3 w-3" /> : <Car className="h-3 w-3" />}
                    {t(titleKey)}
                </span>
                {typeof count === "number" && (
                    <span className="rounded-full bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-[#3A3A3A]/50 ring-1 ring-[#3A3A3A]/10 dark:bg-white/[0.06] dark:text-white/50 dark:ring-white/10">
                        {count}
                    </span>
                )}
            </header>
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">{children}</div>
        </section>
    );
}

function ComingSoonCard() {
    const { t } = useTranslation();
    const [remaining, setRemaining] = useState(() => comingSoonTarget() - Date.now());

    useEffect(() => {
        const target = comingSoonTarget();
        const tick = () => setRemaining(target - Date.now());
        const timer = window.setInterval(tick, 1000);
        tick();
        return () => window.clearInterval(timer);
    }, []);

    const label =
        remaining <= 0
            ? t("simulator.scannerLab.gate.comingSoonLive")
            : formatRemaining(remaining);

    return (
        <div className="flex flex-1 flex-col items-center justify-center rounded-[20px] border border-dashed border-[#F47822]/30 bg-white p-5 text-center dark:border-[#F47822]/30 dark:bg-[#1b1b20]">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#F47822]/10">
                <Car className="h-5 w-5 text-[#F47822]" />
            </div>
            <p className="mt-3 text-sm font-black text-[#3A3A3A] dark:text-white">
                {t("simulator.scannerLab.gate.comingSoonTitle")}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">
                {t("simulator.scannerLab.gate.comingSoonDesc")}
            </p>
            <button
                type="button"
                disabled
                aria-disabled
                className="mt-4 w-full cursor-not-allowed rounded-xl border border-[#F47822]/40 bg-[#F47822]/10 px-4 py-2.5 text-xs font-black text-[#F47822]"
            >
                {t("simulator.scannerLab.gate.comingSoonAction")}
            </button>
            <p
                dir="ltr"
                className="mt-2 rounded-full bg-[#3A3A3A]/[.06] px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums text-[#3A3A3A]/60 dark:bg-white/[0.06] dark:text-white/60"
                aria-label={t("simulator.scannerLab.gate.countdownAria", { time: label })}
            >
                {label}
            </p>
        </div>
    );
}

function toGateVehicleFromStatic(v: (typeof VEH)[number]): GateVehicle {
    return {
        id: v.id,
        name: v.name,
        sub: `${v.engine} · ${v.transmission}`,
        vin: v.vin,
        km: v.odometerKm,
        coverage: v.coverage.scanner,
    };
}

function toGateVehicleFromBackend(v: BackendVehicleCard): GateVehicle {
    return {
        id: v.key,
        name: v.name,
        sub: `${v.engine} · ${v.transmission}`,
        vin: v.vin,
        km: v.odometerKm,
        coverage: v.coverage,
    };
}

export function VehicleGate({
    onSelect,
    demo = false,
}: {
    onSelect: (vehicleId: string) => void;
    demo?: boolean;
}) {
    const { t } = useTranslation();
    const [extra, setExtra] = useState<BackendVehicleCard[]>([]);
    const [downloaded, setDownloaded] = useState<Set<string>>(() => readDownloaded());
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    useEffect(() => {
        if (demo) return;
        void fetchCatalog().then(() => setExtra(backendVehicleCards()));
    }, [demo]);

    const all: GateVehicle[] = useMemo(() => {
        const staticOnes = VEH.map(toGateVehicleFromStatic);
        if (demo) {
            // Free demo pack: Corolla ready, every other vehicle hard-locked.
            return staticOnes.map((v) => ({
                ...v,
                coverage: v.id === "corolla" ? "ok" : ("none" as Coverage),
            }));
        }
        const backendOnes = extra.map(toGateVehicleFromBackend);
        // Prefer static garage entries when the same id appears in both.
        const seen = new Set(staticOnes.map((v) => v.id));
        return [...staticOnes, ...backendOnes.filter((v) => !seen.has(v.id))];
    }, [extra, demo]);

    const buckets = useMemo(() => {
        const ready: GateVehicle[] = [];
        const download: GateVehicle[] = [];
        const none: GateVehicle[] = [];
        for (const v of all) {
            const kind = coverageKind(v.coverage, downloaded.has(v.id));
            if (kind === "none") none.push(v);
            else if (kind === "download") download.push(v);
            else ready.push(v);
        }
        return { ready, download, none };
    }, [all, downloaded]);

    const handleDownload = (id: string) => {
        if (downloadingId) return;
        setDownloadingId(id);
        // Simulated pack download, then the vehicle moves to Ready.
        window.setTimeout(() => {
            setDownloaded((prev) => {
                const next = new Set(prev);
                next.add(id);
                writeDownloaded(next);
                return next;
            });
            setDownloadingId(null);
        }, 1200);
    };

    const emptyCopy = (kind: GateKind) =>
        kind === "ready"
            ? t("simulator.scannerLab.gate.emptyReady")
            : kind === "download"
              ? t("simulator.scannerLab.gate.emptyDownload")
              : t("simulator.scannerLab.gate.emptyNone");

    return (
        <div className="space-y-4">
            <div className="rounded-[20px] border border-[#3A3A3A]/10 bg-white p-6 text-center dark:border-white/10 dark:bg-[#1b1b20]">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#F47822]/10">
                    <Car className="h-6 w-6 text-[#F47822]" />
                </div>
                <h3 className="mt-4 text-lg font-black text-[#3A3A3A] dark:text-white">
                    {t("simulator.scannerLab.gate.title")}
                </h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-[#3A3A3A]/55 dark:text-white/55">
                    {t("simulator.scannerLab.gate.desc")}
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <CategoryCard kind="ready" titleKey="simulator.scannerLab.gate.ok" count={buckets.ready.length}>
                    {buckets.ready.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-[#3A3A3A]/15 p-4 text-center text-xs text-[#3A3A3A]/45 dark:border-white/15 dark:text-white/45">
                            {emptyCopy("ready")}
                        </p>
                    ) : (
                        buckets.ready.map((v) => (
                            <VehicleCard
                                key={v.id}
                                vehicle={v}
                                kind="ready"
                                downloading={false}
                                onSelect={onSelect}
                                onDownload={handleDownload}
                            />
                        ))
                    )}
                </CategoryCard>

                <CategoryCard kind="download" titleKey="simulator.scannerLab.gate.avail" count={buckets.download.length}>
                    {buckets.download.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-[#3A3A3A]/15 p-4 text-center text-xs text-[#3A3A3A]/45 dark:border-white/15 dark:text-white/45">
                            {emptyCopy("download")}
                        </p>
                    ) : (
                        buckets.download.map((v) => (
                            <VehicleCard
                                key={v.id}
                                vehicle={v}
                                kind="download"
                                downloading={downloadingId === v.id}
                                onSelect={onSelect}
                                onDownload={handleDownload}
                            />
                        ))
                    )}
                </CategoryCard>

                <CategoryCard kind="none" titleKey="simulator.scannerLab.gate.none" count={buckets.none.length}>
                    {buckets.none.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-[#3A3A3A]/15 p-4 text-center text-xs text-[#3A3A3A]/45 dark:border-white/15 dark:text-white/45">
                            {emptyCopy("none")}
                        </p>
                    ) : (
                        buckets.none.map((v) => (
                            <VehicleCard
                                key={v.id}
                                vehicle={v}
                                kind="none"
                                downloading={false}
                                onSelect={onSelect}
                                onDownload={handleDownload}
                            />
                        ))
                    )}
                </CategoryCard>

                <CategoryCard kind="coming" titleKey="simulator.scannerLab.gate.comingSoon" count={1}>
                    <ComingSoonCard />
                </CategoryCard>
            </div>
        </div>
    );
}
