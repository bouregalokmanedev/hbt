"use client";

import type { ScopeEngine, ScopeEngineState } from "@sim/oscilloscope";
import { cn } from "@/lib/cn";

/** Per-channel controls: V/div (±), coupling DC/AC, invert, vertical offset (±). */
export function ChannelControls({ engine, state, t }: { engine: ScopeEngine; state: ScopeEngineState; t: any }) {
  const comp = engine.comp();
  const row = (ch: "A" | "B") => {
    const cfg = ch === "A" ? comp.chA : comp.chB!;
    const vdiv = ch === "A" ? state.vdivA : state.vdivB;
    const off = ch === "A" ? state.offA : state.offB;
    const cpl = ch === "A" ? state.couplingA : state.couplingB;
    const inv = ch === "A" ? state.invA : state.invB;
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2">
        <span className={cn("t-code", ch === "A" ? "text-ok-mid" : "text-info")}>{ch === "A" ? t("channel.a") : t("channel.b")}</span>
        <span className="min-w-0 flex-1 truncate t-body-sm text-neutralx-fg3">{cfg.label}</span>
        <div className="inline-flex items-center gap-1 rounded-md border border-line2 px-1">
          <button type="button" onClick={() => engine.setVdiv(ch, vdiv / 2)} aria-label="v-down" className="focus-ring px-1.5 t-code text-ink">−</button>
          <span dir="ltr" className="min-w-16 text-center t-mono text-xs text-ink">{vdiv} {cfg.unit}/div</span>
          <button type="button" onClick={() => engine.setVdiv(ch, vdiv * 2)} aria-label="v-up" className="focus-ring px-1.5 t-code text-ink">+</button>
        </div>
        <button type="button" onClick={() => engine.setCoupling(ch, cpl === "DC" ? "AC" : "DC")} className="focus-ring rounded-md border border-line2 px-2 py-0.5 t-code text-ink">{cpl}</button>
        <button type="button" onClick={() => engine.toggleInvert(ch)} className={cn("focus-ring rounded-md border px-2 py-0.5 t-code", inv ? "border-mod-oscilloscope text-mod-oscilloscope" : "border-line2 text-ink")}>{t("control.invert")}</button>
        <div className="inline-flex items-center gap-1 rounded-md border border-line2 px-1">
          <button type="button" onClick={() => engine.setOffset(ch, off - 0.5)} aria-label="off-down" className="focus-ring px-1.5 t-code text-ink">↓</button>
          <span dir="ltr" className="min-w-12 text-center t-mono text-xs text-ink">{off.toFixed(1)} div</span>
          <button type="button" onClick={() => engine.setOffset(ch, off + 0.5)} aria-label="off-up" className="focus-ring px-1.5 t-code text-ink">↑</button>
        </div>
      </div>
    );
  };
  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
      {row("A")}
      {comp.chB ? row("B") : null}
    </div>
  );
}
