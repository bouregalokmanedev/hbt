import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { BootcampSchedule } from "../types/bootcamp.types";
import {
  formatBootcampDate,
  formatBootcampMonth,
  formatBootcampPrice,
} from "../utils/bootcampFormat";

interface BootcampCalendarProps {
  schedules: BootcampSchedule[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function toDate(value: string): Date {
  return new Date(`${value.slice(0, 10)}T12:00:00`);
}

function dateKey(value: string): string {
  return value.slice(0, 10);
}

function dateRange(
  schedule: BootcampSchedule,
  language: string,
): string {
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

export function BootcampCalendar({
  schedules,
  isLoading = false,
  error = null,
  onRetry,
}: BootcampCalendarProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const locale = language === "ar" ? "ar-DZ" : "en-GB";

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const first = schedules[0]?.starts_at;

    return first ? toDate(first) : new Date();
  });
  const initialisedRef = useRef(false);

  useEffect(() => {
    if (initialisedRef.current || schedules.length === 0) {
      return;
    }

    initialisedRef.current = true;
    setVisibleMonth(toDate(schedules[0].starts_at));
  }, [schedules]);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  const monthSchedules = useMemo(() => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    return [...schedules]
      .filter((schedule) => {
        const start = toDate(schedule.starts_at);
        const end = toDate(schedule.ends_at);

        return end >= monthStart && start <= monthEnd;
      })
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }, [month, schedules, year]);

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, BootcampSchedule[]>();

    monthSchedules.forEach((schedule) => {
      const key = dateKey(schedule.starts_at);
      const current = map.get(key) ?? [];
      current.push(schedule);
      map.set(key, current);
    });

