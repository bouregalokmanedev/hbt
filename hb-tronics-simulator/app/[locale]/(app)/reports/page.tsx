"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/format";
import { useAppStore, useAppStoreApi } from "@/providers/StoreProvider";
import { MODS } from "@/data/shared/modules";
import { cn } from "@/lib/cn";

function ReportsInner() {
  const t = useTranslations("reports");
  // Live session results record verdict/step labels as Class-C content ids
  // (sentinel `content:<id>`); seeded sample reports carry raw prose. Resolve
  // ids through the content namespace, pass raw text through unchanged.
  const tc = useTranslations("content");
  const rt = (s: string) => (s.startsWith("content:") ? tc(s.slice("content:".length)) : s);
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const api = useAppStoreApi();
  const reports = useAppStore((s) => s.reports);
  const [sel, setSel] = useState(params.get("r") ?? reports[0]?.id);
  const report = reports.find((r) => r.id === sel) ?? reports[0];

  return (
    <div className="flex min-h-0 flex-1">
      {/* List */}
      <aside className="w-80 shrink-0 overflow-auto border-e border-line bg-paper">
        <div className="p-4 t-eyebrow text-neutralx-fg3">{t("list")}</div>
        <ul>
          {reports.map((r) => {
            const selected = r.id === report.id;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSel(r.id)}
                  className={cn(
                    "focus-ring flex w-full flex-col gap-1 border-b border-line3 px-4 py-3 text-start",
                    selected ? "bg-warmActive" : "hover:bg-fill",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span dir="ltr" className="t-code text-neutralx-fg3">
                      {formatDate(r.date, locale)}
                    </span>
                    <span
                      className="rounded-md px-1.5 py-0.5 t-code"
                      style={
                        r.outcome === "pass"
                          ? { color: "#0B7A3C", background: "#EDF7F1" }
                          : { color: "#B42318", background: "#FDECEA" }
                      }
                    >
                      {t(`outcome.${r.outcome}`)}
                    </span>
                  </div>
                  <span className="t-body-sm font-medium text-ink">{rt(r.finding)}</span>
                  <div className="flex items-center gap-1.5">
                    {r.tools.map((tool) => {
                      const m = MODS.find((x) => x.id === tool)!;
                      return (
                        <span key={tool} dir="ltr" className="t-code rounded-xs px-1.5 py-0.5" style={{ background: m.accentBg, color: m.accent }}>
                          {m.tag}
                        </span>
                      );
                    })}
                    <span dir="ltr" className="ms-auto t-mono text-xs text-ink">
                      {r.score}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Detail */}
      <section className="min-w-0 flex-1 overflow-auto px-7 pt-[26px] pb-7">
        <div className="flex items-start justify-between">
          <div>
            <div className="t-eyebrow text-neutralx-fg3">{t("kicker")}</div>
            <h1 className="mt-1 t-title text-ink" style={{ fontSize: 22 }}>
              {rt(report.finding)}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/tools/${report.tools[0]}`)}
              className="focus-ring rounded-lg border border-line2 bg-paper px-3 py-1.5 t-cta text-ink hover:border-brand"
            >
              {t("reopen")}
            </button>
            <button
              type="button"
              onClick={() => api.getState().say(t("exportPdf"))}
              className="focus-ring rounded-lg bg-brand px-3 py-1.5 t-cta text-brand-on"
            >
              {t("exportPdf")}
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="t-section text-ink">{t("steps")}</h2>
            <div className="mt-3 space-y-1.5 rounded-xl border border-line bg-paper p-4">
              {report.steps.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-pill t-code"
                    style={s.ok ? { color: "#0B7A3C", background: "#EDF7F1" } : { color: "#B42318", background: "#FDECEA" }}
                  >
                    {s.ok ? "✓" : "!"}
                  </span>
                  <span className="t-body-sm text-ink">{rt(s.label)}</span>
                </div>
              ))}
            </div>

            <h2 className="mt-5 t-section text-ink">{t("verdict")}</h2>
            <div
              className="mt-3 rounded-xl border p-4 t-body-sm"
              style={
                report.outcome === "pass"
                  ? { borderColor: "#CDEBD9", background: "#F1F8F3", color: "#0B7A3C" }
                  : { borderColor: "#F6D3CF", background: "#FDF2F1", color: "#B42318" }
              }
            >
              {rt(report.verdict)}
            </div>
          </div>

          <div>
            <h2 className="t-section text-ink">{t("meta")}</h2>
            <div className="mt-3 space-y-3 rounded-xl border border-line bg-paper p-4">
              {[
                { k: "date", v: formatDate(report.date, locale), ltr: false },
                { k: "score", v: `${report.score} / 100`, ltr: true },
                { k: "vin", v: report.vin, ltr: true },
                { k: "km", v: `${report.km.toLocaleString("en-US")} km`, ltr: true },
                { k: "tech", v: report.tech, ltr: false },
              ].map((f) => (
                <div key={f.k} className="flex items-center justify-between">
                  <span className="t-eyebrow text-neutralx-fg3">{t(`fields.${f.k}`)}</span>
                  <span dir={f.ltr ? "ltr" : undefined} className="t-mono text-xs text-ink">
                    {f.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-7 t-body text-neutralx-fg3">Loading…</div>}>
      <ReportsInner />
    </Suspense>
  );
}
