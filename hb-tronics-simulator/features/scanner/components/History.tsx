"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  HISTORY_SESSIONS, SESSION_TOTAL, STATUS_STYLE, COMPARE_FIELDS, compareSessions,
  type HistorySession, type CompareField,
} from "../data/history";
import type { ScannerScreen } from "../screens/types";

/**
 * Diagnostic History (SC, doc 17/19): session table with per-row Compare/Open,
 * multi-select, and a side-by-side compare of two sessions. Session records are
 * Class-B canonical (data/history.ts); comparison logic is a pure data helper.
 * The compare-result layout is a functional reconstruction — the source's compare
 * view could not be captured (its interaction did not automate).
 */
export function History({ t, go }: { t: any; go?: (s: ScannerScreen) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState<[string, string] | null>(null);

  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 2 ? [cur[1], id] : [...cur, id]));

  const fmtKm = (n: number) => `${n.toLocaleString("en-US")} km`;
  const val = (s: HistorySession, f: CompareField) =>
    f === "date" ? `${s.date} · ${s.time}` : f === "odometer" ? fmtKm(s.odometerKm) : f === "dtc" ? String(s.dtc) : f === "status" ? t(`hist.st.${s.status}`) : (s[f as "vehicle" | "technician"] as string);

  if (comparing) {
    const a = HISTORY_SESSIONS.find((s) => s.id === comparing[0])!;
    const b = HISTORY_SESSIONS.find((s) => s.id === comparing[1])!;
    const { changed, diffCount, dtcDelta } = compareSessions(a, b);
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between">
          <h2 className="t-section text-ink">{t("hist.comparing")}</h2>
          <span className="t-eyebrow text-neutralx-fg3">{t("hist.differences", { n: diffCount })}</span>
        </div>
        <div className="mt-3 overflow-auto rounded-xl border border-line bg-paper">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-line">
                <th className="p-3 text-start t-eyebrow text-neutralx-fg3">{t("hist.field")}</th>
                <th dir="ltr" className="p-3 text-start t-eyebrow text-neutralx-fg3">{a.id}</th>
                <th dir="ltr" className="p-3 text-start t-eyebrow text-neutralx-fg3">{b.id}</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_FIELDS.map((f) => (
                <tr key={f} className={cn("border-b border-line3 last:border-0", changed[f] && "bg-warn/5")}>
                  <td className="p-3 t-eyebrow text-neutralx-fg3">{t(`hist.${f}`)}</td>
                  <td dir="ltr" className="p-3 t-body-sm text-ink">{val(a, f)}</td>
                  <td dir="ltr" className={cn("p-3 t-body-sm", changed[f] ? "font-semibold text-brand" : "text-ink")}>
                    {val(b, f)}{f === "dtc" && dtcDelta !== 0 ? <span className={cn("ms-2 t-code", dtcDelta < 0 ? "text-ok" : "text-fault")}>({dtcDelta > 0 ? "+" : ""}{dtcDelta})</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <button type="button" onClick={() => setComparing(null)} className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink">‹ {t("hist.backToHistory")}</button>
          <span className="t-eyebrow text-neutralx-fg3">{dtcDelta < 0 ? t("hist.faultsCleared", { n: -dtcDelta }) : t("hist.differences", { n: diffCount })}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-line bg-paper">
        <table className="w-full min-w-[880px]">
          <thead className="sticky top-0 bg-paper">
            <tr className="border-b border-line">
              {["session", "date", "vehicle", "odometer", "technician", "dtc", "status"].map((k) => (
                <th key={k} className="p-3 text-start t-eyebrow text-neutralx-fg3">{t(`hist.${k}`)}</th>
              ))}
              <th className="p-3 text-end t-eyebrow text-neutralx-fg3">{t("hist.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {HISTORY_SESSIONS.map((s) => {
              const sel = selected.includes(s.id);
              const st = STATUS_STYLE[s.status];
              return (
                <tr key={s.id} className={cn("border-b border-line3 last:border-0", sel ? "bg-mod-scannerBg" : "hover:bg-fill/40")}>
                  <td dir="ltr" className="p-3 t-code text-ink">{s.id}</td>
                  <td dir="ltr" className="p-3 t-code text-neutralx-fg3">{s.date} · {s.time}</td>
                  <td className="p-3 t-body-sm text-ink">{s.vehicle}</td>
                  <td dir="ltr" className="p-3 t-code text-ink">{fmtKm(s.odometerKm)}</td>
                  <td className="p-3 t-body-sm text-neutralx-fg3">{s.technician}</td>
                  <td dir="ltr" className={cn("p-3 t-mono text-xs", s.dtc > 0 ? "font-semibold text-fault" : "text-neutralx-fg3")}>{s.dtc}</td>
                  <td className="p-3"><span className="rounded-md px-2 py-0.5 t-code" style={{ color: st.fg, background: st.bg }}>{t(`hist.st.${s.status}`)}</span></td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => toggle(s.id)} className={cn("focus-ring rounded-md border px-2.5 py-1 t-cta", sel ? "border-mod-scanner bg-mod-scannerBg text-mod-scanner" : "border-line2 text-ink hover:border-mod-scanner")}>{t("hist.compare")}</button>
                      <button type="button" onClick={() => go?.("report")} className="focus-ring rounded-md border border-line2 px-2.5 py-1 t-cta text-ink hover:border-mod-scanner">{t("hist.open")}</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <button type="button" className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink">‹ {t("hist.back")}</button>
        <span className="t-eyebrow text-neutralx-fg3">{t("hist.sessionsCount", { total: SESSION_TOTAL, shown: HISTORY_SESSIONS.length })}</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={selected.length !== 2} onClick={() => selected.length === 2 && setComparing([selected[0], selected[1]])}
            className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink disabled:opacity-50">{t("hist.compareSelected")}</button>
          <button type="button" onClick={() => go?.("dashboard")} className="focus-ring rounded-md bg-brand px-4 py-1.5 t-cta text-brand-on">{t("hist.continueDiagnosis")} →</button>
        </div>
      </div>
    </div>
  );
}
