"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { ADAS_ITEMS, ADAS_ACTIVE, ADAS_STATUS_COLOR } from "../data/adas";
import type { ScannerScreenProps } from "./types";

/**
 * ADAS Calibration workstation (SC, doc 17/19): calibration-item list, the active
 * static-calibration panel with target-alignment diagram + progress, the
 * pre-conditions checklist, and the status prose. The 0→100 run is engine-driven
 * (runAdas); prose is Class-C (content.scanner.adas.*).
 */
export function AdasPanel({ t, engine, state }: ScannerScreenProps) {
  const tc = useTranslations("content");
  const a = (k: string) => tc(`scanner.adas.${k}`);
  const active = ADAS_ITEMS.find((i) => i.id === ADAS_ACTIVE.itemId)!;
  const prog = state.adasProg;
  const done = prog >= 100;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
        {/* Calibration items */}
        <aside className="rounded-xl border border-line bg-paper">
          <div className="border-b border-line3 px-4 py-2.5 t-eyebrow text-neutralx-fg3">{t("adas.calibrationItems")} · {ADAS_ITEMS.length}</div>
          <ul>
            {ADAS_ITEMS.map((it) => (
              <li key={it.id} className={cn("border-b border-line3 p-4 last:border-0", it.id === active.id && "bg-mod-scannerBg")}>
                <div className="flex items-center justify-between">
                  <span dir="ltr" className="t-code text-neutralx-fg2">#{ADAS_STATUS_COLOR[it.status].replace("#", "").toUpperCase()}</span>
                  <span className="inline-flex items-center gap-1.5 t-code" style={{ color: ADAS_STATUS_COLOR[it.status] }}>
                    <span className="h-1.5 w-1.5 rounded-pill" style={{ background: ADAS_STATUS_COLOR[it.status] }} aria-hidden />
                    {t(`adas.itemStatus.${it.status}`)}
                  </span>
                </div>
                <div className="mt-1 t-body-sm font-medium text-ink">{a(`item.${it.id}.name`)}</div>
                <div className="mt-0.5 t-code text-neutralx-fg3">{a(`item.${it.id}.note`)}</div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Calibration workstation */}
        <div className="min-w-0">
          {/* Dark static-calibration panel */}
          <div className="rounded-xl bg-[#14181C] p-5 text-[#E8EAED]">
            <div className="flex items-start justify-between">
              <div>
                <div className="t-eyebrow tracking-[0.12em] text-brand">{a("calibType.static")}</div>
                <h2 className="mt-1 t-title text-white" style={{ fontSize: 22 }}>{a(`item.${active.id}.name`)}</h2>
                <div dir="ltr" className="mt-1 t-code text-[#8A9099]">{ADAS_ACTIVE.targetBoard} {t("adas.targetBoard")} · {ADAS_ACTIVE.distance}</div>
              </div>
              <div className="text-end">
                <div dir="ltr" className="t-display text-white">{prog} <span className="t-body text-[#8A9099]">%</span></div>
                <div className="t-eyebrow text-[#8A9099]">{t("adas.progress")}</div>
              </div>
            </div>
            {/* Target-alignment diagram */}
            <div className="ltr-island mt-4 rounded-lg bg-[#0E1114]/60 p-4" dir="ltr">
              <svg viewBox="0 0 800 220" className="w-full" role="img" aria-label="ADAS target alignment">
                <text x="770" y="30" textAnchor="end" className="fill-[#8A9099]" style={{ font: "600 11px 'IBM Plex Mono'" }}>{t("adas.targetAlignment")} ± 5 mm</text>
                {/* camera */}
                <rect x="70" y="80" width="26" height="70" rx="3" fill="#2A3038" stroke="#3A424C" />
                <text x="83" y="170" textAnchor="middle" className="fill-[#8A9099]" style={{ font: "600 10px 'IBM Plex Mono'" }}>{ADAS_ACTIVE.targetBoard}</text>
                {/* target board */}
                <rect x="560" y="70" width="150" height="60" rx="4" fill="#2A3038" stroke="#3A424C" />
                <circle cx="635" cy="150" r="5" fill="#F47822" />
                <text x="635" y="175" textAnchor="middle" className="fill-[#8A9099]" style={{ font: "600 10px 'IBM Plex Mono'" }}>{t("adas.frontAxleCentre").toUpperCase()}</text>
                {/* alignment lines */}
                <line x1="96" y1="100" x2="560" y2="90" stroke="#12A150" strokeWidth="1.5" strokeDasharray="4 4" />
                <line x1="96" y1="130" x2="560" y2="115" stroke="#12A150" strokeWidth="1.5" strokeDasharray="4 4" />
                <line x1="96" y1="150" x2="635" y2="150" stroke="#F47822" strokeWidth="1.5" strokeDasharray="6 4" />
                <text x="330" y="140" className="fill-[#8A9099]" style={{ font: "600 11px 'IBM Plex Mono'" }}>1.28 m</text>
              </svg>
            </div>
            {/* progress bar */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-pill bg-white/10">
              <div className="h-full bg-brand transition-[width] duration-100" style={{ width: `${prog}%` }} />
            </div>
          </div>

          {/* Pre-conditions + Status */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-line bg-paper p-4">
              <div className="t-eyebrow text-neutralx-fg3">{t("adas.preConditions")}</div>
              <ul className="mt-3 space-y-3">
                {Array.from({ length: ADAS_ACTIVE.preconditionCount }, (_v, i) => {
                  const ok = state.adasDone[i];
                  return (
                    <li key={i} className="flex items-center gap-2.5">
                      <span className={cn("flex h-5 w-5 items-center justify-center rounded-pill t-code", ok ? "bg-ok-bg text-ok" : "bg-fill text-neutralx-fg3")}>{ok ? "✓" : ""}</span>
                      <span className="t-body-sm text-ink">{a(`precondition.${i}`)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="rounded-xl border border-line bg-paper p-4">
              <div className="t-eyebrow text-neutralx-fg3">{t("adas.status")}</div>
              {done ? (
                <div className="mt-3 rounded-lg bg-ok-bg2 p-3">
                  <div className="t-eyebrow text-ok">{t("adas.calibrationSuccessful")}</div>
                  <p className="mt-1.5 t-body-sm text-ink">{a("status.success")}</p>
                </div>
              ) : (
                <p className="mt-3 t-body-sm text-ink">{a("status.idle")}</p>
              )}
              <div dir="ltr" className="mt-4 t-code text-neutralx-fg3">{a(`item.${active.id}.note`)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <button type="button" className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink">‹ {t("adas.back")}</button>
        <span className="t-eyebrow text-neutralx-fg3">{t("adas.footerHint")}</span>
        <div className="flex items-center gap-2">
          <button type="button" className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink">{t("adas.calibrationReport")}</button>
          <button type="button" onClick={() => engine.runAdas()} disabled={state.adasRunning}
            className="focus-ring rounded-md bg-brand px-4 py-1.5 t-cta text-brand-on disabled:opacity-60">
            {done ? t("adas.calibrationComplete") : t("adas.startCalibration")}
          </button>
        </div>
      </div>
    </div>
  );
}
