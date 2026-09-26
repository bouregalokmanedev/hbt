import type { SchematicWorkspaceEngine, WorkspaceState, WorkspaceMode, WorkspaceView } from "../engine/workspace.engine";
import { schByKey } from "../data/schematic.data";
import clsx from "clsx";
import { Search, Layers, Menu, Printer, Download, Play, Pause, LayoutGrid } from "lucide-react";

const MODES: WorkspaceMode[] = ["study", "trace", "training", "practice", "exam"];
const VIEWS: WorkspaceView[] = ["schematic", "circuit"];

/** Top bar — brand + search + mode pills + layers + print/export. Matches platform header language. */
export function TopBar({ engine, state, t }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any }) {
    return (
        <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-[#3A3A3A]/10 bg-white px-3 dark:border-white/10 dark:bg-[#1b1b20] sm:gap-3 sm:px-4">
            <button
                type="button"
                onClick={() => engine.toggleDrawer()}
                aria-label={t("controls.menu")}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[#3A3A3A]/10 bg-[#F8F7F6] text-[#3A3A3A]/70 transition hover:border-[#B85708]/20 hover:text-[#B85708] dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70 lg:hidden"
            >
                <Menu className="h-4 w-4" />
            </button>
            <div className="hidden items-center gap-2 sm:flex">
                <span className="h-2 w-2 rounded-full bg-[#B85708] shadow-[0_0_8px_rgba(184,87,8,0.5)]" />
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#3A3A3A] dark:text-white">R16</span>
                <span className="hidden text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40 lg:inline">{t("brand")}</span>
            </div>
            <div className="hidden h-6 w-px bg-[#3A3A3A]/10 dark:bg-white/10 sm:block" />
            <button
                type="button"
                onClick={() => engine.openSearch()}
                className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-[#F8F7F6] px-3 text-start transition hover:border-[#B85708]/20 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.08] md:max-w-[320px]"
            >
                <Search className="h-4 w-4 shrink-0 text-[#3A3A3A]/40 dark:text-white/40" />
                <span className="hidden truncate text-sm font-medium text-[#3A3A3A]/50 dark:text-white/50 sm:inline">{t("search.button")}</span>
                <span className="ms-auto hidden rounded-md border border-[#3A3A3A]/10 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#3A3A3A]/40 dark:border-white/10 dark:bg-white/10 dark:text-white/40 sm:inline">⌘K</span>
            </button>
            <div className="flex-1 sm:hidden" />
            <div className="flex items-center rounded-xl bg-[#3A3A3A]/[.06] p-1 dark:bg-white/[0.07]">
                {MODES.map((m) => (
                    <button
                        key={m}
                        type="button"
                        onClick={() => engine.setMode(m)}
                        aria-current={state.mode === m ? "page" : undefined}
                        className={clsx(
                            "rounded-lg px-2.5 py-1.5 text-xs font-black capitalize transition sm:px-3",
                            state.mode === m
                                ? "bg-[#B85708] text-white shadow-sm"
                                : "text-[#3A3A3A]/60 hover:text-[#3A3A3A] dark:text-white/60 dark:hover:text-white",
                        )}
                    >
                        {t(`mode.${m}`)}
                    </button>
                ))}
            </div>
            <button
                type="button"
                onClick={() => engine.toggleLayersPanel()}
                aria-pressed={state.showLayers}
                className={clsx(
                    "hidden h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition sm:inline-flex",
                    state.showLayers
                        ? "border-[#B85708]/20 bg-[#B85708]/10 text-[#B85708]"
                        : "border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/60 hover:border-[#B85708]/20 hover:text-[#B85708] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/60",
                )}
            >
                <Layers className="h-3.5 w-3.5" />
                {t("layers.title")}
                <span className={clsx("ms-1 hidden rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold lg:inline", state.showLayers ? "bg-[#B85708] text-white" : "bg-[#3A3A3A]/10 text-[#3A3A3A]/60 dark:bg-white/10")}>
                    {engine.layersOnCount()}
                </span>
            </button>
            <button type="button" disabled aria-disabled className="hidden h-9 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-xs font-bold text-[#3A3A3A]/25 dark:border-white/10 dark:bg-[#1b1b20] sm:inline-flex">
                <Printer className="h-3.5 w-3.5" />
                {t("controls.print")}
            </button>
            <button type="button" disabled aria-disabled className="hidden h-9 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-xs font-bold text-[#3A3A3A]/25 dark:border-white/10 dark:bg-[#1b1b20] sm:inline-flex">
                <Download className="h-3.5 w-3.5" />
                {t("controls.export")}
            </button>
        </div>
    );
}

/** Sub bar — breadcrumb + view tabs + layout + trace controls. */
export function SubBar({
    engine,
    state,
    t,
    tc,
    layout,
    setLayout,
}: {
    engine: SchematicWorkspaceEngine;
    state: WorkspaceState;
    t: any;
    tc: any;
    layout: "a" | "b" | "c";
    setLayout: (l: "a" | "b" | "c") => void;
}) {
    const isTrace = state.mode === "trace";
    const sheet = schByKey("R16")!;
    const progress = isTrace ? engine.traceProgress() : 0;

    return (
        <div className="flex min-h-[44px] flex-wrap items-center gap-2 border-b border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 py-2 dark:border-white/10 dark:bg-[#232329] sm:gap-3 sm:px-4">
            <div className="hidden min-w-0 items-center gap-2 truncate text-sm text-[#3A3A3A]/50 dark:text-white/50 md:flex">
                <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-[#3A3A3A]/30 dark:text-white/30" />
                <span className="truncate">{t("systems.engine")}</span>
                <span className="text-[#3A3A3A]/20 dark:text-white/20">/</span>
                <span dir="ltr" className="truncate font-semibold text-[#3A3A3A] dark:text-white">
                    R16 — {sheet.name}
                </span>
                <span className="shrink-0 rounded-full border border-[#B85708]/20 bg-[#B85708]/10 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-[#B85708]">{t("sheet")}</span>
            </div>
            <span className="hidden h-5 w-px bg-[#3A3A3A]/10 dark:bg-white/10 md:block" />
            <div className="flex items-center rounded-xl bg-[#3A3A3A]/[.06] p-1 dark:bg-white/[0.07]">
                {VIEWS.map((v) => (
                    <button
                        key={v}
                        type="button"
                        onClick={() => engine.setView(v)}
                        aria-current={state.view === v ? "page" : undefined}
                        className={clsx(
                            "rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition",
                            state.view === v ? "bg-white text-[#3A3A3A] shadow-sm dark:bg-[#1b1b20] dark:text-white" : "text-[#3A3A3A]/50 hover:text-[#3A3A3A] dark:text-white/50",
                        )}
                    >
                        {t(`view.${v}`)}
                    </button>
                ))}
            </div>
            <div className="hidden items-center gap-2 lg:flex">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/30 dark:text-white/30">{t("layout.label")}</span>
                <div className="flex items-center rounded-xl bg-[#3A3A3A]/[.06] p-1 dark:bg-white/[0.07]">
                    {(["a", "b", "c"] as const).map((l) => (
                        <button
                            key={l}
                            type="button"
                            onClick={() => setLayout(l)}
                            title={t(`layout.${l}`)}
                            aria-current={layout === l ? "true" : undefined}
                            className={clsx(
                                "grid h-7 w-7 place-items-center rounded-lg text-xs font-black uppercase transition",
                                layout === l ? "bg-white text-[#B85708] shadow-sm dark:bg-[#1b1b20]" : "text-[#3A3A3A]/40 hover:text-[#3A3A3A] dark:text-white/40",
                            )}
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {isTrace ? (
                <div className="flex w-full items-center gap-2 rounded-xl border border-[#B85708]/20 bg-white px-3 py-2 dark:border-[#B85708]/20 dark:bg-[#1b1b20] md:w-auto">
                    <span className="hidden font-mono text-[10px] font-black uppercase tracking-wide text-[#B85708] sm:inline">{t("trace.kicker")}</span>
                    <div className="flex items-center gap-1 overflow-x-auto">
                        {engine.traces().map((tr) => (
                            <button
                                key={tr.id}
                                type="button"
                                onClick={() => engine.setTrace(tr.id)}
                                aria-current={state.trace === tr.id ? "true" : undefined}
                                className={clsx(
                                    "shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition",
                                    state.trace === tr.id ? "bg-[#B85708] text-white" : "bg-[#3A3A3A]/[.06] text-[#3A3A3A]/60 hover:bg-[#3A3A3A]/10 dark:bg-white/10 dark:text-white/60",
                                )}
                            >
                                {tc(tr.labelId)}
                            </button>
                        ))}
                    </div>
                    <div className="ms-2 hidden h-6 w-px bg-[#3A3A3A]/10 dark:bg-white/10 sm:block" />
                    <button
                        type="button"
                        onClick={() => (state.tracePlaying ? engine.tracePause() : engine.tracePlay())}
                        className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-[#B85708] px-3 text-xs font-black text-white transition hover:bg-[#9A4A06]"
                    >
                        {state.tracePlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        {state.tracePlaying ? t("trace.pause") : t("trace.play")}
                    </button>
                    <div className="hidden items-center gap-2 sm:flex">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#3A3A3A]/10 dark:bg-white/10">
                            <div className="h-full rounded-full bg-[#B85708] transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-[#B85708]">{progress}%</span>
                    </div>
                </div>
            ) : null}

            <div className="ms-auto hidden items-center gap-2 text-xs font-bold text-[#3A3A3A]/40 dark:text-white/40 sm:flex">
                <span className="rounded-full bg-white px-2.5 py-1 font-mono text-[11px] dark:bg-[#1b1b20]">{t("layers.count", { n: engine.layersOnCount() })}</span>
            </div>
        </div>
    );
}
