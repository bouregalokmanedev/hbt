"use client";

import type { MeterProcedureEngine, MeterProcedureState } from "@sim/multimeter";
import type { MeterProcedureComponent, MeterMode, ProbeTarget } from "@/data/multimeter/procedures";
import { cn } from "@/lib/cn";

const MODE_LABEL: Record<MeterMode, string> = { OFF: "OFF", VDC: "V⎓", VAC: "V~", OHM: "Ω", MA: "mA", A: "A", HZ: "Hz" };

function targetName(target: ProbeTarget, comp: MeterProcedureComponent, t: any): string {
  if (target === "gnd") return t("proc.earth");
  if (target.charAt(0) === "e") return t("proc.ecuPin", { code: comp.ecu.code, n: target.slice(1) });
  return t("proc.componentPin", { n: target.slice(1) });
}

/**
 * Guided measurement procedure (data-driven — one panel, not one component per
 * step). Renders "Diagnosis n/N", a step accordion, the reference table where the
 * step has one, the YOUR MEASUREMENT readout (from engine.placement), and the
 * Yes / No / Hint controls. All actions call the engine; no scoring in React.
 */
export function ProcedurePanel({ comp, state, engine, t, tc, hints }: { comp: MeterProcedureComponent; state: MeterProcedureState; engine: MeterProcedureEngine; t: any; tc: any; hints: boolean }) {
  const pl = engine.placement();
  const step = comp.steps[state.stepIdx];
  const total = comp.steps.length;

  return (
    <div className="flex min-h-0 flex-col rounded-xl border border-line bg-paper p-4 shadow-card">
      <div className="t-section text-ink">{t("proc.diagnosis", { n: Math.min(state.stepIdx + 1, total), total })}</div>
      <p className="mt-0.5 t-body-sm text-neutralx-fg3">{tc(`multimeter.${comp.ref}.step.${state.stepIdx}.instruction`)}</p>

      <ol className="mt-3 space-y-2 overflow-auto">
        {comp.steps.map((s, i) => {
          const active = i === state.stepIdx && !state.finished;
          const done = i < state.stepIdx || (state.finished && i <= state.stepIdx);
          return (
            <li key={i} className={cn("rounded-lg border p-3", active ? "border-mod-multimeter bg-[#FBFDFF]" : done ? "border-ok-bg bg-ok-bg2" : "border-line3 opacity-70")}>
              <div className="flex items-start gap-2.5">
                <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill t-code", done ? "bg-ok-bg text-ok" : active ? "bg-mod-multimeter text-white" : "bg-fill text-neutralx-fg3")}>{done ? "✓" : i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className={cn("t-body-sm text-ink", !active && "line-clamp-1")}>{tc(`multimeter.${comp.ref}.step.${i}.instruction`)}</p>

                  {active ? (
                    <>
                      {s.table ? (
                        <table dir="ltr" className="ltr-island mt-2 w-full">
                          <thead>
                            <tr className="border-b border-line3">
                              <th className="py-1 text-start t-eyebrow text-neutralx-fg3">{s.table.head[0]}</th>
                              <th className="py-1 text-start t-eyebrow text-neutralx-fg3">{s.table.head[1]}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {s.table.rows.map((r) => (
                              <tr key={r[0]}>
                                <td className="py-0.5 t-mono text-xs text-ink">{r[0]}</td>
                                <td className="py-0.5 t-mono text-xs text-ink">{r[1]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : null}

                      {/* YOUR MEASUREMENT */}
                      <div className="mt-2.5 rounded-lg border border-line3 bg-paper2 p-2.5">
                        <div className="t-eyebrow tracking-[0.1em] text-mod-multimeter">{t("proc.yourMeasurement")}</div>
                        <Measure label={t("proc.redProbe")} dot="red" target={targetName(s.red, comp, t)} ok={pl.redOk} t={t} />
                        <Measure label={t("proc.blackProbe")} dot="black" target={targetName(s.black, comp, t)} ok={pl.blackOk} t={t} />
                        <Measure label={t("proc.rotary")} target={MODE_LABEL[s.mode]} ok={pl.modeOk} set t={t} />
                      </div>

                      {/* actions */}
                      <div className="mt-2.5 flex items-center gap-2">
                        <button type="button" onClick={() => engine.answer(true)} className="focus-ring rounded-md border border-line2 px-4 py-1.5 t-cta text-ink hover:border-mod-multimeter">{t("proc.yes")}</button>
                        <button type="button" onClick={() => engine.answer(false)} className="focus-ring rounded-md border border-line2 px-4 py-1.5 t-cta text-ink hover:border-mod-multimeter">{t("proc.no")}</button>
                        {hints ? (
                          <button type="button" onClick={() => engine.useHint()} disabled={state.hintUsed} className="focus-ring ms-auto rounded-md px-2.5 py-1.5 t-cta text-neutralx-fg3 hover:text-ink disabled:opacity-40">
                            {t("proc.hint")} <span className="t-code">{t("proc.hintPenalty")}</span>
                          </button>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Measure({ label, dot, target, ok, set, t }: { label: string; dot?: "red" | "black"; target: string; ok: boolean; set?: boolean; t: any }) {
  return (
    <div className="mt-1.5 flex items-center gap-2 t-body-sm">
      {dot ? <span className={cn("h-2 w-2 rounded-pill", dot === "red" ? "bg-fault-red" : "bg-ink")} /> : <span className="h-2 w-2" />}
      <span className="text-neutralx-fg3">{label}</span>
      <span dir="ltr" className="t-code text-ink">· {target}</span>
      <span className={cn("ms-auto t-eyebrow", ok ? "text-ok" : "text-neutralx-fg3")}>{ok ? "✓" : set ? t("proc.notSet") : t("proc.notPlaced")}</span>
    </div>
  );
}
