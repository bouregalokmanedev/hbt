import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion, type MotionProps } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  BrainCircuit,
  Check,
  CheckCircle2,
  Gauge,
  Lightbulb,
  ListChecks,
  Lock,
  MessageSquare,
  Sparkles,
  Target,
  Ticket,
  Wrench,
  Zap,
} from "lucide-react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { usePageMeta } from "@/lib/page-meta";
import { MentorShowcaseLoop } from "../components/MentorShowcaseLoop";

const CAPABILITIES = [
  { icon: MessageSquare, key: "chat" },
  { icon: Gauge, key: "tools" },
  { icon: Wrench, key: "bench" },
  { icon: Zap, key: "speed" },
] as const;

const STEPS = ["step1", "step2", "step3", "step4"] as const;

const KINDS = [
  {
    key: "hint",
    icon: Lightbulb,
    tone: "border-amber-400/30 bg-amber-50 text-amber-600",
  },
  {
    key: "quiz",
    icon: ListChecks,
    tone: "border-sky-400/30 bg-sky-50 text-sky-600",
  },
  {
    key: "guide",
    icon: BookOpenCheck,
    tone: "border-emerald-400/30 bg-emerald-50 text-emerald-600",
  },
  {
    key: "weakSpot",
    icon: Target,
    tone: "border-rose-400/30 bg-rose-50 text-rose-600",
  },
] as const;

const EASE = [0.22, 1, 0.36, 1] as const;

