import { Award as AwardIcon, Filter, History, Search, Sparkles, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { getDiagnostics } from "../api/diagnostics.api";
import type { DiagnosticHubItem } from "../types/diagnostic.types";
import { DiagnosticCard } from "../components/DiagnosticCard";

type FilterKey = "all" | "available" | "in_progress" | "completed";

export function DiagnosticsPage() {
    const { t } = useTranslation();
    const [params] = useSearchParams();
    const courseFilter = params.get("course");
    const [items, setItems] = useState<DiagnosticHubItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<FilterKey>("all");

    useEffect(() => {
        setLoading(true);
        setError(null);
        void getDiagnostics(courseFilter ?? undefined)
            .then(setItems)
            .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : t("diagnostics.hub.loadFail")))
            .finally(() => setLoading(false));
    }, [courseFilter]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return items.filter((i) => {
            if (filter !== "all" && i.state !== filter) return false;
            if (!q) return true;
            return i.title.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q) || (i.course?.title.toLowerCase().includes(q) ?? false);
        });
    }, [items, query, filter]);

    const completed = items.filter((i) => i.state === "completed").length;
    const inProgress = items.filter((i) => i.state === "in_progress").length;

    if (loading) return <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013] p-8"><div className="mx-auto max-w-[1440px] animate-pulse space-y-4"><div className="h-40 rounded-[28px] bg-[#3A3A3A]/10 dark:bg-white/10" /><div className="grid gap-5 lg:grid-cols-2"><div className="h-64 rounded-[28px] bg-white dark:bg-[#1b1b20]" /><div className="h-64 rounded-[28px] bg-white dark:bg-[#1b1b20]" /></div></div></main>;
    if (error) return <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013] p-8"><div className="mx-auto max-w-[1440px] rounded-2xl bg-red-50 dark:bg-red-500/10 p-5 text-red-700 dark:text-red-400">{error}</div></main>;

    const tabs: { key: FilterKey; label: string; count: number }[] = [
        { key: "all", label: t("diagnostics.hub.tabs.all"), count: items.length },
        { key: "available", label: t("diagnostics.hub.tabs.available"), count: items.filter((i) => i.state === "available").length },
        { key: "in_progress", label: t("diagnostics.hub.tabs.inProgress"), count: inProgress },
        { key: "completed", label: t("diagnostics.hub.tabs.completed"), count: completed },
    ];

    return (
        <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013]">
            <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
                {/* Hero — professional workbench header */}
                <section className="relative overflow-hidden rounded-[28px] bg-[#0f1115] p-7 text-white sm:p-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3A3A3A] via-[#232323] to-[#0f1115]" />
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#F47822]/20 blur-3xl" />
                    <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-white/[0.04] blur-3xl" />

                    <div className="relative">
                        <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]"><Sparkles className="h-3.5 w-3.5" /> {t("diagnostics.hub.eyebrow")}</p>
                        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
                            <div className="max-w-[640px]">
                                <h1 className="text-3xl font-black tracking-tight sm:text-[32px]">{t("diagnostics.hub.title")}</h1>
                                <p className="mt-2 text-sm leading-6 text-white/60">{t("diagnostics.hub.description")}</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Link to="/diagnostics/history" className="inline-flex items-center gap-2 rounded-full bg-[#F47822] px-4 py-2 text-xs font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.35)] transition-all hover:-translate-y-px hover:bg-[#E96D18] hover:shadow-[0_10px_24px_rgba(244,120,34,0.4)] active:translate-y-0"><History className="h-4 w-4" /> {t("diagnostics.hub.history")}</Link>
                                    {courseFilter && <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F47822] px-3.5 py-1.5 text-xs font-bold text-white">{t("diagnostics.hub.courseFilter")}</span>}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="min-w-[120px] rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">{t("diagnostics.hub.completed")}</p>
                                    <p className="mt-1 flex items-baseline gap-1 text-2xl font-black text-white">{completed}<span className="text-sm font-bold text-white/30">/{items.length}</span></p>
                                </div>
                                <div className="hidden min-w-[120px] rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur sm:block">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">{t("diagnostics.hub.bench")}</p>
                                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-white"><Wrench className="h-4 w-4 text-[#F47822]" /> {t("diagnostics.hub.toolsCount")}</p>
                                    <p className="text-xs text-white/40">{t("diagnostics.hub.toolsList")}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Controls */}
                <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {tabs.map((t) => (
                            <button key={t.key} onClick={() => setFilter(t.key)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${filter === t.key ? "bg-[#3A3A3A] text-white shadow" : "bg-white dark:bg-[#1b1b20] text-[#3A3A3A]/60 dark:text-white/60 hover:bg-white dark:hover:bg-[#1b1b20] hover:text-[#3A3A3A] dark:hover:text-[#ececef] border border-[#3A3A3A]/10 dark:border-white/10"}`}>
                                {t.label} <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${filter === t.key ? "bg-white/15 text-white" : "bg-[#3A3A3A]/10 dark:bg-white/10 text-[#3A3A3A]/60 dark:text-white/60"}`}>{t.count}</span>
                            </button>
                        ))}
                    </div>
                    <label className="relative block w-full max-w-[380px]">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/30 dark:text-white/30" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("diagnostics.hub.searchPh")} className="h-11 w-full rounded-2xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] pl-10 pr-3 text-sm outline-none placeholder:text-[#3A3A3A]/30 dark:placeholder:text-white/30 focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/10" />
                    </label>
                </div>

                {/* Grid */}
                {filtered.length === 0 ? (
                    <section className="mt-6 rounded-[28px] border border-dashed border-[#3A3A3A]/15 dark:border-white/15 bg-white dark:bg-[#1b1b20] p-10 text-center">
                        <div className="mx-auto max-w-md">
                            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#3A3A3A] text-white"><Filter className="h-5 w-5" /></div>
                            <h3 className="mt-4 text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("diagnostics.hub.emptyTitle")}</h3>
                            <p className="mt-1 text-sm text-[#3A3A3A]/60 dark:text-white/60">{courseFilter ? t("diagnostics.hub.emptyCourse") : query || filter !== "all" ? t("diagnostics.hub.emptySearch") : t("diagnostics.hub.emptyEnroll")}</p>
                        </div>
                    </section>
                ) : (
                    <motion.section layout className="mt-6 grid gap-5 lg:grid-cols-2">
                        {filtered.map((item) => (
                            <DiagnosticCard key={item.id} item={item} />
                        ))}
                    </motion.section>
                )}

                <p className="mt-6 flex items-center gap-2 text-xs text-[#3A3A3A]/40 dark:text-white/40"><AwardIcon className="h-3.5 w-3.5 text-[#F47822]" /> {t("diagnostics.hub.footer")}</p>
            </div>
        </main>
    );
}
