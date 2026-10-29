import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  GraduationCap,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { useDeferredValue, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/errors";

import {
  runInstructorBootcampAction,
} from "../api/instructorBootcampsApi";
import { useInstructorBootcamps } from "../hooks/useInstructorBootcamps";
import type { Bootcamp } from "../types/bootcamp.types";
import {
  formatBootcampDate,
  formatBootcampDuration,
  formatBootcampLevel,
  formatBootcampPrice,
} from "../utils/bootcampFormat";

const statuses = ["all", "published", "draft", "archived"] as const;

const statusStyles: Record<string, string> = {
  published:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400",
  draft:
    "bg-slate-100 text-slate-600 ring-slate-500/10 dark:bg-white/8 dark:text-white/65",
  archived:
    "bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400",
};

function readError(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function nextSession(bootcamp: Bootcamp, language: string): string {
  const schedule = bootcamp.schedules?.[0];

  if (!schedule) {
    return "";
  }

  return formatBootcampDate(schedule.starts_at, language, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function InstructorBootcampsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<(typeof statuses)[number]>("all");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const bootcampsQuery = useInstructorBootcamps({
    per_page: 12,
    page,
    search: deferredSearch || undefined,
    ...(status !== "all" ? { status } : {}),
  });

  const allBootcamps = bootcampsQuery.data?.data ?? [];
  const pagination = bootcampsQuery.data?.meta;
  const hasFilters = Boolean(search || status !== "all");

  const metrics = {
    total: pagination?.total ?? allBootcamps.length,
    published: allBootcamps.filter(
      (bootcamp) => bootcamp.status === "published",
    ).length,
    drafts: allBootcamps.filter((bootcamp) => bootcamp.status === "draft")
      .length,
    registrations: allBootcamps.reduce(
      (total, bootcamp) => total + bootcamp.registered_count,
      0,
    ),
  };

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "publish" | "unpublish";
    }) => runInstructorBootcampAction(id, action),
    onSuccess: async (_bootcamp, variables) => {
      setActionError(null);
      setNotice(
        variables.action === "publish"
          ? t("instructor.bootcamps.card.publish")
          : t("instructor.bootcamps.card.unpublish"),
      );
      await queryClient.invalidateQueries({
        queryKey: ["instructor", "bootcamps"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["instructor", "bootcamp", variables.id],
      });
    },
    onError: (error) => {
      setNotice(null);
      setActionError(
        readError(error, t("instructor.bootcamps.editor.actionFail")),
      );
    },
  });

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 lg:space-y-7">
      <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#2E2E2E] via-[#3A3A3A] to-[#262626] px-5 py-7 text-white shadow-[0_20px_50px_rgba(58,58,58,.18)] sm:px-8 sm:py-9">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -end-20 -top-24 h-64 w-64 rounded-full bg-[#F47822]/25 blur-3xl" />
          <div className="absolute -bottom-28 start-1/3 h-56 w-56 rounded-full bg-[#8B5CF6]/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:48px_48px]" />
        </div>

        <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-start">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#F47822]/30 bg-[#F47822]/12 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-[#F9A16C]">
              <Sparkles className="h-3 w-3" />
              {t("instructor.bootcamps.eyebrow")}
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              {t("instructor.bootcamps.title")}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">
              {t("instructor.bootcamps.description")}
            </p>
          </div>

          <Link
            to="/instructor/bootcamps/new"
            className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-5 text-sm font-black tracking-wide text-white shadow-[0_12px_28px_rgba(244,120,34,.35)] transition duration-200 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#3A3A3A] active:scale-[.98]"
          >
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-white/20 transition group-hover:bg-white/30">
              <Plus className="h-4 w-4" />
            </span>
            {t("instructor.bootcamps.create")}
          </Link>
        </div>

        <div className="relative mt-8 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: t("instructor.bootcamps.metrics.total"),
              value: metrics.total,
              icon: GraduationCap,
            },
            {
              label: t("instructor.bootcamps.metrics.published"),
              value: metrics.published,
              icon: CheckCircle2,
            },
            {
              label: t("instructor.bootcamps.metrics.drafts"),
              value: metrics.drafts,
              icon: BookOpen,
            },
            {
              label: t("instructor.bootcamps.metrics.registrations"),
              value: metrics.registrations,
              icon: Users,
            },
          ].map((metric) => {
            const Icon = metric.icon;

            return (
              <div
                key={metric.label}
                className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/45">
                    {metric.label}
                  </p>
                  <Icon className="h-4 w-4 text-[#F9A16C]" />
                </div>
                <p className="mt-2 text-2xl font-black tracking-tight text-white">
                  {metric.value}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-4 shadow-[0_10px_30px_rgba(58,58,58,.04)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block flex-1">
            <span className="sr-only">
              {t("instructor.bootcamps.searchPh")}
            </span>
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/35 dark:text-white/35" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t("instructor.bootcamps.searchPh")}
              className="h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] ps-10 pe-3.5 text-sm text-[#3A3A3A] outline-none transition placeholder:text-[#3A3A3A]/30 focus:border-[#F47822] focus:bg-white focus:ring-4 focus:ring-[#F47822]/8 dark:border-white/10 dark:bg-[#101013] dark:text-[#ececef] dark:placeholder:text-white/30"
            />
          </label>

          <div className="flex flex-wrap gap-1.5 rounded-xl bg-[#F7F7F7] p-1 dark:bg-[#101013]">
            {statuses.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={status === item}
                onClick={() => {
                  setStatus(item);
                  setPage(1);
                }}
                className={[
                  "rounded-lg px-3 py-2 text-[11px] font-bold transition",
                  status === item
                    ? "bg-white text-[#F47822] shadow-sm dark:bg-[#1b1b20]"
                    : "text-[#3A3A3A]/50 hover:text-[#3A3A3A] dark:text-white/50 dark:hover:text-white",
                ].join(" ")}
              >
                {item === "all"
                  ? t("instructor.bootcamps.all")
                  : t(`bootcampCommon.status.${item}`)}
              </button>
            ))}
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[#3A3A3A]/10 px-3.5 text-[11px] font-bold text-[#3A3A3A]/55 transition hover:border-[#F47822]/35 hover:text-[#F47822] dark:border-white/10 dark:text-white/55"
            >
              {t("instructor.bootcamps.all")}
            </button>
          )}
        </div>
      </section>

      {notice && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          {notice}
        </p>
      )}

      {actionError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
        >
          {actionError}
        </p>
      )}

      {bootcampsQuery.isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-[340px] animate-pulse rounded-2xl bg-black/5 dark:bg-white/5"
            />
          ))}
        </div>
      ) : bootcampsQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-7 text-center dark:border-red-500/20 dark:bg-red-500/10">
          <h2 className="text-base font-bold text-red-900 dark:text-red-300">
            {t("instructor.bootcamps.errorTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-red-700 dark:text-red-400">
            {t("instructor.bootcamps.errorDesc")}
          </p>
          <button
            type="button"
            onClick={() => void bootcampsQuery.refetch()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#F47822]"
          >
            <RefreshCw className="h-4 w-4" />
            {t("instructor.bootcamps.retry")}
          </button>
        </div>
      ) : allBootcamps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#3A3A3A]/15 bg-[#FCFCFC] px-6 py-16 text-center dark:border-white/15 dark:bg-[#1b1b20]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-[#3A3A3A] dark:text-[#ececef]">
            {t("instructor.bootcamps.emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#3A3A3A]/50 dark:text-white/50">
            {t("instructor.bootcamps.emptyDesc")}
          </p>
          <Link
            to="/instructor/bootcamps/new"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#de6414]"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("instructor.bootcamps.create")}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {allBootcamps.map((bootcamp) => (
              <BootcampCard
                key={bootcamp.id}
                bootcamp={bootcamp}
                language={i18n.language}
                isUpdating={
                  statusMutation.isPending &&
                  statusMutation.variables?.id === bootcamp.id
                }
                onStatusChange={(action) => {
                  setNotice(null);
                  setActionError(null);
                  statusMutation.mutate({ id: bootcamp.id, action });
                }}
              />
            ))}
          </div>

          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-[#3A3A3A]/10 pt-5 dark:border-white/10">
              <p className="text-xs text-[#3A3A3A]/45 dark:text-white/45">
                {t("bootcampCatalog.results.page", {
                  page: pagination.current_page,
                  last: pagination.last_page,
                })}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-lg border border-[#3A3A3A]/10 px-3 py-2 text-[11px] font-bold text-[#3A3A3A]/55 disabled:opacity-40 dark:border-white/10 dark:text-white/55"
                >
                  {t("bootcampCatalog.results.previous")}
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.last_page}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-[#3A3A3A]/10 px-3 py-2 text-[11px] font-bold text-[#3A3A3A]/55 disabled:opacity-40 dark:border-white/10 dark:text-white/55"
                >
                  {t("bootcampCatalog.results.next")}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BootcampCard({
  bootcamp,
  language,
  isUpdating,
  onStatusChange,
}: {
  bootcamp: Bootcamp;
  language: string;
  isUpdating: boolean;
  onStatusChange: (action: "publish" | "unpublish") => void;
}) {
  const { t } = useTranslation();
  const session = nextSession(bootcamp, language);
  const statusLabel =
    bootcamp.status === "published"
      ? t("bootcampCommon.status.published")
      : bootcamp.status === "archived"
        ? t("bootcampCommon.status.archived")
        : t("bootcampCommon.status.draft");

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-[0_10px_30px_rgba(58,58,58,.045)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(58,58,58,.1)] dark:border-white/8 dark:bg-[#1b1b20]">
      <div className="relative overflow-hidden bg-[#3A3A3A] px-5 pb-5 pt-6 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,120,34,.38),transparent_52%),linear-gradient(135deg,#3A3A3A,#202020)]"
        />
        <div className="relative flex items-start justify-between gap-3">
          <span
            className={[
              "rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] ring-1",
              statusStyles[bootcamp.status] ??
                "bg-white/90 text-[#3A3A3A] ring-white/30",
            ].join(" ")}
          >
            {statusLabel}
          </span>
          <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-white/70">
            {formatBootcampLevel(bootcamp.level, t)}
          </span>
        </div>

        <h2 className="relative mt-5 line-clamp-2 text-xl font-bold leading-snug tracking-tight">
          {bootcamp.title}
        </h2>
        <p className="relative mt-2 line-clamp-2 text-xs leading-5 text-white/55">
          {bootcamp.short_description}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="grid grid-cols-2 gap-3 border-b border-[#3A3A3A]/7 pb-4 dark:border-white/7">
          <Detail
            icon={Clock3}
            label={t("bootcampCommon.durationLabel")}
            value={formatBootcampDuration(
              bootcamp.duration_value,
              bootcamp.duration_unit,
              t,
            )}
          />
          <Detail
            icon={MapPin}
            label={t("bootcampCommon.locationLabel")}
            value={bootcamp.location}
          />
          <Detail
            icon={Users}
            label={t("instructor.bootcamps.metrics.registrations")}
            value={t("instructor.bootcamps.card.registered", {
              count: bootcamp.registered_count,
            })}
          />
          <Detail
            icon={Clock3}
            label={t("bootcampCommon.priceLabel")}
            value={formatBootcampPrice(
              bootcamp.price,
              bootcamp.currency,
              language,
            )}
          />
        </div>

        <div className="mt-4 rounded-xl bg-[#F7F7F7] px-3 py-2.5 dark:bg-[#101013]">
          <p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#3A3A3A]/35 dark:text-white/35">
            {t("instructor.bootcamps.card.nextSession")}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-[#3A3A3A] dark:text-[#ececef]">
            {session
              ? `${session} · ${t("instructor.bootcamps.card.dates", {
                  count: bootcamp.schedules.length,
                })}`
              : t("instructor.bootcamps.card.noSession")}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
          <Link
            to={`/instructor/bootcamps/${bootcamp.id}`}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#F47822] px-3.5 text-xs font-bold text-white shadow-[0_6px_14px_rgba(244,120,34,.2)] transition hover:-translate-y-0.5 hover:bg-[#de6414]"
          >
            {t("instructor.bootcamps.card.manage")}
            <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
          </Link>

          {bootcamp.status === "published" && (
            <Link
              to={`/bootcamps/${bootcamp.id}`}
              title={t("instructor.bootcamps.card.preview")}
              aria-label={t("instructor.bootcamps.card.preview")}
              className="grid h-9 w-9 place-items-center rounded-xl border border-[#3A3A3A]/10 text-[#3A3A3A]/55 transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:text-white/55"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}

          <button
            type="button"
            disabled={isUpdating || bootcamp.status === "archived"}
            onClick={() =>
              onStatusChange(
                bootcamp.status === "published" ? "unpublish" : "publish",
              )
            }
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 px-3 text-[11px] font-bold text-[#3A3A3A]/60 transition hover:border-[#F47822]/40 hover:text-[#F47822] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-white/60"
          >
            {isUpdating ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CalendarDays className="h-3.5 w-3.5" />
            )}
            {isUpdating
              ? t("instructor.bootcamps.card.updating")
              : bootcamp.status === "published"
                ? t("instructor.bootcamps.card.unpublish")
                : t("instructor.bootcamps.card.publish")}
          </button>
        </div>
      </div>
    </article>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.1em] text-[#3A3A3A]/38 dark:text-white/38">
        <Icon className="h-3 w-3 shrink-0 text-[#F47822]" />
        {label}
      </p>
      <p className="mt-1 truncate text-[11px] font-semibold text-[#3A3A3A] dark:text-[#ececef]">
        {value}
      </p>
    </div>
  );
}
