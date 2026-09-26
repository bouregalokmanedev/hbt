"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAppStoreApi } from "@/providers/StoreProvider";

export default function LoginPage() {
  const t = useTranslations("login");
  const locale = useLocale();
  const router = useRouter();
  const api = useAppStoreApi();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keep, setKeep] = useState(true);

  const signIn = () => {
    api.getState().signIn();
    router.push(`/${locale}/hub`);
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-shell-bg lg:grid-cols-[662fr_778fr]">
      {/* Left brand panel — full-height orange (source: #F47822, ink text, 44/46 padding). */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-brand px-[46px] py-[44px] text-[#131A26] lg:flex">
        {/* Decorative tonal circles (source). */}
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-black/[0.06]" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white t-cta font-bold text-brand">
            HB
          </span>
          <span className="t-eyebrow leading-tight text-[#131A26]">{t("brand.name")}</span>
        </div>

        <div className="relative max-w-[540px]">
          <h1 className="font-[var(--font-plex-cond)] text-[44px] font-bold leading-[1.05] text-[#131A26]">
            {t("brand.tagline")}
          </h1>
          <p className="mt-5 max-w-sm t-body text-[#131A26]/80" style={{ textWrap: "pretty" } as React.CSSProperties}>
            {t("brand.desc")}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["oem", "waveforms", "trees"].map((c) => (
              <span key={c} className="rounded-md border border-black/10 bg-white/60 px-3 py-1.5 t-eyebrow text-[#131A26]">
                {t(`brand.chips.${c}`)}
              </span>
            ))}
          </div>
        </div>

        <div className="relative t-code text-[#131A26]/70">{t("brand.version")}</div>
      </section>

      {/* Right sign-in area — form on the dark shell (no white card in source). */}
      <section className="flex items-center justify-center bg-shell-bg p-10">
        <div className="w-full max-w-sm">
          <div className="t-eyebrow tracking-[0.18em] text-brand">{t("form.kicker")}</div>
          <h2 className="mt-2 text-[25px] font-semibold leading-tight tracking-[-0.25px] text-white">
            {t("form.heading")}
          </h2>
          <p className="mt-2 t-body-sm text-shell-dim">{t("form.subtitle")}</p>

          <form
            className="mt-6 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              signIn();
            }}
          >
            <label className="flex flex-col gap-1.5">
              <span className="t-eyebrow text-shell-dim">{t("form.email")}</span>
              <input
                dir="ltr"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("form.emailPlaceholder")}
                className="focus-ring h-[42px] rounded border border-[#2A3038] bg-[#14181C] px-3 t-body-sm text-[#E8EAED] outline-none placeholder:text-shell-muted"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="t-eyebrow text-shell-dim">{t("form.password")}</span>
              <input
                dir="ltr"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-ring h-[42px] rounded border border-[#2A3038] bg-[#14181C] px-3 t-body-sm text-[#E8EAED] outline-none"
              />
            </label>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 t-body-sm text-shell-text">
                <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} className="accent-brand" />
                {t("form.keep")}
              </label>
              <button type="button" className="t-body-sm text-[#1F6AE1] hover:underline">
                {t("form.forgot")}
              </button>
            </div>

            <button type="submit" className="focus-ring mt-1 h-[42px] rounded-[9px] bg-brand t-cta text-brand-on">
              {t("form.submit")} →
            </button>
            <button
              type="button"
              onClick={signIn}
              className="focus-ring h-[42px] rounded-[9px] border border-[#2A3038] t-cta text-[#C9CDD2] hover:border-brand"
            >
              {t("form.sso")}
            </button>
          </form>

          <div className="mt-6 border-t border-[#2A3038] pt-4">
            <p className="t-body-sm text-[#5F6570]">{t("form.footer")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
