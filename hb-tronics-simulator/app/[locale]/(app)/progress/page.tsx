"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { StatTile } from "@/components/shared/StatTile";
import { useAppStoreApi } from "@/providers/StoreProvider";
import { PROGRESS } from "@/data/record";
import { MODS } from "@/data/shared/modules";
import { componentByRef } from "@/data/shared/components";

export default function ProgressPage() {
  const t = useTranslations("progress");
  // Class-C learner-facing prose (cert names, weak-spot / path labels, coach)
  // resolved by content id (14 §0 / F7).
  const tc = useTranslations("content");
  const locale = useLocale();
  const router = useRouter();
  const api = useAppStoreApi();

  const deepLink = (ref: string, tool: string) => {
    api.getState().setFocus(ref);
    router.push(`/${locale}/tools/${tool}?component=${ref}`);
  };

  return (
    <div className="px-7 pt-[26px] pb-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Overall + stats */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-line bg-paper p-5 shadow-card">
            <div className="t-eyebrow text-neutralx-fg3">{t("overall")}</div>
            <div dir="ltr" className="t-display mt-1 text-ink">
              {PROGRESS.overall}%
            </div>
            <ProgressBar value={PROGRESS.overall} className="mt-3" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PROGRESS.stats.map((s) => (
              <StatTile key={s.label} label={s.label} value={s.value} unit={s.unit} />
            ))}
          </div>

          <h2 className="mt-6 t-section text-ink">{t("skillLevels")}</h2>
          <div className="mt-3 space-y-3 rounded-xl border border-line bg-paper p-5">
            {PROGRESS.moduleLevels.map((ml) => {
              const mod = MODS.find((m) => m.id === ml.id)!;
              return (
                <div key={ml.id}>
                  <div className="flex items-center justify-between">
                    <span className="t-body-sm font-medium text-ink">{mod.name}</span>
                    <span dir="ltr" className="t-mono text-xs text-ink">
                      {ml.level}%
                    </span>
                  </div>
                  <ProgressBar value={ml.level} color={mod.accent} className="mt-1.5" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: certs, weak spots, path, coach */}
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-paper p-5 shadow-card">
            <h2 className="t-section text-ink">{t("certifications")}</h2>
            <div className="mt-3 space-y-2">
              {PROGRESS.certifications.map((c) => (
                <div key={c.name} className="flex items-center gap-3 rounded-lg border border-line3 p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-pill bg-brand/10 text-brand">
                    ★
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="t-body-sm font-medium text-ink">{tc(c.name)}</div>
                    <div className="t-eyebrow text-neutralx-fg3">{c.meta}</div>
                  </div>
                  <span
                    className="rounded-md px-2 py-0.5 t-code"
                    style={
                      c.status === "earned"
                        ? { color: "#0B7A3C", background: "#EDF7F1" }
                        : { color: "#B4560F", background: "#FFF3E8" }
                    }
                  >
                    {t(`cert.${c.status}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-line bg-paper p-5 shadow-card">
            <h2 className="t-section text-ink">{t("weakSpots")}</h2>
            <div className="mt-3 space-y-2">
              {PROGRESS.weakSpots.map((w) => (
                <button
                  key={w.ref + w.tool}
                  type="button"
                  onClick={() => deepLink(w.ref, w.tool)}
                  className="focus-ring flex w-full items-center gap-2 rounded-lg border border-line3 p-3 text-start hover:border-brand"
                >
                  <span dir="ltr" className="t-code rounded-xs bg-fault-bg px-1.5 py-0.5 text-fault">
                    {w.ref}
                  </span>
                  <span className="flex-1 t-body-sm text-ink">{tc(w.label)}</span>
                  <span aria-hidden className="rtl:-scale-x-100 text-neutralx-fg3">→</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-line bg-paper p-5 shadow-card">
            <h2 className="t-section text-ink">{t("recommendedPath")}</h2>
            <div className="mt-3 space-y-2">
              {PROGRESS.recommendedPath.map((p, i) => (
                <button
                  key={p.ref + p.tool}
                  type="button"
                  onClick={() => deepLink(p.ref, p.tool)}
                  className="focus-ring flex w-full items-center gap-3 rounded-lg border border-line3 p-3 text-start hover:border-brand"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-fill t-code text-neutralx-fg3">
                    {i + 1}
                  </span>
                  <span className="flex-1 t-body-sm text-ink">{tc(p.label)}</span>
                  <span aria-hidden className="rtl:-scale-x-100 text-neutralx-fg3">→</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-brand/30 bg-brand/5 p-5">
            <h2 className="t-eyebrow text-brand">{t("coach")}</h2>
            <p className="mt-2 t-body-sm text-ink">{tc(PROGRESS.coach)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
