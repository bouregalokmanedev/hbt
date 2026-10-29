import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  FileText,
  FolderOpen,
  GraduationCap,
  Headphones,
  Images,
  Landmark,
  Layers3,
  ListChecks,
  MapPin,
  MessagesSquare,
  Network,
  PlayCircle,
  Rocket,
  School,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import galleryElectrical from "@/assets/landing/pic-8.jpg";
import galleryWorkshop from "@/assets/landing/pic-6.jpg";
import galleryScan from "@/assets/landing/heropic.webp";
import galleryPractice from "@/assets/landing/heropic2.webp";
import galleryTools from "@/assets/landing/scanner.webp";
import { Footer } from "@/features/landingpage/components/FooterSection";
import { usePageMeta } from "@/lib/page-meta";

import { bootcampsApi } from "../api/bootcamps.api";
import { BootcampRegistrationForm } from "../components/BootcampRegistrationForm";
import { useBootcamp, useBootcamps } from "../hooks/useBootcamps";
import {
  BOOTCAMP_INCLUDE_KEYS,
  type Bootcamp,
  type BootcampIncludes,
  type BootcampSchedule,
} from "../types/bootcamp.types";
import {
  formatBootcampDate,
  formatBootcampDuration,
  formatBootcampLevel,
  formatBootcampPrice,
} from "../utils/bootcampFormat";

const INCLUDE_ICONS: Record<keyof BootcampIncludes, typeof BookOpen> = {
  challenges: Wrench,
  resources: FolderOpen,
  quizzes: ListChecks,
  support: Headphones,
  certificate: Award,
  final_project: Rocket,
  classrooms: School,
};

const CAREER_ITEMS = [
  { key: "jobOffers", icon: Briefcase },
  { key: "interview", icon: MessagesSquare },
  { key: "network", icon: Network },
] as const;

const ENROLLMENT_STEPS = ["form", "advisor", "payment", "access"] as const;

const GALLERY_ITEMS = [
  { key: "workshop", image: galleryWorkshop },
  { key: "electrical", image: galleryElectrical },
  { key: "scan", image: galleryScan },
  { key: "practice", image: galleryPractice },
  { key: "tools", image: galleryTools },
] as const;

function scheduleRange(schedule: BootcampSchedule, language: string): string {
  const start = formatBootcampDate(schedule.starts_at, language, {
    day: "numeric",
    month: "long",
  });
  const end = formatBootcampDate(schedule.ends_at, language, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `${start} – ${end}`;
}

function SectionHeading({
  eyebrow,
  title,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  icon: typeof BookOpen;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon
        aria-hidden="true"
        className="mt-1 h-4 w-4 shrink-0 text-[#F47822]"
      />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
          {title}
        </h2>
      </div>
    </div>
  );
}

function Initials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F47822]/10 text-sm font-black text-[#F47822]">
      {initials || "HB"}
    </span>
  );
}

