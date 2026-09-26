import type { SchematicWorkspaceEngine, WorkspaceState } from "../engine/workspace.engine";
import { SCH_COMPONENTS, schByKey, wiresFor } from "../data/schematic.data";
import clsx from "clsx";
import { Search, X, Cpu, Zap, Network, Power, Clock3, Bookmark, History, Target, TrendingUp } from "lucide-react";

const SYSTEMS: { key: string; labelKey: string; count: number; dot: string; onClick: (e: SchematicWorkspaceEngine) => void; icon: React.ReactNode }[] = [
    { key: "engine", labelKey: "systems.engine", count: SCH_COMPONENTS.length, dot: "#B85708", icon: <Cpu className="h-3.5 w-3.5" />, onClick: () => {} },
    { key: "ecu", labelKey: "systems.ecu", count: 2, dot: "#3B6FE0", icon: <Cpu className="h-3.5 w-3.5" />, onClick: (e) => e.openConnector("A") },
    { key: "can", labelKey: "systems.can", count: 2, dot: "#3B6FE0", icon: <Network className="h-3.5 w-3.5" />, onClick: (e) => e.select("CAN1") },
    { key: "power", labelKey: "systems.power", count: 11, dot: "#F59E0B", icon: <Power className="h-3.5 w-3.5" />, onClick: (e) => e.select("F_EFI1") },
];
const BOOKMARKS = [
    { key: "E1", labelKey: "bookmarks.ecu", icon: <Cpu className="h-3.5 w-3.5 text-[#B85708]" /> },
    { key: "G_BA", labelKey: "bookmarks.ground", icon: <Zap className="h-3.5 w-3.5 text-emerald-600" /> },
    { key: "R16", labelKey: "bookmarks.relay", icon: <Power className="h-3.5 w-3.5 text-[#F59E0B]" /> },
];

