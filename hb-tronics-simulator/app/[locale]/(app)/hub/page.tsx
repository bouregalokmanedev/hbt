"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { useAppStore } from "@/providers/StoreProvider";
import { MODS } from "@/data/shared/modules";
import { HUB_TASKS } from "@/data/shared/hub";
import { PROGRESS } from "@/data/record";
import { vehicleById } from "@/data/shared/vehicles";
import { componentByRef } from "@/data/shared/components";
import { cn } from "@/lib/cn";

const STATUS_CLS: Record<string, string> = {
  resume: "bg-brand/10 text-brand",
  new: "bg-mod-multimeterBg text-mod-multimeter",
  retry: "bg-fault-bg text-fault",
  guided: "bg-fill2 text-neutralx-fg",
};

/** Simulator Hub (02/09 §2) — "Choose your simulator": 5 module cards in a row,
 * platform stats, shared session context + coach, and the continue-your-path rail. */
export default function HubPage() {
  const t = useTranslations("hub");
  // Class-C learner-facing prose resolved by content id (14 §0 / F7).
  const tc = useTranslations("content");
  const locale = useLocale();
  const vehicleId = useAppStore((s) => s.vehicleId);
  const focus = useAppStore((s) => s.focus);
  const vehicle = vehicleById(vehicleId)!;
  const comp = componentByRef(focus ?? "INJ");

  return (
    <div className="px-7 pt-[26px] pb-8">
      {/* Header: brand kicker + heading + subtitle, with two stat cards on the end. */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="t-eyebrow tracking-[0.16em] text-brand">{t("kicker")}</div>
          <h1 className="mt-1 t-display text-ink">{t("heading")}</h1>
          <p className="mt-2 t-body text-neutralx-fg3">{t("subtitle")}</p>
        </div>
        <div className="flex shrink-0 gap-3">
          <div className="w-40 rounded-xl border border-line bg-paper p-4 shadow-card">
            <div className="t-eyebrow text-neutralx-fg3">{t("platformProgress")}</div>
            <div dir="ltr" className="mt-1 flex items-baseline gap-0.5">
              <span className="t-display text-ink">{PROGRESS.overall}</span>
              <span className="t-body text-neutralx-fg3">%</span>
            </div>
            <ProgressBar value={PROGRESS.overall} className="mt-2" />
          </div>
          <div className="w-40 rounded-xl border border-line bg-paper p-4 shadow-card">
            <div className="t-eyebrow text-neutralx-fg3">{t("practiceStreak")}</div>
            <div dir="ltr" className="mt-1 flex items-baseline gap-1">
              <span className="t-display text-ink">{PROGRESS.streakDays}</span>
              <span className="t-body text-neutralx-fg3">{t("days")}</span>
            </div>
            <div dir="ltr" className="mt-2 flex gap-1">
              {PROGRESS.streak.map((on, i) => (
                <span key={i} className={cn("h-1.5 flex-1 rounded-pill", on ? "bg-brand" : "bg-line2")} aria-hidden />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Five module cards in a row (desktop). */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {MODS.map((m) => (
          <Link
            key={m.id}
            href={`/${locale}/tools/${m.id}`}
            className="group flex flex-col rounded-xl border border-line bg-paper p-5 shadow-card transition-shadow hover:shadow-panel"
          >
            <div className="flex items-start justify-between">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-lg t-code font-semibold"
                style={{ background: m.accentBg, color: m.accent }}
              >
                {m.tag}
              </span>
              <span className="t-code text-neutralx-fg2">{String(m.index).padStart(2, "0")}</span>
            </div>
            <div className="mt-4 t-body font-semibold text-ink">{m.name}</div>
            <div className="t-body-sm text-neutralx-fg3">{tc(`hub.mod.${m.id}.subtitle`)}</div>
            <div className="mt-2 t-eyebrow text-neutralx-fg2">{tc(`hub.mod.${m.id}.features`)}</div>

            <div className="mt-auto pt-4">
              <div className="flex items-center justify-between">
                <span className="t-eyebrow text-neutralx-fg3">{t("cardProgress")}</span>
                <span dir="ltr" className="t-mono text-xs text-ink">{m.progress}%</span>
              </div>
              <ProgressBar value={m.progress} color={m.accent} className="mt-1.5" />
              <div className="mt-3 t-eyebrow text-neutralx-fg2">{tc(`hub.mod.${m.id}.lastActivity`)}</div>
              <span className="mt-3 flex w-full items-center justify-center rounded-md bg-brand px-3 py-2 t-cta text-brand-on group-hover:brightness-95">
                {t("continueCta")} →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Session context (+ coach) and Continue your path. */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-paper p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="t-section text-ink">{t("sessionContext")}</h2>
            <span className="t-eyebrow text-neutralx-fg3">{t("sharedByAll")}</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-line3 p-4">
              <div className="t-eyebrow text-neutralx-fg3">{t("activeVehicle")}</div>
              <div className="mt-1 t-body font-semibold text-ink">{vehicle.name}</div>
              <div dir="ltr" className="mt-1 t-code text-neutralx-fg3">
                {vehicle.engine} · {vehicle.transmission}
              </div>
              <div dir="ltr" className="t-code text-neutralx-fg3">VIN {vehicle.vin}</div>
              <Link href={`/${locale}/garage`} className="mt-2 inline-block t-body-sm text-brand hover:underline">
                {t("openGarage")} →
              </Link>
            </div>
            <div className="rounded-lg border border-line3 bg-brand/5 p-4">
              <div className="t-eyebrow text-neutralx-fg3">{t("componentUnderTest")}</div>
              <div className="mt-1 t-body font-semibold text-ink">
                <span dir="ltr">{comp?.ref}</span> · {comp?.name}
              </div>
              <div className="mt-1 t-body-sm text-neutralx-fg3">{comp?.system}</div>
              <Link href={`/${locale}/garage`} className="mt-2 inline-block t-body-sm text-brand hover:underline">
                {t("changeComponent")} →
              </Link>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-brand/30 bg-brand/5 p-4">
            <div className="t-eyebrow text-brand">{t("coachLabel")}</div>
            <p className="mt-1.5 t-body-sm text-ink">{tc("hub.coach")}</p>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-paper p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="t-section text-ink">{t("continuePath")}</h2>
            <span className="t-body-sm text-brand">{t("allSkills")}</span>
          </div>
          <div className="mt-3 space-y-2">
            {HUB_TASKS.map((task, i) => (
              <Link
                key={task.tag}
                href={`/${locale}/tools/${task.tool}`}
                className="focus-ring flex items-center gap-3 rounded-lg border border-line3 p-3 hover:border-brand"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fill t-code font-semibold text-neutralx-fg3">
                  {task.tag}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="t-body-sm font-medium text-ink">{tc(`hub.task.${i}.title`)}</div>
                  <div className="t-eyebrow text-neutralx-fg2">{tc(`hub.task.${i}.meta`)}</div>
                </div>
                <span className={cn("rounded-md px-2 py-0.5 t-code", STATUS_CLS[task.status])}>
                  {t(`status.${task.status}`)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
