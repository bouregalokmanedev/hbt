"use client";

import { useTranslations } from "next-intl";
import { useAppStore, useAppStoreApi } from "@/providers/StoreProvider";
import { VEH, vehicleById } from "@/data/shared/vehicles";
import { REPORTS } from "@/data/record";
import { cn } from "@/lib/cn";
import type { Coverage, ToolId } from "@/data/schema";

const TOOLS: ToolId[] = ["scanner", "multimeter", "oscilloscope", "location", "schematic"];
const MARK: Record<Coverage, { glyph: string; fg: string; bg: string }> = {
  ok: { glyph: "✓", fg: "#0B7A3C", bg: "#EDF7F1" },
  avail: { glyph: "↓", fg: "#B4560F", bg: "#FFF3E8" },
  none: { glyph: "—", fg: "#C2C8D0", bg: "#F7F8FA" },
};

export default function GaragePage() {
  const t = useTranslations("garage");
  const activeId = useAppStore((s) => s.vehicleId);
  const api = useAppStoreApi();
  const active = vehicleById(activeId)!;

  return (
    <div className="px-7 pt-[26px] pb-8">
      {/* Active vehicle facts */}
      <div className="rounded-xl border border-line bg-paper p-5 shadow-card">
        <div className="t-eyebrow text-neutralx-fg3">{t("activeVehicle")}</div>
        <div className="mt-1 t-title text-ink" style={{ fontSize: 20 }}>
          {active.name}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { k: "vin", v: active.vin },
            { k: "engine", v: active.engine },
            { k: "transmission", v: active.transmission },
            { k: "odometer", v: `${active.odometerKm.toLocaleString("en-US")} km` },
          ].map((f) => (
            <div key={f.k}>
              <div className="t-eyebrow text-neutralx-fg3">{t(`facts.${f.k}`)}</div>
              <div dir="ltr" className="t-mono mt-1 text-sm text-ink">
                {f.v}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => api.getState().say(`${active.name} · ${active.vin}`)}
          className="focus-ring mt-4 rounded-lg border border-line2 bg-paper px-3 py-1.5 t-cta text-ink hover:border-brand"
        >
          {t("decode")}
        </button>
      </div>

      {/* Coverage matrix */}
      <h2 className="mt-6 t-section text-ink">{t("matrix")}</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-paper shadow-card">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th className="p-3 text-start t-eyebrow text-neutralx-fg3">{t("columns.vehicle")}</th>
              {TOOLS.map((tool) => (
                <th key={tool} dir="ltr" className="p-3 text-center t-eyebrow text-neutralx-fg3">
                  {t(`columns.${tool}`)}
                </th>
              ))}
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {VEH.map((v) => (
              <tr key={v.id} className={cn("border-b border-line3 last:border-0", v.id === activeId && "bg-warmActive")}>
                <td className="p-3">
                  <div className="t-body-sm font-medium text-ink">{v.name}</div>
                  <div dir="ltr" className="t-code text-neutralx-fg3">
                    {v.engine}
                  </div>
                </td>
                {TOOLS.map((tool) => {
                  const cov: Coverage = v.coverage[tool] ?? "none";
                  const m = MARK[cov];
                  return (
                    <td key={tool} className="p-3 text-center">
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md t-code"
                        style={{ color: m.fg, background: m.bg }}
                        title={t(`cell.${cov}`)}
                      >
                        {m.glyph}
                      </span>
                    </td>
                  );
                })}
                <td className="p-3 text-end">
                  {v.id === activeId ? (
                    <span className="t-eyebrow text-ok">✓ {t("activeVehicle")}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => api.getState().setVehicle(v.id)}
                      className="focus-ring rounded-md border border-line2 bg-paper px-2.5 py-1 t-cta text-ink hover:border-brand"
                    >
                      {t("switch")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent sessions */}
      <h2 className="mt-6 t-section text-ink">{t("recentSessions")}</h2>
      <div className="mt-3 space-y-2">
        {REPORTS.slice(0, 4).map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3">
            <div className="min-w-0">
              <div className="t-body-sm font-medium text-ink">{r.finding}</div>
              <div dir="ltr" className="t-code text-neutralx-fg3">
                {r.date} · {r.km.toLocaleString("en-US")} km
              </div>
            </div>
            <span
              className="rounded-md px-2 py-0.5 t-code"
              style={
                r.outcome === "pass"
                  ? { color: "#0B7A3C", background: "#EDF7F1" }
                  : { color: "#B42318", background: "#FDECEA" }
              }
            >
              {r.outcome === "pass" ? "PASS" : "FAULT"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
