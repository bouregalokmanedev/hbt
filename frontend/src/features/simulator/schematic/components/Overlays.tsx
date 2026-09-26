import { useEffect } from "react";
import type { SchematicWorkspaceEngine, WorkspaceState } from "../engine/workspace.engine";
import { SCH_LAYERS, SCH_WIRES, schByKey, wiresFor } from "../data/schematic.data";
import { swatchBg } from "../lib";
import clsx from "clsx";
import { Search, X, Layers, Plug, Car, ChevronRight } from "lucide-react";

/** All schematic overlays: search palette, connector modal, vehicle modal, layers panel. */
export function Overlays({ engine, state, t, tc }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any; tc: any }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                engine.openSearch();
            }
            if (e.key === "Escape") {
                engine.closeSearch();
                engine.closeConnector();
                engine.closeVehicle();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [engine]);

    return (
        <>
            {state.showLayers ? <LayersPanel engine={engine} state={state} t={t} /> : null}
            {state.showSearch ? <SearchPalette engine={engine} state={state} t={t} tc={tc} /> : null}
            {state.showConnector ? <ConnectorModal engine={engine} state={state} t={t} /> : null}
            {state.showVehicle ? <VehicleModal engine={engine} t={t} tc={tc} /> : null}
        </>
    );
}

function Scrim({ onClose, children, items }: { onClose: () => void; children: React.ReactNode; items?: string }) {
    return (
        <div role="dialog" aria-modal="true" onClick={onClose} className={clsx("fixed inset-0 z-[60] flex bg-[#0f1115]/60 backdrop-blur-md", items ?? "items-center justify-center p-6")}>
            <div onClick={(e) => e.stopPropagation()} className="animate-[in_.2s_ease] w-full max-w-[min(100%,640px)]">
                {children}
            </div>
        </div>
    );
}

