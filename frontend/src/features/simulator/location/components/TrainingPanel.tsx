import clsx from "clsx";

import type { AtlasState, Difficulty, LocationAtlasEngine } from "@/features/simulator/location/engine/atlas.engine";
import { locByKey } from "@/features/simulator/location/data/location.data";

const DIFFS: Difficulty[] = ["Easy", "Medium", "Hard", "Expert"];

/** Right panel in Training mode — task card, progress (score/wrong/tasks), difficulty selector, hint/skip, and the attempt log. Scoring is engine-driven. */
export function TrainingPanel({
  engine,
  state,
  t,
  tc,
}: {
  engine: LocationAtlasEngine;
  state: AtlasState;
  t?: (key: string, opts?: Record<string, unknown>) => string;
  tc?: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const tr = (key: string, fallback: string, opts?: Record<string, unknown>) =>
    t ? (t(key, { defaultValue: fallback, ...opts } as Record<string, unknown>) as string) : fallback;
  const trc = (key: string, fallback: string, opts?: Record<string, unknown>) =>
    tc ? (tc(key, { defaultValue: fallback, ...opts } as Record<string, unknown>) as string) : fallback;

  const target = state.tTarget ? locByKey(state.tTarget) : undefined;
  const wrong = state.tLog.filter((l) => !l.ok).length;
  const noHints = state.difficulty === "Hard" || state.difficulty === "Expert";

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-auto border-s border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
      {/* task */}
      <div className="border-b border-[#3A3A3A]/10 p-4 dark:border-white/10">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#F47822]">
          {tr("location.train.task", "Training task")} · {state.difficulty.toUpperCase()}
        </div>
        {target ? <h2 className="mt-1 text-lg font-black text-[#3A3A3A] dark:text-white">{trc("location.train.prompt", "Locate: {name}", { name: target.name })}</h2> : null}
        <p className="mt-1 text-sm leading-6 text-[#3A3A3A]/60 dark:text-white/60">
          {trc("location.train.instruction", "Click the component on the diagram. Switch view if you need to.")}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => engine.useHint()}
            disabled={noHints || state.tHints >= 3}
            className="rounded-xl border border-[#3A3A3A]/10 bg-white px-2.5 py-1.5 text-xs font-black text-[#3A3A3A] transition hover:border-[#F47822]/30 hover:text-[#F47822] focus:outline-none focus:ring-2 focus:ring-[#F47822]/20 disabled:opacity-40 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
          >
            {tr("location.train.hint", "Hint {n} / 5", { n: state.tHints })}
          </button>
          <button
            type="button"
            onClick={() => engine.skipTask()}
            className="rounded-xl bg-[#F47822] px-3 py-1.5 text-xs font-black text-white transition hover:bg-[#E96D18] focus:outline-none focus:ring-2 focus:ring-[#F47822]/30"
          >
            {tr("location.train.skip", "Skip task")}
          </button>
        </div>
        {state.tVerdict ? (
          <p
            className={clsx(
              "mt-2 rounded-xl px-2.5 py-1.5 text-sm font-bold",
              state.tVerdict === "ok"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
            )}
          >
            {state.tVerdict === "ok" ? trc("location.train.correct", "Correct location.") : trc("location.train.wrong", "Not there — look again.")}
          </p>
        ) : null}
      </div>

      {/* progress */}
      <div className="grid grid-cols-2 gap-2 border-b border-[#3A3A3A]/10 p-4 dark:border-white/10">
        <div className="rounded-xl border border-[#3A3A3A]/10 p-2.5 dark:border-white/10">
          <div className="text-[11px] font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
            {tr("location.train.score", "SCORE")}
          </div>
          <div dir="ltr" className="font-mono text-xl font-black text-[#3A3A3A] dark:text-white">
            {state.tScore}
          </div>
        </div>
        <div className="rounded-xl border border-[#3A3A3A]/10 p-2.5 dark:border-white/10">
          <div className="text-[11px] font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
            {tr("location.train.wrong", "WRONG PICKS")}
          </div>
          <div dir="ltr" className="font-mono text-xl font-black text-[#3A3A3A] dark:text-white">
            {wrong}
          </div>
        </div>
        <div className="col-span-2 font-mono text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
          {tr("location.train.tasksDone", "Tasks completed: {n}", { n: state.tDone })}
        </div>
      </div>

      {/* difficulty */}
      <div className="border-b border-[#3A3A3A]/10 p-4 dark:border-white/10">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">
          {tr("location.train.difficulty", "Difficulty")}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {DIFFS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => engine.setDifficulty(d)}
              aria-pressed={state.difficulty === d}
              className={clsx(
                "rounded-xl border px-2.5 py-1.5 text-start transition focus:outline-none focus:ring-2 focus:ring-[#F47822]/20",
                state.difficulty === d
                  ? "border-[#F47822] bg-[#F47822]/10"
                  : "border-[#3A3A3A]/10 bg-white hover:border-[#F47822]/20 dark:border-white/10 dark:bg-[#1b1b20]",
              )}
            >
              <div className={clsx("text-xs font-black", state.difficulty === d ? "text-[#F47822]" : "text-[#3A3A3A] dark:text-white")}>{d}</div>
              <div className="font-mono text-[11px] text-[#3A3A3A]/40 dark:text-white/40">{trc(`location.difficulty.${d}`, d)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* attempt log */}
      <div className="p-4">
        <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">
          {tr("location.train.log", "Attempt log")}
        </div>
        {state.tLog.length === 0 ? (
          <p className="mt-1.5 text-sm text-[#3A3A3A]/60 dark:text-white/60">{tr("location.train.logEmpty", "Attempts appear here as you work through the tasks.")}</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {state.tLog.map((l, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className={l.ok ? "text-emerald-600" : "text-red-500"}>{l.ok ? "✓" : "✗"}</span>
                <span dir="ltr" className="font-mono text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
                  {l.ref}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
