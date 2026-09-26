"use client";

import { cn } from "@/lib/cn";
import { VCI_INTERFACE, UNITS_LOCALE, type SettingRow } from "../data/settings";

/**
 * Scanner Settings (SC, doc 17/21): the authentic original is a read-only
 * two-card panel — VCI Interface + Units and Locale. No interactive controls
 * exist in the source (verified against the original DOM), so this faithfully
 * renders display rows (label left / canonical value right) plus a Back action.
 * Card headers + row labels are chrome; values are Class-B canonical.
 */
export function SettingsScreen({ t }: { t: any }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title={t("set.vci")} rows={VCI_INTERFACE} t={t} />
        <Card title={t("set.units")} rows={UNITS_LOCALE} t={t} />
      </div>

      {/* Action bar */}
      <div className="mt-4 flex items-center border-t border-line pt-3">
        <button type="button" className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink">‹ {t("set.back")}</button>
      </div>
    </div>
  );
}

function Card({ title, rows, t }: { title: string; rows: SettingRow[]; t: any }) {
  return (
    <section className="rounded-xl border border-line bg-paper p-5 shadow-card">
      <div className="t-eyebrow tracking-[0.12em] text-neutralx-fg3">{title}</div>
      <div className="mt-3 space-y-4">
        {rows.map((r) => (
          <div key={r.id} className="flex items-baseline justify-between gap-4">
            <span className="t-body-sm text-neutralx-fg3">{t(`set.${r.id}`)}</span>
            <span dir="ltr" className={cn("t-code text-end", r.ok ? "text-ok" : "text-ink")}>{r.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
