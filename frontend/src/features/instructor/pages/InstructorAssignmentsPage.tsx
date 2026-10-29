import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Plus,
  Save,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useBlocker, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import type {
  InstructorAssignment,
  InstructorAssignmentSubmission,
} from "@/features/assignments/types/assignment.types";
import { formatAssignmentDate } from "@/features/assignments/utils/assignment-format";
import { ApiError } from "@/lib/api/errors";

import {
  createInstructorAssignment,
  deleteInstructorAssignment,
  getInstructorAssignmentSubmissions,
  getInstructorAssignments,
  getInstructorCourse,
  gradeInstructorAssignmentSubmission,
  runInstructorAssignmentAction,
  updateInstructorAssignment,
} from "../api/instructorApi";

interface AssignmentForm {
  title: string;
  slug: string;
  instructions: string;
  due_at: string;
  max_points: string;
  allow_late_submissions: boolean;
}

const emptyForm: AssignmentForm = {
  title: "",
  slug: "",
  instructions: "",
  due_at: "",
  max_points: "100",
  allow_late_submissions: true,
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function snapshot(form: AssignmentForm): string {
  return [
    form.title,
    form.slug,
    form.instructions,
    form.due_at,
    form.max_points,
    form.allow_late_submissions ? "1" : "0",
  ].join("\u0000");
}

function toDateTimeLocal(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIso(value: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formFromAssignment(assignment: InstructorAssignment): AssignmentForm {
  return {
    title: assignment.title,
    slug: assignment.slug,
    instructions: assignment.instructions,
    due_at: toDateTimeLocal(assignment.due_at),
    max_points: String(assignment.max_points),
    allow_late_submissions: assignment.allow_late_submissions,
  };
}

function errorMessage(error: unknown): string | null {
  if (error instanceof ApiError) {
    return (
      error.errors?.title?.[0] ??
      error.errors?.instructions?.[0] ??
      error.errors?.max_points?.[0] ??
      error.errors?.grade?.[0] ??
      error.errors?.slug?.[0] ??
      error.errors?.due_at?.[0] ??
      error.message
    );
  }

  return error instanceof Error ? error.message : null;
}

export function InstructorAssignmentsPage() {
  const { t, i18n } = useTranslation();
  const { courseId } = useParams();
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AssignmentForm>(emptyForm);
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot(emptyForm));
  const [slugTouched, setSlugTouched] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const courseQuery = useQuery({
    queryKey: ["instructor", "course", courseId],
    queryFn: () => getInstructorCourse(courseId!),
    enabled: Boolean(courseId),
  });

  const assignmentsQuery = useQuery({
    queryKey: ["instructor", "assignments", courseId],
    queryFn: () => getInstructorAssignments(courseId!),
    enabled: Boolean(courseId),
  });

  const assignments = assignmentsQuery.data ?? [];
  const selected = assignments.find((assignment) => assignment.id === editingId) ?? null;
  const isNew = editingId === null;
  const dirty = snapshot(form) !== savedSnapshot;
  const canSave =
    dirty &&
    form.title.trim().length > 0 &&
    form.instructions.trim().length > 0 &&
    Number(form.max_points) > 0;

  const submissionsQuery = useQuery({
    queryKey: ["instructor", "assignment-submissions", editingId],
    queryFn: () => getInstructorAssignmentSubmissions(editingId!),
    enabled: Boolean(editingId),
  });

  const blocker = useBlocker(dirty);

  useEffect(() => {
    if (!dirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  const refreshList = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["instructor", "assignments", courseId],
    });
  };

  const loadAssignment = (assignment: InstructorAssignment | null) => {
    if (assignment) {
      const next = formFromAssignment(assignment);
      setEditingId(assignment.id);
      setForm(next);
      setSavedSnapshot(snapshot(next));
    } else {
      setEditingId(null);
      setForm(emptyForm);
      setSavedSnapshot(snapshot(emptyForm));
    }

    setSlugTouched(false);
    setNotice(null);
  };

  const requestSelection = (assignment: InstructorAssignment | null) => {
    if (dirty && !window.confirm(t("instructor.assignments.discardConfirm"))) {
      return;
    }

    loadAssignment(assignment);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        instructions: form.instructions.trim(),
        due_at: toIso(form.due_at),
        max_points: Number(form.max_points),
        allow_late_submissions: form.allow_late_submissions,
      };

      return isNew
        ? createInstructorAssignment(courseId!, payload)
        : updateInstructorAssignment(editingId!, payload);
    },
    onSuccess: async (saved) => {
      const next = formFromAssignment(saved);
      setEditingId(saved.id);
      setForm(next);
      setSavedSnapshot(snapshot(next));
      setSlugTouched(false);
      setNotice(
        isNew
          ? t("instructor.assignments.created")
          : t("instructor.assignments.saved"),
      );
      await refreshList();
    },
  });

  const actionMutation = useMutation({
    mutationFn: (action: "publish" | "unpublish") =>
      runInstructorAssignmentAction(editingId!, action),
    onSuccess: async (updated) => {
      setNotice(
        updated.status === "published"
          ? t("instructor.assignments.published")
          : t("instructor.assignments.unpublished"),
      );
      await refreshList();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteInstructorAssignment(editingId!),
    onSuccess: async () => {
      await refreshList();
      setNotice(t("instructor.assignments.deleted"));
      setEditingId(null);
      setForm(emptyForm);
      setSavedSnapshot(snapshot(emptyForm));
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    saveMutation.mutate();
  };

  const handleDelete = () => {
    if (!selected) {
      return;
    }

    if (
      window.confirm(
        t("instructor.assignments.deleteConfirm", { title: selected.title }),
      )
    ) {
      deleteMutation.mutate();
    }
  };

  const actionError =
    errorMessage(saveMutation.error) ??
    errorMessage(actionMutation.error) ??
    errorMessage(deleteMutation.error);
  const lifecycleBlocked = dirty || saveMutation.isPending;
  const busy = saveMutation.isPending || actionMutation.isPending || deleteMutation.isPending;

  return (
    <main
      data-testid="instructor-assignments-page"
      className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:py-10"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/instructor/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#3A3A3A]/55 transition hover:text-[#F47822] dark:text-white/55"
        >
          <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
          {t("instructor.assignments.backToCourse")}
        </Link>
        <Link
          to={`/instructor/courses/${courseId}/curriculum`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F47822] hover:underline"
        >
          {t("instructor.assignments.openCurriculum")}
        </Link>
      </div>

      <section className="rounded-3xl border border-[#3A3A3A]/8 bg-white p-6 shadow-[0_12px_32px_rgba(58,58,58,0.045)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
              {t("instructor.assignments.eyebrow")}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
              {t("instructor.assignments.title")}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#3A3A3A]/50 dark:text-white/50">
              {courseQuery.data?.title
                ? t("instructor.assignments.descriptionCourse", {
                    course: courseQuery.data.title,
                  })
                : t("instructor.assignments.description")}
            </p>
          </div>
          <button
            type="button"
            data-testid="assignment-new"
            onClick={() => requestSelection(null)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(244,120,34,0.2)] transition hover:bg-[#de6414]"
          >
            <Plus className="h-4 w-4" />
            {t("instructor.assignments.new")}
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,340px)_1fr]">
        <aside className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white shadow-[0_8px_26px_rgba(58,58,58,0.04)] dark:border-white/8 dark:bg-[#1b1b20]">
            <div className="flex items-center justify-between border-b border-[#3A3A3A]/8 px-4 py-3 dark:border-white/8">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/55 dark:text-white/55">
                {t("instructor.assignments.listTitle")}
              </h2>
              <span className="rounded-full bg-[#F47822]/10 px-2 py-0.5 text-[10px] font-bold text-[#F47822]">
                {assignments.length}
              </span>
            </div>

            {assignmentsQuery.isLoading ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />
                ))}
              </div>
            ) : assignmentsQuery.isError ? (
              <p className="p-4 text-xs font-semibold text-red-600 dark:text-red-400">
                {t("instructor.assignments.errorDesc")}
              </p>
            ) : assignments.length === 0 ? (
              <div className="p-5 text-center">
                <BookOpenCheck className="mx-auto h-7 w-7 text-[#F47822]/60" />
                <p className="mt-2 text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">
                  {t("instructor.assignments.emptyTitle")}
                </p>
                <p className="mt-1 text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                  {t("instructor.assignments.emptyDesc")}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#3A3A3A]/8 dark:divide-white/8">
                {assignments.map((assignment) => (
                  <li key={assignment.id}>
                    <button
                      type="button"
                      data-testid={`assignment-list-item-${assignment.id}`}
                      onClick={() => requestSelection(assignment)}
                      className={`w-full px-4 py-3 text-start transition ${
                        assignment.id === editingId
                          ? "bg-[#F47822]/8"
                          : "hover:bg-[#F47822]/5"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">
                          {assignment.title}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] ${
                            assignment.status === "published"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "bg-[#3A3A3A]/8 text-[#3A3A3A]/55 dark:bg-white/8 dark:text-white/55"
                          }`}
                        >
                          {t(`instructor.assignments.status.${assignment.status}`)}
                        </span>
                      </span>
                      <span className="mt-1 flex items-center gap-2 text-[10px] text-[#3A3A3A]/40 dark:text-white/40">
                        <CalendarClock className="h-3 w-3" />
                        {assignment.due_at
                          ? new Intl.DateTimeFormat(
                              i18n.language === "ar" ? "ar" : "en",
                              { dateStyle: "medium" },
                            ).format(new Date(assignment.due_at))
                          : t("instructor.assignments.noDeadline")}
                        {assignment.pending_count > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-bold text-[#F47822]">
                              {t("instructor.assignments.toGrade", {
                                count: assignment.pending_count,
                              })}
                            </span>
                          </>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_26px_rgba(58,58,58,0.04)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                  {isNew
                    ? t("instructor.assignments.newEyebrow")
                    : t("instructor.assignments.editEyebrow")}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                  {isNew
                    ? t("instructor.assignments.newTitle")
                    : form.title || t("instructor.assignments.editTitle")}
                </h2>
              </div>
              {!isNew && (
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
                    selected?.status === "published"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "bg-[#3A3A3A]/8 text-[#3A3A3A]/55 dark:bg-white/8 dark:text-white/55"
                  }`}
                >
                  {t(
                    `instructor.assignments.status.${selected?.status ?? "draft"}`,
                  )}
                </span>
              )}
            </div>

            {dirty && (
              <p
                data-testid="assignment-unsaved"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500 motion-reduce:animate-none" />
                {t("instructor.assignments.unsaved")}
              </p>
            )}

            <form
              data-testid="assignment-form"
              onSubmit={handleSubmit}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <label className="block md:col-span-2">
                <span className="text-xs font-semibold text-[#3A3A3A]/75 dark:text-white/75">
                  {t("instructor.assignments.fields.title")}
                </span>
                <input
                  data-testid="assignment-title"
                  value={form.title}
                  dir="auto"
                  required
                  maxLength={255}
                  onChange={(event) => {
                    const title = event.target.value;
                    setForm((current) => ({
                      ...current,
                      title,
                      slug:
                        isNew && !slugTouched
                          ? slugify(title)
                          : current.slug,
                    }));
                    setNotice(null);
                  }}
                  className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3.5 text-sm text-[#3A3A3A] outline-none transition focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/8 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-[#3A3A3A]/75 dark:text-white/75">
                  {t("instructor.assignments.fields.slug")}
                </span>
                <input
                  value={form.slug}
                  dir="ltr"
                  maxLength={255}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setForm((current) => ({
                      ...current,
                      slug: slugify(event.target.value),
                    }));
                    setNotice(null);
                  }}
                  className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3.5 text-sm text-[#3A3A3A] outline-none transition focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/8 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-[#3A3A3A]/75 dark:text-white/75">
                  {t("instructor.assignments.fields.dueAt")}
                </span>
                <input
                  type="datetime-local"
                  value={form.due_at}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      due_at: event.target.value,
                    }));
                    setNotice(null);
                  }}
                  className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3.5 text-sm text-[#3A3A3A] outline-none transition focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/8 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-[#3A3A3A]/75 dark:text-white/75">
                  {t("instructor.assignments.fields.maxPoints")}
                </span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={form.max_points}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      max_points: event.target.value,
                    }));
                    setNotice(null);
                  }}
                  className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3.5 text-sm text-[#3A3A3A] outline-none transition focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/8 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
                />
              </label>

              <label className="flex items-center gap-3 self-end rounded-xl bg-[#FCFCFC] px-4 py-3 dark:bg-[#17171b]">
                <input
                  type="checkbox"
                  checked={form.allow_late_submissions}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      allow_late_submissions: event.target.checked,
                    }));
                    setNotice(null);
                  }}
                  className="h-4 w-4 accent-[#F47822]"
                />
                <span className="text-xs font-semibold text-[#3A3A3A]/75 dark:text-white/75">
                  {t("instructor.assignments.fields.allowLate")}
                </span>
              </label>

              <label className="block md:col-span-2">
                <span className="text-xs font-semibold text-[#3A3A3A]/75 dark:text-white/75">
                  {t("instructor.assignments.fields.instructions")}
                </span>
                <textarea
                  data-testid="assignment-instructions"
                  required
                  rows={8}
                  maxLength={20000}
                  dir="auto"
                  value={form.instructions}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      instructions: event.target.value,
                    }));
                    setNotice(null);
                  }}
                  placeholder={t("instructor.assignments.fields.instructionsPh")}
                  className="mt-2 w-full rounded-2xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-4 py-3 text-sm leading-6 text-[#3A3A3A] outline-none transition focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/8 dark:border-white/10 dark:bg-[#17171b] dark:text-white"
                />
              </label>

              {actionError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 md:col-span-2">
                  {actionError}
                </p>
              )}

              {notice && (
                <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 md:col-span-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {notice}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                <button
                  type="submit"
                  data-testid="assignment-save"
                  disabled={!canSave || busy}
                  title={
                    !canSave && !dirty
                      ? t("instructor.assignments.noChanges")
                      : undefined
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-xs font-bold text-white shadow-[0_8px_18px_rgba(244,120,34,0.2)] transition hover:bg-[#de6414] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {saveMutation.isPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isNew
                    ? t("instructor.assignments.createCta")
                    : t("instructor.assignments.saveCta")}
                </button>

                {!isNew && selected && (
                  <>
                    <button
                      type="button"
                      data-testid={
                        selected.status === "published"
                          ? "assignment-unpublish"
                          : "assignment-publish"
                      }
                      disabled={busy || lifecycleBlocked}
                      title={
                        lifecycleBlocked
                          ? t("instructor.assignments.saveBeforePublish")
                          : undefined
                      }
                      onClick={() =>
                        actionMutation.mutate(
                          selected.status === "published"
                            ? "unpublish"
                            : "publish",
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-[#F47822]/25 bg-[#FFF8F4] px-4 py-3 text-xs font-bold text-[#F47822] transition hover:bg-[#F47822] hover:text-white disabled:cursor-not-allowed disabled:opacity-55 dark:bg-[#F47822]/10"
                    >
                      {actionMutation.isPending ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {selected.status === "published"
                        ? t("instructor.assignments.unpublishCta")
                        : t("instructor.assignments.publishCta")}
                    </button>
                    <button
                      type="button"
                      data-testid="assignment-delete"
                      disabled={busy}
                      onClick={handleDelete}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-55 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("instructor.assignments.deleteCta")}
                    </button>
                  </>
                )}
              </div>

              {!isNew && lifecycleBlocked && (
                <p
                  data-testid="assignment-publish-blocked"
                  className="rounded-xl bg-amber-50 px-4 py-3 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300 md:col-span-2"
                >
                  {t("instructor.assignments.saveBeforePublish")}
                </p>
              )}
            </form>
          </section>

          {!isNew && selected && (
            <section
              data-testid="assignment-submissions"
              className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_26px_rgba(58,58,58,0.04)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#F47822]" />
                  <h2 className="text-base font-bold text-[#3A3A3A] dark:text-[#ececef]">
                    {t("instructor.assignments.submissionsTitle")}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-300">
                    {t("instructor.assignments.pendingCount", {
                      count: selected.pending_count,
                    })}
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-300">
                    {t("instructor.assignments.gradedCount", {
                      count: selected.graded_count,
                    })}
                  </span>
                </div>
              </div>

              {submissionsQuery.isLoading ? (
                <div className="mt-4 space-y-3">
                  {[1, 2].map((item) => (
                    <div key={item} className="h-28 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
                  ))}
                </div>
              ) : submissionsQuery.isError ? (
                <p className="mt-4 text-xs font-semibold text-red-600 dark:text-red-400">
                  {t("instructor.assignments.submissionsError")}
                </p>
              ) : (submissionsQuery.data?.length ?? 0) === 0 ? (
                <p className="mt-4 rounded-2xl bg-[#FCFCFC] px-4 py-6 text-center text-xs text-[#3A3A3A]/45 dark:bg-[#17171b] dark:text-white/45">
                  {t("instructor.assignments.submissionsEmpty")}
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {submissionsQuery.data!.map((submission) => (
                    <SubmissionGrader
                      key={`${submission.id}-${submission.graded_at ?? "open"}`}
                      assignmentId={selected.id}
                      maxPoints={selected.max_points}
                      submission={submission}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {blocker.state === "blocked" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="assignment-leave-title"
            className="w-full max-w-md rounded-2xl border border-[#3A3A3A]/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#1b1b20]"
          >
            <h2
              id="assignment-leave-title"
              className="text-lg font-bold text-[#3A3A3A] dark:text-[#ececef]"
            >
              {t("instructor.assignments.leaveTitle")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/55 dark:text-white/55">
              {t("instructor.assignments.leaveDesc")}
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => blocker.reset()}
                className="rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#F47822]"
              >
                {t("instructor.assignments.leaveStay")}
              </button>
              <button
                type="button"
                onClick={() => blocker.proceed()}
                className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                {t("instructor.assignments.leaveDiscard")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SubmissionGrader({
  assignmentId,
  maxPoints,
  submission,
}: {
  assignmentId: string;
  maxPoints: number;
  submission: InstructorAssignmentSubmission;
}) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [grade, setGrade] = useState(
    submission.grade === null ? "" : String(submission.grade),
  );
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [notice, setNotice] = useState<string | null>(null);

  const dirty =
    grade !== (submission.grade === null ? "" : String(submission.grade)) ||
    feedback !== (submission.feedback ?? "");
  const numericGrade = Number(grade);
  const validGrade =
    grade.trim() !== "" &&
    Number.isFinite(numericGrade) &&
    numericGrade >= 0 &&
    numericGrade <= maxPoints;

  const mutation = useMutation({
    mutationFn: () =>
      gradeInstructorAssignmentSubmission(assignmentId, submission.id, {
        grade: numericGrade,
        feedback: feedback.trim() || null,
      }),
    onSuccess: async () => {
      setNotice(t("instructor.assignments.gradedSaved"));
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["instructor", "assignment-submissions", assignmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["instructor", "assignments"],
        }),
      ]);
    },
  });

  const studentName = submission.student
    ? `${submission.student.first_name} ${submission.student.last_name}`.trim()
    : t("instructor.assignments.unknownStudent");
  const submittedAt =
    formatAssignmentDate(submission.submitted_at, i18n.language) ?? "—";

  const error =
    mutation.error instanceof ApiError
      ? mutation.error.errors?.grade?.[0] ?? mutation.error.message
      : mutation.error instanceof Error
        ? mutation.error.message
        : null;

  return (
    <article
      data-testid={`assignment-submission-${submission.id}`}
      className="rounded-2xl border border-[#3A3A3A]/8 bg-[#FCFCFC] p-4 dark:border-white/8 dark:bg-[#17171b]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">
            {studentName}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[#3A3A3A]/45 dark:text-white/45">
            <Clock3 className="h-3 w-3" />
            {t("instructor.assignments.submittedOn", { date: submittedAt })}
            {submission.is_late && (
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 font-bold text-red-600 dark:text-red-300">
                {t("instructor.assignments.late")}
              </span>
            )}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${
            submission.status === "graded"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
          }`}
        >
          {t(`instructor.assignments.submissionStatus.${submission.status}`)}
        </span>
      </div>

      {submission.content && (
        <p className="mt-3 whitespace-pre-line rounded-xl bg-white p-3 text-xs leading-6 text-[#3A3A3A] dark:bg-[#1b1b20] dark:text-white/80" dir="auto">
          {submission.content}
        </p>
      )}

      {submission.link_url && (
        <a
          href={submission.link_url}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-2 inline-block text-[11px] font-bold text-[#F47822] hover:underline"
        >
          {t("instructor.assignments.openSubmissionLink")}
        </a>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr_auto]">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#3A3A3A]/45 dark:text-white/45">
            {t("instructor.assignments.gradeLabel", { max: maxPoints })}
          </span>
          <input
            type="number"
            min="0"
            max={maxPoints}
            step="0.5"
            value={grade}
            onChange={(event) => {
              setGrade(event.target.value);
              setNotice(null);
            }}
            className="mt-1 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-sm outline-none focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/8 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#3A3A3A]/45 dark:text-white/45">
            {t("instructor.assignments.feedbackLabel")}
          </span>
          <input
            value={feedback}
            maxLength={5000}
            dir="auto"
            onChange={(event) => {
              setFeedback(event.target.value);
              setNotice(null);
            }}
            placeholder={t("instructor.assignments.feedbackPh")}
            className="mt-1 h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-sm outline-none focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/8 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
          />
        </label>
        <button
          type="button"
          disabled={!dirty || !validGrade || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="mt-auto inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#3A3A3A] px-4 text-[11px] font-bold text-white transition hover:bg-[#F47822] disabled:cursor-not-allowed disabled:opacity-50 sm:self-end"
        >
          {mutation.isPending ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          {t("instructor.assignments.saveGrade")}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-[11px] font-semibold text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {notice && (
        <p className="mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          {notice}
        </p>
      )}
    </article>
  );
}
