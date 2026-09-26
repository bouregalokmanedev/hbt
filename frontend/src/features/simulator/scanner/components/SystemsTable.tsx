import { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LAST_SCAN, type EcuNode } from "../data/scanner.data";

type Filter = "all" | "faults" | "warnings" | "attention" | "normal";

function kindOf(status: string): Exclude<Filter, "all" | "attention"> {
    if (status === "fault") return "faults";
    if (status === "warn") return "warnings";
    return "normal";
}

export function SystemsTable({
    nodes,
    focusEcu,
    onOpen,
    onOpenDtcs,
}: {
    nodes: EcuNode[];
    focusEcu: string | null;
    onOpen: (ecuId: string) => void;
    onOpenDtcs: () => void;
}) {
    const { t } = useTranslation();
    const [filter, setFilter] = useState<Filter>("all");
    const [query, setQuery] = useState("");
    const [sortDir, setSortDir] = useState<1 | -1>(1);

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return nodes.filter((n) => {
            const kind = kindOf(n.status);
            if (filter === "faults" && kind !== "faults") return false;
            if (filter === "warnings" && kind !== "warnings") return false;
            if (filter === "normal" && kind !== "normal") return false;
            if (filter === "attention" && !(kind === "faults" || kind === "warnings")) return false;
            if (q && !`${n.id} ${n.name}`.toLowerCase().includes(q)) return false;
            return true;
        }).sort((a, b) => (a.bus < b.bus ? -sortDir : a.bus > b.bus ? sortDir : 0));
    }, [filter, query, sortDir]);

    const counts: Record<Filter, number> = {
        all: nodes.length,
        faults: nodes.filter((n) => kindOf(n.status) === "faults").length,
        warnings: nodes.filter((n) => kindOf(n.status) === "warnings").length,
        attention: nodes.filter((n) => kindOf(n.status) !== "normal").length,
        normal: nodes.filter((n) => kindOf(n.status) === "normal").length,
    };

    return (
        <div className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-5 dark:border-white/10 dark:bg-[#1b1b20]">
            <div className="flex flex-wrap items-center gap-2">
                {(Object.keys(counts) as Filter[]).map((f) => (
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
                        {t(`simulator.scannerLab.systems.${f}`)} · {counts[f]}
                    </button>
                ))}
                <span className="ms-auto flex items-center gap-2 text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                    {t("simulator.scannerLab.systems.count", { n: rows.length, total: nodes.length })}
                </span>
                <span className="relative">
                    <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#3A3A3A]/30 dark:text-white/30" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t("simulator.scannerLab.systems.searchPh")}
                        className="h-8 w-52 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] ps-8 pe-2 text-xs outline-none placeholder:text-[#3A3A3A]/30 focus:border-[#F47822] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                    />
                </span>
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-[#3A3A3A]/10 dark:border-white/10">
                <table className="min-w-[820px] w-full text-sm">
                    <thead className="sticky top-0 bg-[#F8F7F6] dark:bg-white/[0.04]">
                        <tr className="text-left font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/45 dark:text-white/45">
                            <th className="px-4 py-2.5">{t("simulator.scannerLab.systems.ecu")}</th>
                            <th className="px-4 py-2.5">{t("simulator.scannerLab.systems.system")}</th>
                            <th className="px-4 py-2.5">
                                <button
                                    type="button"
                                    onClick={() => setSortDir((d) => (d === 1 ? -1 : 1))}
                                    className="inline-flex items-center gap-1 hover:text-[#F47822]"
                                >
                                    {t("simulator.scannerLab.systems.bus")}
                                    <ArrowUpDown className="h-3 w-3" />
                                </button>
                            </th>
                            <th className="px-4 py-2.5">{t("simulator.scannerLab.systems.status")}</th>
                            <th className="px-4 py-2.5">{t("simulator.scannerLab.systems.dtc")}</th>
                            <th className="px-4 py-2.5">{t("simulator.scannerLab.systems.lastScan")}</th>
                            <th className="px-4 py-2.5">{t("simulator.scannerLab.systems.actions")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3A3A3A]/[.06] dark:divide-white/[0.06]">
                        {rows.map((n) => (
                            <tr
                                key={n.id}
                                className={focusEcu === n.id ? "bg-[#F47822]/[.06] dark:bg-[#F47822]/[0.08]" : undefined}
                            >
                                <td className="px-4 py-2.5 font-mono text-xs font-black text-[#3A3A3A] dark:text-white">{n.id}</td>
                                <td className="px-4 py-2.5 text-xs font-semibold text-[#3A3A3A]/75 dark:text-white/75">{n.name}</td>
                                <td className="px-4 py-2.5 font-mono text-xs text-[#3A3A3A]/55 dark:text-white/55" dir="ltr">{n.bus}</td>
                                <td className="px-4 py-2.5">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3A3A3A] dark:text-white">
                                        <span
                                            className="h-1.5 w-1.5 rounded-full"
                                            style={{
                                                background:
                                                    n.status === "fault"
                                                        ? "#D92D20"
                                                        : n.status === "warn"
                                                          ? "#F59E0B"
                                                          : n.status === "normal"
                                                            ? "#12A150"
                                                            : "#8A9099",
                                            }}
                                        />
                                        {t(`simulator.scannerLab.systems.${n.status === "warn" ? "warnSt" : n.status === "fault" ? "faultSt" : n.status === "normal" ? "normalSt" : n.status === "offline" ? "offlineSt" : "noneSt"}`)}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5 font-mono text-xs font-black text-[#3A3A3A] dark:text-white" dir="ltr">{n.dtc}</td>
                                <td className="px-4 py-2.5 font-mono text-[11px] text-[#3A3A3A]/45 dark:text-white/45" dir="ltr">{LAST_SCAN}</td>
                                <td className="px-4 py-2.5">
                                    <span className="flex gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => onOpen(n.id)}
                                            className="rounded-lg border border-[#3A3A3A]/10 px-2.5 py-1 text-[11px] font-black text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:text-white/70"
                                        >
                                            {t("simulator.scannerLab.systems.open")}
                                        </button>
                                        {n.dtc > 0 && (
                                            <button
                                                type="button"
                                                onClick={onOpenDtcs}
                                                className="rounded-lg bg-[#F47822] px-2.5 py-1 text-[11px] font-black text-white transition hover:bg-[#E96D18]"
                                            >
                                                {t("simulator.scannerLab.systems.faultCodes")}
                                            </button>
                                        )}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
