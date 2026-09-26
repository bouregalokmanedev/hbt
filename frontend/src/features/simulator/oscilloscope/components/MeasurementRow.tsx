import type { ScopeEngine, ScopeEngineState } from "../engine/scope.engine";

/** Auto-measurement readout row — every value comes from ScopeEngine.measure()/ cursorReadout(). No hardcoded display values. */
export function MeasurementRow({
  engine,
  state,
  t,
}: {
  engine: ScopeEngine;
  state: ScopeEngineState;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const m = engine.measure();
  const cur = engine.cursorReadout();
  const u = engine.comp().chA.unit;
  const fmt = (v: number) => (Math.abs(v) < 10 ? v.toFixed(2) : v.toFixed(1));
  const fmtT = (ms: number) => (ms < 1 ? `${(ms * 1000).toFixed(0)} µs` : ms < 1000 ? `${ms.toFixed(ms < 10 ? 2 : 1)} ms` : `${(ms / 1000).toFixed(2)} s`);
  const freq = m.freq > 1000 ? `${(m.freq / 1000).toFixed(2)} kHz` : `${m.freq.toFixed(1)} Hz`;

  const cells: [string, string][] = [
    [(t("oscilloscope.meas.vmax", { defaultValue: "Vmax" }) as string), `${fmt(m.mx)} ${u}`],
    [(t("oscilloscope.meas.vmin", { defaultValue: "Vmin" }) as string), `${fmt(m.mn)} ${u}`],
    [(t("oscilloscope.meas.vpp", { defaultValue: "Vpp" }) as string), `${fmt(m.pp)} ${u}`],
    [(t("oscilloscope.meas.freq", { defaultValue: "Freq" }) as string), freq],
    [(t("oscilloscope.meas.duty", { defaultValue: "Duty" }) as string), `${m.duty.toFixed(1)} %`],
    [(t("oscilloscope.meas.pw", { defaultValue: "Pw" }) as string), fmtT(m.pw)],
    [(t("oscilloscope.meas.rise", { defaultValue: "Rise" }) as string), fmtT(m.rise)],
    [(t("oscilloscope.meas.dt", { defaultValue: "ΔT" }) as string), fmtT(cur.dt)],
    [(t("oscilloscope.meas.dv", { defaultValue: "ΔV" }) as string), `${fmt(cur.dv)} ${u}`],
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
      {cells.map(([label, val]) => (
        <div key={label} className="rounded-xl border border-[#3A3A3A]/10 bg-white px-2.5 py-1.5 dark:border-white/10 dark:bg-[#1b1b20]">
          <div className="text-[10px] font-black uppercase tracking-wide text-[#3A3A3A]/45 dark:text-white/45">{label}</div>
          <div dir="ltr" className="font-mono text-sm font-bold text-[#3A3A3A] dark:text-white">
            {val}
          </div>
        </div>
      ))}
    </div>
  );
}
