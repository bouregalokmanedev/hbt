"use client";

import { useEffect, useRef, useState } from "react";
import type { ScopeEngine, ScopeEngineState } from "@sim/oscilloscope";
import { cn } from "@/lib/cn";

/**
 * Info-tab live state — two animated bars + values + an event indicator, computed
 * by engine.liveState(phase). The phase is a deterministic rAF tick (advances only
 * while running); all values come from the engine, none are hardcoded here.
 */
export function LiveState({ engine, state, t, tc }: { engine: ScopeEngine; state: ScopeEngineState; t: any; tc: any }) {
  const comp = engine.comp();
  const [live, setLive] = useState(() => engine.liveState(0));
  const phase = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    let last = 0;
    const tick = (ts: number) => {
      const dt = last ? ts - last : 16;
      last = ts;
      if (state.running) phase.current = (phase.current + dt * 0.35) % comp.period;
      setLive(engine.liveState(phase.current));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [engine, comp.period, state.running, state.compId, state.fault]);

  const bar = (label: string, pct: number, val: string, color: string) => (
    <div>
      <div className="flex items-center justify-between">
        <span className="t-body-sm text-neutralx-fg3">{label}</span>
        <span dir="ltr" className="t-mono text-xs text-ink">{val}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-pill bg-fill">
        <div className="h-full rounded-pill transition-[width] duration-150" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );

  return (
    <div className="mt-3 rounded-lg border border-line bg-paper2 p-3">
      <div className="t-eyebrow tracking-[0.1em] text-neutralx-fg3">{t("info.liveState")}</div>
      <div className="mt-2 space-y-2.5">
        {bar(tc(`oscilloscope.ex.${comp.id}.anim1`), live.p1, live.v1, "#0E9F6E")}
        {bar(tc(`oscilloscope.ex.${comp.id}.anim2`), live.p2, live.v2, "#8B5CF6")}
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-pill transition-colors", live.hot ? "bg-mod-oscilloscope" : "bg-line2")} />
          <span className="t-body-sm text-neutralx-fg3">{tc(`oscilloscope.ex.${comp.id}.animEvent`)}</span>
        </div>
      </div>
    </div>
  );
}
