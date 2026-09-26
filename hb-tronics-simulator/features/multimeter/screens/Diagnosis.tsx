"use client";

import { useState } from "react";
import type { MeterProcedureEngine, MeterProcedureState } from "@sim/multimeter";
import { cn } from "@/lib/cn";
import { ProcedurePanel } from "../components/ProcedurePanel";
import { WiringView } from "../components/WiringView";
import { EcuPinView } from "../components/EcuPinView";
import { DmmPanel } from "../components/DmmPanel";
import { ProbeBench } from "../components/ProbeBench";
import { TabBar, type RefTab } from "../components/TabBar";

/**
 * Diagnosis workstation — the primary Multimeter screen. Diagnosis header +
 * complaint, the 6-tab reference bar (Wiring/ECU live), the data-driven procedure
 * panel, the wiring/ECU content area, and the DMM + probe bench. All state comes
 * from the MeterProcedureEngine.
 */
export function Diagnosis({ engine, state, t, tc, hints }: { engine: MeterProcedureEngine; state: MeterProcedureState; t: any; tc: any; hints: boolean }) {
  const comp = engine.component();
  const [tab, setTab] = useState<RefTab>("wiring");
  const [zoom, setZoom] = useState(1);
  const [pinsOn, setPinsOn] = useState(true);
  const [extended, setExtended] = useState(false);
  const resetWiring = () => { engine.clearProbes(); setZoom(1); setPinsOn(true); setExtended(false); };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-4">
      {/* diagnosis header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="t-eyebrow tracking-[0.1em] text-neutralx-fg3">{t("header.complaint")}</div>
          <h2 className="mt-0.5 flex items-baseline gap-2 t-title text-ink">
            <span dir="ltr" className="text-mod-multimeter">{comp.ref}</span>
            <span>{comp.name}</span>
          </h2>
          <p className="mt-1 max-w-2xl t-body-sm text-neutralx-fg3">{tc(`multimeter.${comp.ref}.complaint`)}</p>
        </div>
      </div>

      {/* tab bar */}
      <div className="mt-3">
        <TabBar active={tab} onSelect={setTab} t={t} />
      </div>

      {/* content grid */}
      <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_300px]">
        <ProcedurePanel comp={comp} state={state} engine={engine} t={t} tc={tc} hints={hints} />

        {/* wiring / ecu area */}
        <div className="flex min-h-[320px] flex-col rounded-xl border border-line bg-paper p-3 shadow-card">
          {tab === "wiring" ? (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <button type="button" onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))} aria-label={t("wiring.zoomOut")} className="focus-ring rounded-md border border-line2 px-2 py-1 t-code text-ink">−</button>
                <button type="button" onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))} aria-label={t("wiring.zoomIn")} className="focus-ring rounded-md border border-line2 px-2 py-1 t-code text-ink">+</button>
                <button type="button" onClick={resetWiring} className="focus-ring rounded-md border border-line2 px-2.5 py-1 t-cta text-info">{t("wiring.reset")}</button>
                <button type="button" onClick={() => setPinsOn((v) => !v)} aria-pressed={pinsOn} className={cn("focus-ring rounded-md border px-2.5 py-1 t-cta", pinsOn ? "border-mod-multimeter text-mod-multimeter" : "border-line2 text-ink")}>{t("wiring.viewPins")}</button>
                <button type="button" onClick={() => setExtended((v) => !v)} aria-pressed={extended} className={cn("focus-ring rounded-md border px-2.5 py-1 t-cta", extended ? "border-mod-multimeter text-mod-multimeter" : "border-line2 text-info")}>{t("wiring.extended")}</button>
                <div className="ms-auto flex items-center gap-2 t-eyebrow text-neutralx-fg3">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-xs border border-dashed border-fault-red" />{t("wiring.component")}</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-xs border border-ok-mid" />{t("wiring.controlUnit")}</span>
                </div>
              </div>
              <div className="min-h-0 flex-1">
                <WiringView comp={comp} state={state} engine={engine} t={t} zoom={zoom} pinsOn={pinsOn} extended={extended} />
              </div>
            </>
          ) : (
            <EcuPinView comp={comp} t={t} />
          )}
        </div>

        {/* DMM + probes */}
        <div className="space-y-3">
          <DmmPanel engine={engine} state={state} t={t} />
          <ProbeBench engine={engine} state={state} t={t} />
        </div>
      </div>

      {/* feedback / completion */}
      {state.feedback && (state.feedback.tone === "warn" || state.feedback.tone === "bad") ? (
        <div className={cn("mt-3 rounded-lg p-3 t-body-sm", state.feedback.tone === "bad" ? "bg-fault-bg2 text-fault" : "bg-warn-bg2 text-warn")}>
          {tc(`multimeter.feedback.${state.feedback.kind}`)}
        </div>
      ) : null}
      {state.finished ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-ok-bg bg-ok-bg2 p-3">
          <span className="t-section text-ok">{t(`progress.${state.done[comp.ref]?.status === "clear" ? "clear" : "found"}`)}</span>
          <span className="t-body-sm text-ink">{tc(`multimeter.verdict.${state.done[comp.ref]?.status === "clear" ? "clear" : "found"}`)}</span>
          <span dir="ltr" className="ms-auto t-mono text-ink">{state.score} / 100</span>
        </div>
      ) : null}
    </div>
  );
}
