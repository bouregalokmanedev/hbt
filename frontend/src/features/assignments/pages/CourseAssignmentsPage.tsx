import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getCourseAssignments } from "../api/assignments.api";
import { AssignmentStateBadge } from "../components/AssignmentStateBadge";
import {
  formatAssignmentDate,
  learnerAssignmentState,
} from "../utils/assignment-format";

export function CourseAssignmentsPage() {
  const { t, i18n } = useTranslation();
  const { courseId } = useParams();
  const assignments = useQuery({
    queryKey: ["assignments", "course", courseId],
    queryFn: () => getCourseAssignments(courseId!),
    enabled: Boolean(courseId),
  });

  const list = assignments.data ?? [];
  const pending = list.filter(
    (assignment) => learnerAssignmentState(assignment) === "assigned",
  ).length;
  const submitted = list.filter(
    (assignment) => learnerAssignmentState(assignment) === "submitted",
  ).length;
  const graded = list.filter(
    (assignment) => learnerAssignmentState(assignment) === "graded",
  ).length;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
      <Link
        to={`/courses/${courseId}`}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#3A3A3A]/55 transition hover:text-[#F47822] dark:text-white/55"
      >
        <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
        {t("assignments.backToCourse")}
      </Link>

      <section className="overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
              {t("assignments.eyebrow")}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {t("assignments.title")}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {t("assignments.description")}
            </p>
          </div>
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
            <BookOpenCheck className="h-7 w-7" />
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric
            label={t("assignments.metrics.pending")}
            value={pending}
            icon={Clock3}
          />
          <Metric
            label={t("assignments.metrics.submitted")}
            value={submitted}
            icon={CalendarClock}
          />
          <Metric
            label={t("assignments.metrics.graded")}
            value={graded}
            icon={CheckCircle2}
          />
        </div>
      </section>

      {assignments.isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl border border-border bg-card"
            />
          ))}
        </div>
      ) : assignments.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          <p className="font-semibold">{t("assignments.errorTitle")}</p>
          <p className="mt-1">{t("assignments.errorDesc")}</p>
          <button
            type="button"
            onClick={() => void assignments.refetch()}
            className="mt-4 rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-bold text-white"
          >
            {t("assignments.retry")}
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
            <BookOpenCheck className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-foreground">
            {t("assignments.emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {t("assignments.emptyDesc")}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {list.map((assignment) => {
            const state = learnerAssignmentState(assignment);
            const due = formatAssignmentDate(assignment.due_at, i18n.language);

            return (
              <li key={assignment.id}>
                <Link
                  to={`/courses/${courseId}/assignments/${assignment.id}`}
                  className="group flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-[0_6px_22px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-[#F47822]/35 hover:shadow-[0_12px_30px_rgba(244,120,34,0.10)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-foreground" dir="auto">
                        {assignment.title}
                      </h2>
                      <AssignmentStateBadge state={state} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground" dir="auto">
                      {assignment.instructions}
                    </p>
                    <p className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {due ?? t("assignments.noDeadline")}
                      <span aria-hidden="true">·</span>
                      {t("assignments.points", { count: assignment.max_points })}
                      {assignment.submission?.grade !== null &&
                        assignment.submission?.grade !== undefined && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span dir="ltr">
                              {t("assignments.gradeSummary", {
                                grade: assignment.submission.grade,
                                max: assignment.max_points,
                              })}
                            </span>
                          </>
                        )}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[#3A3A3A]/25 transition group-hover:text-[#F47822] rtl:-scale-x-100 dark:text-white/25" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Clock3;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#FCFCFC] px-4 py-3 dark:bg-[#1b1b20]">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-xl font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
