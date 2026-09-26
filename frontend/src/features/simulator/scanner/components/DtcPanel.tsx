import { useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DTC_DETAIL, type Dtc } from "../data/scanner.data";

type DtcFilter = "all" | "Current" | "Stored" | "Pending";
type DetailTab = "overview" | "causes" | "livedata" | "repair" | "tree";

const DETAIL_TABS: DetailTab[] = ["overview", "causes", "livedata", "repair", "tree"];

export function DtcPanel({ dtcs, onOpenTree }: { dtcs: Dtc[]; onOpenTree: () => void }) {
    const { t } = useTranslation();
    const [filter, setFilter] = useState<DtcFilter>("all");
    const [openCode, setOpenCode] = useState<string | null>("P2118");
    const [detailTab, setDetailTab] = useState<DetailTab>("tree");
    const [clearOpen, setClearOpen] = useState(false);
    const [cleared, setCleared] = useState(false);

    const rows = dtcs.filter((d) => {
        if (cleared) return false;
        if (filter === "all") return true;
        if (filter === "Pending") return d.status === "Pending" || d.status === "Intermittent";
        return d.status === filter;
    });
    const tabLabels = t("simulator.scannerLab.dtcDetail.tabs", { returnObjects: true }) as string[];
    const detail = DTC_DETAIL["P2118"]!;

    return (
        <div className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-5 dark:border-white/10 dark:bg-[#1b1b20]">
            <div className="flex flex-wrap items-center gap-2">
                {(["all", "Current", "Stored", "Pending"] as const).map((f) => (
                    <button
                        key={f}
                        type="button"
                        onClick={() => setFilter(f)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                            filter === f
                                ? "bg-[#14181C] text-white dark:bg-white dark:text-[#14181C]"
                                : "border border-[#3A3A3A]/10 text-[#3A3A3A]/55 hover:text-[#3A3A3A] dark:border-white/10 dark:text-white/55 dark:hover:text-white"
                        }`}
                    >
                        {f === "all"
                            ? t("simulator.scannerLab.dtcDetail.filterAll")
                            : f === "Current"
                              ? t("simulator.scannerLab.dtcDetail.filterCurrent")
                              : f === "Stored"
                                ? t("simulator.scannerLab.dtcDetail.filterStored")
                                : t("simulator.scannerLab.dtcDetail.filterPending")}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => setClearOpen(true)}
                    className="ms-auto rounded-full border border-red-200 px-3 py-1.5 text-[11px] font-black text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                >
                    {t("simulator.scannerLab.dtcDetail.confirmClear")}
                </button>
            </div>
            {cleared && (
                <p className="mt-3 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {t("simulator.scannerLab.dtcDetail.cleared")}
                </p>
            )}
            <div className="mt-4 divide-y divide-[#3A3A3A]/8 overflow-hidden rounded-xl border border-[#3A3A3A]/10 dark:divide-white/8 dark:border-white/10">
                {rows.map((d) => {
                    const open = openCode === d.code;
                    return (
                        <div key={d.code}>
                            <button
                                type="button"
                                onClick={() => setOpenCode(open ? null : d.code)}
                                className="flex w-full items-center gap-3 px-4 py-3 text-start transition hover:bg-[#FCFCFC] dark:hover:bg-white/[0.03]"
                            >
                                <span
                                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                        d.status === "Current"
                                            ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                                            : d.status === "Stored"
                                              ? "bg-amber-500"
                                              : "border-2 border-[#3A3A3A]/15 bg-white dark:border-white/20 dark:bg-transparent"
                                    }`}
                                />
                                <span className="shrink-0 font-mono text-sm font-black text-[#3A3A3A] dark:text-white">{d.code}</span>
                                <span className="min-w-0 flex-1 truncate text-sm text-[#3A3A3A]/70 dark:text-white/70">{d.desc}</span>
                                <span className="hidden shrink-0 rounded-full bg-[#3A3A3A] px-2.5 py-1 text-xs font-bold text-white sm:inline-flex">
                                    {d.ecu}
                                </span>
                                <span className="hidden shrink-0 rounded-full border border-[#3A3A3A]/10 px-2.5 py-1 font-mono text-[11px] font-bold text-[#3A3A3A]/50 sm:inline-flex dark:border-white/10 dark:text-white/50" dir="ltr">
                                    {d.status} · {d.count}×
                                </span>
                            </button>
                            {open && d.code === "P2118" && (
                                <div className="border-t border-[#3A3A3A]/[.06] bg-[#FCFCFC] px-4 py-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                                    <div className="flex gap-1 overflow-x-auto border-b border-[#3A3A3A]/10 dark:border-white/10">
                                        {DETAIL_TABS.map((dt, i) => (
                                            <button
                                                key={dt}
                                                type="button"
                                                onClick={() => setDetailTab(dt)}
                                                className={`shrink-0 border-b-2 px-3 py-2 text-xs font-black transition ${
                                                    detailTab === dt
                                                        ? "border-[#F47822] text-[#F47822]"
                                                        : "border-transparent text-[#3A3A3A]/45 hover:text-[#3A3A3A] dark:text-white/45 dark:hover:text-white"
                                                }`}
                                            >
                                                {tabLabels[i] ?? dt}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="pt-4 text-sm leading-6 text-[#3A3A3A]/70 dark:text-white/70">
                                        {detailTab === "overview" && <p>{t("simulator.scannerLab.dtcDetail.overview")}</p>}
                                        {detailTab === "causes" && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-black uppercase tracking-wide text-[#3A3A3A]/45 dark:text-white/45">
                                                    {t("simulator.scannerLab.dtcDetail.causesTitle")}
                                                </p>
                                                {detail.causes.map((c) => (
                                                    <div key={c.id} className="flex items-center gap-3">
                                                        <span className="w-40 shrink-0 text-xs font-bold text-[#3A3A3A] dark:text-white">
                                                            {t(`simulator.scannerLab.dtcDetail.cause${c.id[0].toUpperCase()}${c.id.slice(1)}`)}
                                                        </span>
                                                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#3A3A3A]/10 dark:bg-white/10">
                                                            <span className="block h-full rounded-full bg-[#F47822]" style={{ width: `${c.confidence}%` }} />
                                                        </span>
                                                        <span dir="ltr" className="w-24 shrink-0 text-right font-mono text-[11px] font-bold text-[#3A3A3A]/50 dark:text-white/50">
                                                            {c.confidence}% {t("simulator.scannerLab.dtcDetail.confidence")}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {detailTab === "livedata" && (
                                            <div className="overflow-x-auto">
                                                <table className="w-full min-w-[420px] text-xs">
                                                    <thead>
                                                        <tr className="text-left font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/45 dark:text-white/45">
                                                            <th className="py-1.5">{t("simulator.scannerLab.dtcDetail.parameter")}</th>
                                                            <th className="py-1.5">{t("simulator.scannerLab.dtcDetail.expected")}</th>
                                                            <th className="py-1.5">{t("simulator.scannerLab.dtcDetail.measured")}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#3A3A3A]/[.06] dark:divide-white/[0.06]">
                                                        {detail.liveExpected.map((row) => (
                                                            <tr key={row.pid}>
                                                                <td className="py-2 font-bold text-[#3A3A3A] dark:text-white">{row.pid}</td>
                                                                <td dir="ltr" className="py-2 font-mono text-[#3A3A3A]/60 dark:text-white/60">{row.expected}</td>
                                                                <td dir="ltr" className={`py-2 font-mono font-black ${row.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                                                                    {row.measured}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                        {detailTab === "repair" && <p>{t("simulator.scannerLab.dtcDetail.repair")}</p>}
                                        {detailTab === "tree" && (
                                            <button
                                                type="button"
                                                onClick={onOpenTree}
                                                className="rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#E96D18]"
                                            >
                                                {t("simulator.scannerLab.dtcDetail.openTree")}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
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
                                    setCleared(true);
                                    setClearOpen(false);
                                    setOpenCode(null);
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