/** Left sidebar — 5 sections with platform card language. */
export function Sidebar({ engine, state, t, tc }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any; tc: any }) {
    const comps = engine.filteredComponents();
    const pct = engine.accuracyPct();

    return (
        <aside className="flex w-[300px] shrink-0 flex-col overflow-hidden border-e border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
            <div className="border-b border-[#3A3A3A]/10 p-3 dark:border-white/10">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/30 dark:text-white/30" />
                    <input
                        type="search"
                        value={state.filter}
                        onChange={(e) => engine.setFilter(e.target.value)}
                        placeholder={t("sidebar.filter")}
                        aria-label={t("sidebar.filter")}
                        className="h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#F8F7F6] py-2 pe-9 ps-10 text-sm font-medium text-[#3A3A3A] placeholder:text-[#3A3A3A]/40 focus:border-[#B85708]/30 focus:outline-none focus:ring-2 focus:ring-[#B85708]/10 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/40"
                    />
                    {state.filter ? (
                        <button
                            type="button"
                            onClick={() => engine.setFilter("")}
                            className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-lg text-[#3A3A3A]/40 hover:bg-[#3A3A3A]/10 hover:text-[#3A3A3A] dark:text-white/40"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-3">
                {/* Vehicle systems */}
                <section className="rounded-2xl border border-[#3A3A3A]/10 bg-[#F8F7F6] p-3 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-2 px-1 pb-2">
                        <div className="grid h-6 w-6 place-items-center rounded-lg bg-[#B85708]/10 text-[#B85708]">
                            <LayoutGridIcon />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#3A3A3A] dark:text-white">{t("sidebar.systems")}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        {SYSTEMS.map((s, i) => (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => s.onClick(engine)}
                                className={clsx(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-start transition",
                                    i === 0 ? "bg-white shadow-sm ring-1 ring-[#3A3A3A]/5 dark:bg-[#1b1b20]" : "hover:bg-white dark:hover:bg-white/[0.06]",
                                )}
                            >
                                <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-[#3A3A3A]/70 shadow-sm ring-1 ring-[#3A3A3A]/10 dark:bg-white/10 dark:text-white/70" style={{ color: s.dot }}>
                                    {s.icon}
                                </span>
                                <span className={clsx("flex-1 text-sm font-bold", i === 0 ? "text-[#B85708]" : "text-[#3A3A3A] dark:text-white")}>{t(s.labelKey)}</span>
                                <span className="rounded-full bg-[#3A3A3A]/10 px-2 py-0.5 font-mono text-xs font-bold text-[#3A3A3A]/60 dark:bg-white/10 dark:text-white/60">{s.count}</span>
                            </button>
                        ))}
                    </div>
                    <p className="mt-3 rounded-xl border border-dashed border-[#3A3A3A]/15 bg-white px-3 py-2 text-xs leading-5 text-[#3A3A3A]/50 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/50">{tc("schematic.na.systems")}</p>
                </section>

                {/* Components on sheet */}
                <section>
                    <div className="flex items-center justify-between px-1 pb-2">
                        <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#3A3A3A]/40 dark:text-white/40">
                            <Target className="h-3.5 w-3.5" />
                            {t("sidebar.components")}
                        </span>
                        <span className="rounded-full bg-[#B85708]/10 px-2 py-0.5 font-mono text-xs font-bold text-[#B85708]">{comps.length}</span>
                    </div>
                    <div className="flex max-h-[320px] flex-col gap-1 overflow-y-auto rounded-2xl border border-[#3A3A3A]/10 bg-white p-1.5 dark:border-white/10 dark:bg-[#1b1b20]">
                        {comps.length === 0 ? (
                            <div className="p-6 text-center text-sm text-[#3A3A3A]/40 dark:text-white/40">No components</div>
                        ) : (
                            comps.map((c) => {
                                const on = state.sel === c.key;
                                return (
                                    <button
                                        key={c.key}
                                        type="button"
                                        onClick={() => engine.select(c.key)}
                                        onMouseEnter={() => engine.setHover(c.key)}
                                        onMouseLeave={() => engine.setHover(null)}
                                        aria-current={on ? "true" : undefined}
                                        className={clsx(
                                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-start transition",
                                            on ? "bg-[#B85708] text-white shadow-sm" : "hover:bg-[#F8F7F6] dark:hover:bg-white/[0.06]",
                                        )}
                                    >
                                        <span
                                            dir="ltr"
                                            className={clsx("grid h-7 min-w-[52px] place-items-center rounded-lg font-mono text-xs font-black", on ? "bg-white/20 text-white" : "bg-[#F8F7F6] text-[#3A3A3A]/60 dark:bg-white/10 dark:text-white/60")}
                                        >
                                            {c.code}
                                        </span>
                                        <span className={clsx("min-w-0 flex-1 truncate text-sm font-semibold", on ? "text-white" : "text-[#3A3A3A] dark:text-white")}>{c.name}</span>
                                        <span className={clsx("grid h-6 min-w-6 place-items-center rounded-full font-mono text-xs font-bold", on ? "bg-white/20 text-white" : "bg-[#3A3A3A]/10 text-[#3A3A3A]/60 dark:bg-white/10")}>{wiresFor(c.key).length}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* Recent */}
                <section className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-3 dark:border-white/10 dark:bg-[#1b1b20]">
                    <div className="flex items-center gap-1.5 px-1 pb-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#3A3A3A]/40 dark:text-white/40">
                        <History className="h-3.5 w-3.5" />
                        {t("sidebar.recent")}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {state.recent.length ? (
                            state.recent.map((k) => (
                                <button
                                    key={k}
                                    type="button"
                                    onClick={() => engine.select(k)}
                                    dir="ltr"
                                    className="rounded-full border border-[#3A3A3A]/10 bg-[#F8F7F6] px-3 py-1.5 font-mono text-xs font-bold text-[#3A3A3A]/70 transition hover:border-[#B85708]/30 hover:bg-[#B85708]/10 hover:text-[#B85708] dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70"
                                >
                                    {schByKey(k)!.code}
                                </button>
                            ))
                        ) : (
                            <span className="px-1 text-sm text-[#3A3A3A]/40 dark:text-white/40">{tc("schematic.na.recent")}</span>
                        )}
                    </div>
                </section>

                {/* Training progress */}
                <section className="rounded-2xl bg-[#B85708] p-4 text-white">
                    <div className="flex items-center gap-2 pb-3 text-[11px] font-black uppercase tracking-[0.12em] text-white/70">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {t("sidebar.progress")}
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-black">{pct}%</span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-xs font-bold">{t("sidebar.attempts", { n: state.attempts })}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/20">
                        <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-2 text-xs font-medium text-white/80">{t("sidebar.progressNote", { done: state.taskDone, total: 8 })}</p>
                    <div className="mt-3 flex gap-1">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <span key={i} className={clsx("h-1.5 flex-1 rounded-full", i < state.taskDone ? "bg-white" : "bg-white/30")} />
                        ))}
                    </div>
                </section>

                {/* Bookmarks */}
                <section>
                    <div className="flex items-center gap-1.5 px-1 pb-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#3A3A3A]/40 dark:text-white/40">
                        <Bookmark className="h-3.5 w-3.5" />
                        {t("sidebar.bookmarks")}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {BOOKMARKS.map((b) => (
                            <button
                                key={b.key}
                                type="button"
                                onClick={() => engine.select(b.key)}
                                className="flex flex-col items-center gap-1.5 rounded-2xl border border-[#3A3A3A]/10 bg-white p-3 text-center transition hover:border-[#B85708]/30 hover:bg-[#B85708]/5 dark:border-white/10 dark:bg-[#1b1b20] dark:hover:bg-white/[0.06]"
                            >
                                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#F8F7F6] dark:bg-white/10">{b.icon}</span>
                                <span className="text-xs font-bold text-[#3A3A3A] dark:text-white">{t(b.labelKey)}</span>
                                <span className="font-mono text-[11px] text-[#3A3A3A]/40 dark:text-white/40">{b.key}</span>
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </aside>
    );
}

function LayoutGridIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
    );
}
