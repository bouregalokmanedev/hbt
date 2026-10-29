import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  EyeOff,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Layers3,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Trash2,
  Upload,
  Users,
  Video,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useBlocker, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/errors";

import {
  createInstructorBootcamp,
  createInstructorBootcampSchedule,
  deleteInstructorBootcamp,
  deleteInstructorBootcampSchedule,
  removeInstructorBootcampMedia,
  runInstructorBootcampAction,
  syncInstructorBootcampCurriculum,
  updateBootcampRegistrationStatus,
  updateInstructorBootcamp,
  updateInstructorBootcampSchedule,
  uploadInstructorBootcampBrochure,
  uploadInstructorBootcampMedia,
} from "../api/instructorBootcampsApi";
import {
  useBootcampRegistrations,
  useInstructorBootcamp,
} from "../hooks/useInstructorBootcamps";
import {
  BOOTCAMP_CAMPUSES,
  BOOTCAMP_INCLUDE_KEYS,
  type Bootcamp,
  type BootcampDurationUnit,
  type BootcampIncludes,
  type BootcampLevel,
  type BootcampMediaType,
  type BootcampRegistrationStatus,
  type BootcampSchedule,
  type BootcampSection,
  type InstructorBootcampPayload,
} from "../types/bootcamp.types";
import {
  bootcampPaymentLabel,
  bootcampRegistrationStatusLabel,
  bootcampSiteLabel,
  formatBootcampDate,
  formatBootcampDuration,
  formatBootcampLevel,
  formatBootcampPrice,
  normalizeBootcampLocation,
} from "../utils/bootcampFormat";

type Tab =
  | "overview"
  | "media"
  | "brochure"
  | "schedule"
  | "curriculum"
  | "students";

interface BootcampForm {
  title: string;
  short_description: string;
  description: string;
  duration_value: string;
  duration_unit: BootcampDurationUnit;
  location: string;
  price: string;
  currency: string;
  level: BootcampLevel;
  includes: BootcampIncludes;
}

interface DraftLesson {
  key: string;
  id?: string;
  title: string;
  classroom_count: string;
  duration_minutes: string;
}

interface DraftSection {
  key: string;
  id?: string;
  title: string;
  lessons: DraftLesson[];
}

const emptyForm: BootcampForm = {
  title: "",
  short_description: "",
  description: "",
  duration_value: "3",
  duration_unit: "days",
  location: "",
  price: "0",
  currency: "DZD",
  level: "beginner",
  includes: {
    challenges: false,
    resources: false,
    quizzes: false,
    support: false,
    certificate: false,
    final_project: false,
    classrooms: false,
  },
};

let generatedKey = 0;

function keyFor(prefix: string): string {
  generatedKey += 1;

  return `${prefix}-${generatedKey}`;
}

function toForm(bootcamp: Bootcamp): BootcampForm {
  return {
    title: bootcamp.title,
    short_description: bootcamp.short_description ?? "",
    description: bootcamp.description,
    duration_value: String(bootcamp.duration_value),
    duration_unit: bootcamp.duration_unit,
    location: normalizeBootcampLocation(bootcamp.location),
    price: String(bootcamp.price),
    currency: bootcamp.currency,
    level: bootcamp.level,
    includes: { ...bootcamp.includes },
  };
}

function toPayload(form: BootcampForm): InstructorBootcampPayload {
  return {
    title: form.title.trim(),
    short_description: form.short_description.trim() || null,
    description: form.description.trim(),
    duration_value: Number(form.duration_value) || 1,
    duration_unit: form.duration_unit,
    location: form.location.trim(),
    price: Number(form.price) || 0,
    currency: form.currency.trim().toUpperCase() || "DZD",
    level: form.level,
    includes: form.includes,
  };
}

function toDraftSections(sections: BootcampSection[]): DraftSection[] {
  return sections.map((section) => ({
    key: keyFor("section"),
    id: section.id,
    title: section.title,
    lessons: section.lessons.map((lesson) => ({
      key: keyFor("lesson"),
      id: lesson.id,
      title: lesson.title,
      classroom_count: String(lesson.classroom_count),
      duration_minutes: String(lesson.duration_minutes),
    })),
  }));
}

function draftSectionsSnapshot(sections: DraftSection[]): string {
  return sections
    .map((section) =>
      [
        section.id ?? "",
        section.title,
        section.lessons
          .map((lesson) =>
            [
              lesson.id ?? "",
              lesson.title,
              lesson.classroom_count,
              lesson.duration_minutes,
            ].join("\u0000"),
          )
          .join("\u0001"),
      ].join("\u0000"),
    )
    .join("\u0002");
}

