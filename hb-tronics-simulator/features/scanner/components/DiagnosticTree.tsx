"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { TREE } from "@/data/scanner";
import type { ScannerScreenProps } from "./types";

/** Interactive 7-step diagnostic tree (06 §1): measure → reveal → pass/fail. */
export function DiagnosticTree({ t, engine, state }: ScannerScreenProps) {
  // Class-C learner-facing prose resolved by content id (14 §0 / F7).
  const tc = useTranslations("content");
  const fb = state.treeFeedback;
  return (
    <>
      <ol className="space-y-2">
        {TREE.map((step, i) => {
          const st = state.treeStates[i];
          const active = i === state.treeStep && !state.treeFinished;
          return (
            <li
              key={i}
              className={cn(
                "rounded-lg border p-3",
                st.done ? (st.verdict === "pass" ? "border-ok-bg bg-ok-bg2" : "border-fault-bg bg-fault-bg2") : active ? "border-mod-scanner bg-[#FFFDFA]" : "border-line3 opacity-60",
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-pill t-code",
                    st.done ? (st.verdict === "pass" ? "bg-ok-bg text-ok" : "bg-fault-bg text-fault") : active ? "bg-mod-scanner text-white" : "bg-fill text-neutralx-fg3",
                  )}
                >
                  {st.done ? (st.verdict === "pass" ? "✓" : "!") : i + 1}
                </span>
                <span className="flex-1 t-body-sm text-ink">{tc(`scanner.tree.${step.id}.label`)}</span>
                <span dir="ltr" className="t-code text-neutralx-fg3">{step.expected}</span>
              </div>
              {active ? (
                <div className="mt-2 ps-7">
                  {!state.treeMeasured ? (
                    <button type="button" onClick={() => engine.treeMeasure()} className="focus-ring rounded-md bg-mod-scanner px-3 py-1.5 t-cta text-white">
                      {t("dtcs.measure")}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span dir="ltr" className="t-mono text-sm font-semibold text-ink">{step.measure}</span>
                      <button type="button" onClick={() => engine.treeVerdict(true)} className="focus-ring rounded-md bg-ok-bg px-3 py-1 t-cta text-ok">
                        {t("dtcs.pass")}
                      </button>
                      <button type="button" onClick={() => engine.treeVerdict(false)} className="focus-ring rounded-md bg-fault-bg px-3 py-1 t-cta text-fault">
                        {t("dtcs.fail")}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
      {fb ? (
        <div className={cn("mt-3 rounded-lg p-3 t-body-sm", fb.ok ? "bg-ok-bg2 text-ok" : "bg-fault-bg2 text-fault")}>
          {fb.kind === "recheck"
            ? tc("scanner.treeFeedback.recheck", { hint: tc(`scanner.tree.${fb.stepId}.hint`) })
            : tc(`scanner.treeFeedback.${fb.kind}`)}
        </div>
      ) : null}
    </>
  );
}
