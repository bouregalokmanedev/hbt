import clsx from "clsx";
import type { ScopeEngine, ScopeEngineState } from "../engine/scope.engine";

const TIMEDIVS = [0.2, 0.5, 1, 2, 5, 6, 10, 20, 50, 100, 110, 120, 200, 400, 500];

/** Scope toolbar — RUN/STOP · SINGLE · AUTO SET · TIME/DIV · TRIG (edge + level),
 * and the overlay row PERSIST · PEAK DET · REF · CURSORS · SAVE. All engine-driven. */
export function ScopeControls({
  engine,
  state,
  t,
}: {
  engine: ScopeEngine;
  state: ScopeEngineState;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const comp = engine.comp();
  const stepDown = () => {
    const i = TIMEDIVS.indexOf(state.timeDiv);
    engine.setTimeDiv(TIMEDIVS[Math.max(0, i - 1)] ?? state.timeDiv);
  };
  const stepUp = () => {
    const i = TIMEDIVS.indexOf(state.timeDiv);
    engine.setTimeDiv(TIMEDIVS[Math.min(TIMEDIVS.length - 1, i + 1)] ?? state.timeDiv);
  };
  const btn = (active: boolean) =>
    clsx(
      "rounded-md border px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0E9F6E]/30",
      active
        ? "border-[#0E9F6E] bg-[#0E9F6E]/10 text-[#0E9F6E]"
        : "border-[#3A3A3A]/10 text-[#3A3A3A] hover:border-[#0E9F6E]/40 dark:border-white/10 dark:text-white",
    );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => engine.toggleRun()}
          className={clsx(
            "rounded-md px-3 py-1.5 text-xs font-black text-white focus:outline-none focus:ring-2 focus:ring-black/20",
            state.running ? "bg-[#D92D20]" : "bg-[#0E9F6E]",
          )}
        >
          {state.running
            ? (t("oscilloscope.control.stop", { defaultValue: "STOP" }) as string)
            : (t("oscilloscope.control.run", { defaultValue: "RUN" }) as string)}
        </button>
        <button type="button" onClick={() => engine.single()} className={btn(false)}>
          {t("oscilloscope.control.single", { defaultValue: "Single" }) as string}
        </button>
        <button type="button" onClick={() => engine.autoSet()} className={btn(false)}>
          {t("oscilloscope.control.autoSet", { defaultValue: "AUTO SET" }) as string}
        </button>

        <div className="ms-1 inline-flex items-center gap-1 rounded-md border border-[#3A3A3A]/10 bg-white px-1 dark:border-white/10 dark:bg-[#1b1b20]">
          <span className="px-1.5 font-mono text-[11px] font-bold text-[#3A3A3A]/50 dark:text-white/50">
            {t("oscilloscope.control.timeDiv", { defaultValue: "Time/div" }) as string}
          </span>
          <button type="button" onClick={stepDown} aria-label="-" className="px-1.5 font-mono text-[#3A3A3A] focus:outline-none dark:text-white">
            −
          </button>
          <span dir="ltr" className="min-w-14 text-center font-mono text-xs font-bold text-[#3A3A3A] dark:text-white">
            {state.timeDiv < 1 ? `${state.timeDiv * 1000} µs` : `${state.timeDiv} ms`}/div
          </span>
          <button type="button" onClick={stepUp} aria-label="+" className="px-1.5 font-mono text-[#3A3A3A] focus:outline-none dark:text-white">
            +
          </button>
        </div>

        <div className="inline-flex items-center gap-2 rounded-md border border-[#3A3A3A]/10 bg-white px-2 py-1 dark:border-white/10 dark:bg-[#1b1b20]">
          <span className="font-mono text-[11px] font-bold text-[#3A3A3A]/50 dark:text-white/50">
            {t("oscilloscope.control.trig", { defaultValue: "Trig" }) as string}
          </span>
          <button
            type="button"
            onClick={() => engine.setTrigEdge(state.trigEdge === "rising" ? "falling" : "rising")}
            className="font-mono text-xs font-bold text-[#0E9F6E] focus:outline-none"
          >
            {state.trigEdge === "rising"
              ? `↑ ${t("oscilloscope.control.rising", { defaultValue: "Rising" })}`
              : `↓ ${t("oscilloscope.control.falling", { defaultValue: "Falling" })}`}
          </button>
          <input
            type="range"
            dir="ltr"
            min={comp.trig.min}
            max={comp.trig.max}
            step={comp.trig.step}
            value={state.trigLevel}
            onChange={(e) => engine.setTrigLevel(Number(e.target.value))}
            aria-label={t("oscilloscope.control.level", { defaultValue: "Level" }) as string}
            className="w-24 accent-[#0E9F6E]"
          />
          <span dir="ltr" className="font-mono text-xs font-bold text-[#3A3A3A] dark:text-white">
            {state.trigLevel} {comp.chA.unit}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => engine.togglePersist()} className={btn(state.persist)}>
          {t("oscilloscope.control.persist", { defaultValue: "Persist" }) as string}
        </button>
        <button type="button" onClick={() => engine.togglePeakDet()} className={btn(state.peakDet)}>
          {t("oscilloscope.control.peak", { defaultValue: "Peak detect" }) as string}
        </button>
        <button type="button" onClick={() => engine.toggleRef()} className={btn(state.refOn)}>
          {t("oscilloscope.control.ref", { defaultValue: "REF" }) as string}
        </button>
        <button type="button" onClick={() => engine.toggleCursors()} className={btn(state.cursors)}>
          {t("oscilloscope.control.cursors", { defaultValue: "Cursors" }) as string}
        </button>
        <span
          className={clsx(
            "ms-auto rounded-md px-2 py-1 font-mono text-[11px] font-bold",
            state.triggered ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
          )}
        >
          {t("oscilloscope.header.triggered", { defaultValue: "Triggered" }) as string} ·{" "}
          {state.triggered ? (t("oscilloscope.header.auto", { defaultValue: "Auto" }) as string) : "—"}
        </span>
      </div>

      {state.cursors ? (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#3A3A3A]/10 bg-white p-2.5 dark:border-white/10 dark:bg-[#1b1b20]">
          {(["A", "B"] as const).map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm text-[#3A3A3A]/60 dark:text-white/60">
              <span className="font-bold text-[#0E9F6E]">
                {c === "A"
                  ? (t("oscilloscope.cursor.a", { defaultValue: "Cursor A" }) as string)
                  : (t("oscilloscope.cursor.b", { defaultValue: "Cursor B" }) as string)}
              </span>
              <input
                type="range"
                dir="ltr"
                min={0}
                max={1}
                step={0.005}
                value={c === "A" ? state.cA : state.cB}
                onChange={(e) => engine.setCursor(c, Number(e.target.value))}
                className="w-32 accent-[#0E9F6E]"
              />
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
