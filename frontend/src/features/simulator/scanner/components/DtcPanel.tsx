import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, X, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { TREE, type Dtc } from "../data/scanner.data";
import { mergeDtcDetail, type DtcDetail } from "../data/dtc.details";
import { CLEARED_DTC_EVENT, readClearedCodes, writeClearedCodes } from "../lib/clearedDtcs";

type DtcFilter = "all" | "Current" | "Stored" | "Pending";
type DetailTab = "overview" | "causes" | "tree" | "livedata" | "repair";

const DETAIL_TABS: DetailTab[] = ["overview", "causes", "tree", "livedata", "repair"];

type Severity = Dtc["severity"];

const SEV: Record<Severity, { text: string; chip: string }> = {
    high: { text: "text-[#D92D20]", chip: "bg-[#FDF2F1] text-[#D92D20] dark:bg-[#D92D20]/15 dark:text-[#FF8A80]" },
    medium: { text: "text-[#B4560F]", chip: "bg-[#FFF8EC] text-[#B4560F] dark:bg-[#F59E0B]/15 dark:text-[#F59E0B]" },
    low: { text: "text-[#3C424A]", chip: "bg-[#F1F2F4] text-[#5F6570] dark:bg-white/10 dark:text-white/60" },
};

function systemOf(d: Dtc): string {
    return d.sys ?? (d.ecu === "ADAS" ? "ADAS" : d.ecu === "TCM" ? "Transmission" : "Chassis");
}

function km(n: number): string {
    return `${n.toLocaleString("en-US").replace(/,/g, " ")} km`;
}