    return map;
  }, [monthSchedules]);

  const leadingBlanks = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
          new Date(2024, 0, 7 + index),
        ),
      ),
    [locale],
  );

  const monthLabel = formatBootcampMonth(
    `${year}-${String(month + 1).padStart(2, "0")}-01`,
    language,
  );

  const todayKey = new Date().toISOString().slice(0, 10);

  function moveMonth(offset: number) {
    setVisibleMonth(new Date(year, month + offset, 1));
  }

  return (
    <section
      className="overflow-hidden rounded-[28px] border border-[#3A3A3A]/8 bg-white shadow-[0_14px_40px_rgba(58,58,58,0.06)] dark:border-white/8 dark:bg-[#1b1b20]"
      aria-labelledby="bootcamp-calendar-title"
      data-testid="bootcamp-calendar"
    >
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[#3A3A3A]/8 p-6 dark:border-white/8 sm:p-8">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
            <CalendarDays className="h-3.5 w-3.5" />
            {t("bootcampCatalog.calendar.eyebrow")}
          </p>

          <h2
            id="bootcamp-calendar-title"
            className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef] sm:text-3xl"
          >
            {t("bootcampCatalog.calendar.title")}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3A3A3A]/55 dark:text-white/55">
            {t("bootcampCatalog.calendar.description")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            aria-label={t("bootcampCatalog.calendar.previousMonth")}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/60 transition hover:border-[#F47822]/40 hover:text-[#F47822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/40 dark:border-white/10 dark:bg-[#101013] dark:text-white/60"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </button>

          <span className="min-w-36 text-center text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
            {monthLabel}
          </span>

          <button
            type="button"
            onClick={() => moveMonth(1)}
            aria-label={t("bootcampCatalog.calendar.nextMonth")}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/60 transition hover:border-[#F47822]/40 hover:text-[#F47822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/40 dark:border-white/10 dark:bg-[#101013] dark:text-white/60"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center gap-2 p-10 text-sm text-[#3A3A3A]/50 dark:text-white/50">
          <LoaderCircle className="h-4 w-4 animate-spin text-[#F47822]" />
          {t("bootcampCatalog.results.loading")}
        </div>
      ) : error ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-10 text-center">
          <p className="text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">
            {t("bootcampCatalog.results.errorTitle")}
          </p>
          <p className="max-w-md text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">
            {error}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#F47822]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("bootcampCatalog.results.retry")}
            </button>
          )}
        </div>
      ) : schedules.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-2 p-10 text-center">
          <CalendarDays className="h-8 w-8 text-[#F47822]/50" />
          <p className="text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">
            {t("bootcampCatalog.calendar.noSessions")}
          </p>
        </div>
      ) : (
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekdays.map((weekday) => (
                <span
                  key={weekday}
                  className="pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/40 dark:text-white/40"
                >
                  {weekday}
                </span>
              ))}

              {Array.from({ length: leadingBlanks }).map((_, index) => (
                <span
                  key={`blank-${index}`}
                  aria-hidden="true"
                  className="min-h-20 rounded-xl bg-[#F7F7F7]/50 dark:bg-white/[0.02]"
                />
              ))}

              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1;
                const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const sessions = sessionsByDay.get(key) ?? [];
                const isToday = key === todayKey;

                return (
                  <div
                    key={key}
                    className={[
                      "min-h-20 rounded-xl border p-1.5 text-start transition",
                      isToday
                        ? "border-[#F47822]/35 bg-[#F47822]/5"
                        : "border-[#3A3A3A]/6 bg-[#FCFCFC] dark:border-white/6 dark:bg-[#101013]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold",
                        isToday
                          ? "bg-[#F47822] text-white"
                          : "text-[#3A3A3A]/45 dark:text-white/45",
                      ].join(" ")}
                    >
                      {day}
                    </span>

                    <div className="mt-1 space-y-1">
                      {sessions.slice(0, 2).map((schedule) => (
                        <Link
                          key={schedule.id}
                          to={`/bootcamps/${schedule.bootcamp?.id ?? schedule.bootcamp_id}`}
                          aria-label={`${schedule.bootcamp?.title ?? t("bootcampCommon.viewDetails")} — ${dateRange(schedule, language)}`}
                          className="block truncate rounded-md bg-[#F47822]/12 px-1 py-0.5 text-[9px] font-bold leading-4 text-[#D96510] transition hover:bg-[#F47822] hover:text-white dark:text-[#F9A16C] dark:hover:text-white"
                        >
                          {schedule.bootcamp?.title ??
                            t("bootcampCommon.viewDetails")}
                        </Link>
                      ))}

                      {sessions.length > 2 && (
                        <span className="block px-1 text-[9px] font-semibold text-[#3A3A3A]/40 dark:text-white/40">
                          +{sessions.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-[11px] text-[#3A3A3A]/40 dark:text-white/40">
              {t("bootcampCatalog.calendar.legend")}
            </p>
          </div>

          <aside className="border-t border-[#3A3A3A]/8 bg-[#FCFCFC] p-5 dark:border-white/8 dark:bg-[#101013] sm:p-6 lg:border-s lg:border-t-0">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                  {t("bootcampCatalog.calendar.month", {
                    month: monthLabel,
                  })}
                </p>
                <p className="mt-1 text-xs text-[#3A3A3A]/45 dark:text-white/45">
                  {t("bootcampCatalog.calendar.sessionCount", {
                    count: monthSchedules.length,
                  })}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {monthSchedules.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#3A3A3A]/12 px-4 py-6 text-center text-xs text-[#3A3A3A]/45 dark:border-white/12 dark:text-white/45">
                  {t("bootcampCatalog.calendar.noSessions")}
                </p>
              ) : (
                monthSchedules.map((schedule) => (
                  <Link
                    key={schedule.id}
                    to={`/bootcamps/${schedule.bootcamp?.id ?? schedule.bootcamp_id}`}
                    className="group block rounded-xl border border-[#3A3A3A]/8 bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-[#F47822]/35 hover:shadow-sm dark:border-white/8 dark:bg-[#1b1b20]"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#F47822]">
                      {dateRange(schedule, language)}
                    </p>
                    <p className="mt-1.5 line-clamp-1 text-sm font-semibold text-[#3A3A3A] group-hover:text-[#F47822] dark:text-[#ececef]">
                      {schedule.bootcamp?.title}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#3A3A3A]/45 dark:text-white/45">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#F47822]" />
                        {schedule.bootcamp?.location}
                      </span>
                      {schedule.bootcamp && (
                        <span className="font-semibold text-[#3A3A3A]/65 dark:text-white/65">
                          {formatBootcampPrice(
                            schedule.bootcamp.price,
                            schedule.bootcamp.currency,
                            language,
                          )}
                        </span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>

            <p className="mt-4 text-[10px] leading-5 text-[#3A3A3A]/35 dark:text-white/35">
              {t("bootcampCatalog.calendar.timezone")}
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}