export function AiMentorIntroPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const prefersReduced = useReducedMotion();

  usePageMeta({
    title: t("demo.mentorPage.title"),
    description: t("demo.mentorPage.desc"),
    canonicalPath: "/ai-mentor/intro",
  });

  const enter = (delay = 0) => ({
    initial: prefersReduced ? false : { opacity: 0, y: 26 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  const reveal: MotionProps =
    typeof IntersectionObserver === "undefined"
      ? {}
      : {
          initial: prefersReduced ? false : { opacity: 0, y: 28 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "0px 0px -60px 0px" },
          transition: { duration: 0.6, ease: "easeOut" },
        };

  return (
    <main
      className="min-h-screen bg-[#F7F7F7] text-[#3A3A3A]"
      data-testid="ai-mentor-intro"
    >
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(244,120,34,0.14),transparent_32%),radial-gradient(circle_at_82%_25%,rgba(34,211,238,0.08),transparent_30%),linear-gradient(180deg,#FFFDFC_0%,#F7F7F7_92%)]" />
          <div className="absolute inset-0 opacity-[0.45] [background-image:linear-gradient(to_right,rgba(58,58,58,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(58,58,58,.06)_1px,transparent_1px)] [background-size:64px_64px]" />
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#F47822]/12 blur-[120px] motion-safe:animate-[hbt-glow_9s_ease-in-out_infinite]" />
          <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-cyan-400/8 blur-[130px] motion-safe:animate-[hbt-glow_11s_ease-in-out_infinite] [animation-delay:1.5s]" />
        </div>

        <div className="relative mx-auto max-w-[1240px] px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-16">
          <div className="grid gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <motion.div {...enter(0)}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#F47822]/25 bg-white/85 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#D96319] shadow-sm">
                  <BrainCircuit className="h-3.5 w-3.5" />
                  {t("demo.mentorPage.eyebrow")}
                </span>
                {!user && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#3A3A3A]/10 bg-white/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#3A3A3A]/55 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                    {t("demo.mentorPage.guestPreview")}
                  </span>
                )}
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.03] tracking-[-0.045em] text-[#3A3A3A] sm:text-5xl lg:text-6xl">
                {t("demo.mentorPage.titleA")}{" "}
                <span className="inline-block whitespace-nowrap bg-gradient-to-r from-[#F47822] via-[#FFB37A] to-[#F47822] bg-clip-text text-transparent">
                  {t("demo.mentorPage.titleHighlight")}
                </span>{" "}
                {t("demo.mentorPage.titleB")}
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-[#3A3A3A]/65 sm:text-base">
                {t("demo.mentorPage.desc")}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {user ? (
                  <Link
                    to="/ai-mentor"
                    data-testid="mentor-open-app"
                    className="group inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-6 py-3.5 text-sm font-black text-white shadow-[0_16px_50px_rgba(244,120,34,0.3)] transition hover:-translate-y-0.5 hover:bg-[#e96916]"
                  >
                    {t("demo.mentorPage.openApp")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register?next=%2Fai-mentor%2Fintro"
                      data-testid="mentor-register"
                      className="group inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-6 py-3.5 text-sm font-black text-white shadow-[0_16px_50px_rgba(244,120,34,0.3)] transition hover:-translate-y-0.5 hover:bg-[#e96916]"
                    >
                      <Ticket className="h-4 w-4" />
                      {t("demo.mentorPage.get_token")}
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
                    </Link>
                    <Link
                      to="/demo"
                      className="inline-flex items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-white px-6 py-3.5 text-sm font-black text-[#3A3A3A]/80 shadow-sm transition hover:border-[#F47822]/35 hover:bg-[#FFF8F4] hover:text-[#D96319]"
                    >
                      {t("demo.mentorPage.tryDemo")}
                    </Link>
                  </>
                )}
              </div>

              {!user && (
                <div
                  data-testid="mentor-token-gate"
                  className="group relative mt-8 max-w-xl overflow-hidden rounded-2xl border border-[#F47822]/20 bg-white/90 p-4 shadow-[0_14px_35px_rgba(58,58,58,.06)] sm:p-5"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F47822]/70 to-transparent"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[#F47822]/15 blur-2xl motion-safe:animate-[hbt-glow_7s_ease-in-out_infinite]"
                  />

                  <div className="relative flex items-start gap-3.5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#F47822]/25 bg-[#F47822]/10 text-[#F47822]">
                      <Lock className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-[#3A3A3A]">
                        {t("demo.mentorPage.gateTitle")}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/60">
                        {t("demo.mentorPage.gateDesc")}
                      </p>

                      <ul className="mt-3.5 grid gap-2">
                        {[
                          t("demo.mentorPage.gateBullet1"),
                          t("demo.mentorPage.gateBullet2"),
                          t("demo.mentorPage.gateBullet3"),
                        ].map((bullet) => (
                          <li
                            key={bullet}
                            className="flex items-start gap-2 text-[11px] leading-5 text-[#3A3A3A]/65"
                          >
                            <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#F47822]/15 text-[#F47822]">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                            {bullet}
                          </li>
                        ))}
                      </ul>

                      <div
                        className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-lg border border-[#3A3A3A]/10 bg-[#F8F7F6] px-3 py-1.5 font-mono text-[10px] text-[#3A3A3A]/45"
                        dir="ltr"
                      >
                        <Ticket className="h-3 w-3 text-[#D96319]" />
                        <span className="text-[#D96319]">
                          {t("demo.mentorPage.previewToken")}
                        </span>
                        <span className="text-[#3A3A3A]/35">
                          {t("demo.mentorPage.previewTokenValue")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <p className="mt-5 flex items-center gap-2 text-[11px] text-[#3A3A3A]/45">
                <Sparkles className="h-3.5 w-3.5 text-[#F47822]" />
                {t("demo.mentorPage.heroNote")}
              </p>
            </motion.div>

            {/* Mentor console preview */}
            <motion.div
              aria-hidden="true"
              initial={
                prefersReduced ? false : { opacity: 0, y: 30, scale: 0.97 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.12, ease: EASE }}
              className="relative mx-auto w-full max-w-[520px]"
            >
              <div className="absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#3A3A3A]/8" />
              <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#F47822]/15 motion-safe:animate-[hbt-orbit_30s_linear_infinite]" />
              <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F47822]/15 blur-[90px]" />

              <div className="relative rounded-[30px] border border-[#3A3A3A]/10 bg-white/90 p-2.5 shadow-[0_32px_80px_rgba(58,58,58,0.16)] backdrop-blur">
                <div className="overflow-hidden rounded-[22px] border border-[#3A3A3A]/8 bg-[#FCFCFC]">
                  <div className="flex items-center justify-between border-b border-[#3A3A3A]/8 bg-white px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-400/80" />
                      <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                      <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                      <span className="ms-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#3A3A3A]/40">
                        {t("demo.mentorPage.showcase.windowTitle")}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-2.5 py-1 font-mono text-[8px] font-black uppercase tracking-[0.16em] text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {t("demo.mentorPage.showcase.mentorLabel")}
                    </span>
                  </div>

                  <div className="relative space-y-3 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3A3A3A]/10 bg-white px-2.5 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/45 shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#F47822]" />
                        {t("demo.mentorPage.previewContext")}
                      </span>
                    </div>

                    <div className="flex justify-end">
                      <p className="max-w-[88%] rounded-2xl rounded-ee-sm bg-[#F47822] px-4 py-2.5 text-[11px] leading-5 text-white shadow-[0_10px_26px_rgba(244,120,34,0.22)]">
                        {t("demo.mentorPage.showcase.turns.hint.q")}
                      </p>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#F47822]/25 bg-[#F47822]/10">
                        <BrainCircuit className="h-3.5 w-3.5 text-[#F47822]" />
                      </span>
                      <div className="min-w-0 max-w-[90%] rounded-2xl rounded-es-sm border border-[#3A3A3A]/8 bg-white px-4 py-3 text-[11px] leading-5 text-[#3A3A3A]/70 shadow-sm">
                        <span className="mb-1.5 inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-amber-600">
                          <Lightbulb className="h-2.5 w-2.5" />
                          {t("demo.mentorPage.showcase.kinds.hint")}
                        </span>
                        <p className="line-clamp-3">
                          {t("demo.mentorPage.showcase.turns.hint.a")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-2.5 shadow-sm">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-[#3A3A3A]/30" />
                      <span className="flex-1 truncate text-[10px] text-[#3A3A3A]/35">
                        {t("demo.mentorPage.previewPlaceholder")}
                      </span>
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#F47822] text-white">
                        <ArrowUpRight className="h-3 w-3 rtl:-scale-x-100" />
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#3A3A3A]/8 pt-3">
                      <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/35">
                        {t("demo.mentorPage.showcase.mentorLabel")}
                      </span>
                      <div className="flex items-center gap-1">
                        {[0, 1, 2, 3].map((bar) => (
                          <span
                            key={bar}
                            className="h-1 w-5 rounded-full"
                            style={{
                              background: kindBarColor(bar),
                              opacity: bar === 0 ? 1 : 0.4,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -end-3 top-16 hidden rotate-3 rounded-xl border border-[#F47822]/25 bg-white px-3 py-2 shadow-[0_12px_30px_rgba(58,58,58,0.16)] motion-safe:animate-[hbt-float_7s_ease-in-out_infinite] sm:-end-6 sm:block">
                <div dir="ltr">
                  <p className="flex items-center gap-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#D96319]">
                    <Ticket className="h-3 w-3" />
                    {t("demo.mentorPage.previewToken")}
                  </p>
                  <p className="mt-0.5 font-mono text-xs font-black text-[#3A3A3A]">
                    {t("demo.mentorPage.previewTokenValue")}
                  </p>
                </div>
              </div>

              <div className="absolute -bottom-8 start-8 hidden -rotate-2 rounded-xl border border-rose-200 bg-white px-3 py-2 shadow-[0_12px_30px_rgba(58,58,58,0.16)] motion-safe:animate-[hbt-float_8s_ease-in-out_infinite] [animation-delay:1.2s] sm:block">
                <p className="flex items-center gap-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-rose-500">
                  <Target className="h-3 w-3" />
                  {t("demo.mentorPage.showcase.kinds.weakSpot")}
                </p>
                <p className="mt-0.5 text-[10px] font-bold text-[#3A3A3A]/60">
                  {t("demo.mentorPage.caps.speed.title")}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-[1240px] space-y-20 px-5 pb-24 pt-16 sm:px-8 sm:pt-20">
        <MentorShowcaseLoop />

        {/* Capabilities */}
        <motion.section aria-labelledby="mentor-what" {...reveal}>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
                <span className="h-px w-8 bg-[#F47822]" />
                02 / {t("demo.mentorPage.whatEyebrow")}
              </p>
              <h2
                id="mentor-what"
                className="mt-3 text-3xl font-black tracking-tight text-[#3A3A3A] sm:text-4xl"
              >
                {t("demo.mentorPage.whatTitle")}
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#3A3A3A]/10 bg-white px-4 py-2 text-xs font-bold text-[#3A3A3A]/55 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#F47822]" />
              {t("demo.mentorPage.heroNote")}
            </span>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map(({ icon: Icon, key }, index) => (
              <motion.article
                key={key}
                whileHover={prefersReduced ? undefined : { y: -5 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                className="group relative overflow-hidden rounded-[24px] border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_10px_30px_rgba(58,58,58,.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#F47822]/35 hover:shadow-[0_16px_38px_rgba(58,58,58,.09)]"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F47822]/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                />
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[#F47822]/20 bg-[#F47822]/10 text-[#F47822] transition-transform duration-300 group-hover:-rotate-6">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-[10px] font-bold text-[#3A3A3A]/25">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-black text-[#3A3A3A]">
                  {t(`demo.mentorPage.caps.${key}.title`)}
                </h3>
                <p className="mt-1.5 text-xs leading-5 text-[#3A3A3A]/60">
                  {t(`demo.mentorPage.caps.${key}.desc`)}
                </p>
              </motion.article>
            ))}
          </div>
        </motion.section>

        {/* How it works */}
        <motion.section aria-labelledby="mentor-how" {...reveal}>
          <p className="flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
            <span className="h-px w-8 bg-[#F47822]" />
            03 / {t("demo.mentorPage.howEyebrow")}
          </p>
          <h2
            id="mentor-how"
            className="mt-3 text-3xl font-black tracking-tight text-[#3A3A3A] sm:text-4xl"
          >
            {t("demo.mentorPage.howTitle")}
          </h2>

          <ol className="relative mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li
                key={step}
                className="group relative overflow-hidden rounded-[24px] border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_10px_30px_rgba(58,58,58,.04)] transition-all hover:-translate-y-1 hover:border-[#F47822]/30 hover:shadow-[0_16px_38px_rgba(58,58,58,.09)]"
              >
                <div className="flex items-center justify-between">
                  <span className="bg-gradient-to-br from-[#F47822] to-[#F9A16C] bg-clip-text font-mono text-3xl font-black text-transparent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {index < STEPS.length - 1 && (
                    <ArrowRight className="hidden h-4 w-4 text-[#3A3A3A]/20 lg:block rtl:rotate-180" />
                  )}
                </div>
                <p className="mt-3 text-sm font-black text-[#3A3A3A]">
                  {t(`demo.mentorPage.how.${step}.title`)}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/60">
                  {t(`demo.mentorPage.how.${step}.desc`)}
                </p>
              </li>
            ))}
          </ol>
        </motion.section>

        {/* Value + CTA */}
        <motion.section
          aria-labelledby="mentor-value"
          {...reveal}
          className="relative overflow-hidden rounded-[32px] border border-[#F47822]/15 bg-gradient-to-br from-[#FFFDFB] via-white to-[#FFF3EA] p-6 shadow-[0_18px_45px_rgba(58,58,58,.07)] sm:p-10"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#F47822]/20 blur-[90px]" />
            <div className="absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-cyan-400/10 blur-[100px]" />
            <div className="absolute inset-0 opacity-[0.5] [background-image:linear-gradient(to_right,rgba(58,58,58,.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(58,58,58,.05)_1px,transparent_1px)] [background-size:48px_48px]" />
          </div>

          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
                <span className="h-px w-8 bg-[#F47822]" />
                04 / {t("demo.mentorPage.valueEyebrow")}
              </p>
              <h2
                id="mentor-value"
                className="mt-3 text-3xl font-black tracking-tight text-[#3A3A3A] sm:text-4xl"
              >
                {t("demo.mentorPage.valueTitle")}
              </h2>

              <ul className="mt-6 grid gap-3">
                {[1, 2, 3, 4].map((n) => (
                  <li
                    key={n}
                    className="flex items-start gap-3 rounded-2xl border border-[#3A3A3A]/8 bg-white/90 p-4 shadow-sm"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <span className="text-sm leading-6 text-[#3A3A3A]/65">
                      {t(`demo.mentorPage.value.${n}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative overflow-hidden rounded-[26px] border border-[#3A3A3A]/10 bg-white p-6 shadow-[0_24px_60px_rgba(58,58,58,0.12)] backdrop-blur sm:p-7">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-[#F47822]/10 to-transparent motion-safe:animate-[hbt-shimmer_6s_ease-in-out_infinite] motion-reduce:hidden"
              />

              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#F47822]/30 bg-[#F47822]/10 text-[#F47822]">
                <Ticket className="h-5 w-5" />
              </span>

              <p className="mt-4 text-lg font-black leading-7 text-[#3A3A3A]">
                {t("demo.mentorPage.ctaLine")}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {user ? (
                  <Link
                    to="/ai-mentor"
                    className="group inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-black text-white transition hover:bg-[#e96916]"
                  >
                    {t("demo.mentorPage.openApp")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                  </Link>
                ) : (
                  <Link
                    to="/register?next=%2Fai-mentor%2Fintro"
                    className="group inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-black text-white transition hover:bg-[#e96916]"
                  >
                    <Ticket className="h-4 w-4" />
                    {t("demo.mentorPage.get_token")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                  </Link>
                )}
                <Link
                  to="/demo"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-5 py-3 text-sm font-black text-[#3A3A3A]/75 transition hover:border-[#F47822]/35 hover:bg-[#FFF8F4] hover:text-[#D96319]"
                >
                  {t("demo.mentorPage.tryDemo")}
                </Link>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#3A3A3A]/10 pt-3">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/35">
                  {t("demo.mentorPage.previewToken")}
                </span>
                <div className="flex items-center gap-1.5">
                  {KINDS.map((kind) => (
                    <span
                      key={kind.key}
                      className={`grid h-6 w-6 place-items-center rounded-full border ${kind.tone}`}
                    >
                      <kind.icon className="h-3 w-3" />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}

function kindBarColor(index: number): string {
  return ["#F47822", "#38BDF8", "#34D399", "#FB7185"][index] ?? "#F47822";
}
