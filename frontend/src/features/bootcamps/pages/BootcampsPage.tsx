import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  GraduationCap,
  Layers3,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";

import { usePageMeta } from "@/lib/page-meta";

import type { Bootcamp } from "../types/bootcamp.types";
import {
  BOOTCAMP_INCLUDE_KEYS,
  type BootcampLevel,
} from "../types/bootcamp.types";
import { BootcampCalendar } from "../components/BootcampCalendar";
import {
  useBootcampCalendar,
  useBootcamps,
} from "../hooks/useBootcamps";
import {
  formatBootcampDate,
  formatBootcampDuration,
  formatBootcampLevel,
  formatBootcampPrice,
} from "../utils/bootcampFormat";

const LEVELS: BootcampLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "all levels",
];

function nextSession(schedule: Bootcamp["schedules"][number] | undefined, language: string): string {
  if (!schedule) {
    return "";
  }

  const start = formatBootcampDate(schedule.starts_at, language, {
    day: "numeric",
    month: "short",
  });
  const end = formatBootcampDate(schedule.ends_at, language, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${start} – ${end}`;
}

function BootcampCard({ bootcamp }: { bootcamp: Bootcamp }) {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const schedule = bootcamp.schedules?.[0];
  const included = BOOTCAMP_INCLUDE_KEYS.filter(
    (key) => bootcamp.includes?.[key],
  ).slice(0, 3);

  return (
    <Link
      to={`/bootcamps/${bootcamp.id}`}
      data-testid="bootcamp-card"
      className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-[#3A3A3A]/8 bg-white shadow-[0_12px_34px_rgba(58,58,58,0.05)] transition duration-200 hover:-translate-y-1 hover:border-[#F47822]/25 hover:bg-[#FFF8F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/50 focus-visible:ring-offset-2 dark:border-white/8 dark:bg-[#1b1b20] dark:hover:bg-white/[0.04] dark:focus-visible:ring-offset-[#101013]"
    >
      <div className="relative overflow-hidden bg-[#3A3A3A] px-6 pb-6 pt-7 text-white">
        {bootcamp.thumbnail && (
          <img
            src={bootcamp.thumbnail}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-0",
            bootcamp.thumbnail
              ? "bg-[radial-gradient(circle_at_top_right,rgba(244,120,34,0.14),transparent_50%),linear-gradient(to_bottom,rgba(18,18,22,0.35),rgba(18,18,22,0.08)_30%,rgba(18,18,22,0.84))]"
              : "bg-[radial-gradient(circle_at_top_right,rgba(244,120,34,0.38),transparent_52%),linear-gradient(135deg,rgba(37,37,41,0.92),rgba(24,24,27,0.9))]",
          ].join(" ")}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -end-10 -top-10 h-32 w-32 rounded-full border border-white/[0.07]"
        />

        <div className="relative flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/85 backdrop-blur-[2px]">
            <GraduationCap className="h-3 w-3 text-[#F47822]" />
            {formatBootcampLevel(bootcamp.level, t)}
          </span>

          <span className="inline-flex items-center rounded-full bg-black/30 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/85 backdrop-blur-[2px]">
            {String(bootcamp.registered_count).padStart(2, "0")}{" "}
            {t("bootcampCommon.registeredLabel")}
          </span>
        </div>

        <h2 className="relative mt-5 line-clamp-2 text-xl font-bold leading-snug tracking-[-0.02em] [text-shadow:0_1px_10px_rgba(0,0,0,0.55)] transition-colors group-hover:text-[#F9A16C] sm:text-2xl">
          {bootcamp.title}
        </h2>

        <p className="relative mt-2.5 line-clamp-3 min-h-[60px] text-xs leading-5 text-white/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
          {bootcamp.short_description}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <dl className="grid grid-cols-2 gap-3 border-b border-[#3A3A3A]/7 pb-4 dark:border-white/7">
          <div>
            <dt className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/38 dark:text-white/38">
              <Clock3 className="h-3 w-3 text-[#F47822]" />
              {t("bootcampCatalog.card.duration")}
            </dt>
            <dd className="mt-1 text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">
              {formatBootcampDuration(
                bootcamp.duration_value,
                bootcamp.duration_unit,
                t,
              )}
            </dd>
          </div>

          <div>
            <dt className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/38 dark:text-white/38">
              <MapPin className="h-3 w-3 text-[#F47822]" />
              {t("bootcampCatalog.card.location")}
            </dt>
            <dd className="mt-1 truncate text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">
              {bootcamp.location}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#F7F7F7] px-3 py-2.5 dark:bg-[#101013]">
          <CalendarDays className="h-4 w-4 shrink-0 text-[#F47822]" />
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/35 dark:text-white/35">
              {t("bootcampCatalog.card.nextSession")}
            </p>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-[#3A3A3A] dark:text-[#ececef]">
              {schedule
                ? nextSession(schedule, language)
                : t("bootcampCatalog.card.noSession")}
            </p>
          </div>
        </div>

        {included.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {included.map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 rounded-full bg-[#F47822]/8 px-2 py-1 text-[9px] font-bold text-[#D96510] dark:text-[#F9A16C]"
              >
                <Check className="h-2.5 w-2.5" />
                {t(`bootcampCommon.includes.${key}`)}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/35 dark:text-white/35">
              {t("bootcampCatalog.card.from")}
            </p>
            <p className="mt-0.5 text-lg font-black tracking-[-0.03em] text-[#3A3A3A] dark:text-[#ececef]">
              {formatBootcampPrice(
                bootcamp.price,
                bootcamp.currency,
                language,
              )}
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F47822] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_6px_16px_rgba(244,120,34,0.2)] transition group-hover:-translate-y-0.5 group-hover:bg-[#de6414]">
            {t("bootcampCatalog.card.view")}
            <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function BootcampCardSkeleton() {
  return (
    <div className="h-[470px] animate-pulse rounded-[26px] bg-black/5 dark:bg-white/5" />
  );
}

export function BootcampsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialView =
    searchParams.get("view") === "calendar" ? "calendar" : "catalog";
  const [view, setView] = useState<"catalog" | "calendar">(initialView);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<string>("");
  const [page, setPage] = useState(1);

  const { bootcamps, pagination, isLoading, error, reload } = useBootcamps({
    search: search || undefined,
    level: level || undefined,
    page,
    per_page: 9,
  });

  const calendar = useBootcampCalendar();

  usePageMeta({
    title: t("bootcampCatalog.meta.title"),
    description: t("bootcampCatalog.meta.description"),
    canonicalPath: "/bootcamps",
  });

  const hasFilters = Boolean(search || level);
  const total = pagination?.total ?? bootcamps.length;
  const lastPage = pagination?.last_page ?? 1;

  const pages = useMemo(() => {
    const start = Math.max(1, Math.min(page - 2, lastPage - 4));
    const end = Math.min(lastPage, start + 4);

    return Array.from(
      { length: Math.max(0, end - start + 1) },
      (_, index) => start + index,
    );
  }, [lastPage, page]);

  function changeView(next: "catalog" | "calendar") {
    setView(next);

    const params = new URLSearchParams(searchParams);

    if (next === "calendar") {
      params.set("view", "calendar");
    } else {
      params.delete("view");
    }

    setSearchParams(params, { replace: true });

    if (next === "calendar") {
      window.setTimeout(() => {
        document
          .getElementById("bootcamp-calendar-anchor")
          ?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }

  function clearFilters() {
    setSearch("");
    setLevel("");
    setPage(1);
  }

  return (
    <>
      <main className="min-h-screen bg-[#F3F3F3] dark:bg-[#101013]">
        <section className="relative z-20 px-5 pt-6 sm:px-8 sm:pt-8">
          <div className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[32px] bg-[#353535] px-6 py-8 text-white shadow-[0_18px_42px_rgba(58,58,58,0.13)] sm:px-8 sm:py-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
            >
              <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#F47822]/20 blur-3xl rtl:-left-24 rtl:right-auto" />
              <div className="absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-[#F47822]/[0.07] blur-3xl" />
              <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:56px_56px]" />
            </div>

            <div className="relative">
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                <div>
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("bootcampCatalog.hero.badge")}
                  </p>

                  <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                    {t("bootcampCatalog.hero.titleA")}{" "}
                    <span className="text-[#F47822]">
                      {t("bootcampCatalog.hero.titleHighlight")}
                    </span>{" "}
                    {t("bootcampCatalog.hero.titleB")}
                  </h1>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
                    {t("bootcampCatalog.hero.description")}
                  </p>
                </div>

                <span className="hidden font-mono text-[10px] tracking-[0.2em] text-white/35 sm:block">
                  {t("bootcampCatalog.hero.code")}
                </span>
              </div>

              <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
                <label className="relative block flex-1">
                  <span className="sr-only">
                    {t("bootcampCatalog.search.label")}
                  </span>
                  <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder={t("bootcampCatalog.search.placeholder")}
                    className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.06] ps-11 pe-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#F47822]/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-[#F47822]/10"
                  />
                </label>

                <label className="relative block lg:w-52">
                  <span className="sr-only">
                    {t("bootcampCatalog.filters.level")}
                  </span>
                  <select
                    value={level}
                    onChange={(event) => {
                      setLevel(event.target.value);
                      setPage(1);
                    }}
                    className="h-12 w-full appearance-none rounded-xl border border-white/12 bg-white/[0.08] ps-4 pe-10 text-sm font-semibold text-white outline-none transition [color-scheme:dark] focus:border-[#F47822]/60 focus:bg-white/[0.12] focus:ring-4 focus:ring-[#F47822]/10"
                  >
                    <option value="">
                      {t("bootcampCatalog.filters.allLevels")}
                    </option>
                    {LEVELS.map((item) => (
                      <option key={item} value={item}>
                        {formatBootcampLevel(item, t)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                </label>

                <button
                  type="button"
                  role="switch"
                  aria-checked={view === "calendar"}
                  onClick={() =>
                    changeView(view === "calendar" ? "catalog" : "calendar")
                  }
                  className="flex h-12 items-center justify-between gap-3 rounded-xl border border-white/12 bg-white/[0.06] px-4 text-xs font-bold text-white transition hover:border-white/25 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/50 lg:w-56"
                >
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#F47822]" />
                    {t("bootcampCatalog.views.calendar")}
                  </span>
                  <span
                    aria-hidden="true"
                    className={[
                      "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors",
                      view === "calendar"
                        ? "border-[#F47822] bg-[#F47822]"
                        : "border-white/20 bg-white/15",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute start-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                        view === "calendar"
                          ? "translate-x-5 rtl:-translate-x-5"
                          : "translate-x-0",
                      ].join(" ")}
                    />
                  </span>
                </button>
              </div>

              {hasFilters && (
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/70 transition hover:bg-white/20 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                    {t("bootcampCatalog.filters.clear")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="px-5 py-10 sm:px-8 sm:py-14">
          <div className="mx-auto max-w-[1280px]">
            {view === "catalog" ? (
              <>
                <div className="mb-8 flex flex-col gap-5 border-b border-[#3A3A3A]/10 pb-6 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                        <Layers3 className="h-4.5 w-4.5" />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#3A3A3A]/45 dark:text-white/45">
                        {t("bootcampCatalog.results.eyebrow")}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-[#3A3A3A] dark:text-white sm:text-3xl">
                      {t("bootcampCatalog.results.titleA")}{" "}
                      <span className="text-[#F47822]">
                        {t("bootcampCatalog.results.titleB")}
                      </span>
                    </h2>

                    {!isLoading && !error && (
                      <p className="mt-2 text-sm text-[#3A3A3A]/50 dark:text-white/50">
                        {t("bootcampCatalog.results.count", { count: total })}
                      </p>
                    )}
                  </div>

                  {!isLoading && !error && bootcamps.length > 0 && (
                    <div className="flex items-center gap-3 rounded-2xl border border-[#3A3A3A]/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#1b1b20]">
                      <span className="text-2xl font-bold text-[#F47822]">
                        {String(bootcamps.length).padStart(2, "0")}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/45 dark:text-white/45">
                        {t("bootcampCatalog.results.showing")}
                      </span>
                    </div>
                  )}
                </div>

                {isLoading && (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <BootcampCardSkeleton key={index} />
                    ))}
                  </div>
                )}

                {!isLoading && error && (
                  <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/10">
                    <p className="text-base font-bold text-red-900 dark:text-red-300">
                      {t("bootcampCatalog.results.errorTitle")}
                    </p>
                    <p className="mx-auto mt-2 max-w-md text-sm text-red-700 dark:text-red-400">
                      {error || t("bootcampCatalog.results.errorBody")}
                    </p>
                    <button
                      type="button"
                      onClick={() => void reload()}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#3A3A3A] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#F47822]"
                    >
                      <RefreshCw className="h-4 w-4" />
                      {t("bootcampCatalog.results.retry")}
                    </button>
                  </div>
                )}

                {!isLoading && !error && bootcamps.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-[#3A3A3A]/15 bg-white/60 px-6 py-16 text-center dark:border-white/15 dark:bg-white/[0.02]">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
                      <GraduationCap className="h-7 w-7" />
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-[#3A3A3A] dark:text-[#ececef]">
                      {t("bootcampCatalog.results.emptyTitle")}
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#3A3A3A]/50 dark:text-white/50">
                      {t("bootcampCatalog.results.emptyBody")}
                    </p>
                    {hasFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#de6414]"
                      >
                        <X className="h-4 w-4" />
                        {t("bootcampCatalog.filters.clear")}
                      </button>
                    )}
                  </div>
                )}

                {!isLoading && !error && bootcamps.length > 0 && (
                  <div className="space-y-10">
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {bootcamps.map((bootcamp) => (
                        <BootcampCard
                          key={bootcamp.id}
                          bootcamp={bootcamp}
                        />
                      ))}
                    </div>

                    {pagination && pagination.last_page > 1 && (
                      <div className="flex flex-col items-center justify-between gap-4 border-t border-[#3A3A3A]/10 pt-8 dark:border-white/10 sm:flex-row">
                        <p className="text-xs text-[#3A3A3A]/40 dark:text-white/40">
                          {t("bootcampCatalog.results.page", {
                            page: pagination.current_page,
                            last: pagination.last_page,
                          })}
                        </p>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                            disabled={page <= 1}
                            aria-label={t("bootcampCatalog.results.previous")}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/55 transition hover:border-[#F47822]/40 hover:text-[#F47822] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/55"
                          >
                            <ChevronLeftIcon />
                          </button>

                          {pages.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setPage(item)}
                              aria-current={item === page ? "page" : undefined}
                              className={[
                                "grid h-9 min-w-9 place-items-center rounded-lg px-2 text-xs font-bold transition",
                                item === page
                                  ? "bg-[#F47822] text-white shadow-sm"
                                  : "border border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/55 hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/55",
                              ].join(" ")}
                            >
                              {item}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() =>
                              setPage((current) => Math.min(lastPage, current + 1))
                            }
                            disabled={page >= lastPage}
                            aria-label={t("bootcampCatalog.results.next")}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/55 transition hover:border-[#F47822]/40 hover:text-[#F47822] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/55"
                          >
                            <ChevronRightIcon />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div id="bootcamp-calendar-anchor" className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">
                      {t("bootcampCatalog.calendar.eyebrow")}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A] dark:text-white sm:text-3xl">
                      {t("bootcampCatalog.calendar.title")}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => changeView("catalog")}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-white px-4 py-2.5 text-xs font-bold text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
                  >
                    <Search className="h-3.5 w-3.5" />
                    {t("bootcampCatalog.views.catalog")}
                  </button>
                </div>

                <BootcampCalendar
                  schedules={calendar.schedules}
                  isLoading={calendar.isLoading}
                  error={calendar.error}
                  onRetry={() => void calendar.reload()}
                />
              </div>
            )}
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-[#3A3A3A]/10 bg-white px-5 py-16 dark:border-white/10 dark:bg-[#1b1b20] sm:px-8 sm:py-20">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
                  {t("bootcampCatalog.statement.eyebrow")}
                </p>

                <h3 className="mt-4 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-[#3A3A3A] dark:text-white sm:text-4xl lg:text-5xl">
                  {t("bootcampCatalog.statement.title")}
                </h3>
              </div>

              <div className="lg:col-span-4 lg:col-start-9">
                <p className="text-sm leading-7 text-[#3A3A3A]/55 dark:text-white/55">
                  {t("bootcampCatalog.statement.description")}
                </p>
              </div>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-1 w-1/3 bg-[#F47822] rtl:left-auto rtl:right-0"
          />
        </section>
      </main>
    </>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 rtl:rotate-180"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 rtl:rotate-180"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
