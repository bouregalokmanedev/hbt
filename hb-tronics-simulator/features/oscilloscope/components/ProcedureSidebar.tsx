"use client";

import type { ScopeEngine, ScopeEngineState } from "@sim/oscilloscope";
import { cn } from "@/lib/cn";

const STEP_KEYS = ["probe", "vdiv", "timebase", "trigger", "capture", "cursors", "diagnosis"] as const;

/**
 * Left workstation sidebar — exercise header, the 7-step procedure checklist
 * (auto-detected via engine.stepChecks(), never manually ticked), the measurement
 * prose, the reference-values table, and the fault-injection chips.
 */
export function ProcedureSidebar({ engine, state, t, tc }: { engine: ScopeEngine; state: ScopeEngineState; t: any; tc: any }) {
  const comp = engine.comp();
  const k = engine.stepChecks();
  const done = [k.probeOk, k.vOk, k.tOk, k.trigOk, k.capOk, k.measOk, k.diagOk];
  const doneCount = done.filter(Boolean).length;

  return (
    <aside className="flex w-72 shrink-0 flex-col overflow-auto border-e border-line bg-paper">
      <div className="border-b border-line p-4">
        <div className="t-eyebrow tracking-[0.1em] text-neutralx-fg3">{t("header.exercise")} {comp.code}</div>
        <h2 className="mt-0.5 t-title text-ink" style={{ fontSize: 20 }}>{comp.name}</h2>
        <p className="mt-0.5 t-body-sm text-neutralx-fg3">{tc(`oscilloscope.ex.${comp.id}.sub`)}</p>
      </div>

      {/* procedure */}
      <div className="border-b border-line p-4">
        <div className="flex items-center justify-between">
          <span className="t-eyebrow tracking-[0.1em] text-neutralx-fg3">{t("proc.title")}</span>
          <span dir="ltr" className="t-code text-neutralx-fg3">{doneCount} / 7</span>
        </div>
        <ul className="mt-2 space-y-1.5">
          {STEP_KEYS.map((key, i) => (
            <li key={key} className={cn("flex items-start gap-2 rounded-md border p-2", done[i] ? "border-ok-bg bg-ok-bg2" : "border-line3")}>
              <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-pill t-code", done[i] ? "bg-ok-mid text-white" : "border border-line2 text-neutralx-fg3")}>{done[i] ? "✓" : i + 1}</span>
              <span className="t-body-sm text-ink">{tc(`oscilloscope.step.${key}`)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* measurement */}
      <div className="border-b border-line p-4">
        <div className="t-eyebrow tracking-[0.1em] text-neutralx-fg3">{t("proc.measurement")}</div>
        <p className="mt-1.5 t-body-sm text-neutralx-fg3">{tc(`oscilloscope.ex.${comp.id}.instruction`)}</p>
      </div>

      {/* reference values */}
      <div className="border-b border-line p-4">
        <div className="t-eyebrow tracking-[0.1em] text-neutralx-fg3">{t("proc.refValues")}</div>
        <dl className="mt-2 space-y-1.5">
          {comp.specs.map((sp) => (
            <div key={sp.k} className="flex items-center justify-between gap-2">
              <dt className="t-body-sm text-neutralx-fg3">{sp.k}</dt>
              <dd dir="ltr" className="t-mono text-xs text-ink">{sp.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* fault injection */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="t-eyebrow tracking-[0.1em] text-neutralx-fg3">{t("proc.faultInjection")}</span>
          <span className={cn("t-eyebrow", state.fault === "none" ? "text-ok" : "text-fault")}>{state.fault === "none" ? t("proc.healthy") : t("proc.faultActive")}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {comp.faults.map((f) => (
            <button key={f} type="button" onClick={() => engine.setFault(f)} className={cn("focus-ring rounded-md border px-2 py-1 t-cta", state.fault === f ? "border-mod-oscilloscope bg-mod-oscilloscopeBg text-mod-oscilloscope" : "border-line2 text-ink hover:border-mod-oscilloscope")}>
              {tc(`oscilloscope.fault.${f}.label`)}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