function PaymentLogos({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-1.5 ${className}`}>
      <img
        src="/assets/payments/visa.svg"
        alt="Visa"
        width={48}
        height={30}
        loading="lazy"
        className="h-[30px] w-12 rounded-md border border-black/5 bg-white object-contain shadow-sm"
      />
      <img
        src="/assets/payments/mastercard.svg"
        alt="Mastercard"
        width={48}
        height={30}
        loading="lazy"
        className="h-[30px] w-12 rounded-md border border-black/5 bg-white object-contain shadow-sm"
      />
    </span>
  );
}

function QuickReserveBar({
  bootcamp,
  language,
}: {
  bootcamp: Bootcamp;
  language: string;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) {
      return;
    }

    const update = () => {
      const registration = document.getElementById("bootcamp-registration");
      const rect = registration?.getBoundingClientRect();
      const formInView = rect
        ? rect.top < window.innerHeight * 0.92 && rect.bottom > 96
        : false;
      const scrollHeight = document.documentElement.scrollHeight;
      const nearBottom =
        scrollHeight > window.innerHeight &&
        window.innerHeight + window.scrollY >= scrollHeight - 160;

      setVisible(window.scrollY > 480 && !formInView && !nearBottom);
    };

    update();

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [dismissed]);

  if (!visible || dismissed) {
    return null;
  }

  const price = formatBootcampPrice(
    bootcamp.price,
    bootcamp.currency,
    language,
  );

  return (
    <div
      role="region"
      aria-label={t("bootcampDetails.quickReserve.eyebrow")}
      data-testid="quick-reserve-bar"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-40 px-3 sm:bottom-5 sm:px-5 sm:pe-24 xl:pe-5"
    >
      <div className="pointer-events-auto relative mx-auto flex max-w-[900px] animate-fade-up items-center gap-2.5 overflow-hidden rounded-[22px] border border-white/70 bg-white/[0.72] p-2.5 shadow-[0_10px_30px_-8px_rgba(58,58,58,0.22),0_30px_70px_-20px_rgba(58,58,58,0.3),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/[0.04] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-[#1b1b20]/[0.72] dark:shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5),0_30px_70px_-20px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.08)] dark:ring-white/[0.06] sm:gap-4 sm:p-3 xl:max-w-[1040px]">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#F47822]/60 to-transparent"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -end-12 -top-20 h-40 w-40 rounded-full bg-[#F47822]/20 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -start-16 h-40 w-40 rounded-full bg-white/40 blur-3xl dark:bg-white/[0.03]"
        />

        <span className="relative hidden h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/50 bg-gradient-to-br from-[#F47822] to-[#D96510] text-white shadow-[0_8px_20px_rgba(244,120,34,0.35)] dark:border-white/10 sm:grid">
          <CalendarDays className="h-5 w-5" />
        </span>

        <div className="relative min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/70 dark:text-white/60">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F47822] shadow-[0_0_0_3px_rgba(244,120,34,0.15)]" />
            {t("bootcampDetails.quickReserve.eyebrow")}
          </p>
          <p className="mt-0.5 truncate text-xs font-bold text-[#3A3A3A] dark:text-[#ececef] sm:text-sm">
            {bootcamp.title}
          </p>
          <p className="mt-0.5 text-sm font-black text-[#F47822] sm:hidden">
            {price}
          </p>
        </div>

        <span
          aria-hidden="true"
          className="relative hidden h-9 w-px shrink-0 bg-gradient-to-b from-transparent via-[#3A3A3A]/10 to-transparent dark:via-white/15 sm:block"
        />

        <div className="relative hidden shrink-0 text-end sm:block">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/70 dark:text-white/60">
            {t("bootcampDetails.hero.priceLabel")}
          </p>
          <p className="text-lg font-black tracking-[-0.03em] text-[#3A3A3A] dark:text-[#ececef]">
            {price}
          </p>
        </div>

        <a
          href="#bootcamp-registration"
          aria-label={t("bootcampDetails.hero.registerTitle")}
          className="group relative inline-flex h-10 shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-white/20 bg-gradient-to-r from-[#F47822] to-[#E8650F] px-3 text-[11px] font-bold text-white shadow-[0_8px_22px_-6px_rgba(244,120,34,0.65)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(244,120,34,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/60 sm:h-11 sm:px-4"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"
          />
          <span className="relative sm:hidden">
            {t("bootcampDetails.quickReserve.ctaShort")}
          </span>
          <span className="relative hidden sm:inline">
            {t("bootcampDetails.hero.registerTitle")}
          </span>
          <ArrowRight className="relative h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
        </a>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={t("bootcampDetails.quickReserve.dismiss")}
          className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#3A3A3A]/10 bg-white/60 text-[#3A3A3A]/60 backdrop-blur transition hover:bg-white/90 hover:text-[#3A3A3A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/40 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/60 dark:hover:bg-white/[0.14] dark:hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function BootcampDetailsPage() {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const { bootcampId } = useParams<{ bootcampId: string }>();
  const { bootcamp, isLoading, error, reload } = useBootcamp(bootcampId);
  const { bootcamps: catalogBootcamps } = useBootcamps({ per_page: 6 });

  usePageMeta({
    title: bootcamp?.title ?? t("bootcampDetails.meta.titleFallback"),
    description:
      bootcamp?.short_description ??
      bootcamp?.description ??
      t("bootcampDetails.meta.descriptionFallback"),
    canonicalPath: bootcamp ? `/bootcamps/${bootcamp.id}` : null,
    image: bootcamp?.thumbnail ?? bootcamp?.cover_image ?? null,
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F3F3F3] pb-20 dark:bg-[#101013]">
        <div className="mx-auto w-full max-w-[1280px] px-5 pt-8 sm:px-8">
          <div className="h-9 w-40 animate-pulse rounded-full bg-black/5 dark:bg-white/5" />
          <div className="mt-8 h-72 animate-pulse rounded-[32px] bg-black/5 dark:bg-white/5" />
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="space-y-5">
              <div className="h-48 animate-pulse rounded-3xl bg-black/5 dark:bg-white/5" />
              <div className="h-80 animate-pulse rounded-3xl bg-black/5 dark:bg-white/5" />
            </div>
            <div className="h-[520px] animate-pulse rounded-3xl bg-black/5 dark:bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !bootcamp) {
    return (
      <main className="min-h-screen bg-[#F3F3F3] dark:bg-[#101013]">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center px-5 py-12 sm:px-8">
          <div className="w-full rounded-[28px] border border-[#3A3A3A]/8 bg-white p-8 text-center shadow-sm dark:border-white/8 dark:bg-[#1b1b20] sm:p-12">
            <GraduationCap className="mx-auto h-10 w-10 text-[#F47822]" />
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
              {t("bootcampDetails.error.title")}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#3A3A3A]/50 dark:text-white/50">
              {error ?? t("bootcampDetails.error.body")}
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void reload()}
                className="inline-flex items-center justify-center rounded-xl bg-[#F47822] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#de6414]"
              >
                {t("bootcampDetails.error.retry")}
              </button>
              <Link
                to="/bootcamps"
                className="inline-flex items-center justify-center rounded-xl border border-[#3A3A3A]/10 bg-white px-5 py-3 text-sm font-semibold text-[#3A3A3A] transition hover:bg-[#F7F7F7] dark:border-white/10 dark:bg-[#101013] dark:text-[#ececef]"
              >
                {t("bootcampCommon.backToBootcamps")}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const includes = BOOTCAMP_INCLUDE_KEYS.map((key) => ({
    key,
    included: Boolean(bootcamp.includes?.[key]),
  }));

  const includedCount = includes.filter((item) => item.included).length;

  const lessonCount = bootcamp.sections.reduce(
    (total, section) => total + section.lessons.length,
    0,
  );

  const instructorName = bootcamp.instructor
    ? `${bootcamp.instructor.first_name} ${bootcamp.instructor.last_name}`.trim()
    : t("bootcampDetails.hero.instructorFallback");

  const coverImage = bootcamp.cover_image ?? bootcamp.thumbnail;

  const relatedBootcamps = catalogBootcamps
    .filter((item) => item.id !== bootcamp.id)
    .sort(
      (a, b) =>
        Number(b.level === bootcamp.level) - Number(a.level === bootcamp.level),
    )
    .slice(0, 3);

  return (
    <>
      <main className="min-h-screen bg-[#F3F3F3] dark:bg-[#101013]">
        <div className="mx-auto w-full max-w-[1280px] px-5 pb-24 pt-6 sm:px-8 sm:pt-8">
          <Link
            to="/bootcamps"
            className="group inline-flex items-center gap-2 rounded-full border border-[#3A3A3A]/10 bg-white px-4 py-2 text-xs font-semibold text-[#3A3A3A]/60 shadow-sm transition hover:-translate-x-0.5 hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/60 rtl:hover:translate-x-0.5"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F7F7F7] dark:bg-[#101013]">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </span>
            {t("bootcampCommon.backToBootcamps")}
          </Link>

          <section className="relative mt-5 overflow-hidden rounded-[32px] bg-[#242428] text-white shadow-[0_18px_42px_rgba(58,58,58,0.16)]">
            {coverImage && (
              <img
                src={coverImage}
                alt={t("bootcampDetails.hero.coverAlt", {
                  title: bootcamp.title,
                })}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#17171a]/95 via-[#1d1d21]/90 to-[#1d1d21]/45"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
            >
              <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#F47822]/25 blur-3xl rtl:-left-20 rtl:right-auto" />
            </div>

            <div className="relative grid gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F47822] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                    <Sparkles className="h-3 w-3" />
                    {t("bootcampDetails.hero.badge")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">
                    <GraduationCap className="h-3 w-3 text-[#F47822]" />
                    {formatBootcampLevel(bootcamp.level, t)}
                  </span>
                  {bootcamp.preview_video && (
                    <a
                      href="#bootcamp-preview"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/70 transition hover:border-[#F47822]/50 hover:text-white"
                    >
                      <PlayCircle className="h-3 w-3 text-[#F47822]" />
                      {t("bootcampDetails.hero.previewEyebrow")}
                    </a>
                  )}
                </div>

                <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-4xl lg:text-5xl">
                  {bootcamp.title}
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                  {bootcamp.short_description}
                </p>

                <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/70">
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-[#F47822]" />
                    {formatBootcampDuration(
                      bootcamp.duration_value,
                      bootcamp.duration_unit,
                      t,
                    )}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#F47822]" />
                    {bootcamp.location}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#F47822]" />
                    {t("bootcampDetails.hero.sectionCount", {
                      count: bootcamp.sections.length,
                    })}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#F47822]" />
                    {t("bootcampDetails.hero.registered", {
                      count: bootcamp.registered_count,
                    })}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-5 backdrop-blur-md">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">
                  {t("bootcampDetails.hero.priceLabel")}
                </p>
                <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-white">
                  {formatBootcampPrice(
                    bootcamp.price,
                    bootcamp.currency,
                    language,
                  )}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <span className="inline-flex items-center gap-2 text-[11px] text-white/65">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#F47822]" />
                    {t("bootcampDetails.paymentCard.onlineBadge")}
                  </span>
                  <PaymentLogos />
                </div>

                <a
                  href="#bootcamp-registration"
                  className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white transition hover:bg-[#de6414]"
                >
                  {t("bootcampDetails.hero.registerTitle")}
                  <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                </a>
              </div>
            </div>
          </section>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
            <div className="flex min-w-0 flex-col gap-6">
              <article className="rounded-3xl border border-[#3A3A3A]/8 bg-white p-6 shadow-[0_6px_24px_rgba(58,58,58,0.035)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-8">
                <SectionHeading
                  eyebrow={t("bootcampDetails.hero.overviewEyebrow")}
                  title={t("bootcampDetails.hero.aboutTitle")}
                  icon={BookOpen}
                />

                <p className="mt-6 whitespace-pre-line text-sm leading-8 text-[#3A3A3A]/65 dark:text-white/65 sm:text-base">
                  {bootcamp.description}
                </p>
              </article>

              {bootcamp.preview_video && (
                <section
                  id="bootcamp-preview"
                  className="scroll-mt-28 rounded-3xl border border-[#3A3A3A]/8 bg-white p-6 shadow-[0_6px_24px_rgba(58,58,58,0.035)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-8"
                >
                  <SectionHeading
                    eyebrow={t("bootcampDetails.hero.previewEyebrow")}
                    title={t("bootcampDetails.hero.previewTitle")}
                    icon={PlayCircle}
                  />
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[#3A3A3A]/55 dark:text-white/55">
                    {t("bootcampDetails.hero.previewBody")}
                  </p>

                  <video
                    src={bootcamp.preview_video}
                    poster={
                      bootcamp.cover_image ?? bootcamp.thumbnail ?? undefined
                    }
                    controls
                    preload="metadata"
                    aria-label={t("bootcampDetails.hero.previewTitle")}
                    className="mt-5 aspect-video w-full rounded-2xl bg-black object-contain"
                  />
                </section>
              )}

              <section className="rounded-3xl border border-[#3A3A3A]/8 bg-white p-6 shadow-[0_6px_24px_rgba(58,58,58,0.035)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <SectionHeading
                    eyebrow={t("bootcampDetails.hero.includesEyebrow")}
                    title={t("bootcampDetails.hero.includesTitle")}
                    icon={BadgeCheck}
                  />

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F47822]/10 px-3 py-1.5 text-[10px] font-bold text-[#D96510] dark:text-[#F9A16C]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t("bootcampDetails.includes.count", {
                      included: includedCount,
                      total: includes.length,
                    })}
                  </span>
                </div>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-[#3A3A3A]/55 dark:text-white/55">
                  {t("bootcampDetails.includes.intro")}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {includes.map(({ key, included }) => {
                    const Icon = INCLUDE_ICONS[key];

                    return (
                      <div
                        key={key}
                        className={[
                          "flex items-start gap-3 rounded-2xl border p-4 transition",
                          included
                            ? "border-[#F47822]/20 bg-[#F47822]/[0.04]"
                            : "border-[#3A3A3A]/8 bg-[#FCFCFC] opacity-70 dark:border-white/8 dark:bg-[#101013]",
                        ].join(" ")}
                      >
                        <Icon
                          className={[
                            "mt-0.5 h-5 w-5 shrink-0",
                            included
                              ? "text-[#F47822]"
                              : "text-[#3A3A3A]/30 dark:text-white/30",
                          ].join(" ")}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                              {t(`bootcampCommon.includes.${key}`)}
                            </p>
                            <span
                              className={[
                                "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold",
                                included
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                  : "bg-[#3A3A3A]/8 text-[#3A3A3A]/45 dark:bg-white/8 dark:text-white/45",
                              ].join(" ")}
                            >
                              {included ? (
                                <Check className="h-2.5 w-2.5" />
                              ) : (
                                <X className="h-2.5 w-2.5" />
                              )}
                              {included
                                ? t("bootcampCommon.included")
                                : t("bootcampCommon.notIncluded")}
                            </span>
                          </div>
                          <p className="mt-1.5 text-[11px] leading-5 text-[#3A3A3A]/50 dark:text-white/50">
                            {t(`bootcampDetails.includes.descriptions.${key}`)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-5 flex items-start gap-2 rounded-xl border border-[#3A3A3A]/8 bg-[#F7F7F7] px-4 py-3 text-[10px] leading-5 text-[#3A3A3A]/45 dark:border-white/8 dark:bg-[#101013] dark:text-white/45">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F47822]" />
                  {t("bootcampDetails.includes.packageNote")}
                </p>
              </section>

              <section className="rounded-3xl border border-[#3A3A3A]/8 bg-white p-6 shadow-[0_6px_24px_rgba(58,58,58,0.035)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-8">
                <SectionHeading
                  eyebrow={t("bootcampDetails.hero.scheduleEyebrow")}
                  title={t("bootcampDetails.hero.scheduleTitle")}
                  icon={CalendarDays}
                />

                {bootcamp.schedules.length === 0 ? (
                  <p className="mt-5 rounded-xl border border-dashed border-[#3A3A3A]/12 px-4 py-6 text-center text-sm text-[#3A3A3A]/45 dark:border-white/12 dark:text-white/45">
                    {t("bootcampDetails.hero.scheduleEmpty")}
                  </p>
                ) : (
                  <ul className="mt-5 space-y-2.5">
                    {bootcamp.schedules.map((schedule) => (
                      <li
                        key={schedule.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#3A3A3A]/8 bg-[#FCFCFC] px-4 py-3 dark:border-white/8 dark:bg-[#101013]"
                      >
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                          <CalendarDays className="h-4 w-4 text-[#F47822]" />
                          {scheduleRange(schedule, language)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          {t("bootcampCatalog.card.seatsOpen")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-3xl border border-[#3A3A3A]/8 bg-white p-6 shadow-[0_6px_24px_rgba(58,58,58,0.035)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <SectionHeading
                    eyebrow={t("bootcampDetails.hero.curriculumEyebrow")}
                    title={t("bootcampDetails.hero.curriculumTitle")}
                    icon={Layers3}
                  />

                  <span className="rounded-full bg-[#F7F7F7] px-3 py-1.5 text-[10px] font-bold text-[#3A3A3A]/50 dark:bg-[#101013] dark:text-white/50">
                    {t("bootcampDetails.hero.lessonCount", {
                      count: lessonCount,
                    })}
                  </span>
                </div>

                {bootcamp.sections.length === 0 ? (
                  <p className="mt-5 rounded-xl border border-dashed border-[#3A3A3A]/12 px-4 py-6 text-center text-sm text-[#3A3A3A]/45 dark:border-white/12 dark:text-white/45">
                    {t("bootcampDetails.hero.curriculumEmpty")}
                  </p>
                ) : (
                  <div className="mt-5 space-y-2.5">
                    {bootcamp.sections.map((section, sectionIndex) => (
                      <details
                        key={section.id}
                        open={sectionIndex === 0}
                        className="group overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-[#FCFCFC] dark:border-white/8 dark:bg-[#101013]"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 transition hover:bg-[#F47822]/5 [&::-webkit-details-marker]:hidden">
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="grid h-8 w-8 shrink-0 place-items-center bg-transparent text-[11px] font-black text-[#F47822]">
                              {String(sectionIndex + 1).padStart(2, "0")}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                                {section.title}
                              </span>
                              <span className="mt-0.5 block text-[10px] text-[#3A3A3A]/40 dark:text-white/40">
                                {t("bootcampDetails.hero.lessonCount", {
                                  count: section.lessons.length,
                                })}
                              </span>
                            </span>
                          </span>

                          <span className="text-lg leading-none text-[#3A3A3A]/30 transition group-open:rotate-45 dark:text-white/30">
                            +
                          </span>
                        </summary>

                        <ul className="border-t border-[#3A3A3A]/7 px-4 py-2 dark:border-white/7">
                          {section.lessons.map((lesson) => (
                            <li
                              key={lesson.id}
                              className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3A3A3A]/5 py-3 last:border-0 dark:border-white/5"
                            >
                              <span className="inline-flex min-w-0 items-center gap-2 text-xs font-medium text-[#3A3A3A]/75 dark:text-white/75">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F47822]" />
                                <span className="truncate">{lesson.title}</span>
                              </span>

                              <span className="flex flex-wrap items-center gap-3 text-[10px] text-[#3A3A3A]/40 dark:text-white/40">
                                <span className="inline-flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {lesson.classroom_count === 1
                                    ? t(
                                        "bootcampDetails.hero.lessonClassroomsOne",
                                        { count: lesson.classroom_count },
                                      )
                                    : t(
                                        "bootcampDetails.hero.lessonClassrooms",
                                        { count: lesson.classroom_count },
                                      )}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock3 className="h-3 w-3" />
                                  {t("bootcampDetails.hero.lessonDuration", {
                                    count: lesson.duration_minutes,
                                  })}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ))}
                  </div>
                )}
              </section>

              <section className="relative overflow-hidden rounded-3xl bg-[#252529] p-6 text-white shadow-[0_18px_42px_rgba(58,58,58,0.12)] sm:p-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                >
                  <div className="absolute -right-16 -top-20 h-60 w-60 rounded-full bg-[#F47822]/20 blur-3xl rtl:-left-16 rtl:right-auto" />
                </div>

                <div className="relative">
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F9A16C]">
                    <Briefcase className="h-3.5 w-3.5" />
                    {t("bootcampDetails.career.eyebrow")}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                    {t("bootcampDetails.career.title")}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
                    {t("bootcampDetails.career.description")}
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {CAREER_ITEMS.map(({ key, icon: Icon }) => (
                      <div
                        key={key}
                        className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"
                      >
                        <Icon className="h-4.5 w-4.5 text-[#F9A16C]" />
                        <p className="mt-3 text-xs font-bold">
                          {t(`bootcampDetails.career.items.${key}.title`)}
                        </p>
                        <p className="mt-1.5 text-[11px] leading-5 text-white/50">
                          {t(`bootcampDetails.career.items.${key}.body`)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-5 text-[10px] leading-5 text-white/35">
                    {t("bootcampDetails.career.disclaimer")}
                  </p>

                  <a
                    href="#bootcamp-registration"
                    className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F47822] px-5 text-xs font-bold text-white transition hover:bg-[#de6414]"
                  >
                    {t("bootcampDetails.career.cta")}
                    <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                  </a>
                </div>
              </section>

              <section className="rounded-3xl border border-[#3A3A3A]/8 bg-white p-6 shadow-[0_6px_24px_rgba(58,58,58,0.035)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-8">
                <SectionHeading
                  eyebrow={t("bootcampDetails.hero.instructorEyebrow")}
                  title={t("bootcampDetails.hero.instructorFallback")}
                  icon={UserRound}
                />

                <div className="mt-5 flex flex-wrap items-start gap-4 rounded-2xl border border-[#3A3A3A]/8 bg-[#FCFCFC] p-4 dark:border-white/8 dark:bg-[#101013]">
                  {bootcamp.instructor?.avatar ? (
                    <img
                      src={bootcamp.instructor.avatar}
                      alt=""
                      className="h-12 w-12 rounded-2xl object-cover"
                    />
                  ) : (
                    <Initials name={instructorName} />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                      {instructorName}
                    </p>
                    <p className="mt-1 text-xs leading-6 text-[#3A3A3A]/55 dark:text-white/55">
                      {bootcamp.instructor?.bio ||
                        t("bootcampDetails.hero.noBio")}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24">
              <section className="overflow-hidden rounded-3xl border border-[#3A3A3A]/8 bg-white shadow-[0_8px_28px_rgba(58,58,58,0.06)] dark:border-white/8 dark:bg-[#1b1b20]">
                <div className="relative overflow-hidden bg-[#353535] px-6 py-5 text-white">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[#F47822]/25 blur-2xl rtl:-left-10 rtl:right-auto"
                  />
                  <div className="relative flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F9A16C]">
                        {t("bootcampDetails.paymentCard.eyebrow")}
                      </p>
                      <h2 className="mt-1 text-lg font-bold">
                        {t("bootcampDetails.paymentCard.title")}
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F47822]/30 bg-[#F47822]/15 px-2.5 py-1 text-[9px] font-bold text-[#F9A16C]">
                      <Sparkles className="h-3 w-3" />
                      {t("bootcampDetails.paymentCard.onlineBadge")}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="rounded-2xl border border-[#F47822]/20 bg-[#FFF8F4] p-4 dark:bg-[#F47822]/10">
                    <p className="text-sm font-bold text-[#9c4209] dark:text-amber-200">
                      {t("bootcampDetails.paymentCard.discountTitle")}
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-[#9c4209]/75 dark:text-amber-200/75">
                      {t("bootcampDetails.paymentCard.discountBody")}
                    </p>
                    <p className="mt-2 text-[10px] leading-4 text-[#9c4209]/55 dark:text-amber-200/55">
                      {t("bootcampDetails.paymentCard.discountNote")}
                    </p>
                  </div>

                  <ul className="mt-4 space-y-3">
                    <li className="flex items-start gap-3 rounded-xl border border-[#3A3A3A]/8 bg-[#FCFCFC] p-3.5 dark:border-white/8 dark:bg-[#101013]">
                      <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-[#F47822]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">
                            {t("bootcampDetails.paymentCard.cardTitle")}
                          </p>
                          <PaymentLogos />
                        </div>
                        <p className="mt-1 text-[10px] leading-4 text-[#3A3A3A]/45 dark:text-white/45">
                          {t("bootcampDetails.paymentCard.cardDesc")}
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3 rounded-xl border border-[#3A3A3A]/8 bg-[#FCFCFC] p-3.5 dark:border-white/8 dark:bg-[#101013]">
                      <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-[#F47822]" />
                      <div>
                        <p className="text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">
                          {t("bootcampDetails.paymentCard.transferTitle")}
                        </p>
                        <p className="mt-1 text-[10px] leading-4 text-[#3A3A3A]/45 dark:text-white/45">
                          {t("bootcampDetails.paymentCard.transferDesc")}
                        </p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3 rounded-xl border border-[#3A3A3A]/8 bg-[#FCFCFC] p-3.5 dark:border-white/8 dark:bg-[#101013]">
                      <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-[#F47822]" />
                      <div>
                        <p className="text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">
                          {t("bootcampDetails.paymentCard.cashTitle")}
                        </p>
                        <p className="mt-1 text-[10px] leading-4 text-[#3A3A3A]/45 dark:text-white/45">
                          {t("bootcampDetails.paymentCard.cashDesc")}
                        </p>
                      </div>
                    </li>
                  </ul>

                  <p className="mt-4 rounded-xl bg-[#F7F7F7] px-3.5 py-3 text-[10px] leading-5 text-[#3A3A3A]/45 dark:bg-[#101013] dark:text-white/45">
                    {t("bootcampDetails.paymentCard.secure")}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#3A3A3A]/8 pt-4 dark:border-white/8">
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/35 dark:text-white/35">
                      {t("bootcampDetails.paymentCard.accepted")}
                    </span>
                    <PaymentLogos />
                  </div>
                </div>
              </section>

              {bootcamp.brochure_available && (
                <section className="rounded-3xl border border-[#3A3A3A]/8 bg-white p-6 shadow-[0_8px_28px_rgba(58,58,58,0.045)] dark:border-white/8 dark:bg-[#1b1b20]">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#F47822]" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                        {t("bootcampDetails.hero.brochureEyebrow")}
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                        {t("bootcampDetails.hero.brochureTitle")}
                      </p>
                      {bootcamp.brochure_name && (
                        <p className="mt-1 truncate text-[10px] text-[#3A3A3A]/45 dark:text-white/45">
                          {bootcamp.brochure_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <a
                    href={bootcampsApi.brochureUrl(bootcamp.id)}
                    className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-4 text-xs font-bold text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:bg-[#101013] dark:text-[#ececef]"
                  >
                    <Download className="h-4 w-4" />
                    {t("bootcampCommon.downloadBrochure")}
                  </a>
                </section>
              )}
            </aside>
          </div>

          <section
            id="bootcamp-registration"
            className="mt-10 scroll-mt-28 overflow-hidden rounded-[32px] border border-[#3A3A3A]/8 bg-white shadow-[0_18px_48px_rgba(58,58,58,0.08)] dark:border-white/8 dark:bg-[#1b1b20]"
          >
            <div className="grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              <div className="relative overflow-hidden bg-[#252529] p-6 text-white sm:p-9">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                >
                  <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#F47822]/20 blur-3xl rtl:-left-20 rtl:right-auto" />
                </div>

                <div className="relative">
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F9A16C]">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("bootcampDetails.enroll.eyebrow")}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                    {t("bootcampDetails.enroll.title")}
                  </h2>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-white/60">
                    {t("bootcampDetails.enroll.subtitle")}
                  </p>

                  <h3 className="mt-8 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
                    {t("bootcampDetails.enroll.stepsTitle")}
                  </h3>

                  <ol className="mt-4 space-y-4">
                    {ENROLLMENT_STEPS.map((step, index) => (
                      <li key={step} className="flex items-start gap-3">
                        <span className="w-8 shrink-0 pt-0.5 text-sm font-black text-[#F9A16C]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#F9A16C]">
                            {t("bootcampDetails.enroll.stepLabel", {
                              number: index + 1,
                            })}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-white/65">
                            {t(`bootcampDetails.enroll.steps.${step}`)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                    <p className="flex items-center gap-2 text-xs font-bold">
                      <Headphones className="h-4 w-4 text-[#F9A16C]" />
                      {t("bootcampDetails.enroll.helpTitle")}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-5 text-white/50">
                      {t("bootcampDetails.enroll.helpBody")}
                    </p>
                    <Link
                      to="/contact"
                      className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#F9A16C] transition hover:text-white"
                    >
                      {t("bootcampDetails.enroll.helpCta")}
                      <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                    </Link>
                  </div>

                  <p className="mt-5 flex items-center gap-2 text-[10px] text-white/40">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#F47822]" />
                    {t("bootcampDetails.enroll.confirmNote")}
                  </p>
                </div>
              </div>

              <div className="bg-[#FCFCFC] p-4 dark:bg-[#101013] sm:p-8">
                <BootcampRegistrationForm bootcamp={bootcamp} />
              </div>
            </div>
          </section>

          <section
            data-testid="bootcamp-gallery"
            className="mt-10 rounded-[32px] border border-[#3A3A3A]/8 bg-white p-6 shadow-[0_8px_28px_rgba(58,58,58,0.045)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-8"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                eyebrow={t("bootcampDetails.gallery.eyebrow")}
                title={t("bootcampDetails.gallery.title")}
                icon={Images}
              />

              <Link
                to="/bootcamps"
                className="group inline-flex items-center gap-1.5 text-[11px] font-bold text-[#F47822] transition hover:text-[#de6414]"
              >
                {t("bootcampDetails.gallery.viewAll")}
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
              </Link>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#3A3A3A]/55 dark:text-white/55">
              {t("bootcampDetails.gallery.description")}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {GALLERY_ITEMS.map((item, index) => (
                <figure
                  key={item.key}
                  className={
                    index === 0 ? "sm:col-span-2 lg:col-span-1" : ""
                  }
                >
                  <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#252529]">
                    <img
                      src={item.image}
                      alt={t(
                        `bootcampDetails.gallery.items.${item.key}.alt`,
                      )}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"
                    />
                    <figcaption className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-sm font-bold text-white">
                        {t(`bootcampDetails.gallery.items.${item.key}.title`)}
                      </p>
                      <p className="mt-0.5 text-[10px] leading-4 text-white/65">
                        {t(
                          `bootcampDetails.gallery.items.${item.key}.caption`,
                        )}
                      </p>
                    </figcaption>
                  </div>
                </figure>
              ))}
            </div>
          </section>

          {relatedBootcamps.length > 0 && (
            <section data-testid="related-bootcamps" className="mt-10">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <SectionHeading
                  eyebrow={t("bootcampDetails.related.eyebrow")}
                  title={t("bootcampDetails.related.title")}
                  icon={GraduationCap}
                />

                <Link
                  to="/bootcamps"
                  className="group inline-flex items-center gap-1.5 text-[11px] font-bold text-[#F47822] transition hover:text-[#de6414]"
                >
                  {t("bootcampDetails.related.browseAll")}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
                </Link>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#3A3A3A]/55 dark:text-white/55">
                {t("bootcampDetails.related.description")}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedBootcamps.map((item) => (
                  <Link
                    key={item.id}
                    to={`/bootcamps/${item.id}`}
                    data-testid="related-bootcamp-card"
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-[0_8px_24px_rgba(58,58,58,0.04)] transition duration-200 hover:-translate-y-1 hover:border-[#F47822]/25 hover:shadow-[0_18px_36px_rgba(58,58,58,0.09)] dark:border-white/8 dark:bg-[#1b1b20]"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-[#252529]">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={t("bootcampDetails.related.coverAlt", {
                            title: item.title,
                          })}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top_right,rgba(244,120,34,0.28),transparent_55%),linear-gradient(135deg,#353535,#1d1d21)]">
                          <GraduationCap className="h-9 w-9 text-[#F9A16C]/70" />
                        </div>
                      )}

                      <span className="absolute start-3 top-3 inline-flex items-center rounded-full bg-black/45 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-sm">
                        {formatBootcampLevel(item.level, t)}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="line-clamp-1 text-sm font-bold text-[#3A3A3A] transition-colors group-hover:text-[#F47822] dark:text-[#ececef]">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-[#3A3A3A]/50 dark:text-white/50">
                        {item.short_description}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#3A3A3A]/45 dark:text-white/45">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3 w-3 text-[#F47822]" />
                          {formatBootcampDuration(
                            item.duration_value,
                            item.duration_unit,
                            t,
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-[#F47822]" />
                          <span className="truncate">{item.location}</span>
                        </span>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#3A3A3A]/7 pt-3 dark:border-white/7">
                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/35 dark:text-white/35">
                            {t("bootcampDetails.related.from")}
                          </p>
                          <p className="text-sm font-black text-[#3A3A3A] dark:text-[#ececef]">
                            {formatBootcampPrice(
                              item.price,
                              item.currency,
                              language,
                            )}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#F47822]">
                          {t("bootcampDetails.related.view")}
                          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <QuickReserveBar
          key={bootcamp.id}
          bootcamp={bootcamp}
          language={language}
        />
      </main>

      <Footer />
    </>
  );
}
