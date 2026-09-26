"use client";

import { useEffect } from "react";
import type { LocationAtlasEngine, AtlasState } from "@sim/location";
import { locByKey } from "@/data/location/atlas";

/** Right panel in Quiz mode — current question, timer, score/progress and results.
 * The timer ticks via a rAF-free interval that only advances engine state. */
export function QuizPanel({ engine, state, t, tc }: { engine: LocationAtlasEngine; state: AtlasState; t: any; tc: any }) {
  useEffect(() => {
    if (state.qDone) return;
    const id = setInterval(() => engine.tickQuiz(), 1000);
    return () => clearInterval(id);
  }, [engine, state.qDone]);

  const target = state.qList[state.qIdx] ? locByKey(state.qList[state.qIdx]) : undefined;
  const mm = String(Math.floor(state.qElapsed / 60)).padStart(2, "0");
  const ss = String(state.qElapsed % 60).padStart(2, "0");

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-auto border-s border-line bg-paper">
      <div className="flex items-center justify-between border-b border-line p-4">
        <span dir="ltr" className="t-code text-neutralx-fg3">{t("quiz.time")} <span className="t-mono text-ink">{mm}:{ss}</span></span>
        <span dir="ltr" className="t-code text-neutralx-fg3">{t("quiz.score")} <span className="t-mono text-ink">{state.qScore}</span></span>
      </div>

      {state.qDone ? (
        <div className="p-4">
          <div className="t-section text-ink">{t("quiz.results")}</div>
          <div dir="ltr" className="mt-3 rounded-lg bg-fill p-4 text-center t-mono text-2xl text-ink">{state.qScore} / {state.qList.length * 10}</div>
          <button type="button" onClick={() => engine.setMode("quiz")} className="focus-ring mt-3 w-full rounded-md bg-mod-location px-3 py-2 t-cta text-white">{t("quiz.restart")}</button>
        </div>
      ) : (
        <div className="p-4">
          <div className="t-eyebrow tracking-[0.1em] text-mod-location">{t("quiz.question", { n: state.qIdx + 1 })}</div>
          {target ? <h2 className="mt-1 t-title text-ink" style={{ fontSize: 18 }}>{tc("location.quiz.prompt", { name: target.name })}</h2> : null}
          <p className="mt-1 t-body-sm text-neutralx-fg3">{tc("location.quiz.instruction")}</p>
          {state.qTries > 0 ? <p className="mt-2 rounded-md bg-fault-bg2 px-2.5 py-1.5 t-body-sm text-fault">{tc("location.quiz.wrong")}</p> : null}
        </div>
      )}
    </aside>
  );
}
