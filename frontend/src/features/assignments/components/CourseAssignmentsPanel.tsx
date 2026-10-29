import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpenCheck, CalendarClock, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getCourseAssignments } from "../api/assignments.api";
import {
  formatAssignmentDate,
  learnerAssignmentState,
} from "../utils/assignment-format";
import { AssignmentStateBadge } from "./AssignmentStateBadge";

export function CourseAssignmentsPanel({
  courseId,
  enabled,
}: {
  courseId: string;
  enabled: boolean;
}) {
  const { t, i18n } = useTranslation();
  const assignments = useQuery({
    queryKey: ["assignments", "course", courseId],
    queryFn: () => getCourseAssignments(courseId),
    enabled,
  });

  const list = assignments.data ?? [];
  const pending = list.filter((assignment) => {
    const state = learnerAssignmentState(assignment);
    return state === "assigned" || state === "overdue";
  }).length;

  return (
    <section
      data-testid="course-assignments-panel"
      className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
            <BookOpenCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-foreground">
              {t("assignments.coursePanel.title")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {enabled
                ? pending > 0
                  ? t("assignments.coursePanel.pending", { count: pending })
                  : t("assignments.coursePanel.description")
                : t("assignments.coursePanel.lockedDesc")}
            </p>
          </div>
        </div>

        {enabled && list.length > 0 && (
          <Link
            to={`/courses/${courseId}/assignments`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F47822] hover:underline"
          >
            {t("assignments.coursePanel.viewAll")}
            <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
          </Link>
        )}
      </div>

      {!enabled ? (
        <div className="flex items-center gap-3 px-5 py-6 text-sm text-muted-foreground">
          <LockKeyhole className="h-4 w-4 text-[#F47822]" />
          {t("assignments.coursePanel.locked")}
        </div>
      ) : assignments.isLoading ? (
        <div className="space-y-3 px-5 py-5">
          {[1, 2].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : assignments.isError ? (
        <p className="px-5 py-6 text-sm text-red-600 dark:text-red-400">
          {t("assignments.coursePanel.error")}
        </p>
      ) : list.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">
          {t("assignments.coursePanel.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {list.slice(0, 4).map((assignment) => {
            const state = learnerAssignmentState(assignment);
            const due = formatAssignmentDate(assignment.due_at, i18n.language);

            return (
              <li key={assignment.id}>
                <Link
                  to={`/courses/${courseId}/assignments/${assignment.id}`}
                  className="flex flex-wrap items-center gap-3 px-5 py-4 transition hover:bg-[#F47822]/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground" dir="auto">
                      {assignment.title}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {due ?? t("assignments.noDeadline")}
                      <span aria-hidden="true">·</span>
                      {t("assignments.points", { count: assignment.max_points })}
                    </p>
                  </div>
                  <AssignmentStateBadge state={state} />
                  <ArrowRight className="h-4 w-4 text-[#3A3A3A]/30 rtl:-scale-x-100 dark:text-white/30" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