export function DtcPanel({
    dtcs,
    details,
    tree = TREE,
    onOpenTree,
    vehicleKey,
}: {
    dtcs: Dtc[];
    /** Instructor pack overrides keyed by code; falls back to static dossiers. */
    details?: Record<string, DtcDetail>;
    /** Guided-tree steps currently loaded for the scenario (defaults to the static tree). */
    tree?: typeof TREE;
    onOpenTree: () => void;
    /** Practice car — cleared codes persist per student AND per vehicle. */
    vehicleKey: string;
}) {
    const { t } = useTranslation();
    const [filter, setFilter] = useState<DtcFilter>("all");
    const [query, setQuery] = useState("");
    const [openCode, setOpenCode] = useState<string | null>(null);
    const [activeCode, setActiveCode] = useState<string | null>(null);
    const [detailTab, setDetailTab] = useState<DetailTab>("overview");
    const [clearOpen, setClearOpen] = useState(false);
    // Cleared codes survive refreshes/tab switches: hydrated from storage and
    // re-read whenever another view (or a completed rescan) changes it.
    const [clearedCodes, setClearedCodes] = useState<string[]>(() => readClearedCodes(vehicleKey));
    useEffect(() => {
        const refresh = () => setClearedCodes(readClearedCodes(vehicleKey));
        refresh();
        window.addEventListener(CLEARED_DTC_EVENT, refresh);
        return () => window.removeEventListener(CLEARED_DTC_EVENT, refresh);
    }, [vehicleKey]);
    const clearedSet = useMemo(() => new Set(clearedCodes), [clearedCodes]);

    const base = useMemo(() => dtcs.filter((d) => !clearedSet.has(d.code)), [dtcs, clearedSet]);
    const counts = useMemo(
        () => ({
            all: base.length,
            Current: base.filter((d) => d.status === "Current").length,
            Stored: base.filter((d) => d.status === "Stored").length,
            Pending: base.filter((d) => d.status === "Pending" || d.status === "Intermittent").length,
        }),
        [base],
    );
    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return base.filter((d) => {
            if (filter === "Current" && d.status !== "Current") return false;
            if (filter === "Stored" && d.status !== "Stored") return false;
            if (filter === "Pending" && d.status !== "Pending" && d.status !== "Intermittent") return false;
            if (!q) return true;
            return `${d.code} ${d.desc} ${d.ecu} ${systemOf(d)}`.toLowerCase().includes(q);
        });
    }, [base, filter, query]);

    const active = activeCode ? (base.find((d) => d.code === activeCode) ?? null) : null;
    const activeDetail = active ? mergeDtcDetail(active.code, details?.[active.code]) : undefined;
    const tabLabels = t("simulator.scannerLab.dtcDetail.tabs", { returnObjects: true }) as string[];

    const openDetail = (code: string, tab: DetailTab = "overview") => {
        setActiveCode(code);
        setDetailTab(tab);
        setOpenCode(null);
    };

    /* ---------------- Detail view (screenshots 2–3) ---------------- */
    if (active) {
        const sev = SEV[active.severity];
        const d = activeDetail;
        return (
            <div
                data-testid="dtc-detail"
                className="overflow-hidden rounded-2xl border border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]"
            >
                <div className="border-b border-[#3A3A3A]/10 px-5 pb-4 pt-5 dark:border-white/10 sm:px-6">
                    <button
                        type="button"
                        onClick={() => setActiveCode(null)}
                        className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-black text-[#3A3A3A]/55 transition hover:bg-[#3A3A3A]/[.05] hover:text-[#F47822] dark:text-white/55 dark:hover:bg-white/10 dark:hover:text-[#F47822]"
                    >
                        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                        {t("simulator.scannerLab.dtcDetail.back")}
                    </button>
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <span dir="ltr" className={`font-mono text-4xl font-black tracking-tight ${sev.text}`}>
                            {active.code}
                        </span>
                        <h2 className="min-w-0 flex-1 text-lg font-black leading-snug text-[#14171A] dark:text-white">
                            {active.desc}
                        </h2>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] text-[#8A9099]" dir="ltr">
                        <span>
                            {active.ecu} · {active.status}
                        </span>
                        <span>
                            <span className="font-bold uppercase tracking-[0.1em]">
                                {t("simulator.scannerLab.dtcDetail.firstDetected")}
                            </span>{" "}
                            {km(active.firstKm)}
                            {active.firstSeen ? ` · ${active.firstSeen}` : ""}
                        </span>
                        <span>
                            <span className="font-bold uppercase tracking-[0.1em]">
                                {t("simulator.scannerLab.dtcDetail.lastDetected")}
                            </span>{" "}
                            {km(active.lastKm)}
                            {active.lastSeen ? ` · ${active.lastSeen}` : ""}
                        </span>
                        <span>
                            <span className="font-bold uppercase tracking-[0.1em]">
                                {t("simulator.scannerLab.dtcDetail.occurrences")}
                            </span>{" "}
                            {t("simulator.scannerLab.dtcDetail.nOccurrences", { n: active.count })}
                        </span>
                        <span>
                            <span className="font-bold uppercase tracking-[0.1em]">
                                {t("simulator.scannerLab.dtcDetail.freezeFrame")}
                            </span>{" "}
                            {active.freezeFrame
                                ? t("simulator.scannerLab.dtcDetail.ffAvailable")
                                : t("simulator.scannerLab.dtcDetail.ffNotStored")}
                        </span>
                    </div>
                    <div className="mt-4 flex gap-1 overflow-x-auto border-b border-[#3A3A3A]/10 dark:border-white/10">
                        {DETAIL_TABS.map((dt, i) => (
                            <button
                                key={dt}
                                type="button"
                                onClick={() => setDetailTab(dt)}
                                className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-bold transition ${
                                    detailTab === dt
                                        ? "border-[#F47822] text-[#14171A] dark:text-white"
                                        : "border-transparent text-[#8A9099] hover:text-[#14171A] dark:hover:text-white"
                                }`}
                            >
                                {tabLabels[i] ?? dt}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-[#F8F7F6] px-5 py-5 dark:bg-[#101013] sm:px-6">
                    {detailTab === "overview" && (
                        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                            <div className="grid gap-4">
                                <section className="rounded-xl border border-[#E3E5E8] bg-white p-5 dark:border-white/10 dark:bg-[#1b1b20]">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8A9099]">
                                        {t("simulator.scannerLab.dtcDetail.whatMeans")}
                                    </h3>
                                    <p className="mt-3 text-sm leading-7 text-[#3C424A] dark:text-white/70">
                                        {d?.meaning ?? t("simulator.scannerLab.dtcDetail.noDossier")}
                                    </p>
                                    {d?.related && (
                                        <p className="mt-4 border-l-[3px] border-[#F47822] bg-[#FFFAF5] px-3.5 py-3 text-xs leading-6 text-[#5C4327] rounded-r-md dark:bg-[#F47822]/10 dark:text-white/70">
                                            {t("simulator.scannerLab.dtcDetail.relatedPrefix")}{" "}
                                            <strong dir="ltr">{d.related.code}</strong> {d.related.text}
                                        </p>
                                    )}
                                </section>
                                <section className="rounded-xl border border-[#E3E5E8] bg-white p-5 dark:border-white/10 dark:bg-[#1b1b20]">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8A9099]">
                                        {t("simulator.scannerLab.dtcDetail.freezeTitle")}
                                    </h3>
                                    {d && d.freeze.length > 0 ? (
                                        <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#EDEFF1] bg-[#EDEFF1] sm:grid-cols-3 dark:border-white/10 dark:bg-white/10">
                                            {d.freeze.map((cell) => (
                                                <div key={cell.k} className="bg-white p-3 dark:bg-[#1b1b20]">
                                                    <p className="min-h-[26px] text-[11px] leading-4 text-[#8A9099]">{cell.k}</p>
                                                    <p
                                                        dir="ltr"
                                                        className={`mt-1.5 font-mono text-base font-bold ${cell.ok ? "text-[#12A150]" : "text-[#D92D20]"}`}
                                                    >
                                                        {cell.measured}
                                                    </p>
                                                    <p dir="ltr" className="mt-1 font-mono text-[11px] text-[#8A9099]">
                                                        spec {cell.spec}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-3 font-mono text-xs text-[#8A9099]">
                                            {t("simulator.scannerLab.dtcDetail.ffNone")}
                                        </p>
                                    )}
                                </section>
                            </div>
                            <div className="grid content-start gap-4">
                                <section className="rounded-xl border border-[#E3E5E8] bg-white p-5 dark:border-white/10 dark:bg-[#1b1b20]">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8A9099]">
                                        {t("simulator.scannerLab.dtcDetail.testConditions")}
                                    </h3>
                                    <ul className="mt-2 divide-y divide-[#F4F5F6] dark:divide-white/5">
                                        {(d?.conditions ?? []).map((c) => (
                                            <li key={c} className="flex items-start gap-2.5 py-2.5 text-sm text-[#3C424A] dark:text-white/70">
                                                <svg
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="#12A150"
                                                    strokeWidth="2.4"
                                                    strokeLinecap="round"
                                                    className="mt-1 shrink-0"
                                                >
                                                    <path d="M5 12.5l4.5 4.5L19 7" />
                                                </svg>
                                                <span className="leading-6">{c}</span>
                                            </li>
                                        ))}
                                        {(d?.conditions.length ?? 0) === 0 && (
                                            <li className="py-2.5 text-sm text-[#8A9099]">
                                                {t("simulator.scannerLab.dtcDetail.noDossier")}
                                            </li>
                                        )}
                                    </ul>
                                </section>
                                <section className="rounded-xl border border-[#E3E5E8] bg-white p-5 dark:border-white/10 dark:bg-[#1b1b20]">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8A9099]">
                                        {t("simulator.scannerLab.dtcDetail.toolsNeeded")}
                                    </h3>
                                    <ul className="mt-2 divide-y divide-[#F4F5F6] dark:divide-white/5">
                                        {(d?.tools ?? []).map((tool) => (
                                            <li key={tool} className="py-2.5 text-sm text-[#3C424A] dark:text-white/70">
                                                {tool}
                                            </li>
                                        ))}
                                        {(d?.tools.length ?? 0) === 0 && (
                                            <li className="py-2.5 text-sm text-[#8A9099]">
                                                {t("simulator.scannerLab.dtcDetail.noDossier")}
                                            </li>
                                        )}
                                    </ul>
                                </section>
                            </div>
                        </div>
                    )}

                    {detailTab === "causes" && (
                        <div className="max-w-3xl">
                            <p className="mb-4 max-w-2xl text-xs leading-6 text-[#5F6570] dark:text-white/60">
                                {d?.causesIntro ?? t("simulator.scannerLab.dtcDetail.causesIntroFallback")}
                            </p>
                            <div className="grid gap-2.5">
                                {(d?.causes ?? []).map((c) => (
                                    <div
                                        key={c.label}
                                        className="flex items-center gap-4 rounded-lg border border-[#E3E5E8] border-l-[3px] bg-white px-4 py-3.5 dark:border-white/10 dark:bg-[#1b1b20]"
                                        style={{ borderLeftColor: c.pct >= 40 ? "#D92D20" : c.pct >= 15 ? "#F59E0B" : "#8A9099" }}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold leading-5 text-[#14171A] dark:text-white">{c.label}</p>
                                            <p className="mt-1 font-mono text-[11px] text-[#8A9099]">{c.note}</p>
                                        </div>
                                        <span
                                            className="shrink-0 rounded-[3px] px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-white"
                                            style={{ backgroundColor: c.pct >= 40 ? "#D92D20" : c.pct >= 15 ? "#F59E0B" : "#8A9099" }}
                                        >
                                            {c.pct}%
                                        </span>
                                    </div>
                                ))}
                                {(d?.causes.length ?? 0) === 0 && (
                                    <p className="text-sm text-[#8A9099]">{t("simulator.scannerLab.dtcDetail.noDossier")}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {detailTab === "tree" && (
                        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                            <div>
                                <div className="mb-3 flex items-center gap-3">
                                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8A9099]">
                                        {t("simulator.scannerLab.dtcDetail.treeTitle", { n: tree.length })}
                                    </span>
                                    <span className="h-px flex-1 bg-[#E3E5E8] dark:bg-white/10" />
                                </div>
                                <div className="grid gap-2.5">
                                    {tree.map((step, i) => (
                                        <div
                                            key={step.id}
                                            className="rounded-lg border border-[#E3E5E8] bg-white p-4 dark:border-white/10 dark:bg-[#1b1b20]"
                                        >
                                            <div className="flex items-start gap-3">
                                                <span
                                                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[11px] font-black text-white ${
                                                        step.ok ? "bg-[#12A150]" : "bg-[#D92D20]"
                                                    }`}
                                                >
                                                    {String(i + 1).padStart(2, "0")}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <p className="flex-1 text-sm font-semibold text-[#14171A] dark:text-white">{step.label}</p>
                                                        <span
                                                            dir="ltr"
                                                            className={`shrink-0 font-mono text-[11px] font-black ${
                                                                step.ok ? "text-[#12A150]" : "text-[#D92D20]"
                                                            }`}
                                                        >
                                                            {step.measure}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[11px]">
                                                        <span dir="ltr" className="text-[#8A9099]">
                                                            <span className="font-black uppercase tracking-wider">Expected </span>
                                                            <span className="font-mono text-[#5F6570]">{step.expected}</span>
                                                        </span>
                                                        <span className="text-[#8A9099]">
                                                            <span className="font-black uppercase tracking-wider">
                                                                {t("simulator.scannerLab.dtcDetail.verdict")}
                                                            </span>{" "}
                                                            <span className={`font-bold ${step.ok ? "text-[#12A150]" : "text-[#D92D20]"}`}>
                                                                {step.ok
                                                                    ? t("simulator.scannerLab.dtcDetail.inSpec")
                                                                    : t("simulator.scannerLab.dtcDetail.outSpec")}
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={onOpenTree}
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#14181C] px-5 py-3 text-sm font-black text-white transition hover:bg-[#F47822] hover:text-[#1A1206] dark:bg-white dark:text-[#14181C] dark:hover:bg-[#F47822]"
                                >
                                    {t("simulator.scannerLab.dtcDetail.openTree")}
                                </button>
                            </div>
                            <aside className="h-fit rounded-xl border border-[#E3E5E8] bg-white p-4 dark:border-white/10 dark:bg-[#1b1b20]">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8A9099]">
                                    {t("simulator.scannerLab.dtcDetail.progress")}
                                </h3>
                                <ol className="mt-2 divide-y divide-[#F4F5F6] dark:divide-white/5">
                                    {tree.map((step, i) => (
                                        <li key={step.id} className="flex items-center gap-2.5 py-2">
                                            <span
                                                className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full font-mono text-[9px] font-black text-white ${
                                                    step.ok ? "bg-[#12A150]" : "bg-[#D92D20]"
                                                }`}
                                            >
                                                {i + 1}
                                            </span>
                                            <span className="truncate text-xs text-[#5F6570] dark:text-white/60">{step.label}</span>
                                        </li>
                                    ))}
                                </ol>
                            </aside>
                        </div>
                    )}

                    {detailTab === "livedata" && (
                        <div className="max-w-3xl overflow-hidden rounded-xl border border-[#E3E5E8] bg-white dark:border-white/10 dark:bg-[#1b1b20]">
                            <div className="grid grid-cols-[1fr_130px_130px_110px] gap-3 bg-[#FAFAFB] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#8A9099] dark:bg-white/[0.04]">
                                <span>{t("simulator.scannerLab.dtcDetail.measurement")}</span>
                                <span>{t("simulator.scannerLab.dtcDetail.specification")}</span>
                                <span>{t("simulator.scannerLab.dtcDetail.measured")}</span>
                                <span>{t("simulator.scannerLab.dtcDetail.result")}</span>
                            </div>
                            {(d?.live ?? []).map((row) => (
                                <div
                                    key={row.k}
                                    className="grid grid-cols-[1fr_130px_130px_110px] items-center gap-3 border-t border-[#F4F5F6] px-4 py-3 text-sm dark:border-white/5"
                                >
                                    <span className="truncate text-[#14171A] dark:text-white">{row.k}</span>
                                    <span dir="ltr" className="font-mono text-xs text-[#5F6570] dark:text-white/60">
                                        {row.spec}
                                    </span>
                                    <span dir="ltr" className={`font-mono text-sm font-bold ${row.ok ? "text-[#12A150]" : "text-[#D92D20]"}`}>
                                        {row.measured}
                                    </span>
                                    <span
                                        className={`justify-self-start rounded-[3px] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white ${
                                            row.ok ? "bg-[#12A150]" : "bg-[#D92D20]"
                                        }`}
                                    >
                                        {row.ok ? t("simulator.scannerLab.dtcDetail.inSpec") : t("simulator.scannerLab.dtcDetail.outSpec")}
                                    </span>
                                </div>
                            ))}
                            {(d?.live.length ?? 0) === 0 && (
                                <p className="border-t border-[#F4F5F6] px-4 py-4 text-sm text-[#8A9099] dark:border-white/5">
                                    {t("simulator.scannerLab.dtcDetail.noDossier")}
                                </p>
                            )}
                        </div>
                    )}

                    {detailTab === "repair" && (
                        <div className="grid max-w-5xl gap-4 lg:grid-cols-[1.2fr_1fr]">
                            <section className="rounded-xl border border-[#E3E5E8] bg-white p-5 dark:border-white/10 dark:bg-[#1b1b20]">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8A9099]">
                                    {t("simulator.scannerLab.dtcDetail.repairDecision")}
                                </h3>
                                <p className="mt-3 text-base font-semibold leading-6 text-[#14171A] dark:text-white">
                                    {d?.repair.decision ?? t("simulator.scannerLab.dtcDetail.noDossier")}
                                </p>
                                <p className="mt-3 text-sm leading-7 text-[#3C424A] dark:text-white/70">{d?.repair.evidence}</p>
                                <div className="mt-4">
                                    {(d?.repair.rows ?? []).map((row) => (
                                        <div
                                            key={row.label}
                                            className="flex items-center justify-between gap-4 border-b border-[#F4F5F6] py-2.5 last:border-b-0 dark:border-white/5"
                                        >
                                            <span className="text-xs text-[#8A9099]">
                                                {row.label === "Part"
                                                    ? t("simulator.scannerLab.dtcDetail.part")
                                                    : row.label === "Labour"
                                                      ? t("simulator.scannerLab.dtcDetail.labour")
                                                      : row.label === "Post-repair"
                                                        ? t("simulator.scannerLab.dtcDetail.postRepair")
                                                        : t("simulator.scannerLab.dtcDetail.verification")}
                                            </span>
                                            <span dir="ltr" className="text-right font-mono text-xs font-semibold text-[#14171A] dark:text-white">
                                                {row.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                            <section className="rounded-xl border border-[#F7DCC4] bg-[#FFF6EE] p-5 dark:border-[#F47822]/30 dark:bg-[#F47822]/10">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-[#B4560F] dark:text-[#F47822]">
                                    {t("simulator.scannerLab.dtcDetail.doNotStop")}
                                </h3>
                                <p className="mt-3 text-sm leading-7 text-[#5C4327] dark:text-white/70">{d?.repair.doNotStop}</p>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /* ---------------- List view (screenshot 1) ---------------- */
    const filterChips: { id: DtcFilter; label: string }[] = [
        { id: "all", label: t("simulator.scannerLab.dtcDetail.filterAll") },
        { id: "Current", label: t("simulator.scannerLab.dtcDetail.filterCurrent") },
        { id: "Stored", label: t("simulator.scannerLab.dtcDetail.filterStored") },
        { id: "Pending", label: t("simulator.scannerLab.dtcDetail.filterPending") },
    ];

    return (
        <div
            data-testid="dtc-list"
            className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-5 dark:border-white/10 dark:bg-[#1b1b20]"
        >
            <div className="flex flex-wrap items-center gap-2">
                {filterChips.map((chip) => (
                    <button
                        key={chip.id}
                        type="button"
                        onClick={() => setFilter(chip.id)}
                        className={`rounded-full px-3.5 py-2 text-xs font-black transition ${
                            filter === chip.id
                                ? "bg-[#14181C] text-white dark:bg-white dark:text-[#14181C]"
                                : "border border-[#3A3A3A]/10 text-[#3A3A3A]/55 hover:text-[#3A3A3A] dark:border-white/10 dark:text-white/55 dark:hover:text-white"
                        }`}
                    >
                        {chip.label} {counts[chip.id]}
                    </button>
                ))}
                <div className="ms-auto flex items-center gap-2">
                    <span className="hidden font-mono text-xs text-[#8A9099] sm:inline" dir="ltr">
                        {rows.length} {t("simulator.scannerLab.dtcDetail.codesLabel")}
                    </span>
                    <label className="relative">
                        <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8A9099]" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t("simulator.scannerLab.dtcDetail.searchPh")}
                            aria-label={t("simulator.scannerLab.dtcDetail.searchPh")}
                            className="h-9 w-44 rounded-lg border border-[#E3E5E8] bg-white ps-8 pe-3 text-xs text-[#14171A] outline-none transition focus:border-[#F47822] focus:ring-2 focus:ring-[#F47822]/25 sm:w-56 dark:border-white/10 dark:bg-[#101013] dark:text-white"
                        />
                    </label>
                    <button
                        type="button"
                        onClick={() => setClearOpen(true)}
                        className="rounded-full border border-red-200 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                    >
                        {t("simulator.scannerLab.dtcDetail.confirmClear")}
                    </button>
                </div>
            </div>
            {clearedCodes.length > 0 && base.length === 0 && dtcs.length > 0 && (
                <p className="mt-3 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {t("simulator.scannerLab.dtcDetail.cleared")}
                </p>
            )}
            <div className="mt-4 grid gap-3">
                {rows.map((d) => {
                    const sev = SEV[d.severity];
                    const open = openCode === d.code;
                    return (
                        <div
                            key={d.code}
                            className="overflow-hidden rounded-xl border border-[#E3E5E8] bg-white dark:border-white/10 dark:bg-[#101013]"
                        >
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-4">
                                <div className="w-28 shrink-0">
                                    <p dir="ltr" className={`font-mono text-xl font-black ${sev.text}`}>
                                        {d.code}
                                    </p>
                                    <p dir="ltr" className="mt-0.5 font-mono text-[11px] text-[#8A9099]">
                                        {d.ecu} · {systemOf(d)}
                                    </p>
                                </div>
                                <div className="min-w-[180px] flex-1">
                                    <p className="text-sm font-semibold leading-5 text-[#14171A] dark:text-white">{d.desc}</p>
                                    <p dir="ltr" className="mt-1 font-mono text-[11px] text-[#8A9099]">
                                        {t("simulator.scannerLab.dtcDetail.nOccurrences", { n: d.count })} ·{" "}
                                        {d.freezeFrame
                                            ? t("simulator.scannerLab.dtcDetail.ffStored")
                                            : t("simulator.scannerLab.dtcDetail.ffNone")}
                                    </p>
                                </div>
                                <span className={`shrink-0 rounded-[3px] px-2.5 py-1.5 text-xs font-bold ${sev.chip}`}>{d.status}</span>
                                <button
                                    type="button"
                                    onClick={() => openDetail(d.code, "tree")}
                                    className="h-9 shrink-0 rounded-md bg-[#14181C] px-4 text-xs font-black tracking-wide text-white transition hover:bg-[#F47822] hover:text-[#1A1206]"
                                >
                                    {t("simulator.scannerLab.dtcDetail.fixPlan")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOpenCode(open ? null : d.code)}
                                    aria-expanded={open}
                                    aria-label={d.code}
                                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[#8A9099] transition hover:bg-[#3A3A3A]/[.06] hover:text-[#14171A] dark:hover:bg-white/10 dark:hover:text-white"
                                >
                                    <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                                </button>
                            </div>
                            {open && (
                                <div className="border-t border-[#EDEFF1] bg-[#FAFAFB] px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        {[
                                            {
                                                label: t("simulator.scannerLab.dtcDetail.firstDetected"),
                                                value: `${km(d.firstKm)}${d.firstSeen ? ` · ${d.firstSeen}` : ""}`,
                                            },
                                            {
                                                label: t("simulator.scannerLab.dtcDetail.lastDetected"),
                                                value: `${km(d.lastKm)}${d.lastSeen ? ` · ${d.lastSeen}` : ""}`,
                                            },
                                            { label: t("simulator.scannerLab.dtcDetail.occurrences"), value: String(d.count) },
                                            {
                                                label: t("simulator.scannerLab.dtcDetail.freezeFrame"),
                                                value: d.freezeFrame
                                                    ? t("simulator.scannerLab.dtcDetail.ffStored")
                                                    : t("simulator.scannerLab.dtcDetail.ffNone"),
                                            },
                                        ].map((cell) => (
                                            <div key={cell.label}>
                                                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8A9099]">
                                                    {cell.label}
                                                </p>
                                                <p dir="ltr" className="mt-1.5 font-mono text-sm text-[#14171A] dark:text-white">
                                                    {cell.value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {[
                                            { key: "actDetail", tab: "overview" as DetailTab },
                                            { key: "actTree", tab: "tree" as DetailTab },
                                            { key: "actFreeze", tab: "overview" as DetailTab },
                                            { key: "actKnowledge", tab: "causes" as DetailTab },
                                            { key: "actRepair", tab: "repair" as DetailTab },
                                        ].map((btn) => (
                                            <button
                                                key={btn.key}
                                                type="button"
                                                onClick={() => openDetail(d.code, btn.tab)}
                                                className="rounded-md border border-[#E3E5E8] bg-white px-3.5 py-2 text-xs font-semibold text-[#14171A] transition hover:border-[#F47822] hover:text-[#F47822] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
                                            >
                                                {t(`simulator.scannerLab.dtcDetail.${btn.key}`)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                {rows.length === 0 && (
                    <p className="rounded-xl border border-dashed border-[#3A3A3A]/15 px-4 py-8 text-center text-sm text-[#8A9099] dark:border-white/15">
                        {t("simulator.scannerLab.dtcDetail.empty")}
                    </p>
                )}
            </div>

            {clearOpen && (
                <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" onClick={() => setClearOpen(false)}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#1b1b20]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <h3 className="text-base font-black text-[#3A3A3A] dark:text-white">
                                {t("simulator.scannerLab.dtcDetail.clearTitle")}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setClearOpen(false)}
                                aria-label={t("simulator.scannerLab.dtcDetail.cancel")}
                                className="rounded-lg p-1 text-[#3A3A3A]/40 hover:text-[#3A3A3A] dark:text-white/40 dark:hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/60 dark:text-white/60">
                            {t("simulator.scannerLab.dtcDetail.clearBody")}
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setClearOpen(false)}
                                className="rounded-xl border border-[#3A3A3A]/10 px-4 py-2 text-xs font-black text-[#3A3A3A] dark:border-white/10 dark:text-white"
                            >
                                {t("simulator.scannerLab.dtcDetail.cancel")}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    // Persist per student + vehicle so a refresh
                                    // or tab switch never resurrects the codes.
                                    writeClearedCodes(vehicleKey, dtcs.map((d) => d.code));
                                    setClearedCodes(dtcs.map((d) => d.code));
                                    setClearOpen(false);
                                    setOpenCode(null);
                                    setActiveCode(null);
                                }}
                                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white transition hover:bg-red-700"
                            >
                                {t("simulator.scannerLab.dtcDetail.confirmClear")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
