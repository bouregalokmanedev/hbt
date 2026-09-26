import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  Lock,
  MessageSquare,
  Sparkles,
  Ticket,
  Wrench,
  Zap,
} from "lucide-react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { MentorShowcaseLoop } from "../components/MentorShowcaseLoop";

const CAPABILITIES = [
  { icon: MessageSquare, key: "chat" },
  { icon: Gauge, key: "tools" },
  { icon: Wrench, key: "bench" },
  { icon: Zap, key: "speed" },
] as const;

const STEPS = ["step1", "step2", "step3", "step4"] as const;

export function AiMentorIntroPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-[#F3F3F3] dark:bg-[#101013]" data-testid="ai-mentor-intro">
      <section className="relative overflow-hidden border-b border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-[#F47822]/[0.08] via-transparent to-[#8B5CF6]/[0.06]"
        />
        <div className="relative mx-auto max-w-[1100px] px-5 py-14 sm:px-8 sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#F47822]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#F47822]">
            <BrainCircuit className="h-3.5 w-3.5" />
            {t("demo.mentorPage.eyebrow")}
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-[#3A3A3A] sm:text-5xl dark:text-white">
            {t("demo.mentorPage.title")}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#3A3A3A]/60 sm:text-base dark:text-white/60">
            {t("demo.mentorPage.desc")}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Link
                to="/ai-mentor"
                data-testid="mentor-open-app"
                className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-6 py-3.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(244,120,34,.25)] transition hover:bg-[#e96916]"
              >
                {t("demo.mentorPage.openApp")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register?next=%2Fai-mentor%2Fintro"
                  data-testid="mentor-register"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-6 py-3.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(244,120,34,.25)] transition hover:bg-[#e96916]"
                >
                  <Ticket className="h-4 w-4" />
                  {t("demo.mentorPage.get_token")}
                </Link>
                <Link
                  to="/demo"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#3A3A3A]/15 bg-white px-6 py-3.5 text-sm font-black text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
                >
                  {t("demo.mentorPage.tryDemo")}
                </Link>
              </>
            )}
          </div>

          {!user && (
            <div
              data-testid="mentor-token-gate"
              className="mt-6 flex max-w-lg items-start gap-3 rounded-2xl border border-[#F47822]/25 bg-[#F47822]/5 p-4"
            >
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[#F47822]" />
              <div>
                <p className="text-sm font-bold text-[#3A3A3A] dark:text-white">
                  {t("demo.mentorPage.gateTitle")}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/60 dark:text-white/60">
                  {t("demo.mentorPage.gateDesc")}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] space-y-12 px-5 py-12 sm:px-8">
        <section aria-labelledby="mentor-what">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#F47822]">
            {t("demo.mentorPage.whatEyebrow")}
          </p>
          <h2 id="mentor-what" className="mt-1 text-2xl font-black text-[#3A3A3A] dark:text-white">
            {t("demo.mentorPage.whatTitle")}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {CAPABILITIES.map(({ icon: Icon, key }) => (
              <article
                key={key}
                className="rounded-[22px] border border-[#3A3A3A]/10 bg-white p-5 dark:border-white/10 dark:bg-[#1b1b20]"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-black text-[#3A3A3A] dark:text-white">
                  {t(`demo.mentorPage.caps.${key}.title`)}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[#3A3A3A]/55 dark:text-white/55">
                  {t(`demo.mentorPage.caps.${key}.desc`)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="mentor-how">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#F47822]">
            {t("demo.mentorPage.howEyebrow")}
          </p>
          <h2 id="mentor-how" className="mt-1 text-2xl font-black text-[#3A3A3A] dark:text-white">
            {t("demo.mentorPage.howTitle")}
          </h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li
                key={step}
                className="rounded-[22px] border border-[#3A3A3A]/10 bg-white p-5 dark:border-white/10 dark:bg-[#1b1b20]"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F47822] text-xs font-black text-white">
                  {index + 1}
                </span>
                <p className="mt-3 text-sm font-black text-[#3A3A3A] dark:text-white">
                  {t(`demo.mentorPage.how.${step}.title`)}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/55 dark:text-white/55">
                  {t(`demo.mentorPage.how.${step}.desc`)}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <MentorShowcaseLoop />

        <section aria-labelledby="mentor-value" className="rounded-[28px] border border-[#3A3A3A]/10 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-[#1b1b20]">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#F47822]">
            {t("demo.mentorPage.valueEyebrow")}
          </p>
          <h2 id="mentor-value" className="mt-1 text-2xl font-black text-[#3A3A3A] dark:text-white">
            {t("demo.mentorPage.valueTitle")}
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <li
                key={n}
                className="flex items-start gap-3 rounded-2xl bg-[#F8F7F6] p-4 dark:bg-white/[0.03]"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <span className="text-sm leading-6 text-[#3A3A3A]/70 dark:text-white/70">
                  {t(`demo.mentorPage.value.${n}`)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[#3A3A3A]/8 pt-6 dark:border-white/8">
            <Sparkles className="h-5 w-5 text-[#F47822]" />
            <p className="flex-1 text-sm text-[#3A3A3A]/60 dark:text-white/60">{t("demo.mentorPage.ctaLine")}</p>
            {!user ? (
              <Link
                to="/register?next=%2Fai-mentor%2Fintro"
                className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-black text-white transition hover:bg-[#e96916]"
              >
                <Ticket className="h-4 w-4" />
                {t("demo.mentorPage.get_token")}
              </Link>
            ) : (
              <Link
                to="/ai-mentor"
                className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-black text-white transition hover:bg-[#e96916]"
              >
                {t("demo.mentorPage.openApp")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
