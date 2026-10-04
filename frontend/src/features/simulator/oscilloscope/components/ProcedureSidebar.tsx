import clsx from "clsx";
import type { ScopeEngine, ScopeEngineState } from "../engine/scope.engine";

const STEP_KEYS = ["probe", "vdiv", "timebase", "trigger", "capture", "cursors", "diagnosis"] as const;

const STEP_DEFAULTS: Record<(typeof STEP_KEYS)[number], string> = {
  probe: "Connect probes",
  vdiv: "Set V/div",
  timebase: "Set timebase",
  trigger: "Set trigger",
  capture: "Capture / Persist",
  cursors: "Use cursors",
  diagnosis: "Diagnosis",
};

/**
 * Left workstation sidebar — exercise header, the 7-step procedure checklist
 * (auto-detected via engine.stepChecks(), never manually ticked), the measurement
 * prose, the reference-values table, and the fault-injection chips.
 */
export function ProcedureSidebar({
  engine,
  state,
  t,
}: {
  engine: ScopeEngine;
  state: ScopeEngineState;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const comp = engine.comp();
  const k = engine.stepChecks();
  const done = [k.probeOk, k.vOk, k.tOk, k.trigOk, k.capOk, k.measOk, k.diagOk];
  const doneCount = done.filter(Boolean).length;

  return (
    <aside className="flex w-72 shrink-0 flex-col overflow-auto border-e border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
      <div className="border-b border-[#3A3A3A]/10 p-4 dark:border-white/10">
        <div className="text-[10px] font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
          {(t("oscilloscope.header.exercise", { defaultValue: "Exercise" }) as string)} {comp.code}
        </div>
        <h2 className="mt-0.5 text-lg font-black text-[#3A3A3A] dark:text-white" style={{ fontSize: 20 }}>
          {comp.name}
        </h2>
        <p className="mt-0.5 text-sm text-[#3A3A3A]/60 dark:text-white/60">
          {t(`content.oscilloscope.ex.${comp.id}.sub`, { defaultValue: comp.name }) as string}
        </p>
      </div>

      {/* procedure */}
      <div className="border-b border-[#3A3A3A]/10 p-4 dark:border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
            {t("oscilloscope.proc.title", { defaultValue: "Procedure" }) as string}
          </span>
          <span dir="ltr" className="font-mono text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
            {doneCount} / 7
          </span>
        </div>
        <ul className="mt-2 space-y-1.5">
          {STEP_KEYS.map((key, i) => (
            <li
              key={key}
              className={clsx(
                "flex items-start gap-2 rounded-xl border p-2",
                done[i] ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10" : "border-[#3A3A3A]/10 dark:border-white/10",
              )}
            >
              <span
                className={clsx(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-black",
                  done[i] ? "bg-[#0E9F6E] text-white" : "border border-[#3A3A3A]/15 text-[#3A3A3A]/40 dark:border-white/15 dark:text-white/40",
                )}
              >
                {done[i] ? "✓" : i + 1}
              </span>
              <span className="text-sm text-[#3A3A3A] dark:text-white">
                {t(`content.oscilloscope.step.${key}`, { defaultValue: STEP_DEFAULTS[key] }) as string}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* measurement */}
      <div className="border-b border-[#3A3A3A]/10 p-4 dark:border-white/10">
        <div className="text-[10px] font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
          {t("oscilloscope.proc.measurement", { defaultValue: "Measurement" }) as string}
        </div>
        <p className="mt-1.5 text-sm text-[#3A3A3A]/60 dark:text-white/60">
          {t(`content.oscilloscope.ex.${comp.id}.instruction`, { defaultValue: "Observe the waveform and compare to reference values." }) as string}
        </p>
      </div>

      {/* reference values */}
      <div className="border-b border-[#3A3A3A]/10 p-4 dark:border-white/10">
        <div className="text-[10px] font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
          {t("oscilloscope.proc.refValues", { defaultValue: "Reference values" }) as string}
        </div>
        <dl className="mt-2 space-y-1.5">
          {comp.specs.map((sp) => (
            <div key={sp.k} className="flex items-center justify-between gap-2">
              <dt className="text-sm text-[#3A3A3A]/60 dark:text-white/60">{sp.k}</dt>
              <dd dir="ltr" className="font-mono text-xs font-bold text-[#3A3A3A] dark:text-white">
                {sp.v}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* fault injection */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
            {t("oscilloscope.proc.faultInjection", { defaultValue: "Fault injection" }) as string}
          </span>
          <span className={clsx("text-[10px] font-black uppercase", state.fault === "none" ? "text-emerald-600" : "text-[#D92D20]")}>
            {state.fault === "none"
              ? (t("oscilloscope.proc.healthy", { defaultValue: "Healthy" }) as string)
              : (t("oscilloscope.proc.faultActive", { defaultValue: "Fault active" }) as string)}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {comp.faults.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => engine.setFault(f)}
              className={clsx(
                "rounded-md border px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0E9F6E]/30",
                state.fault === f
                  ? "border-[#0E9F6E] bg-[#0E9F6E]/10 text-[#0E9F6E]"
                  : "border-[#3A3A3A]/10 text-[#3A3A3A] hover:border-[#0E9F6E]/40 dark:border-white/10 dark:text-white",
              )}
            >
              {t(`content.oscilloscope.fault.${f}.label`, { defaultValue: f }) as string}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
