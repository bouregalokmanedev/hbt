import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { SIMULATOR_RESULTS_EVENT, simulatorApi, type SimulatorResult } from "@/features/simulator/api/simulator.api";

function fmtDate(value: string | null | undefined, locale?: string): string {
    if (!value) return "—";
    return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function scenarioOf(r: SimulatorResult): string {
    return r.metadata?.scenarioId ?? r.scenario_key ?? r.id.slice(0, 8);
}

export function HistoryScreen({ refreshKey }: { refreshKey: number | null }) {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === "ar" ? "ar" : undefined;
    const [results, setResults] = useState<SimulatorResult[]>([]);
    const [picked, setPicked] = useState<string[]>([]);
    const [comparing, setComparing] = useState(false);

    useEffect(() => {
        const load = () => {
            void simulatorApi
                .results()
                .then((all) => setResults(all.filter((r) => r.tool === "scanner")))
                .catch(() => setResults([]));
        };
        load();
        window.addEventListener(SIMULATOR_RESULTS_EVENT, load);
        return () => window.removeEventListener(SIMULATOR_RESULTS_EVENT, load);
    }, [refreshKey]);

    const toggle = (id: string) =>
        setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 2 ? [p[1], id] : [...p, id]));

    const [a, b] = picked
        .map((id) => results.find((s) => s.id === id))
        .filter((s): s is SimulatorResult => Boolean(s));

    const diffRows =
        comparing && a && b
            ? [
                  { label: t("simulator.scannerLab.historyScreen.date"), av: fmtDate(a.created_at, dateLocale), bv: fmtDate(b.created_at, dateLocale) },
                  { label: t("simulator.scannerLab.historyScreen.vehicle"), av: scenarioOf(a), bv: scenarioOf(b) },
                  { label: t("simulator.scannerLab.historyScreen.score"), av: String(a.score ?? "—"), bv: String(b.score ?? "—") },
                  { label: t("simulator.scannerLab.historyScreen.status"), av: a.outcome ?? "—", bv: b.outcome ?? "—" },
              ]
            : [];
    const diffCount = diffRows.filter((r) => r.av !== r.bv).length;

    return (
        <div className="space-y-4 p-4 sm:p-5">
            <div>
                <h3 className="text-lg font-black text-[#3A3A3A] dark:text-white">
                    {t("simulator.scannerLab.historyScreen.title")}
                </h3>
                <p className="mt-1 text-sm text-[#3A3A3A]/55 dark:text-white/55">
                    {t("simulator.scannerLab.historyScreen.desc")}
                </p>
            </div>
            {results.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#3A3A3A]/15 bg-white p-6 text-center text-sm text-[#3A3A3A]/50 dark:border-white/15 dark:bg-[#1b1b20] dark:text-white/50">
                    {t("simulator.scannerLab.historyScreen.empty")}
                </p>
            ) : !comparing ? (
                <div className="overflow-x-auto rounded-2xl border border-[#3A3A3A]/10 dark:border-white/10">
                    <table className="min-w-[640px] w-full bg-white text-sm dark:bg-[#1b1b20]">
                        <thead>
                            <tr className="text-left font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/45 dark:text-white/45">
                                <th className="px-4 py-2.5" />
                                <th className="px-4 py-2.5">{t("simulator.scannerLab.historyScreen.session")}</th>
                                <th className="px-4 py-2.5">{t("simulator.scannerLab.historyScreen.date")}</th>
                                <th className="px-4 py-2.5">{t("simulator.scannerLab.historyScreen.vehicle")}</th>
                                <th className="px-4 py-2.5">{t("simulator.scannerLab.historyScreen.score")}</th>
                                <th className="px-4 py-2.5">{t("simulator.scannerLab.historyScreen.status")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3A3A3A]/[.06] dark:divide-white/[0.06]">
                            {results.map((r) => (
                                <tr key={r.id} className={picked.includes(r.id) ? "bg-[#F47822]/[.05]" : undefined}>
                                    <td className="px-4 py-2.5">
                                        <input
                                            type="checkbox"
                                            checked={picked.includes(r.id)}
                                            onChange={() => toggle(r.id)}
                                            aria-label={t("simulator.scannerLab.historyScreen.compare")}
                                            className="h-4 w-4 accent-[#F47822]"
                                        />
                                    </td>
                                    <td dir="ltr" className="px-4 py-2.5 font-mono text-xs font-bold text-[#3A3A3A] dark:text-white">
                                        {r.id.slice(0, 8)}
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-[11px] text-[#3A3A3A]/60 dark:text-white/60">
                                        {fmtDate(r.created_at, dateLocale)}
                                    </td>
                                    <td className="max-w-[220px] truncate px-4 py-2.5 text-xs font-bold text-[#3A3A3A] dark:text-white">
                                        {scenarioOf(r)}
                                    </td>
                                    <td dir="ltr" className="px-4 py-2.5 font-mono text-xs font-black text-[#3A3A3A] dark:text-white">
                                        {r.score ?? "—"}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className="rounded-full bg-[#3A3A3A]/[.06] px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-[#3A3A3A]/60 dark:bg-white/[0.07] dark:text-white/60">
                                            {r.outcome ?? "—"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-5 dark:border-white/10 dark:bg-[#1b1b20]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-black text-[#3A3A3A] dark:text-white">
                            {t("simulator.scannerLab.historyScreen.compareTitle")} ·{" "}
                            {t("simulator.scannerLab.historyScreen.differences", { n: diffCount })}
                        </h4>
                        <button
                            type="button"
                            onClick={() => setComparing(false)}
                            className="rounded-xl border border-[#3A3A3A]/10 px-4 py-2 text-xs font-black text-[#3A3A3A] dark:border-white/10 dark:text-white"
                        >
                            {t("simulator.scannerLab.historyScreen.back")}
                        </button>
                    </div>
                    <table className="mt-4 w-full text-sm">
                        <tbody className="divide-y divide-[#3A3A3A]/[.06] dark:divide-white/[0.06]">
                            {diffRows.map((row) => {
                                const changed = row.av !== row.bv;
                                return (
                                    <tr key={row.label} className={changed ? "bg-amber-500/[0.06]" : undefined}>
                                        <td className="py-2.5 text-xs font-bold text-[#3A3A3A]/50 dark:text-white/50">{row.label}</td>
                                        <td className={`py-2.5 text-xs font-bold ${changed ? "text-[#F47822]" : "text-[#3A3A3A] dark:text-white"}`}>{row.av}</td>
                                        <td className={`py-2.5 text-xs font-bold ${changed ? "text-[#F47822]" : "text-[#3A3A3A] dark:text-white"}`}>{row.bv}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {!comparing && picked.length === 2 && (
                <button
                    type="button"
                    onClick={() => setComparing(true)}
                    className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-black text-white transition hover:bg-[#E96D18]"
                >
                    {t("simulator.scannerLab.historyScreen.compare")}
                </button>
            )}
        </div>
    );
}
