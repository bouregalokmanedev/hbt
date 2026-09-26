"use client";

import type { ScopeEngine, ScopeEngineState } from "@sim/oscilloscope";

/** Auto-measurement readout row — every value comes from ScopeEngine.measure()/
 * cursorReadout(). No hardcoded display values. */
export function MeasurementRow({ engine, state, t }: { engine: ScopeEngine; state: ScopeEngineState; t: any }) {
  const m = engine.measure();
  const cur = engine.cursorReadout();
  const u = engine.comp().chA.unit;
  const fmt = (v: number) => (Math.abs(v) < 10 ? v.toFixed(2) : v.toFixed(1));
  const fmtT = (ms: number) => (ms < 1 ? `${(ms * 1000).toFixed(0)} µs` : ms < 1000 ? `${ms.toFixed(ms < 10 ? 2 : 1)} ms` : `${(ms / 1000).toFixed(2)} s`);
  const freq = m.freq > 1000 ? `${(m.freq / 1000).toFixed(2)} kHz` : `${m.freq.toFixed(1)} Hz`;

  const cells: [string, string][] = [
    [t("meas.vmax"), `${fmt(m.mx)} ${u}`],
    [t("meas.vmin"), `${fmt(m.mn)} ${u}`],
    [t("meas.vpp"), `${fmt(m.pp)} ${u}`],
    [t("meas.freq"), freq],
    [t("meas.duty"), `${m.duty.toFixed(1)} %`],
    [t("meas.pw"), fmtT(m.pw)],
    [t("meas.rise"), fmtT(m.rise)],
    [t("meas.dt"), fmtT(cur.dt)],
    [t("meas.dv"), `${fmt(cur.dv)} ${u}`],
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
      {cells.map(([label, val]) => (
        <div key={label} className="rounded-lg border border-line bg-paper px-2.5 py-1.5">
          <div className="t-eyebrow tracking-[0.08em] text-neutralx-fg3">{label}</div>
          <div dir="ltr" className="t-mono text-sm text-ink">{val}</div>
        </div>
      ))}
    </div>
  );
}
