"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { TRAINING_STEPS, TRAINING_ANSWERS, TRAINING_CORRECT } from "@/data/scanner";
import { SCENARIO_LIBRARY, ACTIVE_SCENARIO } from "../data/training";
import type { ScannerScreen } from "./types";
import type { ScannerScreenProps } from "../components/types";

/**
 * Training Simulator (SC, doc 17/19): scenario header + guided step procedure with
 * per-step actions (open screen / mark complete / hint) + single-attempt diagnosis,
 * plus the objectives / scenario-library / instructor-note sidebar. Scoring runs in
 * the engine (UI → state → engine → SessionResult). Prose is Class-C.
 */
export function Training({ t, engine, state, go }: ScannerScreenProps & { go: (s: ScannerScreen) => void }) {
  const tc = useTranslations("content");
  const c = (k: string) => tc(`scanner.training.${k}`);
  const A = ACTIVE_SCENARIO;

  const libBadge: Record<string, string> = {
    passed: "text-ok", progress: "text-brand", locked: "text-neutralx-fg3",
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Main column */}
      <div className="lg:col-span-2">
        {/* Scenario header */}
        <div className="rounded-xl bg-[#14181C] p-5 text-[#E8EAED]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="t-eyebrow tracking-[0.12em] text-brand">
                {t("train.scenario")} {A.n} · {t(`train.difficulty.${A.difficulty}`)} · {A.durationMin} {t("train.min")}
              </div>
              <h2 className="mt-1 t-title text-white" style={{ fontSize: 24 }}>{c("scenario.title")}</h2>
            </div>
            <div className="shrink-0 text-end">
              <div className="t-eyebrow text-[#8A9099]">{t("train.traineeLevel")}</div>
              <div dir="ltr" className="mt-1 t-title text-white">{A.level} · {A.levelPct} %</div>
            </div>
          </div>
          <p className="mt-3 max-w-2xl t-body-sm text-[#9AA0A6]">{c("scenario.desc")}</p>
        </div>

        {/* Step procedure */}
        <ol className="mt-4 space-y-3">
          {TRAINING_STEPS.map((step, i) => {
            const active = i === state.tStep && state.tAnswer == null;
            const done = state.tDone[i];
            const isLast = i === TRAINING_STEPS.length - 1;
            return (
              <li key={step.id} className={cn("rounded-xl border p-4", active ? "border-mod-scanner bg-[#FFFDFA]" : "border-line bg-paper")}>
                <div className="flex items-start gap-3">
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-pill t-code", done ? "bg-ok-bg text-ok" : active ? "bg-mod-scanner text-white" : "bg-fill text-neutralx-fg3")}>
                    {done ? "✓" : String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="t-body-sm font-semibold text-ink">{c(`step.${step.id}.label`)}</div>
                    <div dir="ltr" className="mt-0.5 t-body-sm text-neutralx-fg3">{c(`step.${step.id}.detail`)}</div>

                    {active && !isLast ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => go(step.screen as ScannerScreen)} className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink hover:border-mod-scanner">
                          {t("train.open")} {t(`nav.${step.screen}`)} →
                        </button>
                        <button type="button" onClick={() => engine.trainingCompleteStep()} className="focus-ring rounded-md bg-mod-scanner px-3 py-1.5 t-cta text-white">
                          {t("train.markComplete")}
                        </button>
                        <button type="button" onClick={() => engine.useTrainingHint()} className="focus-ring rounded-md border border-dashed border-line2 px-3 py-1.5 t-cta text-neutralx-fg3 hover:border-mod-scanner">
                          {t("train.hint")}
                        </button>
                      </div>
                    ) : null}

                    {/* Diagnosis on the final step */}
                    {active && isLast ? (
                      <div className="mt-3">
                        <div className="t-eyebrow text-neutralx-fg3">{t("train.yourDiagnosis")}</div>
                        <div className="mt-2 space-y-2">
                          {TRAINING_ANSWERS.map((a, ai) => {
                            const chosen = state.tAnswer === ai;
                            const correct = ai === TRAINING_CORRECT;
                            const answered = state.tAnswer != null;
                            return (
                              <button key={a} type="button" disabled={answered} onClick={() => engine.submitTraining(ai)}
                                className={cn("focus-ring flex w-full items-center gap-2 rounded-lg border p-3 text-start t-body-sm",
                                  answered && correct ? "border-ok bg-ok-bg2 text-ok" : chosen ? "border-fault bg-fault-bg2 text-fault" : "border-line3 text-ink hover:border-mod-scanner")}>
                                {tc(`scanner.training.answer.${a}`)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Result */}
        {state.tFeedback ? (
          <div className={cn("mt-4 rounded-xl border p-4", state.tFeedback.correct ? "border-ok-bg bg-ok-bg2" : "border-fault-bg bg-fault-bg2")}>
            <p className="t-body-sm text-ink">{c(`result.${state.tFeedback.correct ? "correct" : "wrong"}`)}</p>
            {state.tScore ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[["accuracy", state.tScore.accuracy], ["process", state.tScore.process], ["time", state.tScore.time]].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg border border-line bg-paper p-3 text-center">
                    <div className="t-eyebrow text-neutralx-fg3">{t(`training.${k}`)}</div>
                    <div dir="ltr" className="t-mono mt-1 text-lg font-semibold text-ink">{v as number}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Action bar */}
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
          <button type="button" onClick={() => go("workstation")} className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink">‹ {t("train.back")}</button>
          <span className="t-eyebrow text-neutralx-fg3">{t("train.scenario")} {A.n} · {t(`train.difficulty.${A.difficulty}`)} · {A.durationMin} {t("train.min")}</span>
          <div className="flex items-center gap-2">
            <button type="button" className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink">{t("train.instructorNotes")}</button>
            <button type="button" disabled={state.tAnswer != null} onClick={() => engine.submitTraining(TRAINING_CORRECT)} className="focus-ring rounded-md bg-brand px-4 py-1.5 t-cta text-brand-on disabled:opacity-50">{t("train.submitDiagnosis")}</button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-4">
        <div className="rounded-xl border border-line bg-paper p-4">
          <div className="t-eyebrow text-neutralx-fg3">{t("train.learningObjectives")}</div>
          <ul className="mt-3 space-y-2.5">
            {Array.from({ length: A.objectiveCount }, (_v, i) => (
              <li key={i} className="t-body-sm text-ink">{c(`obj.${i}`)}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-line bg-paper p-4">
          <div className="t-eyebrow text-neutralx-fg3">{t("train.scenarioLibrary")}</div>
          <ul className="mt-3 space-y-2">
            {SCENARIO_LIBRARY.map((s) => (
              <li key={s.n} className="flex items-center justify-between gap-2">
                <span className={cn("t-body-sm", s.status === "locked" ? "text-neutralx-fg3" : "text-ink")}>
                  <span dir="ltr" className="text-neutralx-fg3">{s.n}</span> · {c(`lib.${s.n}`)}
                </span>
                <span className={cn("t-code", libBadge[s.status])}>
                  {t(`train.libStatus.${s.status}`)}{s.score != null ? ` ${s.score} %` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-brand/30 bg-brand/5 p-4">
          <div className="t-eyebrow text-brand">{t("train.instructorNoteLabel")}</div>
          <p className="mt-1.5 t-body-sm text-ink">{c("instructorNote")}</p>
        </div>
      </aside>
    </div>
  );
}
