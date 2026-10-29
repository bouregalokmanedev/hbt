import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  Send,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/lib/api/errors";

import { getCourseAssignment, submitAssignment } from "../api/assignments.api";
import { AssignmentStateBadge } from "../components/AssignmentStateBadge";
import {
  formatAssignmentDate,
  learnerAssignmentState,
} from "../utils/assignment-format";

export function AssignmentDetailPage() {
  const { t, i18n } = useTranslation();
  const { courseId, assignmentId } = useParams();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const loadedAssignmentId = useRef<string | null>(null);

  const queryKey = ["assignments", "detail", courseId, assignmentId];
  const assignmentQuery = useQuery({
    queryKey,
    queryFn: () => getCourseAssignment(courseId!, assignmentId!),
    enabled: Boolean(courseId && assignmentId),
  });

  const assignment = assignmentQuery.data;

  useEffect(() => {
    if (!assignment || loadedAssignmentId.current === assignment.id) {
      return;
    }

    loadedAssignmentId.current = assignment.id;
    setContent(assignment.submission?.content ?? "");
    setLinkUrl(assignment.submission?.link_url ?? "");
  }, [assignment]);

  const submit = useMutation({
    mutationFn: () =>
      submitAssignment(courseId!, assignmentId!, {
        content: content.trim() || null,
        link_url: linkUrl.trim() || null,
      }),
    onSuccess: async () => {
      setNotice(t("assignments.detail.submitted"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({
          queryKey: ["assignments", "course", courseId],
        }),
        queryClient.invalidateQueries({ queryKey: ["assignments", "mine"] }),
      ]);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    submit.mutate();
  };

  if (assignmentQuery.isLoading) {
    return (
      <main className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6 lg:py-10">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-3xl bg-card" />
      </main>
    );
  }

  if (assignmentQuery.isError || !assignment) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          <h1 className="text-lg font-bold text-foreground">
            {t("assignments.detail.errorTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("assignments.detail.errorDesc")}
          </p>
          <Link
            to={`/courses/${courseId}/assignments`}
            className="mt-5 inline-flex rounded-xl bg-[#F47822] px-5 py-2.5 text-sm font-bold text-white"
          >
            {t("assignments.detail.backToAssignments")}
          </Link>
        </div>
      </main>
    );
  }

  const state = learnerAssignmentState(assignment);
  const due = formatAssignmentDate(assignment.due_at, i18n.language);
  const submittedAt = formatAssignmentDate(
    assignment.submission?.submitted_at ?? null,
    i18n.language,
  );
  const graded = assignment.submission?.status === "graded";
  const submitError = submit.error;
  const fieldError =
    submitError instanceof ApiError
      ? submitError.errors?.content?.[0] ??
        submitError.errors?.link_url?.[0] ??
        submitError.errors?.assignment?.[0] ??
        submitError.errors?.submission?.[0] ??
        submitError.message
      : submitError instanceof Error
        ? submitError.message
        : t("assignments.detail.submitError");

  return (
    <main
      data-testid="assignment-detail"
      className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:py-10"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/courses/${courseId}/assignments`}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#3A3A3A]/55 transition hover:text-[#F47822] dark:text-white/55"
        >
          <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
          {t("assignments.detail.backToAssignments")}
        </Link>
        <Link
          to={`/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F47822] hover:underline"
        >
          {t("assignments.detail.backToCourse")}
          <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
        </Link>
      </div>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
        <div className="h-1.5 bg-[#F47822]" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
                {t("assignments.detail.eyebrow")}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {assignment.title}
              </h1>
            </div>
            <AssignmentStateBadge state={state} testId="assignment-status" />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FCFCFC] px-3 py-1.5 dark:bg-[#1b1b20]">
              <CalendarClock className="h-3.5 w-3.5" />
              {due ?? t("assignments.noDeadline")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FCFCFC] px-3 py-1.5 dark:bg-[#1b1b20]">
              <Award className="h-3.5 w-3.5" />
              {t("assignments.points", { count: assignment.max_points })}
            </span>
            {assignment.submission?.is_late && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                <Clock3 className="h-3.5 w-3.5" />
                {t("assignments.status.late")}
              </span>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-[#FCFCFC] p-5 dark:bg-[#17171b]">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <FileText className="h-3.5 w-3.5 text-[#F47822]" />
              {t("assignments.detail.instructions")}
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-foreground" dir="auto">
              {assignment.instructions}
            </p>
          </div>
        </div>
      </section>

      {graded && assignment.submission && (
        <section
          data-testid="assignment-grade-card"
          className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 dark:border-emerald-500/20 dark:bg-emerald-500/10 sm:p-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700/70 dark:text-emerald-300/70">
                  {t("assignments.detail.gradedOn", {
                    date: formatAssignmentDate(
                      assignment.submission.graded_at,
                      i18n.language,
                    ),
                  })}
                </p>
                <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                  {t("assignments.detail.gradeTitle")}
                </h2>
              </div>
            </div>
            <p className="text-3xl font-black tracking-tight text-emerald-700 dark:text-emerald-300" dir="ltr">
              <span data-testid="assignment-grade">
                {assignment.submission.grade}
              </span>
              <span className="text-base font-semibold text-emerald-700/60 dark:text-emerald-300/60">
                {" "}
                / {assignment.max_points}
              </span>
            </p>
          </div>
          {assignment.submission.feedback ? (
            <p
              data-testid="assignment-feedback"
              className="mt-4 whitespace-pre-line rounded-2xl bg-white/70 p-4 text-sm leading-6 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100"
              dir="auto"
            >
              {assignment.submission.feedback}
            </p>
          ) : (
            <p className="mt-4 text-sm text-emerald-800/70 dark:text-emerald-200/70">
              {t("assignments.detail.noFeedback")}
            </p>
          )}
        </section>
      )}

      {assignment.submission && (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_8px_25px_rgba(15,23,42,0.04)] sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-foreground">
              {t("assignments.detail.yourSubmission")}
            </h2>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {t("assignments.detail.submittedOn", { date: submittedAt ?? "—" })}
            </span>
          </div>

          {assignment.submission.content && (
            <p className="mt-4 whitespace-pre-line rounded-2xl bg-[#FCFCFC] p-4 text-sm leading-6 text-foreground dark:bg-[#17171b]" dir="auto">
              {assignment.submission.content}
            </p>
          )}

          {assignment.submission.link_url && (
            <a
              href={assignment.submission.link_url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#F47822] hover:underline"
            >
              {t("assignments.detail.openLink")}
              <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
            </a>
          )}
        </section>
      )}

      <section className="rounded-3xl border border-border bg-card p-6 shadow-[0_8px_25px_rgba(15,23,42,0.04)] sm:p-7">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-[#F47822]" />
          <h2 className="text-base font-bold text-foreground">
            {graded
              ? t("assignments.detail.lockedTitle")
              : assignment.submission
                ? t("assignments.detail.updateTitle")
                : t("assignments.detail.submitTitle")}
          </h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {graded
            ? t("assignments.detail.lockedDesc")
            : assignment.submission
              ? t("assignments.detail.updateDesc")
              : t("assignments.detail.submitDesc")}
        </p>

        {!graded && (
          <form
            data-testid="assignment-form"
            onSubmit={handleSubmit}
            className="mt-5 space-y-4"
          >
            <label className="block">
              <span className="text-xs font-bold text-foreground">
                {t("assignments.detail.responseLabel")}
              </span>
              <textarea
                data-testid="assignment-content"
                value={content}
                dir="auto"
                onChange={(event) => {
                  setContent(event.target.value);
                  setNotice(null);
                }}
                rows={7}
                maxLength={20000}
                placeholder={t("assignments.detail.responsePlaceholder")}
                className="mt-2 w-full rounded-2xl border border-border bg-[#FCFCFC] px-4 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/10 dark:bg-[#17171b]"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-foreground">
                {t("assignments.detail.linkLabel")}
              </span>
              <input
                data-testid="assignment-link"
                type="url"
                dir="ltr"
                value={linkUrl}
                onChange={(event) => {
                  setLinkUrl(event.target.value);
                  setNotice(null);
                }}
                maxLength={2048}
                placeholder="https://"
                className="mt-2 h-11 w-full rounded-xl border border-border bg-[#FCFCFC] px-3.5 text-sm text-foreground outline-none transition focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/10 dark:bg-[#17171b]"
              />
              <span className="mt-1.5 block text-[11px] text-muted-foreground">
                {t("assignments.detail.linkHint")}
              </span>
            </label>

            {submit.isError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                {fieldError}
              </p>
            )}

            {notice && (
              <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                {notice}
              </p>
            )}

            <button
              type="submit"
              data-testid="assignment-submit"
              disabled={submit.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-xs font-bold text-white shadow-[0_8px_18px_rgba(244,120,34,0.2)] transition hover:bg-[#de6414] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submit.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {assignment.submission
                ? t("assignments.detail.updateCta")
                : t("assignments.detail.submitCta")}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