function LayersPanel({ engine, state, t }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any }) {
    return (
        <div className="absolute right-4 top-4 z-[25] w-[300px] overflow-hidden rounded-2xl border border-[#3A3A3A]/10 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#1b1b20]">
            <div className="flex items-center justify-between border-b border-[#3A3A3A]/10 bg-[#F8F7F6] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                <span className="flex items-center gap-2 text-sm font-black text-[#3A3A3A] dark:text-white">
                    <Layers className="h-4 w-4 text-[#B85708]" />
                    {t("layers.title")}
                </span>
                <button type="button" onClick={() => engine.toggleLayersPanel()} aria-label="Close" className="grid h-7 w-7 place-items-center rounded-xl bg-white text-[#3A3A3A]/60 shadow-sm ring-1 ring-[#3A3A3A]/10 transition hover:bg-[#3A3A3A] hover:text-white dark:bg-white/10 dark:text-white/60">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-2">
                {SCH_LAYERS.map((l) => {
                    const on = engine.layerOn(l.key);
                    return (
                        <button
                            key={l.key}
                            type="button"
                            onClick={() => engine.toggleLayer(l.key)}
                            disabled={l.na}
                            aria-pressed={on}
                            aria-disabled={l.na}
                            className={clsx("flex h-11 w-full items-center gap-3 rounded-xl px-3 text-start transition", l.na ? "cursor-not-allowed opacity-40" : "hover:bg-[#F8F7F6] dark:hover:bg-white/[0.06]")}
                        >
                            <span className={clsx("relative h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors", on ? "bg-[#B85708]" : "bg-[#3A3A3A]/15 dark:bg-white/15")}>
                                <span className={clsx("block h-5 w-5 rounded-full bg-white shadow-sm transition-transform", on ? "translate-x-5" : "translate-x-0")} />
                            </span>
                            <span className="flex-1 text-sm font-semibold text-[#3A3A3A] dark:text-white">{t(`layers.${l.key}`)}</span>
                            {l.na ? <span className="rounded-full bg-[#3A3A3A]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#3A3A3A]/50 dark:bg-white/10 dark:text-white/50">{t("layers.noData")}</span> : null}
                        </button>
                    );
                })}
            </div>
            <div className="border-t border-[#3A3A3A]/10 bg-[#F8F7F6] px-4 py-2.5 text-xs font-medium text-[#3A3A3A]/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">{t("layers.hint")}</div>
        </div>
    );
}

function SearchPalette({ engine, state, t, tc }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any; tc: any }) {
    const results = engine.search();
    return (
        <Scrim onClose={() => engine.closeSearch()} items="items-start justify-center pt-[10vh]">
            <div className="overflow-hidden rounded-[20px] border border-[#3A3A3A]/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:border-white/10 dark:bg-[#1b1b20]">
                <div className="flex items-center gap-3 border-b border-[#3A3A3A]/10 px-4 py-3 dark:border-white/10">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#B85708]/10 text-[#B85708]">
                        <Search className="h-4 w-4" />
                    </div>
                    <input
                        autoFocus
                        value={state.query}
                        onChange={(e) => engine.setQuery(e.target.value)}
                        placeholder={t("search.placeholder")}
                        aria-label={t("search.placeholder")}
                        className="flex-1 bg-transparent text-sm font-medium text-[#3A3A3A] placeholder:text-[#3A3A3A]/40 focus:outline-none dark:text-white dark:placeholder:text-white/40"
                    />
                    <span className="hidden rounded-lg border border-[#3A3A3A]/10 bg-[#F8F7F6] px-2 py-1 font-mono text-[11px] font-bold text-[#3A3A3A]/50 dark:border-white/10 dark:bg-white/10 dark:text-white/50 sm:inline">ESC</span>
                    <button type="button" onClick={() => engine.closeSearch()} className="grid h-8 w-8 place-items-center rounded-xl text-[#3A3A3A]/40 hover:bg-[#3A3A3A]/10 hover:text-[#3A3A3A] dark:text-white/40">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="max-h-[380px] overflow-y-auto p-2">
                    {results.length === 0 && state.query.trim() ? (
                        <div className="p-8 text-center">
                            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#3A3A3A]/5 dark:bg-white/5">
                                <Search className="h-6 w-6 text-[#3A3A3A]/20 dark:text-white/20" />
                            </div>
                            <p className="mt-3 text-sm font-bold text-[#3A3A3A] dark:text-white">No results</p>
                            <p className="mt-1 text-xs text-[#3A3A3A]/50 dark:text-white/50">{tc("schematic.na.search")}</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-6 text-center text-sm text-[#3A3A3A]/40 dark:text-white/40">Type a component code, pin, or colour…</div>
                    ) : (
                        results.map((r, i) => {
                            const c = schByKey(r.key)!;
                            const w = r.wireIdx != null ? SCH_WIRES[r.wireIdx] : null;
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                        engine.closeSearch();
                                        if (r.wireIdx != null) engine.selectWire(r.wireIdx);
                                        else engine.select(r.key);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start transition hover:bg-[#FFF7ED] dark:hover:bg-white/[0.06]"
                                >
                                    <span className="grid h-7 min-w-[64px] place-items-center rounded-lg bg-[#3A3A3A] px-2 font-mono text-[10px] font-black uppercase tracking-wide text-white dark:bg-white dark:text-[#3A3A3A]">{t(`search.kind.${r.kind}`)}</span>
                                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#3A3A3A] dark:text-white">{w ? `ECU ${w.ecuPin} · ${w.ecuColour} → ${c.name} ${w.targetPin}` : `${c.code} — ${c.name}`}</span>
                                    <span className="hidden items-center gap-1 text-xs text-[#3A3A3A]/40 dark:text-white/40 sm:flex">
                                        {w ? <span className="h-3 w-3 rounded-sm border" style={{ background: w.ecuColour }} /> : null}
                                        {w ? w.ecuColour : `${wiresFor(r.key).length} pins`}
                                        <ChevronRight className="h-3 w-3" />
                                    </span>
                                </button>
                            );
                        })
                    )}
                </div>
                <div className="flex items-center gap-2 border-t border-[#3A3A3A]/10 bg-[#F8F7F6] px-4 py-2.5 text-xs dark:border-white/10 dark:bg-white/[0.03]">
                    <span className="font-medium text-[#3A3A3A]/60 dark:text-white/60">{t("search.footer")}</span>
                    <div className="flex-1" />
                    <span className="rounded-full bg-white px-2.5 py-1 font-mono text-xs font-bold text-[#3A3A3A] shadow-sm ring-1 ring-[#3A3A3A]/10 dark:bg-[#1b1b20] dark:text-white dark:ring-white/10">{results.length ? t("search.results", { n: results.length }) : "0 results"}</span>
                </div>
            </div>
        </Scrim>
    );
}

function ConnectorModal({ engine, state, t }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any }) {
    const code = state.showConnector!;
    const seen = new Set<string>();
    const pins = SCH_WIRES.map((w, i) => ({ w, i })).filter(({ w }) => w.ecuPin[0] === code && !seen.has(w.ecuPin + w.target + w.targetPin) && seen.add(w.ecuPin + w.target + w.targetPin));
    return (
        <div role="dialog" aria-modal="true" onClick={() => engine.closeConnector()} className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0f1115]/60 p-4 backdrop-blur-md sm:p-6">
            <div onClick={(e) => e.stopPropagation()} className="flex max-h-[88vh] w-full max-w-[960px] flex-col overflow-hidden rounded-[20px] border border-[#3A3A3A]/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:border-white/10 dark:bg-[#1b1b20]">
                <div className="flex items-center gap-3 border-b border-[#3A3A3A]/10 px-5 py-4 dark:border-white/10">
                    <span dir="ltr" className="grid h-9 w-9 place-items-center rounded-xl bg-[#B85708] font-mono text-sm font-black text-white shadow-sm">{code}</span>
                    <div>
                        <div className="text-sm font-black text-[#3A3A3A] dark:text-white">{t("connector.title", { code })}</div>
                        <div className="text-xs text-[#3A3A3A]/50 dark:text-white/50">{t("connector.meta")}</div>
                    </div>
                    <div className="ms-auto hidden items-center rounded-xl bg-[#3A3A3A]/[.06] p-1 dark:bg-white/[0.07] sm:flex">
                        {(["A", "B"] as const).map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => engine.openConnector(c)}
                                aria-current={code === c ? "true" : undefined}
                                className={clsx("rounded-lg px-3 py-1.5 text-xs font-black transition", code === c ? "bg-[#B85708] text-white shadow-sm" : "text-[#3A3A3A]/60 hover:text-[#3A3A3A] dark:text-white/60")}
                            >
                                {t("connector.tab", { code: c })}
                            </button>
                        ))}
                    </div>
                    <button type="button" onClick={() => engine.closeConnector()} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-xl border border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/60 transition hover:bg-[#3A3A3A] hover:text-white dark:border-white/10 dark:bg-white/10">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="overflow-y-auto bg-[#F8F7F6] p-4 dark:bg-[#101013] sm:p-5">
                    <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))" }}>
                        {pins.map(({ w, i }) => {
                            const c = schByKey(w.target)!;
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                        engine.closeConnector();
                                        engine.selectWire(i);
                                    }}
                                    className="group rounded-2xl border border-[#3A3A3A]/10 bg-white p-3 text-start shadow-sm transition hover:border-[#B85708]/30 hover:shadow-md dark:border-white/10 dark:bg-[#1b1b20]"
                                >
                                    <span className="mb-2 flex items-center gap-2">
                                        <span className="h-4 w-4 rounded-md border-2 border-white shadow-sm" style={{ background: w.ecuColour }} />
                                        <span dir="ltr" className="font-mono text-sm font-black text-[#3A3A3A] dark:text-white">{w.ecuPin}</span>
                                        <span className="ms-auto rounded-full bg-[#3A3A3A]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#3A3A3A]/60 dark:bg-white/10 dark:text-white/60">{w.ecuColour}</span>
                                    </span>
                                    <span className="block truncate text-sm font-semibold text-[#3A3A3A] dark:text-white">{c.code}</span>
                                    <span className="block truncate text-xs text-[#3A3A3A]/50 dark:text-white/50">{c.name} · {w.targetPin}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

function VehicleModal({ engine: _engine, t, tc }: { engine: SchematicWorkspaceEngine; t: any; tc: any }) {
    return (
        <div role="dialog" aria-modal="true" onClick={() => _engine.closeVehicle()} className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0f1115]/60 p-6 backdrop-blur-md">
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[520px] overflow-hidden rounded-[20px] border border-[#3A3A3A]/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:border-white/10 dark:bg-[#1b1b20]">
                <div className="flex items-center gap-3 border-b border-[#3A3A3A]/10 bg-[#F8F7F6] px-6 py-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#B85708]/10 text-[#B85708]">
                        <Car className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-black text-[#3A3A3A] dark:text-white">{t("vehicle.title")}</span>
                    <button type="button" onClick={() => _engine.closeVehicle()} className="ms-auto grid h-8 w-8 place-items-center rounded-xl border border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/60 dark:border-white/10 dark:bg-white/10">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-6">
                    <div className="rounded-2xl border border-[#B85708]/20 bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] p-4 dark:from-[#B85708]/10 dark:to-[#B85708]/5 dark:border-[#B85708]/20">
                        <div dir="ltr" className="text-sm font-black text-[#3A3A3A] dark:text-white">{t("vehicle.name")}</div>
                        <div className="mt-1 text-sm text-[#3A3A3A]/60 dark:text-white/60">{t("vehicle.years")}</div>
                        <div className="mt-3 inline-flex rounded-full bg-[#B85708] px-3 py-1 text-xs font-bold text-white">R16 · 1ZR-FE · 2013–2018</div>
                    </div>
                    <p className="mt-4 rounded-2xl border-2 border-dashed border-[#3A3A3A]/15 bg-[#F8F7F6] p-4 text-center text-sm leading-5 text-[#3A3A3A]/60 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/60">{tc("schematic.na.vehicle")}</p>
                </div>
            </div>
        </div>
    );
}
