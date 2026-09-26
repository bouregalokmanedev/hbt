"use client";

import { useEffect } from "react";
import type { SchematicWorkspaceEngine, WorkspaceState } from "@sim/schematic";
import { SCH_LAYERS, SCH_WIRES, schByKey, wiresFor } from "@/data/schematic/workspace";
import { swatchBg } from "../lib";
import { cn } from "@/lib/cn";

/** All schematic overlays: search palette (⌘K), connector modal, vehicle modal,
 * layers panel. Each is engine-flag driven; Esc / scrim close. */
export function Overlays({ engine, state, t, tc }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any; tc: any }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); engine.openSearch(); }
      if (e.key === "Escape") { engine.closeSearch(); engine.closeConnector(); engine.closeVehicle(); }
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
    <div role="dialog" aria-modal="true" onClick={onClose} className={cn("fixed inset-0 z-[60] flex bg-ink/45 backdrop-blur-md", items ?? "items-center justify-center p-6")}>
      <div onClick={(e) => e.stopPropagation()} className="animate-[sch-fade_.2s_ease]">{children}</div>
    </div>
  );
}

function LayersPanel({ engine, state, t }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any }) {
  return (
    <div className="absolute right-4 top-4 z-[25] w-[266px] overflow-hidden rounded-xl border border-line bg-paper shadow-pop">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-3">
        <span className="t-section text-ink">{t("layers.title")}</span>
        <button type="button" onClick={() => engine.toggleLayersPanel()} aria-label="Close" className="focus-ring h-6 w-6 rounded text-neutralx-fg4">✕</button>
      </div>
      <div className="max-h-[420px] overflow-y-auto p-1.5">
        {SCH_LAYERS.map((l) => {
          const on = engine.layerOn(l.key);
          return (
            <button key={l.key} type="button" onClick={() => engine.toggleLayer(l.key)} disabled={l.na} aria-pressed={on} aria-disabled={l.na}
              className={cn("flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-start", l.na ? "cursor-not-allowed opacity-45" : "hover:bg-fill")}>
              <span className={cn("relative h-[18px] w-[30px] shrink-0 rounded-pill transition-colors", on ? "bg-mod-schematic" : "bg-line2")}>
                <span className={cn("absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-[left]", on ? "left-[14px]" : "left-0.5")} />
              </span>
              <span className="flex-1 t-body-sm text-ink">{t(`layers.${l.key}`)}</span>
              {l.na ? <span className="t-code text-[9.5px] text-neutralx-fg4">{t("layers.noData")}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SearchPalette({ engine, state, t, tc }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any; tc: any }) {
  const results = engine.search();
  return (
    <Scrim onClose={() => engine.closeSearch()} items="items-start justify-center pt-24">
      <div className="w-[620px] max-w-[92vw] overflow-hidden rounded-2xl border border-line bg-paper shadow-pop">
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3.5">
          <span aria-hidden className="text-neutralx-fg4">⌕</span>
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input autoFocus value={state.query} onChange={(e) => engine.setQuery(e.target.value)} placeholder={t("search.placeholder")} aria-label={t("search.placeholder")} className="flex-1 bg-transparent t-body text-ink outline-none" />
          <span dir="ltr" className="rounded border border-line px-1.5 py-0.5 t-code text-[10px] text-neutralx-fg4">ESC</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-2">
          {results.length === 0 && state.query.trim() ? (
            <div className="p-6 text-center t-body-sm text-neutralx-fg4">{tc("schematic.na.search")}</div>
          ) : results.map((r, i) => {
            const c = schByKey(r.key)!;
            const w = r.wireIdx != null ? SCH_WIRES[r.wireIdx] : null;
            return (
              <button key={i} type="button" onClick={() => { engine.closeSearch(); if (r.wireIdx != null) engine.selectWire(r.wireIdx); else engine.select(r.key); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start hover:bg-fill">
                <span className="min-w-[62px] rounded border border-line bg-paper2 px-1.5 py-0.5 text-center t-code text-[9px] tracking-[0.08em] text-neutralx-fg2">{t(`search.kind.${r.kind}`)}</span>
                <span className="min-w-0 flex-1 truncate t-body-sm text-ink">{w ? `ECU ${w.ecuPin} · ${w.ecuColour} → ${c.name} ${w.targetPin}` : `${c.code} — ${c.name}`}</span>
                <span dir="ltr" className="t-code text-neutralx-fg4">{w ? w.ecuColour : `${wiresFor(r.key).length}`}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 border-t border-line bg-paper2 px-4 py-2 t-body-sm text-neutralx-fg4">
          <span>{t("search.footer")}</span><div className="flex-1" /><span dir="ltr">{results.length ? t("search.results", { n: results.length }) : ""}</span>
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
    <Scrim onClose={() => engine.closeConnector()}>
      <div className="flex max-h-[88vh] w-[860px] max-w-[96vw] flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-pop">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span dir="ltr" className="t-code text-[16px] font-bold text-mod-schematic">{code}</span>
          <span className="t-section text-ink">{t("connector.title", { code })}</span>
          <span className="t-body-sm text-neutralx-fg4">{t("connector.meta")}</span>
          <div className="flex-1" />
          <div className="inline-flex rounded-lg border border-line bg-paper2 p-0.5">
            {(["A", "B"] as const).map((c) => (
              <button key={c} type="button" onClick={() => engine.openConnector(c)} aria-current={code === c ? "true" : undefined}
                className={cn("focus-ring rounded-md px-2.5 py-1 t-cta", code === c ? "bg-paper text-ink shadow-seg" : "text-neutralx-fg3")}>{t("connector.tab", { code: c })}</button>
            ))}
          </div>
          <button type="button" onClick={() => engine.closeConnector()} aria-label="Close" className="focus-ring h-7 w-7 rounded-md border border-line2 text-neutralx-fg4">✕</button>
        </div>
        <div className="overflow-y-auto p-5">
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(148px,1fr))" }}>
            {pins.map(({ w, i }) => {
              const c = schByKey(w.target)!;
              return (
                <button key={i} type="button" onClick={() => { engine.closeConnector(); engine.selectWire(i); }} className="rounded-[9px] border border-line2 p-2.5 text-start hover:border-mod-schematic">
                  <span className="mb-1.5 flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm border border-line2" style={{ background: swatchBg(w.ecuColour) }} />
                    <span dir="ltr" className="t-code text-[12px] font-bold text-ink">{w.ecuPin}</span>
                    <span dir="ltr" className="ms-auto t-body-sm text-neutralx-fg4">{w.ecuColour}</span>
                  </span>
                  <span className="block truncate t-body-sm text-neutralx-fg2">{c.code} {c.name} · {w.targetPin}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Scrim>
  );
}

function VehicleModal({ engine, t, tc }: { engine: SchematicWorkspaceEngine; t: any; tc: any }) {
  return (
    <Scrim onClose={() => engine.closeVehicle()}>
      <div className="w-[520px] max-w-[92vw] overflow-hidden rounded-2xl border border-line bg-paper shadow-pop">
        <div className="border-b border-line px-5 py-4 t-section text-ink">{t("vehicle.title")}</div>
        <div className="p-5">
          <div className="rounded-[10px] border border-mod-schematic bg-mod-schematicBg p-3.5">
            <div dir="ltr" className="t-section text-ink">{t("vehicle.name")}</div>
            <div className="t-body-sm text-neutralx-fg2">{t("vehicle.years")}</div>
          </div>
          <p className="mt-3 rounded-[10px] border border-dashed border-line2 p-3.5 t-body-sm text-neutralx-fg4">{tc("schematic.na.vehicle")}</p>
        </div>
      </div>
    </Scrim>
  );
}
