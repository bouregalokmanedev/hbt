"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { ToggleSwitch } from "@/components/shared/ToggleSwitch";
import { useAppStore, useAppStoreApi } from "@/providers/StoreProvider";
import type { Settings } from "@/stores/createStore";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-paper p-5 shadow-card">
      <h2 className="t-section text-ink">{title}</h2>
      <div className="mt-4 divide-y divide-line3">{children}</div>
    </section>
  );
}

function Row({ label, hint, control }: { label: string; hint?: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="t-body-sm font-medium text-ink">{label}</div>
        {hint ? <div className="mt-0.5 t-body-sm text-neutralx-fg3">{hint}</div> : null}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const s = useAppStore((x) => x.settings);
  const api = useAppStoreApi();

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => api.getState().setSetting(k, v);

  const switchLocale = (loc: string) => {
    const rest = pathname.replace(/^\/[a-z]{2}/, "");
    document.cookie = `NEXT_LOCALE=${loc};path=/;max-age=31536000`;
    set("language", loc as Settings["language"]);
    router.push(`/${loc}${rest}`);
  };

  return (
    <div className="px-7 pt-[26px] pb-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Group title={t("groups.training")}>
          <Row
            label={t("training.difficulty")}
            control={
              <SegmentedControl
                ariaLabel={t("training.difficulty")}
                value={s.difficulty}
                onChange={(v) => set("difficulty", v)}
                options={(["Easy", "Medium", "Hard"] as const).map((v) => ({ value: v, label: t(`options.difficulty.${v}`) }))}
              />
            }
          />
          <Row label={t("training.hints")} control={<ToggleSwitch checked={s.hints} onChange={(v) => set("hints", v)} ariaLabel={t("training.hints")} />} />
          <Row label={t("training.outlines")} control={<ToggleSwitch checked={s.outlines} onChange={(v) => set("outlines", v)} ariaLabel={t("training.outlines")} />} />
        </Group>

        <Group title={t("groups.instruments")}>
          <Row
            label={t("instruments.layout")}
            control={
              <SegmentedControl
                ariaLabel={t("instruments.layout")}
                value={s.instrument}
                onChange={(v) => set("instrument", v)}
                options={(["Bench replica", "Handheld"] as const).map((v) => ({ value: v, label: t(`options.instrument.${v}`) }))}
              />
            }
          />
          <Row
            label={t("instruments.probeMode")}
            control={
              <SegmentedControl
                ariaLabel={t("instruments.probeMode")}
                value={s.probeMode}
                onChange={(v) => set("probeMode", v)}
                options={(["Drag probes", "Click to place"] as const).map((v) => ({ value: v, label: t(`options.probeMode.${v}`) }))}
              />
            }
          />
          <Row
            label={t("instruments.noise")}
            control={
              <SegmentedControl
                ariaLabel={t("instruments.noise")}
                value={s.noise}
                onChange={(v) => set("noise", v)}
                options={(["Off", "Normal", "High"] as const).map((v) => ({ value: v, label: t(`options.noise.${v}`) }))}
              />
            }
          />
        </Group>

        <Group title={t("groups.session")}>
          <Row label={t("session.randomFault")} control={<ToggleSwitch checked={s.randomFault} onChange={(v) => set("randomFault", v)} ariaLabel={t("session.randomFault")} />} />
          <Row
            label={t("session.hubLayout")}
            control={
              <SegmentedControl
                ariaLabel={t("session.hubLayout")}
                value={s.hubLayout}
                onChange={(v) => set("hubLayout", v)}
                options={(["cards", "rows"] as const).map((v) => ({ value: v, label: t(`options.hubLayout.${v}`) }))}
              />
            }
          />
        </Group>

        <Group title={t("groups.account")}>
          <Row label={t("account.railLabels")} control={<ToggleSwitch checked={s.railLabels} onChange={(v) => set("railLabels", v)} ariaLabel={t("account.railLabels")} />} />
          <Row
            label={t("account.language")}
            hint={t("languageHint")}
            control={
              <SegmentedControl
                ariaLabel={t("account.language")}
                value={locale}
                onChange={switchLocale}
                options={[
                  { value: "en", label: "EN" },
                  { value: "ar", label: "AR" },
                  { value: "fr", label: "FR" },
                ]}
              />
            }
          />
        </Group>
      </div>
    </div>
  );
}
