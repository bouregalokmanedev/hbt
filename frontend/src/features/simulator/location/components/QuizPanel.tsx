"use client";

import { useEffect } from "react";

import type { AtlasState, LocationAtlasEngine } from "@/features/simulator/location/engine/atlas.engine";
import { locByKey } from "@/features/simulator/location/data/location.data";

/** Right panel in Quiz mode — current question, timer, score/progress and results.
 * The timer ticks via a rAF-free interval that only advances engine state. */
export function QuizPanel({
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

  useEffect(() => {
    if (state.qDone) return;
    const id = setInterval(() => engine.tickQuiz(), 1000);
    return () => clearInterval(id);
  }, [engine, state.qDone]);

  const target = state.qList[state.qIdx] ? locByKey(state.qList[state.qIdx]) : undefined;
  const mm = String(Math.floor(state.qElapsed / 60)).padStart(2, "0");
  const ss = String(state.qElapsed % 60).padStart(2, "0");

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-auto border-s border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
      <div className="flex items-center justify-between border-b border-[#3A3A3A]/10 p-4 dark:border-white/10">
        <span dir="ltr" className="font-mono text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
          {tr("location.quiz.time", "TIME")} <span className="font-mono font-black text-[#3A3A3A] dark:text-white">{mm}:{ss}</span>
        </span>
        <span dir="ltr" className="font-mono text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
          {tr("location.quiz.score", "SCORE")} <span className="font-mono font-black text-[#3A3A3A] dark:text-white">{state.qScore}</span>
        </span>
      </div>

      {state.qDone ? (
        <div className="p-4">
          <div className="text-sm font-black text-[#3A3A3A] dark:text-white">{tr("location.quiz.results", "Results")}</div>
          <div
            dir="ltr"
            className="mt-3 rounded-xl bg-[#3A3A3A]/5 p-4 text-center font-mono text-2xl font-black text-[#3A3A3A] dark:bg-white/5 dark:text-white"
          >
            {state.qScore} / {state.qList.length * 10}
          </div>
          <button
            type="button"
            onClick={() => engine.setMode("quiz")}
            className="mt-3 w-full rounded-xl bg-[#F47822] px-3 py-2 text-sm font-black text-white transition hover:bg-[#E96D18] focus:outline-none focus:ring-2 focus:ring-[#F47822]/30"
          >
            {tr("location.quiz.restart", "Restart quiz")}
          </button>
        </div>
      ) : (
        <div className="p-4">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#F47822]">
            {tr("location.quiz.question", "Question {n}", { n: state.qIdx + 1 })}
          </div>
          {target ? <h2 className="mt-1 text-lg font-black text-[#3A3A3A] dark:text-white">{trc("location.quiz.prompt", "Where is: {name}?", { name: target.name })}</h2> : null}
          <p className="mt-1 text-sm leading-6 text-[#3A3A3A]/60 dark:text-white/60">
            {trc("location.quiz.instruction", "Pick the correct hotspot.")}
          </p>
          {state.qTries > 0 ? (
            <p className="mt-2 rounded-xl bg-red-50 px-2.5 py-1.5 text-sm font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {trc("location.quiz.wrong", "Wrong — try again.")}
            </p>
          ) : null}
        </div>
      )}
    </aside>
  );
}
