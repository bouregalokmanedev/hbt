import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BookOpenCheck, CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getMyAssignments } from "../api/assignments.api";
import {
  formatAssignmentDate,
  learnerAssignmentState,
} from "../utils/assignment-format";

export function HomeworkCard() {
  const { t, i18n } = useTranslation();
  const assignments = useQuery({
    queryKey: ["assignments", "mine", 3],
    queryFn: () => getMyAssignments(3),
    staleTime: 60_000,
  });

  const list = assignments.data ?? [];
  const pendingList = list.filter((assignment) => {
    const state = learnerAssignmentState(assignment);
    return state === "assigned" || state === "overdue";
  });
  const pending = pendingList.length;
  const next = pendingList[0];
  const caughtUp = !assignments.isLoading && list.length > 0 && !next;
  const due = formatAssignmentDate(next?.due_at ?? null, i18n.language);
  const href = next
    ? `/courses/${next.course_id}/assignments/${next.id}`
    : caughtUp
      ? `/courses/${list[0].course_id}/assignments`
      : "/my-courses";

  return (
    <Link to={href} className="block h-full" data-testid="homework-card">
      <section className="group relative flex h-full min-h-[230px] flex-col overflow-hidden rounded-3xl border border-[#F47822]/20 bg-white p-6 shadow-[0_12px_35px_rgba(58,58,58,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#F47822]/40 hover:shadow-[0_18px_45px_rgba(244,120,34,0.14)] dark:bg-[#1b1b20] sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#F47822]/10 blur-3xl transition-transform duration-500 group-hover:scale-125 rtl:-left-16 rtl:right-auto" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
            <BookOpenCheck className="h-6 w-6" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F47822]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#F47822]">
            {assignments.isLoading
              ? t("dashboard.homework.loading")
              : pending > 0
                ? t("dashboard.homework.pending", { count: pending })
                : t("dashboard.homework.upToDate")}
          </span>
        </div>

        <div className="relative mt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#3A3A3A]/40 dark:text-white/40">
            {t("dashboard.homework.eyebrow")}
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
            {next
              ? next.title
              : assignments.isLoading
                ? t("dashboard.homework.loadingTitle")
                : caughtUp
                  ? t("dashboard.homework.caughtUpTitle")
                  : t("dashboard.homework.emptyTitle")}
          </h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#3A3A3A]/50 dark:text-white/50">
            {next
              ? t("dashboard.homework.nextDue", {
                  course: next.course_title ?? "",
                })
              : assignments.isLoading
                ? t("dashboard.homework.loadingDesc")
                : caughtUp
                  ? t("dashboard.homework.caughtUpDesc")
                  : t("dashboard.homework.emptyDesc")}
          </p>
        </div>

        <div className="relative mt-auto flex items-center justify-between gap-3 pt-6">
          {next ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#3A3A3A]/45 dark:text-white/45">
              <CalendarClock className="h-3.5 w-3.5" />
              {due ?? t("dashboard.homework.noDeadline")}
            </span>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#F47822]">
            {next
              ? t("dashboard.homework.open")
              : caughtUp
                ? t("dashboard.homework.review")
                : t("dashboard.homework.browse")}
            <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
          </span>
        </div>
      </section>
    </Link>
  );
}
