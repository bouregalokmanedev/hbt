"use client";

import type { ScopeEngine, ScopeEngineState } from "@sim/oscilloscope";
import { cn } from "@/lib/cn";

const TIMEDIVS = [0.2, 0.5, 1, 2, 5, 6, 10, 20, 50, 100, 110, 120, 200, 400, 500];

/** Scope toolbar — RUN/STOP · SINGLE · AUTO SET · TIME/DIV · TRIG (edge + level),
 * and the overlay row PERSIST · PEAK DET · REF · CURSORS · SAVE. All engine-driven. */
export function ScopeControls({ engine, state, t }: { engine: ScopeEngine; state: ScopeEngineState; t: any }) {
  const comp = engine.comp();
  const stepDown = () => { const i = TIMEDIVS.indexOf(state.timeDiv); engine.setTimeDiv(TIMEDIVS[Math.max(0, i - 1)] ?? state.timeDiv); };
  const stepUp = () => { const i = TIMEDIVS.indexOf(state.timeDiv); engine.setTimeDiv(TIMEDIVS[Math.min(TIMEDIVS.length - 1, i + 1)] ?? state.timeDiv); };
  const btn = (active: boolean) => cn("focus-ring rounded-md border px-2.5 py-1.5 t-cta", active ? "border-mod-oscilloscope bg-mod-oscilloscopeBg text-mod-oscilloscope" : "border-line2 text-ink hover:border-mod-oscilloscope");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => engine.toggleRun()} className={cn("focus-ring rounded-md px-3 py-1.5 t-cta text-white", state.running ? "bg-fault-red" : "bg-ok-mid")}>
          {state.running ? t("control.stop") : t("control.run")}
        </button>
        <button type="button" onClick={() => engine.single()} className={btn(false)}>{t("control.single")}</button>
        <button type="button" onClick={() => engine.autoSet()} className={btn(false)}>{t("control.autoSet")}</button>

        <div className="ms-1 inline-flex items-center gap-1 rounded-md border border-line2 px-1">
          <span className="px-1.5 t-code text-neutralx-fg3">{t("control.timeDiv")}</span>
          <button type="button" onClick={stepDown} aria-label="-" className="focus-ring px-1.5 t-code text-ink">−</button>
          <span dir="ltr" className="min-w-14 text-center t-mono text-xs text-ink">{state.timeDiv < 1 ? `${state.timeDiv * 1000} µs` : `${state.timeDiv} ms`}/div</span>
          <button type="button" onClick={stepUp} aria-label="+" className="focus-ring px-1.5 t-code text-ink">+</button>
        </div>

        <div className="inline-flex items-center gap-2 rounded-md border border-line2 px-2 py-1">
          <span className="t-code text-neutralx-fg3">{t("control.trig")}</span>
          <button type="button" onClick={() => engine.setTrigEdge(state.trigEdge === "rising" ? "falling" : "rising")} className="focus-ring t-code text-mod-oscilloscope">
            {state.trigEdge === "rising" ? `↑ ${t("control.rising")}` : `↓ ${t("control.falling")}`}
          </button>
          <input type="range" dir="ltr" min={comp.trig.min} max={comp.trig.max} step={comp.trig.step} value={state.trigLevel} onChange={(e) => engine.setTrigLevel(Number(e.target.value))} aria-label={t("control.level")} className="ltr-island w-24 accent-mod-oscilloscope" />
          <span dir="ltr" className="t-mono text-xs text-ink">{state.trigLevel} {comp.chA.unit}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => engine.togglePersist()} className={btn(state.persist)}>{t("control.persist")}</button>
        <button type="button" onClick={() => engine.togglePeakDet()} className={btn(state.peakDet)}>{t("control.peak")}</button>
        <button type="button" onClick={() => engine.toggleRef()} className={btn(state.refOn)}>{t("control.ref")}</button>
        <button type="button" onClick={() => engine.toggleCursors()} className={btn(state.cursors)}>{t("control.cursors")}</button>
        <span className={cn("ms-auto rounded-md px-2 py-1 t-code", state.triggered ? "bg-ok-bg text-ok" : "bg-warn-bg text-warn")}>
          {t("header.triggered")} · {state.triggered ? t("header.auto") : "—"}
        </span>
      </div>

      {state.cursors ? (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-line bg-paper p-2.5">
          {(["A", "B"] as const).map((c) => (
            <label key={c} className="flex items-center gap-2 t-body-sm text-neutralx-fg3">
              <span className="text-mod-oscilloscope">{c === "A" ? t("cursor.a") : t("cursor.b")}</span>
              <input type="range" dir="ltr" min={0} max={1} step={0.005} value={c === "A" ? state.cA : state.cB} onChange={(e) => engine.setCursor(c, Number(e.target.value))} className="ltr-island w-32 accent-mod-oscilloscope" />
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