function readError(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function scheduleDates(schedule: BootcampSchedule, language: string): string {
  const start = formatBootcampDate(schedule.starts_at, language, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const end = formatBootcampDate(schedule.ends_at, language, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${start} – ${end}`;
}

export function InstructorBootcampEditorPage() {
  const { t, i18n } = useTranslation();
  const { bootcampId: routeId } = useParams<{ bootcampId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !routeId || routeId === "new";
  const bootcampId = isNew ? undefined : routeId;

  const bootcampQuery = useInstructorBootcamp(bootcampId);
  const bootcamp = bootcampQuery.data;

  const [form, setForm] = useState<BootcampForm>(emptyForm);
  const [savedForm, setSavedForm] = useState<BootcampForm>(emptyForm);
  const [tab, setTab] = useState<Tab>("overview");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [curriculumDirty, setCurriculumDirty] = useState(false);
  const [scheduleDirty, setScheduleDirty] = useState(false);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);

  useEffect(() => {
    if (!bootcamp) {
      return;
    }

    const next = toForm(bootcamp);
    setForm(next);
    setSavedForm(next);
  }, [bootcamp]);

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm],
  );

  const hasUnsavedChanges = dirty || curriculumDirty || scheduleDirty;
  const blocker = useBlocker(hasUnsavedChanges && leaveTo === null);
  const publishBlocked =
    dirty || curriculumDirty
      ? t("instructor.bootcamps.editor.saveBeforePublish")
      : null;

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Deliberate exits (after create or delete) must bypass the dirty guard.
  useEffect(() => {
    if (!leaveTo) return;
    navigate(leaveTo, { replace: true });
    setLeaveTo(null);
  }, [leaveTo, navigate]);

  const saveMutation = useMutation({
    mutationFn: () =>
      isNew
        ? createInstructorBootcamp(toPayload(form))
        : updateInstructorBootcamp(bootcampId!, toPayload(form)),
    onSuccess: async (saved) => {
      setError(null);
      setNotice(
        isNew
          ? t("instructor.bootcamps.editor.created")
          : t("instructor.bootcamps.editor.saved"),
      );
      setSavedForm(form);
      setLastSavedAt(new Date().toISOString());
      queryClient.setQueryData(
        ["instructor", "bootcamp", saved.id],
        saved,
      );
      await queryClient.invalidateQueries({
        queryKey: ["instructor", "bootcamps"],
      });

      if (isNew) {
        setLeaveTo(`/instructor/bootcamps/${saved.id}`);
      }
    },
    onError: (requestError) => {
      setNotice(null);
      setError(
        readError(requestError, t("instructor.bootcamps.editor.actionFail")),
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: (action: "publish" | "unpublish") =>
      runInstructorBootcampAction(bootcampId!, action),
    onSuccess: async (updated, action) => {
      setError(null);
      setNotice(
        action === "publish"
          ? t("instructor.bootcamps.editor.publishedNotice")
          : t("instructor.bootcamps.editor.draftNotice"),
      );
      queryClient.setQueryData(
        ["instructor", "bootcamp", bootcampId],
        updated,
      );
      await queryClient.invalidateQueries({
        queryKey: ["instructor", "bootcamps"],
      });
    },
    onError: (requestError) => {
      setNotice(null);
      setError(
        readError(requestError, t("instructor.bootcamps.editor.actionFail")),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteInstructorBootcamp(bootcampId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["instructor", "bootcamps"],
      });
      setLeaveTo("/instructor/bootcamps");
    },
    onError: (requestError) => {
      setNotice(null);
      setError(
        readError(requestError, t("instructor.bootcamps.editor.actionFail")),
      );
    },
  });

  const isWorking =
    saveMutation.isPending ||
    statusMutation.isPending ||
    deleteMutation.isPending;

  function updateField<Key extends keyof BootcampForm>(
    key: Key,
    value: BootcampForm[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleInclude(key: keyof BootcampIncludes) {
    setForm((current) => ({
      ...current,
      includes: {
        ...current.includes,
        [key]: !current.includes[key],
      },
    }));
  }

  function submitOverview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    saveMutation.mutate();
  }

  if (!isNew && bootcampQuery.isLoading) {
    return <EditorSkeleton />;
  }

  if (!isNew && (bootcampQuery.isError || !bootcamp)) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-7 dark:border-red-500/20 dark:bg-red-500/10">
        <h1 className="text-lg font-semibold text-red-900 dark:text-red-300">
          {t("instructor.bootcamps.editor.loadError")}
        </h1>
        <p className="mt-2 text-sm text-red-700 dark:text-red-400">
          {t("instructor.bootcamps.errorDesc")}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void bootcampQuery.refetch()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#F47822]"
          >
            <RefreshCw className="h-4 w-4" />
            {t("instructor.bootcamps.retry")}
          </button>
          <Link
            to="/instructor/bootcamps"
            className="inline-flex items-center gap-2 rounded-xl border border-[#3A3A3A]/10 px-4 py-2.5 text-xs font-bold text-[#3A3A3A] dark:border-white/10 dark:text-white"
          >
            <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
            {t("instructor.bootcamps.editor.back")}
          </Link>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: Tab; label: string; icon: typeof BookOpen }> = [
    {
      id: "overview",
      label: t("instructor.bootcamps.editor.tabs.overview"),
      icon: BookOpen,
    },
    {
      id: "media",
      label: t("instructor.bootcamps.editor.tabs.media"),
      icon: ImageIcon,
    },
    {
      id: "brochure",
      label: t("instructor.bootcamps.editor.tabs.brochure"),
      icon: FileText,
    },
    {
      id: "schedule",
      label: t("instructor.bootcamps.editor.tabs.schedule"),
      icon: CalendarDays,
    },
    {
      id: "curriculum",
      label: t("instructor.bootcamps.editor.tabs.curriculum"),
      icon: Layers3,
    },
    {
      id: "students",
      label: t("instructor.bootcamps.editor.tabs.students"),
      icon: Users,
    },
  ];

  const statusLabel =
    bootcamp?.status === "published"
      ? t("bootcampCommon.status.published")
      : bootcamp?.status === "archived"
        ? t("bootcampCommon.status.archived")
        : t("bootcampCommon.status.draft");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {blocker.state === "blocked" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A3A]/45 p-4 backdrop-blur-sm dark:bg-black/60"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="bootcamp-leave-title"
          data-testid="bootcamp-leave-dialog"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#1b1b20]">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <AlertCircle className="h-5 w-5" />
            </span>
            <h2
              id="bootcamp-leave-title"
              className="mt-4 text-base font-bold text-[#3A3A3A] dark:text-[#ececef]"
            >
              {t("instructor.bootcamps.editor.leaveTitle")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/55 dark:text-white/55">
              {t("instructor.bootcamps.editor.leaveDesc")}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => blocker.reset()}
                data-testid="bootcamp-leave-stay"
                className="rounded-xl bg-[#3A3A3A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#F47822]"
              >
                {t("instructor.bootcamps.editor.leaveStay")}
              </button>
              <button
                type="button"
                onClick={() => blocker.proceed()}
                data-testid="bootcamp-leave-discard"
                className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                {t("instructor.bootcamps.editor.leaveDiscard")}
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <Link
            to="/instructor/bootcamps"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3A3A3A]/50 transition hover:text-[#F47822] dark:text-white/50"
          >
            <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" />
            {t("instructor.bootcamps.editor.back")}
          </Link>

          <p className="mt-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">
            <GraduationCap className="h-3.5 w-3.5" />
            {t("instructor.bootcamps.eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
            {isNew
              ? t("instructor.bootcamps.editor.createTitle")
              : bootcamp?.title ?? t("instructor.bootcamps.editor.editTitle")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3A3A3A]/50 dark:text-white/50">
            {isNew
              ? t("instructor.bootcamps.editor.createDescription")
              : t("instructor.bootcamps.editor.editDescription")}
          </p>
        </div>

        {!isNew && bootcamp && (
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em]",
                bootcamp.status === "published"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "bg-[#F47822]/10 text-[#F47822]",
              ].join(" ")}
            >
              {statusLabel}
            </span>

            {bootcamp.status === "published" && (
              <Link
                to={`/bootcamps/${bootcamp.id}`}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-3.5 text-xs font-bold text-[#3A3A3A]/65 shadow-sm transition hover:border-[#F47822]/35 hover:text-[#F47822] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/65"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {t("instructor.bootcamps.card.preview")}
              </Link>
            )}

            <button
              type="button"
              data-testid="bootcamp-publish-header"
              disabled={
                isWorking ||
                bootcamp.status === "archived" ||
                (bootcamp.status !== "published" && Boolean(publishBlocked))
              }
              title={
                bootcamp.status !== "published"
                  ? publishBlocked ?? undefined
                  : undefined
              }
              onClick={() =>
                statusMutation.mutate(
                  bootcamp.status === "published" ? "unpublish" : "publish",
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white shadow-[0_7px_16px_rgba(244,120,34,.2)] transition hover:bg-[#de6414] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {statusMutation.isPending ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : bootcamp.status === "published" ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Send className="h-3.5 w-3.5 rtl:-scale-x-100" />
              )}
              {bootcamp.status === "published"
                ? t("instructor.bootcamps.editor.unpublish")
                : t("instructor.bootcamps.editor.publish")}
            </button>
            {bootcamp.status !== "published" && publishBlocked && (
              <p
                data-testid="bootcamp-publish-blocked"
                className="w-full rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
              >
                {publishBlocked}
              </p>
            )}
          </div>
        )}
      </header>

      {notice && <Notice variant="success">{notice}</Notice>}
      {error && <Notice variant="error">{error}</Notice>}

      {!isNew && bootcamp && (
        <div className="flex flex-wrap gap-1 rounded-2xl border border-[#3A3A3A]/8 bg-white p-1.5 shadow-sm dark:border-white/8 dark:bg-[#1b1b20]">
          {tabs.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id ? "page" : undefined}
                className={[
                  "inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[11px] font-bold transition",
                  tab === item.id
                    ? "bg-[#F47822] text-white shadow-sm"
                    : "text-[#3A3A3A]/55 hover:bg-[#F7F7F7] hover:text-[#F47822] dark:text-white/55 dark:hover:bg-white/5",
                ].join(" ")}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {isNew && (
        <p className="rounded-xl border border-[#F47822]/20 bg-[#FFF8F4] px-4 py-3 text-xs font-medium text-[#9c4209] dark:bg-[#F47822]/10 dark:text-amber-200">
          {t("instructor.bootcamps.editor.tabLocked")}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {tab === "overview" && (
            <form onSubmit={submitOverview} className="space-y-6">
              <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-6">
                <SectionTitle
                  title={t("instructor.bootcamps.editor.basicsTitle")}
                  description={t("instructor.bootcamps.editor.basicsDesc")}
                />

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <TextField
                    label={t("instructor.bootcamps.editor.title")}
                    value={form.title}
                    required
                    className="md:col-span-2"
                    onChange={(value) => updateField("title", value)}
                  />
                  <TextField
                    label={t("instructor.bootcamps.editor.shortDescription")}
                    value={form.short_description}
                    className="md:col-span-2"
                    maxLength={500}
                    onChange={(value) => updateField("short_description", value)}
                  />
                  <TextAreaField
                    label={t("instructor.bootcamps.editor.description")}
                    value={form.description}
                    required
                    className="md:col-span-2"
                    onChange={(value) => updateField("description", value)}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-6">
                <SectionTitle
                  title={t("instructor.bootcamps.editor.overviewTitle")}
                  description={t("instructor.bootcamps.editor.overviewDesc")}
                />

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
                    <TextField
                      label={t("instructor.bootcamps.editor.durationValue")}
                      value={form.duration_value}
                      required
                      type="number"
                      min="1"
                      max="1000"
                      onChange={(value) => updateField("duration_value", value)}
                    />
                    <SelectField
                      label={t("instructor.bootcamps.editor.durationUnit")}
                      value={form.duration_unit}
                      onChange={(value) =>
                        updateField(
                          "duration_unit",
                          value as BootcampDurationUnit,
                        )
                      }
                      options={[
                        ["days", t("instructor.bootcamps.editor.units.days")],
                        ["weeks", t("instructor.bootcamps.editor.units.weeks")],
                        ["hours", t("instructor.bootcamps.editor.units.hours")],
                        [
                          "minutes",
                          t("instructor.bootcamps.editor.units.minutes"),
                        ],
                      ]}
                    />
                  </div>

                  <SelectField
                    label={t("instructor.bootcamps.editor.location")}
                    value={form.location}
                    onChange={(value) => updateField("location", value)}
                    options={BOOTCAMP_CAMPUSES.map(({ site, location }) => [
                      location,
                      t(`bootcampCommon.site.${site}`),
                    ])}
                  />

                  <SelectField
                    label={t("instructor.bootcamps.editor.level")}
                    value={form.level}
                    onChange={(value) =>
                      updateField("level", value as BootcampLevel)
                    }
                    options={[
                      ["beginner", formatBootcampLevel("beginner", t)],
                      ["intermediate", formatBootcampLevel("intermediate", t)],
                      ["advanced", formatBootcampLevel("advanced", t)],
                      ["all levels", formatBootcampLevel("all levels", t)],
                    ]}
                  />

                  <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
                    <TextField
                      label={t("instructor.bootcamps.editor.price")}
                      value={form.price}
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      onChange={(value) => updateField("price", value)}
                    />
                    <TextField
                      label={t("instructor.bootcamps.editor.currency")}
                      value={form.currency}
                      required
                      maxLength={3}
                      onChange={(value) =>
                        updateField("currency", value.toUpperCase())
                      }
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-[#F47822]/15 bg-[#FFF8F4] px-4 py-3 text-xs font-semibold text-[#9c4209] dark:bg-[#F47822]/10 dark:text-amber-200">
                  {formatBootcampDuration(
                    Number(form.duration_value) || 0,
                    form.duration_unit,
                    t,
                  )}{" "}
                  ·{" "}
                  {formatBootcampPrice(
                    Number(form.price) || 0,
                    form.currency,
                    i18n.language,
                  )}{" "}
                  · {form.location || t("bootcampCommon.emptyValue")}
                </div>
              </section>

              <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-6">
                <SectionTitle
                  title={t("instructor.bootcamps.editor.includesTitle")}
                  description={t("instructor.bootcamps.editor.includesDesc")}
                />

                <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {BOOTCAMP_INCLUDE_KEYS.map((key) => {
                    const enabled = form.includes[key];

                    return (
                      <button
                        key={key}
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        onClick={() => toggleInclude(key)}
                        className={[
                          "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-start transition",
                          enabled
                            ? "border-[#F47822]/30 bg-[#F47822]/5"
                            : "border-[#3A3A3A]/8 bg-[#FCFCFC] dark:border-white/8 dark:bg-[#101013]",
                        ].join(" ")}
                      >
                        <span className="text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                          {t(`instructor.bootcamps.editor.includes.${key}`)}
                        </span>
                        <span
                          className={[
                            "relative h-6 w-11 shrink-0 rounded-full transition",
                            enabled
                              ? "bg-[#F47822]"
                              : "bg-[#3A3A3A]/15 dark:bg-white/15",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all dark:bg-[#1b1b20]",
                              enabled
                                ? "left-6 rtl:left-1 rtl:right-6"
                                : "left-1 rtl:left-auto rtl:right-1",
                            ].join(" ")}
                          />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="flex flex-wrap items-center justify-end gap-3">
                {dirty ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {t("instructor.bootcamps.editor.unsaved")}
                  </span>
                ) : lastSavedAt ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t("instructor.bootcamps.editor.savedAt")}
                  </span>
                ) : null}

                <Link
                  to="/instructor/bootcamps"
                  className="rounded-xl px-4 py-3 text-xs font-semibold text-[#3A3A3A]/55 transition hover:bg-white hover:text-[#3A3A3A] dark:text-white/55 dark:hover:bg-white/10"
                >
                  {t("instructor.bootcamps.editor.scheduleCancel")}
                </Link>

                <button
                  type="submit"
                  disabled={isWorking}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#3A3A3A] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#F47822] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saveMutation.isPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saveMutation.isPending
                    ? t("instructor.bootcamps.editor.saving")
                    : isNew
                      ? t("instructor.bootcamps.editor.createDraft")
                      : t("instructor.bootcamps.editor.save")}
                </button>
              </div>
            </form>
          )}

          {tab === "media" && bootcamp && (
            <MediaPanel
              bootcamp={bootcamp}
              onUpdated={(updated) => {
                queryClient.setQueryData(
                  ["instructor", "bootcamp", bootcampId],
                  updated,
                );
              }}
            />
          )}

          {tab === "brochure" && bootcamp && (
            <BrochurePanel
              bootcamp={bootcamp}
              onUpdated={(updated) => {
                queryClient.setQueryData(
                  ["instructor", "bootcamp", bootcampId],
                  updated,
                );
              }}
            />
          )}

          {/*
           * Schedule and curriculum drafts stay mounted so switching tabs
           * never discards unsaved work. The active tab is shown; the
           * others remain hidden.
           */}
          {bootcamp && (
            <>
              <div className={tab === "schedule" ? undefined : "hidden"}>
                <SchedulePanel
                  bootcamp={bootcamp}
                  onChanged={async () => {
                    await queryClient.invalidateQueries({
                      queryKey: ["instructor", "bootcamp", bootcampId],
                    });
                  }}
                  onDirtyChange={setScheduleDirty}
                />
              </div>

              <div className={tab === "curriculum" ? undefined : "hidden"}>
                <CurriculumPanel
                  bootcamp={bootcamp}
                  onSaved={(sections) => {
                    queryClient.setQueryData(
                      ["instructor", "bootcamp", bootcampId],
                      (current: Bootcamp | undefined) =>
                        current ? { ...current, sections } : current,
                    );
                  }}
                  onDirtyChange={setCurriculumDirty}
                />
              </div>
            </>
          )}

          {tab === "students" && bootcamp && (
            <StudentsPanel bootcampId={bootcamp.id} />
          )}
        </div>

        <aside className="h-fit space-y-4 xl:sticky xl:top-24">
          <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)] dark:border-white/8 dark:bg-[#1b1b20]">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">
              {t("instructor.bootcamps.editor.statusLabel")}
            </p>

            {isNew ? (
              <p className="mt-3 text-sm leading-6 text-[#3A3A3A]/55 dark:text-white/55">
                {t("instructor.bootcamps.editor.tabLocked")}
              </p>
            ) : (
              <>
                <h2 className="mt-2 text-lg font-bold capitalize text-[#3A3A3A] dark:text-[#ececef]">
                  {statusLabel}
                </h2>
                <p className="mt-2 text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">
                  {bootcamp?.status === "published"
                    ? t("instructor.bootcamps.editor.publishedNotice")
                    : t("instructor.bootcamps.editor.draftNotice")}
                </p>

                <button
                  type="button"
                  data-testid="bootcamp-publish-sidebar"
                  disabled={
                    isWorking ||
                    bootcamp?.status === "archived" ||
                    (bootcamp?.status !== "published" &&
                      Boolean(publishBlocked))
                  }
                  title={
                    bootcamp?.status !== "published"
                      ? publishBlocked ?? undefined
                      : undefined
                  }
                  onClick={() =>
                    statusMutation.mutate(
                      bootcamp?.status === "published"
                        ? "unpublish"
                        : "publish",
                    )
                  }
                  className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#3A3A3A] px-3.5 py-3 text-xs font-bold text-white transition hover:bg-[#F47822] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>
                    {bootcamp?.status === "published"
                      ? t("instructor.bootcamps.editor.unpublish")
                      : t("instructor.bootcamps.editor.publish")}
                  </span>
                  {statusMutation.isPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : bootcamp?.status === "published" ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4 rtl:-scale-x-100" />
                  )}
                </button>
                {bootcamp?.status !== "published" && publishBlocked && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                    {publishBlocked}
                  </p>
                )}
              </>
            )}
          </section>

          {!isNew && bootcamp && (
            <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)] dark:border-white/8 dark:bg-[#1b1b20]">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">
                {t("instructor.bootcamps.editor.overviewTitle")}
              </p>
              <ul className="mt-4 space-y-3 text-[11px] text-[#3A3A3A]/60 dark:text-white/60">
                <li className="flex items-start gap-2">
                  <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F47822]" />
                  {formatBootcampDuration(
                    bootcamp.duration_value,
                    bootcamp.duration_unit,
                    t,
                  )}
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F47822]" />
                  {bootcamp.location}
                </li>
                <li className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F47822]" />
                  {t("instructor.bootcamps.card.dates", {
                    count: bootcamp.schedules.length,
                  })}
                </li>
                <li className="flex items-start gap-2">
                  <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F47822]" />
                  {t("instructor.bootcamps.card.registered", {
                    count: bootcamp.registered_count,
                  })}
                </li>
              </ul>
            </section>
          )}

          {!isNew && bootcamp && (
            <section className="rounded-2xl border border-red-100 bg-red-50 p-5 dark:border-red-500/20 dark:bg-red-500/10">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-red-600 dark:text-red-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t("instructor.bootcamps.editor.statusLabel")}
              </p>
              <p className="mt-2 text-xs leading-5 text-red-900/65 dark:text-red-200/65">
                {t("instructor.bootcamps.editor.deleteConfirm", {
                  title: bootcamp.title,
                })}
              </p>
              <button
                type="button"
                disabled={isWorking}
                onClick={() => {
                  if (
                    window.confirm(
                      t("instructor.bootcamps.editor.deleteConfirm", {
                        title: bootcamp.title,
                      }),
                    )
                  ) {
                    deleteMutation.mutate();
                  }
                }}
                className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-red-700 transition hover:text-red-900 disabled:opacity-60 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                {t("instructor.bootcamps.editor.delete")}
              </button>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

const MEDIA_TYPES: BootcampMediaType[] = [
  "thumbnail",
  "cover_image",
  "preview_video",
];

const MEDIA_ACCEPT: Record<BootcampMediaType, string> = {
  thumbnail: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
  cover_image: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
  preview_video: "video/mp4,video/webm,.mp4,.webm",
};

const MEDIA_MAX_BYTES: Record<BootcampMediaType, number> = {
  thumbnail: 5 * 1024 * 1024,
  cover_image: 5 * 1024 * 1024,
  preview_video: 50 * 1024 * 1024,
};

function MediaPanel({
  bootcamp,
  onUpdated,
}: {
  bootcamp: Bootcamp;
  onUpdated: (bootcamp: Bootcamp) => void;
}) {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-6">
      <SectionTitle
        title={t("instructor.bootcamps.editor.mediaTitle")}
        description={t("instructor.bootcamps.editor.mediaDesc")}
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {MEDIA_TYPES.map((type) => (
          <MediaCard
            key={type}
            bootcamp={bootcamp}
            type={type}
            onUpdated={onUpdated}
            className={
              type === "preview_video" ? "lg:col-span-2" : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}

function MediaCard({
  bootcamp,
  type,
  onUpdated,
  className,
}: {
  bootcamp: Bootcamp;
  type: BootcampMediaType;
  onUpdated: (bootcamp: Bootcamp) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isVideo = type === "preview_video";
  const url = bootcamp[type];
  const Icon = isVideo ? Video : ImageIcon;
  const title = t(`instructor.bootcamps.editor.mediaTypes.${type}.title`);
  const description = t(
    `instructor.bootcamps.editor.mediaTypes.${type}.description`,
  );
  const alt = t(`instructor.bootcamps.editor.mediaTypes.${type}.alt`);

  function resetInput() {
    setFile(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const uploadMutation = useMutation({
    mutationFn: (selected: File) =>
      uploadInstructorBootcampMedia(bootcamp.id, type, selected),
    onSuccess: (updated) => {
      onUpdated(updated);
      resetInput();
      setLocalError(null);
      setNotice(t("instructor.bootcamps.editor.mediaUploaded"));
    },
    onError: (error) => {
      setNotice(null);
      setLocalError(
        readError(error, t("instructor.bootcamps.editor.mediaFail")),
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeInstructorBootcampMedia(bootcamp.id, type),
    onSuccess: (updated) => {
      onUpdated(updated);
      resetInput();
      setLocalError(null);
      setNotice(t("instructor.bootcamps.editor.mediaRemoved"));
    },
    onError: (error) => {
      setNotice(null);
      setLocalError(
        readError(error, t("instructor.bootcamps.editor.mediaFail")),
      );
    },
  });

  function pick(selected: File | undefined) {
    setNotice(null);
    setLocalError(null);

    if (!selected) {
      setFile(null);
      return;
    }

    const allowedMime = isVideo
      ? ["video/mp4", "video/webm"]
      : ["image/jpeg", "image/png", "image/webp"];
    const allowedExtension = isVideo
      ? [".mp4", ".webm"]
      : [".jpg", ".jpeg", ".png", ".webp"];
    const name = selected.name.toLowerCase();

    if (
      !allowedMime.includes(selected.type) &&
      !allowedExtension.some((extension) => name.endsWith(extension))
    ) {
      setFile(null);
      setLocalError(t("instructor.bootcamps.editor.mediaBadType"));
      return;
    }

    if (selected.size > MEDIA_MAX_BYTES[type]) {
      setFile(null);
      setLocalError(t("instructor.bootcamps.editor.mediaTooBig"));
      return;
    }

    setFile(selected);
  }

  return (
    <article
      data-testid={`bootcamp-media-${type}`}
      className={[
        "rounded-2xl border border-[#3A3A3A]/8 bg-[#FCFCFC] p-4 dark:border-white/8 dark:bg-[#101013]",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
            {title}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-[#3A3A3A]/45 dark:text-white/45">
            {description}
          </p>
        </div>
      </div>

      {notice && <Notice variant="success">{notice}</Notice>}
      {localError && <Notice variant="error">{localError}</Notice>}

      <div className="mt-4 overflow-hidden rounded-xl border border-[#3A3A3A]/8 bg-white dark:border-white/8 dark:bg-[#1b1b20]">
        {url ? (
          isVideo ? (
            <video
              data-testid={`bootcamp-media-preview-${type}`}
              src={url}
              controls
              preload="metadata"
              aria-label={alt}
              className="aspect-video w-full bg-black object-contain"
            />
          ) : (
            <img
              data-testid={`bootcamp-media-preview-${type}`}
              src={url}
              alt={alt}
              className="aspect-video w-full object-cover"
            />
          )
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 px-4 text-center text-[11px] text-[#3A3A3A]/35 dark:text-white/35">
            <Icon className="h-7 w-7" />
            {isVideo
              ? t("instructor.bootcamps.editor.mediaEmptyVideo")
              : t("instructor.bootcamps.editor.mediaEmptyImage")}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={MEDIA_ACCEPT[type]}
        className="sr-only"
        aria-label={`${t("instructor.bootcamps.editor.mediaChoose")} ${title}`}
        onChange={(event) => pick(event.target.files?.[0])}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-white px-3.5 text-xs font-bold text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
        >
          <Upload className="h-3.5 w-3.5" />
          {t("instructor.bootcamps.editor.mediaChoose")}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {url && (
            <button
              type="button"
              disabled={removeMutation.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    t("instructor.bootcamps.editor.mediaRemoveConfirm"),
                  )
                ) {
                  removeMutation.mutate();
                }
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 px-3.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              {removeMutation.isPending ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              {t("instructor.bootcamps.editor.mediaRemove")}
            </button>
          )}

          <button
            type="button"
            disabled={!file || uploadMutation.isPending}
            onClick={() => file && uploadMutation.mutate(file)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white transition hover:bg-[#de6414] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadMutation.isPending ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
            {uploadMutation.isPending
              ? t("instructor.bootcamps.editor.mediaUploading")
              : t("instructor.bootcamps.editor.mediaUpload")}
          </button>
        </div>
      </div>

      <p className="mt-2 truncate text-[10px] text-[#3A3A3A]/40 dark:text-white/40">
        {file
          ? file.name
          : isVideo
            ? t("instructor.bootcamps.editor.mediaVideoHint")
            : t("instructor.bootcamps.editor.mediaImageHint")}
      </p>
    </article>
  );
}

function BrochurePanel({
  bootcamp,
  onUpdated,
}: {
  bootcamp: Bootcamp;
  onUpdated: (bootcamp: Bootcamp) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (selected: File) =>
      uploadInstructorBootcampBrochure(bootcamp.id, selected),
    onSuccess: (updated) => {
      onUpdated(updated);
      setFile(null);
      setLocalError(null);
      setNotice(t("instructor.bootcamps.editor.brochureUploaded"));

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    onError: (error) => {
      setNotice(null);
      setLocalError(
        readError(error, t("instructor.bootcamps.editor.brochureFail")),
      );
    },
  });

  function pick(selected: File | undefined) {
    setNotice(null);
    setLocalError(null);

    if (!selected) {
      setFile(null);
      return;
    }

    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setFile(null);
      setLocalError(t("instructor.bootcamps.editor.brochureBadType"));
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setFile(null);
      setLocalError(t("instructor.bootcamps.editor.brochureTooBig"));
      return;
    }

    setFile(selected);
  }

  return (
    <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-6">
      <SectionTitle
        title={t("instructor.bootcamps.editor.brochureTitle")}
        description={t("instructor.bootcamps.editor.brochureDesc")}
      />

      {notice && <Notice variant="success">{notice}</Notice>}
      {localError && <Notice variant="error">{localError}</Notice>}

      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-[#3A3A3A]/8 bg-[#FCFCFC] p-4 dark:border-white/8 dark:bg-[#101013]">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
          <FileText className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">
            {bootcamp.brochure_name
              ? t("instructor.bootcamps.editor.brochureCurrent")
              : t("instructor.bootcamps.editor.brochureNone")}
          </p>
          {bootcamp.brochure_name && (
            <p className="mt-1 truncate text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
              {bootcamp.brochure_name}
            </p>
          )}
        </div>
        {bootcamp.brochure_available && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            {t("bootcampCommon.downloadBrochure")}
          </span>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-dashed border-[#3A3A3A]/15 p-5 dark:border-white/15">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(event) => pick(event.target.files?.[0])}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">
              {file ? file.name : t("instructor.bootcamps.editor.brochureChoose")}
            </p>
            <p className="mt-1 text-[10px] text-[#3A3A3A]/40 dark:text-white/40">
              {t("instructor.bootcamps.editor.brochureHint")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-white px-3.5 text-xs font-bold text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
            >
              <Upload className="h-3.5 w-3.5" />
              {t("instructor.bootcamps.editor.brochureChoose")}
            </button>

            <button
              type="button"
              disabled={!file || uploadMutation.isPending}
              onClick={() => file && uploadMutation.mutate(file)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white transition hover:bg-[#de6414] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploadMutation.isPending ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              {uploadMutation.isPending
                ? t("instructor.bootcamps.editor.brochureUploading")
                : t("instructor.bootcamps.editor.brochureUpload")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SchedulePanel({
  bootcamp,
  onChanged,
  onDirtyChange,
}: {
  bootcamp: Bootcamp;
  onChanged: () => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = startsAt !== "" || endsAt !== "";

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { starts_at: startsAt, ends_at: endsAt };

      return editingId
        ? updateInstructorBootcampSchedule(bootcamp.id, editingId, payload)
        : createInstructorBootcampSchedule(bootcamp.id, payload);
    },
    onSuccess: async () => {
      setNotice(t("instructor.bootcamps.editor.scheduleSaved"));
      setError(null);
      setStartsAt("");
      setEndsAt("");
      setEditingId(null);
      await onChanged();
    },
    onError: (requestError) => {
      setNotice(null);
      setError(
        readError(requestError, t("instructor.bootcamps.editor.scheduleFail")),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (scheduleId: string) =>
      deleteInstructorBootcampSchedule(bootcamp.id, scheduleId),
    onSuccess: async () => {
      setNotice(t("instructor.bootcamps.editor.scheduleDeleted"));
      setError(null);
      await onChanged();
    },
    onError: (requestError) => {
      setNotice(null);
      setError(
        readError(requestError, t("instructor.bootcamps.editor.scheduleFail")),
      );
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setError(null);

    if (!startsAt || !endsAt) {
      setError(t("instructor.bootcamps.editor.scheduleRequired"));
      return;
    }

    if (endsAt < startsAt) {
      setError(t("instructor.bootcamps.editor.scheduleInvalid"));
      return;
    }

    saveMutation.mutate();
  }

  function edit(schedule: BootcampSchedule) {
    setEditingId(schedule.id);
    setStartsAt(schedule.starts_at.slice(0, 10));
    setEndsAt(schedule.ends_at.slice(0, 10));
    setNotice(null);
    setError(null);
  }

  return (
    <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-6">
      <SectionTitle
        title={t("instructor.bootcamps.editor.scheduleTitle")}
        description={t("instructor.bootcamps.editor.scheduleDesc")}
      />

      {notice && <Notice variant="success">{notice}</Notice>}
      {error && <Notice variant="error">{error}</Notice>}

      <form
        onSubmit={submit}
        className="mt-6 grid gap-3 rounded-2xl border border-[#3A3A3A]/8 bg-[#FCFCFC] p-4 dark:border-white/8 dark:bg-[#101013] sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <TextField
          label={t("instructor.bootcamps.editor.scheduleStarts")}
          value={startsAt}
          type="date"
          required
          onChange={setStartsAt}
        />
        <TextField
          label={t("instructor.bootcamps.editor.scheduleEnds")}
          value={endsAt}
          type="date"
          required
          onChange={setEndsAt}
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white transition hover:bg-[#de6414] disabled:opacity-60"
          >
            {saveMutation.isPending ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saveMutation.isPending
              ? t("instructor.bootcamps.editor.scheduleSaving")
              : editingId
                ? t("instructor.bootcamps.editor.scheduleSave")
                : t("instructor.bootcamps.editor.scheduleAdd")}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setStartsAt("");
                setEndsAt("");
              }}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#3A3A3A]/10 px-3 text-xs font-bold text-[#3A3A3A]/55 dark:border-white/10 dark:text-white/55"
            >
              {t("instructor.bootcamps.editor.scheduleCancel")}
            </button>
          )}
        </div>
      </form>

      {bootcamp.schedules.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-[#3A3A3A]/12 px-4 py-8 text-center text-sm text-[#3A3A3A]/45 dark:border-white/12 dark:text-white/45">
          {t("instructor.bootcamps.editor.scheduleEmpty")}
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
                {scheduleDates(schedule, i18n.language)}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => edit(schedule)}
                  className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-[#3A3A3A]/55 transition hover:bg-white hover:text-[#F47822] dark:text-white/55 dark:hover:bg-white/5"
                >
                  {t("instructor.bootcamps.editor.scheduleEdit")}
                </button>
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        t("instructor.bootcamps.editor.scheduleDeleteConfirm"),
                      )
                    ) {
                      deleteMutation.mutate(schedule.id);
                    }
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg text-red-500 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-500/10"
                  aria-label={t("instructor.bootcamps.editor.scheduleDelete")}
                >
                  {deleteMutation.isPending ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CurriculumPanel({
  bootcamp,
  onSaved,
  onDirtyChange,
}: {
  bootcamp: Bootcamp;
  onSaved: (sections: BootcampSection[]) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { t } = useTranslation();
  const [sections, setSections] = useState<DraftSection[]>(() =>
    toDraftSections(bootcamp.sections),
  );
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    draftSectionsSnapshot(toDraftSections(bootcamp.sections)),
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = draftSectionsSnapshot(sections) !== savedSnapshot;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  // Refresh from the server only when there is nothing local to lose.
  useEffect(() => {
    if (dirty) return;

    const next = toDraftSections(bootcamp.sections);
    setSections(next);
    setSavedSnapshot(draftSectionsSnapshot(next));
  }, [bootcamp.sections, dirty]);

  const saveMutation = useMutation({
    mutationFn: () =>
      syncInstructorBootcampCurriculum(
        bootcamp.id,
        sections.map((section) => ({
          ...(section.id ? { id: section.id } : {}),
          title: section.title.trim(),
          lessons: section.lessons.map((lesson) => ({
            ...(lesson.id ? { id: lesson.id } : {}),
            title: lesson.title.trim(),
            classroom_count: Number(lesson.classroom_count) || 0,
            duration_minutes: Number(lesson.duration_minutes) || 0,
          })),
        })),
      ),
    onSuccess: (savedSections) => {
      const next = toDraftSections(savedSections);
      setSections(next);
      setSavedSnapshot(draftSectionsSnapshot(next));
      setError(null);
      setNotice(t("instructor.bootcamps.editor.curriculumSaved"));
      onSaved(savedSections);
    },
    onError: (requestError) => {
      setNotice(null);
      setError(
        readError(
          requestError,
          t("instructor.bootcamps.editor.curriculumFail"),
        ),
      );
    },
  });

  function addSection() {
    setSections((current) => [
      ...current,
      {
        key: keyFor("section"),
        title: "",
        lessons: [],
      },
    ]);
    setNotice(null);
  }

  function updateSection(key: string, title: string) {
    setSections((current) =>
      current.map((section) =>
        section.key === key ? { ...section, title } : section,
      ),
    );
  }

  function removeSection(key: string) {
    setSections((current) =>
      current.filter((section) => section.key !== key),
    );
    setNotice(null);
  }

  function addLesson(sectionKey: string) {
    setSections((current) =>
      current.map((section) =>
        section.key === sectionKey
          ? {
              ...section,
              lessons: [
                ...section.lessons,
                {
                  key: keyFor("lesson"),
                  title: "",
                  classroom_count: "1",
                  duration_minutes: "60",
                },
              ],
            }
          : section,
      ),
    );
    setNotice(null);
  }

  function updateLesson(
    sectionKey: string,
    lessonKey: string,
    values: Partial<DraftLesson>,
  ) {
    setSections((current) =>
      current.map((section) =>
        section.key === sectionKey
          ? {
              ...section,
              lessons: section.lessons.map((lesson) =>
                lesson.key === lessonKey
                  ? { ...lesson, ...values }
                  : lesson,
              ),
            }
          : section,
      ),
    );
  }

  function removeLesson(sectionKey: string, lessonKey: string) {
    setSections((current) =>
      current.map((section) =>
        section.key === sectionKey
          ? {
              ...section,
              lessons: section.lessons.filter(
                (lesson) => lesson.key !== lessonKey,
              ),
            }
          : section,
      ),
    );
    setNotice(null);
  }

  function save() {
    setNotice(null);
    setError(null);

    const invalid = sections.some(
      (section) =>
        section.title.trim() === "" ||
        section.lessons.some((lesson) => lesson.title.trim() === ""),
    );

    if (invalid) {
      setError(t("instructor.bootcamps.editor.curriculumInvalid"));
      return;
    }

    saveMutation.mutate();
  }

  const lessonCount = sections.reduce(
    (total, section) => total + section.lessons.length,
    0,
  );

  return (
    <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionTitle
          title={t("instructor.bootcamps.editor.curriculumTitle")}
          description={t("instructor.bootcamps.editor.curriculumDesc")}
        />
        <span className="rounded-full bg-[#F7F7F7] px-3 py-1.5 text-[10px] font-bold text-[#3A3A3A]/50 dark:bg-[#101013] dark:text-white/50">
          {t("instructor.bootcamps.editor.curriculumLessons", {
            count: lessonCount,
          })}
        </span>
      </div>

      {notice && <Notice variant="success">{notice}</Notice>}
      {error && <Notice variant="error">{error}</Notice>}

      <div className="mt-6 space-y-3">
        {sections.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#3A3A3A]/12 px-4 py-8 text-center text-sm text-[#3A3A3A]/45 dark:border-white/12 dark:text-white/45">
            {t("instructor.bootcamps.editor.curriculumEmpty")}
          </p>
        ) : (
          sections.map((section, sectionIndex) => (
            <article
              key={section.key}
              className="rounded-2xl border border-[#3A3A3A]/8 bg-[#FCFCFC] p-4 dark:border-white/8 dark:bg-[#101013]"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F47822]/10 text-[11px] font-black text-[#F47822]">
                  {String(sectionIndex + 1).padStart(2, "0")}
                </span>
                <input
                  value={section.title}
                  onChange={(event) =>
                    updateSection(section.key, event.target.value)
                  }
                  placeholder={t(
                    "instructor.bootcamps.editor.curriculumSectionPlaceholder",
                  )}
                  aria-label={t(
                    "instructor.bootcamps.editor.curriculumSectionTitle",
                  )}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-sm font-semibold text-[#3A3A3A] outline-none transition focus:border-[#F47822] focus:ring-4 focus:ring-[#F47822]/8 dark:border-white/10 dark:bg-[#1b1b20] dark:text-[#ececef]"
                />
                <button
                  type="button"
                  onClick={() => removeSection(section.key)}
                  aria-label={t(
                    "instructor.bootcamps.editor.curriculumRemoveSection",
                  )}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 space-y-2 ps-11">
                {section.lessons.map((lesson) => (
                  <div
                    key={lesson.key}
                    className="grid gap-2 rounded-xl border border-[#3A3A3A]/7 bg-white p-3 dark:border-white/7 dark:bg-[#1b1b20] sm:grid-cols-[minmax(0,1fr)_110px_140px_auto]"
                  >
                    <input
                      value={lesson.title}
                      onChange={(event) =>
                        updateLesson(section.key, lesson.key, {
                          title: event.target.value,
                        })
                      }
                      placeholder={t(
                        "instructor.bootcamps.editor.curriculumLessonPlaceholder",
                      )}
                      aria-label={t(
                        "instructor.bootcamps.editor.curriculumLessonTitle",
                      )}
                      className="h-9 min-w-0 rounded-lg border border-[#3A3A3A]/10 bg-[#FCFCFC] px-2.5 text-xs text-[#3A3A3A] outline-none transition focus:border-[#F47822] dark:border-white/10 dark:bg-[#101013] dark:text-[#ececef]"
                    />

                    <label className="flex items-center gap-1.5">
                      <span className="sr-only">
                        {t(
                          "instructor.bootcamps.editor.curriculumClassrooms",
                        )}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={lesson.classroom_count}
                        onChange={(event) =>
                          updateLesson(section.key, lesson.key, {
                            classroom_count: event.target.value,
                          })
                        }
                        aria-label={t(
                          "instructor.bootcamps.editor.curriculumClassrooms",
                        )}
                        className="h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-[#FCFCFC] px-2.5 text-xs text-[#3A3A3A] outline-none transition focus:border-[#F47822] dark:border-white/10 dark:bg-[#101013] dark:text-[#ececef]"
                      />
                      <span className="shrink-0 text-[10px] text-[#3A3A3A]/35 dark:text-white/35">
                        {t(
                          "instructor.bootcamps.editor.curriculumClassroomsShort",
                        )}
                      </span>
                    </label>

                    <label className="flex items-center gap-1.5">
                      <span className="sr-only">
                        {t("instructor.bootcamps.editor.curriculumDuration")}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={lesson.duration_minutes}
                        onChange={(event) =>
                          updateLesson(section.key, lesson.key, {
                            duration_minutes: event.target.value,
                          })
                        }
                        aria-label={t(
                          "instructor.bootcamps.editor.curriculumDuration",
                        )}
                        className="h-9 w-full rounded-lg border border-[#3A3A3A]/10 bg-[#FCFCFC] px-2.5 text-xs text-[#3A3A3A] outline-none transition focus:border-[#F47822] dark:border-white/10 dark:bg-[#101013] dark:text-[#ececef]"
                      />
                      <span className="shrink-0 text-[10px] text-[#3A3A3A]/35 dark:text-white/35">
                        {t(
                          "instructor.bootcamps.editor.curriculumDurationShort",
                        )}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => removeLesson(section.key, lesson.key)}
                      aria-label={t(
                        "instructor.bootcamps.editor.curriculumRemoveLesson",
                      )}
                      className="grid h-9 w-9 place-items-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addLesson(section.key)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#F47822] transition hover:text-[#de6414]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("instructor.bootcamps.editor.curriculumAddLesson")}
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={addSection}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#F47822]/25 bg-[#FFF8F4] px-4 py-2.5 text-xs font-bold text-[#F47822] transition hover:bg-[#F47822] hover:text-white dark:bg-[#F47822]/10"
        >
          <Plus className="h-4 w-4" />
          {t("instructor.bootcamps.editor.curriculumAddSection")}
        </button>

        <button
          type="button"
          onClick={save}
          disabled={saveMutation.isPending || !dirty}
          data-testid="bootcamp-curriculum-save"
          className="inline-flex items-center gap-2 rounded-xl bg-[#3A3A3A] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#F47822] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveMutation.isPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saveMutation.isPending
            ? t("instructor.bootcamps.editor.curriculumSaving")
            : t("instructor.bootcamps.editor.curriculumSave")}
        </button>
      </div>
    </section>
  );
}

function StudentsPanel({ bootcampId }: { bootcampId: string }) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    "all" | BootcampRegistrationStatus
  >("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const registrations = useBootcampRegistrations(bootcampId, {
    per_page: 50,
    search: search || undefined,
    ...(status !== "all" ? { status } : {}),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      registrationId,
      nextStatus,
    }: {
      registrationId: string;
      nextStatus: BootcampRegistrationStatus;
    }) =>
      updateBootcampRegistrationStatus(
        bootcampId,
        registrationId,
        nextStatus,
      ),
    onMutate: ({ registrationId }) => {
      setUpdatingId(registrationId);
      setNotice(null);
      setActionError(null);
    },
    onSuccess: async () => {
      setNotice(t("instructor.bootcamps.editor.statusUpdated"));
      await queryClient.invalidateQueries({
        queryKey: ["instructor", "bootcamp", bootcampId, "registrations"],
      });
    },
    onError: (error) => {
      setNotice(null);
      setActionError(
        readError(error, t("instructor.bootcamps.editor.statusFail")),
      );
    },
    onSettled: () => setUpdatingId(null),
  });

  const rows = registrations.data?.data ?? [];

  return (
    <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,.04)] dark:border-white/8 dark:bg-[#1b1b20] sm:p-6">
      <SectionTitle
        title={t("instructor.bootcamps.editor.studentsTitle")}
        description={t("instructor.bootcamps.editor.studentsDesc")}
      />

      {notice && <Notice variant="success">{notice}</Notice>}
      {actionError && <Notice variant="error">{actionError}</Notice>}

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative block flex-1">
          <span className="sr-only">
            {t("instructor.bootcamps.editor.studentsSearch")}
          </span>
          <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/35 dark:text-white/35" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("instructor.bootcamps.editor.studentsSearch")}
            className="h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] ps-10 pe-3.5 text-xs text-[#3A3A3A] outline-none transition focus:border-[#F47822] dark:border-white/10 dark:bg-[#101013] dark:text-[#ececef]"
          />
        </label>

        <div className="flex flex-wrap gap-1 rounded-xl bg-[#F7F7F7] p-1 dark:bg-[#101013]">
          {(["all", "pending", "confirmed", "cancelled"] as const).map(
            (item) => (
              <button
                key={item}
                type="button"
                aria-pressed={status === item}
                onClick={() => setStatus(item)}
                className={[
                  "rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition",
                  status === item
                    ? "bg-white text-[#F47822] shadow-sm dark:bg-[#1b1b20]"
                    : "text-[#3A3A3A]/50 dark:text-white/50",
                ].join(" ")}
              >
                {item === "all"
                  ? t("instructor.bootcamps.editor.studentsAll")
                  : bootcampRegistrationStatusLabel(item, t)}
              </button>
            ),
          )}
        </div>
      </div>

      {registrations.isLoading ? (
        <div className="mt-5 space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl bg-black/5 dark:bg-white/5"
            />
          ))}
        </div>
      ) : registrations.isError ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-5 text-center dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            {t("instructor.bootcamps.editor.studentsError")}
          </p>
          <button
            type="button"
            onClick={() => void registrations.refetch()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#3A3A3A] px-3 py-2 text-[11px] font-bold text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t("instructor.bootcamps.retry")}
          </button>
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-[#3A3A3A]/12 px-4 py-10 text-center text-sm text-[#3A3A3A]/45 dark:border-white/12 dark:text-white/45">
          {t("instructor.bootcamps.editor.studentsEmpty")}
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[860px] border-separate border-spacing-y-2 text-left text-xs">
            <thead>
              <tr className="text-[9px] font-bold uppercase tracking-[.12em] text-[#3A3A3A]/38 dark:text-white/38">
                <th className="px-3 py-1 font-bold">
                  {t("instructor.bootcamps.editor.headers.name")}
                </th>
                <th className="px-3 py-1 font-bold">
                  {t("instructor.bootcamps.editor.headers.contact")}
                </th>
                <th className="px-3 py-1 font-bold">
                  {t("instructor.bootcamps.editor.headers.site")}
                </th>
                <th className="px-3 py-1 font-bold">
                  {t("instructor.bootcamps.editor.headers.payment")}
                </th>
                <th className="px-3 py-1 font-bold">
                  {t("instructor.bootcamps.editor.headers.session")}
                </th>
                <th className="px-3 py-1 font-bold">
                  {t("instructor.bootcamps.editor.headers.status")}
                </th>
                <th className="px-3 py-1 text-end font-bold">
                  {t("instructor.bootcamps.editor.headers.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((registration) => {
                const isUpdating = updatingId === registration.id;

                return (
                  <tr
                    key={registration.id}
                    className="bg-[#FCFCFC] dark:bg-[#101013]"
                  >
                    <td className="rounded-s-xl px-3 py-3">
                      <p className="font-bold text-[#3A3A3A] dark:text-[#ececef]">
                        {registration.first_name} {registration.last_name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#3A3A3A]/40 dark:text-white/40">
                        {formatBootcampDate(registration.created_at, i18n.language)}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-[#3A3A3A]/65 dark:text-white/65">
                        {registration.email}
                      </p>
                      <p dir="ltr" className="mt-0.5 text-[10px] text-[#3A3A3A]/40 dark:text-white/40 rtl:text-right">
                        {registration.phone}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-[#3A3A3A]/65 dark:text-white/65">
                      {bootcampSiteLabel(registration.site, t)}
                    </td>
                    <td className="px-3 py-3 text-[#3A3A3A]/65 dark:text-white/65">
                      {bootcampPaymentLabel(registration.payment_method, t)}
                    </td>
                    <td className="px-3 py-3 text-[#3A3A3A]/65 dark:text-white/65">
                      {registration.schedule
                        ? scheduleDates(registration.schedule, i18n.language)
                        : t("bootcampCommon.emptyValue")}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={[
                          "inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold",
                          registration.status === "confirmed"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : registration.status === "cancelled"
                              ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
                        ].join(" ")}
                      >
                        {bootcampRegistrationStatusLabel(registration.status, t)}
                      </span>
                    </td>
                    <td className="rounded-e-xl px-3 py-3">
                      <div className="flex justify-end gap-1.5">
                        {registration.status !== "confirmed" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              statusMutation.mutate({
                                registrationId: registration.id,
                                nextStatus: "confirmed",
                              })
                            }
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#F47822] px-2.5 text-[10px] font-bold text-white transition hover:bg-[#de6414] disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <LoaderCircle className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            {t("instructor.bootcamps.editor.confirm")}
                          </button>
                        )}

                        {registration.status !== "cancelled" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              statusMutation.mutate({
                                registrationId: registration.id,
                                nextStatus: "cancelled",
                              })
                            }
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 px-2.5 text-[10px] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                          >
                            <X className="h-3 w-3" />
                            {t("instructor.bootcamps.editor.cancel")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold text-[#3A3A3A] dark:text-[#ececef]">
        {title}
      </h2>
      <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/45 dark:text-white/45">
        {description}
      </p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  className = "",
  hint,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  hint?: string;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
>) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-[#3A3A3A]/75 dark:text-white/75">
        {label}
      </span>
      <input
        {...props}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3.5 text-sm text-[#3A3A3A] outline-none transition placeholder:text-[#3A3A3A]/30 focus:border-[#F47822] focus:bg-white focus:ring-4 focus:ring-[#F47822]/8 dark:border-white/10 dark:bg-[#101013] dark:text-[#ececef]"
      />
      {hint && (
        <span className="mt-1.5 block text-[11px] text-[#3A3A3A]/40 dark:text-white/40">
          {hint}
        </span>
      )}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  className = "",
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
} & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange"
>) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-[#3A3A3A]/75 dark:text-white/75">
        {label}
      </span>
      <textarea
        {...props}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
        className="mt-2 w-full resize-y rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3.5 py-3 text-sm leading-6 text-[#3A3A3A] outline-none transition focus:border-[#F47822] focus:bg-white focus:ring-4 focus:ring-[#F47822]/8 dark:border-white/10 dark:bg-[#101013] dark:text-[#ececef]"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#3A3A3A]/75 dark:text-white/75">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3.5 text-sm text-[#3A3A3A] outline-none transition focus:border-[#F47822] focus:bg-white focus:ring-4 focus:ring-[#F47822]/8 dark:border-white/10 dark:bg-[#101013] dark:text-[#ececef]"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function Notice({
  variant,
  children,
}: {
  variant: "success" | "error";
  children: string;
}) {
  const classes =
    variant === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
      : "border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400";

  return (
    <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${classes}`}>
      {children}
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="h-24 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="h-[620px] animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
        <div className="h-64 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
      </div>
    </div>
  );
}
