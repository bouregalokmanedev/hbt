"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/providers/StoreProvider";
import { useMeterProcedure } from "./hooks/useMeterProcedure";
import { ComponentSidebar } from "./components/ComponentSidebar";
import { Diagnosis } from "./screens/Diagnosis";
import { Progress } from "./screens/Progress";

/**
 * Multimeter tool shell (P3.3) — authentic diagnosis workstation reconstructed on
 * the framework-free MeterProcedureEngine. Top header (TIME / SCORE / Diagnosis·
 * Progress), the electronic-components sidebar, and the active screen. Decomposed
 * into focused components; no measurement logic lives in React.
 */
export function MultimeterView() {
  const t = useTranslations("multimeter");
  const tc = useTranslations("content");
  const { engine, state } = useMeterProcedure();
  const [view, setView] = useState<"diagnosis" | "progress">("diagnosis");
  const hints = useAppStore((s) => s.settings.hints);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-paper2">
      {/* top header */}
      <div className="flex items-center gap-4 border-b border-line bg-paper px-4 py-2">
        <div className="min-w-0">
          <div className="t-eyebrow tracking-[0.12em] text-mod-multimeter">{t("title")}</div>
          <div className="truncate t-body-sm text-neutralx-fg3">{t("subtitle")}</div>
        </div>
        <div dir="ltr" className="ms-auto flex items-center gap-4 t-code text-neutralx-fg3">
          <span>{t("header.time")} <span className="t-mono text-ink">{fmtTime(state.elapsed)}</span></span>
          <span>{t("header.score")} <span className="t-mono text-ink">{state.score}</span></span>
        </div>
        <div className="inline-flex rounded-lg bg-fill p-1">
          {(["diagnosis", "progress"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-current={view === v ? "page" : undefined}
              className={cn("focus-ring rounded-md px-3 py-1.5 t-cta", view === v ? "bg-paper text-mod-multimeter shadow-seg" : "text-neutralx-fg3")}
            >
              {t(`views.${v}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <ComponentSidebar state={state} activeRef={state.compRef} onSelect={(ref) => engine.selectComponent(ref)} t={t} />
        {view === "diagnosis" ? (
          <Diagnosis engine={engine} state={state} t={t} tc={tc} hints={hints} />
        ) : (
          <Progress state={state} onOpen={(ref) => { engine.selectComponent(ref); setView("diagnosis"); }} t={t} />
        )}
      </div>
    </div>
  );
}
