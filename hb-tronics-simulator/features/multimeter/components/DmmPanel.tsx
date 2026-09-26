"use client";

import type { MeterProcedureEngine } from "@sim/multimeter";
import type { MeterProcedureState } from "@sim/multimeter";
import { RotaryDial } from "./RotaryDial";

const JACKS = ["A", "mA", "COM", "V/Ω"];

/**
 * HB TRONICS DMM-772 device — dark body, green LCD, rotary dial, four jacks. The
 * LCD is a pure projection of engine.reading(): value / unit / mode / range status
 * (OFF · Place both probes · Wrong function · at your probe points · Spec …). All
 * measurement truth comes from the engine; this panel never computes a reading.
 */
export function DmmPanel({ engine, state, t }: { engine: MeterProcedureEngine; state: MeterProcedureState; t: any }) {
  const r = engine.reading();
  const range =
    r.status === "off" ? t("dmm.off")
      : r.status === "unseated" ? t("dmm.placeBoth")
        : r.status === "wrongMode" ? t("dmm.wrongFunction")
          : r.status === "wrongPoints" ? t("dmm.atPoints")
            : t("dmm.spec", { spec: r.spec });
  const modeLabel = state.mode === "OFF" ? "OFF" : state.mode;

  return (
    <div className="rounded-2xl border border-[#262E36] bg-[#12181D] p-3.5 shadow-panel">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-bold tracking-[0.08em] text-[#EDF1F5]">{t("dmm.brand")}</span>
        <span className="text-[8px] font-semibold tracking-[0.09em] text-white/60">{t("dmm.model")}</span>
      </div>

      {/* LCD */}
      <div dir="ltr" className="relative mt-2 overflow-hidden rounded-xl border border-[#35473C] bg-[#1B2A22] px-3 py-2">
        <div className="flex h-3.5 items-center justify-between">
          <span className="text-[8.5px] font-semibold tracking-[0.1em] text-[#7FE6AE]">{modeLabel}</span>
          <span className="text-[8.5px] font-semibold tracking-[0.1em] text-[#7FE6AE]">{r.flag}</span>
        </div>
        <div className="t-mono text-right text-[29px] font-medium leading-tight text-[#C8FFDF]" style={{ textShadow: "0 0 14px rgba(120,255,180,.35)", fontVariantNumeric: "tabular-nums" }}>
          {r.value || " "}
        </div>
        <div className="flex h-3.5 items-center justify-between">
          <span className="text-[8.5px] text-[#C8FFDF]/60">{range}</span>
          <span className="t-mono text-[10px] font-semibold text-[#8CEBB6]">{r.unit}</span>
        </div>
      </div>

      <RotaryDial mode={state.mode} onSelect={(m) => engine.setMode(m)} />

      {/* jacks */}
      <div dir="ltr" className="flex items-end justify-around px-2 pb-0.5 pt-1">
        {JACKS.map((j) => (
          <div key={j} className="flex flex-col items-center gap-1">
            <span className="text-[8.5px] font-semibold text-[#EDF1F5]">{j}</span>
            <span className="h-3 w-3 rounded-full border border-[#3B4650] bg-[#0C1114]" />
          </div>
        ))}
      </div>
    </div>
  );
}
