"use client";

import type { LocationAtlasEngine, AtlasState, Difficulty } from "@sim/location";
import { locByKey } from "@/data/location/atlas";
import { cn } from "@/lib/cn";

const DIFFS: Difficulty[] = ["Easy", "Medium", "Hard", "Expert"];

/** Right panel in Training mode — task card, progress (score/wrong/tasks),
 * difficulty selector, hint/skip, and the attempt log. Scoring is engine-driven. */
export function TrainingPanel({ engine, state, t, tc }: { engine: LocationAtlasEngine; state: AtlasState; t: any; tc: any }) {
  const target = state.tTarget ? locByKey(state.tTarget) : undefined;
  const wrong = state.tLog.filter((l) => !l.ok).length;
  const noHints = state.difficulty === "Hard" || state.difficulty === "Expert";

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-auto border-s border-line bg-paper">
      {/* task */}
      <div className="border-b border-line p-4">
        <div className="t-eyebrow tracking-[0.1em] text-mod-location">{t("train.task")} · {state.difficulty.toUpperCase()}</div>
        {target ? <h2 className="mt-1 t-title text-ink" style={{ fontSize: 18 }}>{tc("location.train.prompt", { name: target.name })}</h2> : null}
        <p className="mt-1 t-body-sm text-neutralx-fg3">{tc("location.train.instruction")}</p>
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={() => engine.useHint()} disabled={noHints || state.tHints >= 3} className="focus-ring rounded-md border border-line2 px-2.5 py-1.5 t-cta text-ink disabled:opacity-40">{t("train.hint", { n: state.tHints })}</button>
          <button type="button" onClick={() => engine.skipTask()} className="focus-ring rounded-md bg-mod-location px-3 py-1.5 t-cta text-white">{t("train.skip")}</button>
        </div>
        {state.tVerdict ? (
          <p className={cn("mt-2 rounded-md px-2.5 py-1.5 t-body-sm", state.tVerdict === "ok" ? "bg-ok-bg2 text-ok" : "bg-fault-bg2 text-fault")}>
            {state.tVerdict === "ok" ? tc("location.train.correct") : tc("location.train.wrong")}
          </p>
        ) : null}
      </div>

      {/* progress */}
      <div className="grid grid-cols-2 gap-2 border-b border-line p-4">
        <div className="rounded-lg border border-line2 p-2.5">
          <div className="t-eyebrow text-neutralx-fg3">{t("train.score")}</div>
          <div dir="ltr" className="t-mono text-xl text-ink">{state.tScore}</div>
        </div>
        <div className="rounded-lg border border-line2 p-2.5">
          <div className="t-eyebrow text-neutralx-fg3">{t("train.wrong")}</div>
          <div dir="ltr" className="t-mono text-xl text-ink">{wrong}</div>
        </div>
        <div className="col-span-2 t-eyebrow text-neutralx-fg3">{t("train.tasksDone", { n: state.tDone })}</div>
      </div>

      {/* difficulty */}
      <div className="border-b border-line p-4">
        <div className="t-eyebrow tracking-[0.1em] text-neutralx-fg3">{t("train.difficulty")}</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {DIFFS.map((d) => (
            <button key={d} type="button" onClick={() => engine.setDifficulty(d)} aria-pressed={state.difficulty === d}
              className={cn("focus-ring rounded-md border px-2.5 py-1.5 text-start", state.difficulty === d ? "border-mod-location bg-mod-locationBg" : "border-line2")}>
              <div className={cn("t-cta", state.difficulty === d ? "text-mod-location" : "text-ink")}>{d}</div>
              <div className="t-eyebrow text-neutralx-fg3">{tc(`location.difficulty.${d}`)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* attempt log */}
      <div className="p-4">
        <div className="t-eyebrow tracking-[0.1em] text-neutralx-fg3">{t("train.log")}</div>
        {state.tLog.length === 0 ? (
          <p className="mt-1.5 t-body-sm text-neutralx-fg3">{t("train.logEmpty")}</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {state.tLog.map((l, i) => (
              <li key={i} className="flex items-center gap-2 t-body-sm">
                <span className={l.ok ? "text-ok" : "text-fault"}>{l.ok ? "✓" : "✗"}</span>
                <span dir="ltr" className="t-code text-neutralx-fg3">{l.ref}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
