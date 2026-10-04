import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { ScopeEngine, ScopeEngineState } from "../engine/scope.engine";

/**
 * Info-tab live state — two animated bars + values + an event indicator, computed
 * by engine.liveState(phase). The phase is a deterministic rAF tick (advances only
 * while running); all values come from the engine, none are hardcoded here.
 */
export function LiveState({
  engine,
  state,
  t,
}: {
  engine: ScopeEngine;
  state: ScopeEngineState;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
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
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [engine, comp.period, state.running, state.compId, state.fault]);

  const bar = (label: string, pct: number, val: string, color: string) => (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#3A3A3A]/60 dark:text-white/60">{label}</span>
        <span dir="ltr" className="font-mono text-xs font-bold text-[#3A3A3A] dark:text-white">
          {val}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#3A3A3A]/10 dark:bg-white/10">
        <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );

  return (
    <div className="mt-3 rounded-xl border border-[#3A3A3A]/10 bg-[#F8F7F6] p-3 dark:border-white/10 dark:bg-white/5">
      <div className="text-[10px] font-black uppercase tracking-wide text-[#3A3A3A]/45 dark:text-white/45">
        {t("oscilloscope.info.liveState", { defaultValue: "Live state" }) as string}
      </div>
      <div className="mt-2 space-y-2.5">
        {bar(
          t(`content.oscilloscope.ex.${comp.id}.anim1`, { defaultValue: comp.anim.unit }) as string,
          live.p1,
          live.v1,
          "#0E9F6E",
        )}
        {bar(
          t(`content.oscilloscope.ex.${comp.id}.anim2`, { defaultValue: comp.anim.unit2 }) as string,
          live.p2,
          live.v2,
          "#8B5CF6",
        )}
        <div className="flex items-center gap-2">
          <span className={clsx("h-2.5 w-2.5 rounded-full transition-colors", live.hot ? "bg-[#0E9F6E]" : "bg-[#3A3A3A]/15 dark:bg-white/15")} />
          <span className="text-sm text-[#3A3A3A]/60 dark:text-white/60">
            {t(`content.oscilloscope.ex.${comp.id}.animEvent`, { defaultValue: "Event" }) as string}
          </span>
        </div>
      </div>
    </div>
  );
}
