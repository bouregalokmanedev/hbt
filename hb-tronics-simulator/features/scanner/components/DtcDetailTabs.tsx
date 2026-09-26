"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { DTC_DETAIL } from "@/data/scanner";
import { DiagnosticTree } from "./DiagnosticTree";
import type { ScannerScreenProps } from "./types";

type DtcTab = "overview" | "causes" | "tree" | "livedata" | "repair";

/** 5-tab DTC detail (02 §B): Fault overview / Possible causes / Diagnostic tree / Live data / Repair. */
export function DtcDetailTabs({ t, engine, state }: ScannerScreenProps) {
  const [dtcTab, setDtcTab] = useState<DtcTab>("tree");
  // Class-C learner-facing prose resolved by content id (14 §0 / F7).
  const tc = useTranslations("content");
  const d = DTC_DETAIL.P2118;
  return (
    <div className="border-t border-line3 p-4">
      <div className="mb-3 flex gap-1 border-b border-line3">
        {(["overview", "causes", "tree", "livedata", "repair"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setDtcTab(tab)}
            className={cn(
              "focus-ring -mb-px border-b-2 px-3 py-1.5 t-cta",
              dtcTab === tab ? "border-mod-scanner text-mod-scanner" : "border-transparent text-neutralx-fg3 hover:text-ink",
            )}
          >
            {t(`dtcs.tab.${tab}`)}
          </button>
        ))}
      </div>

      {dtcTab === "overview" ? <p className="t-body-sm text-ink">{tc("dtc.P2118.overview")}</p> : null}

      {dtcTab === "causes" ? (
        <ul className="space-y-2">
          {d.causes.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-lg border border-line3 p-3">
              <span className="flex-1 t-body-sm text-ink">{tc(`dtc.P2118.cause.${c.id}`)}</span>
              <span dir="ltr" className="t-code text-neutralx-fg3">{c.confidence}%</span>
              <div className="h-1.5 w-20 overflow-hidden rounded-pill bg-fill">
                <div className="h-full bg-mod-scanner" style={{ width: `${c.confidence}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {dtcTab === "livedata" ? (
        <table className="w-full">
          <thead>
            <tr className="border-b border-line3">
              <th className="p-2 text-start t-eyebrow text-neutralx-fg3">Parameter</th>
              <th className="p-2 text-start t-eyebrow text-neutralx-fg3">{t("dtcs.expected")}</th>
              <th className="p-2 text-start t-eyebrow text-neutralx-fg3">Measured</th>
            </tr>
          </thead>
          <tbody>
            {d.liveExpected.map((r) => (
              <tr key={r.pid} className="border-b border-line3 last:border-0">
                <td className="p-2 t-body-sm text-ink">{r.pid}</td>
                <td dir="ltr" className="p-2 t-mono text-xs text-neutralx-fg3">{r.expected}</td>
                <td dir="ltr" className="p-2 t-mono text-xs" style={{ color: r.ok ? "#0B7A3C" : "#D92D20" }}>{r.measured}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {dtcTab === "repair" ? <div className="rounded-lg bg-ok-bg2 p-3 t-body-sm text-ink">{tc("dtc.P2118.repair")}</div> : null}

      {dtcTab === "tree" ? <DiagnosticTree t={t} engine={engine} state={state} /> : null}
    </div>
  );
}
