import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Cpu,
  Plus,
  RefreshCw,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { InstructorStats } from "../components/InstructorStats";
import { useInstructorDashboard } from "../hooks/useInstructorDashboard";

export function InstructorDashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useInstructorDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900">
          {t("instructor.dashboard.errorTitle")}
        </h2>
        <p className="mt-2 text-sm text-red-700">
          {t("instructor.dashboard.errorDesc")}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(244,120,34,.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#de6414] hover:shadow-[0_12px_25px_rgba(244,120,34,.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/40"
        >
          <RefreshCw className="h-4 w-4" />
          {t("instructor.dashboard.retry")}
        </button>
      </div>
    );
  }

  const courseDistribution = [
    {
      label: t("instructor.dashboard.status.published"),
      value: data.statistics.published,
      color: "bg-emerald-500",
    },
    {
      label: t("instructor.dashboard.status.review"),
      value: data.statistics.review,
      color: "bg-amber-400",
    },
    { label: t("instructor.dashboard.status.draft"), value: data.statistics.draft, color: "bg-slate-400" },
    {
      label: t("instructor.dashboard.status.archived"),
      value: data.statistics.archived,
      color: "bg-[#3A3A3A]/30",
    },
  ];
  const courseTotal = Math.max(data.statistics.total, 1);
  const checklist = [
    {
      complete: data.statistics.published > 0,
      text: t("instructor.dashboard.checklist.publish"),
    },
    {
      complete: data.statistics.draft === 0 || data.statistics.total === 0,
      text: t("instructor.dashboard.checklist.drafts"),
    },
    {
      complete: data.students.total > 0,
      text: t("instructor.dashboard.checklist.welcome"),
    },
    {
      complete: data.learning.average_quiz_score > 0,
      text: t("instructor.dashboard.checklist.quiz"),
    },
    {
      complete: data.overview.average_progress > 0,
      text: t("instructor.dashboard.checklist.milestone"),
    },
    {
      complete: data.students.active > 0,
      text: t("instructor.dashboard.checklist.engaged"),
    },
    {
      complete: data.overview.completion_rate >= 50,
      text: t("instructor.dashboard.checklist.completion"),
    },
  ];
  const checklistDone = checklist.filter((item) => item.complete).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 lg:space-y-7">
      <section
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#2E2E2E] via-[#3A3A3A] to-[#2A2A2A] px-5 py-7 text-white shadow-[0_20px_50px_rgba(58,58,58,.18)] sm:px-8 sm:py-9"
        data-testid="instructor-hero"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#F47822]/25 blur-3xl rtl:-left-20 rtl:right-auto" />
          <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-[#8B5CF6]/12 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:48px_48px]" />
        </div>

        <div className="relative flex flex-col justify-between gap-8 xl:flex-row xl:items-start">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#F47822]/30 bg-[#F47822]/12 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-[#F9A16C]">
              <Sparkles className="h-3 w-3" />
              {t("instructor.dashboard.hero.eyebrow")}
            </p>

            <h1 className="mt-4 text-[1.7rem] font-black leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.65rem]">
              {t("instructor.dashboard.hero.title")}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/55 sm:text-[0.95rem]">
              {t("instructor.dashboard.hero.description")}
            </p>
          </div>

          <div
            className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:shrink-0"
            data-testid="instructor-hero-actions"
          >
            <Link
              to="/instructor/courses/new"
              data-testid="instructor-hero-create"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#F47822] to-[#ff8f45] px-5 text-sm font-black tracking-wide text-white shadow-[0_12px_28px_rgba(244,120,34,.35)] transition duration-200 hover:brightness-[1.06] hover:shadow-[0_16px_36px_rgba(244,120,34,.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#3A3A3A] active:scale-[0.98]"
            >
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-white/20 transition group-hover:bg-white/30">
                <Plus className="h-4 w-4" />
              </span>
              {t("instructor.dashboard.hero.create")}
            </Link>

            <Link
              to="/instructor/students"
              data-testid="instructor-hero-learners"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/18 bg-white/[0.08] px-5 text-sm font-bold tracking-wide text-white backdrop-blur-md transition duration-200 hover:border-white/35 hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-[0.98]"
            >
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-white/10 text-white/85 transition group-hover:bg-white/20 group-hover:text-white">
                <Users className="h-4 w-4" />
              </span>
              {t("instructor.dashboard.hero.learners")}
            </Link>

            <Link
              to="/instructor/simulator"
              data-testid="instructor-hero-simulator"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[0.1] px-5 text-sm font-bold tracking-wide text-white backdrop-blur-md transition duration-200 hover:border-white/40 hover:bg-white/[0.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-[0.98]"
            >
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#F47822] text-white transition group-hover:brightness-110">
                <Cpu className="h-4 w-4" />
              </span>
              {t("instructor.dashboard.hero.simulator", {
                defaultValue: "Simulator labs",
              })}
            </Link>
          </div>
        </div>

        <div className="relative mt-8 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
          <HeroMetric
            label={t("instructor.dashboard.hero.courses")}
            value={data.statistics.total}
            detail={t("instructor.dashboard.hero.coursesDetail", { count: data.statistics.published })}
          />
          <HeroMetric
            label={t("instructor.dashboard.hero.reached")}
            value={data.students.total}
            detail={t("instructor.dashboard.hero.reachedDetail", { count: data.students.active })}
          />
          <HeroMetric
            label={t("instructor.dashboard.hero.quality")}
            value={`${data.learning.average_quiz_score}%`}
            detail={t("instructor.dashboard.hero.qualityDetail")}
          />
        </div>
      </section>

      <InstructorStats data={data} />

      <section className="rounded-2xl border border-[#3A3A3A]/10 bg-[#3A3A3A] p-5 shadow-[0_10px_30px_rgba(58,58,58,.12)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822] text-white shadow-sm">
              <Cpu className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-[#F7F7F7]">{t("instructor.dashboard.simulator.title", { defaultValue: "Simulator Lab Builder" })}</h2>
              <p className="mt-1 max-w-xl text-sm leading-5 text-white/55">{t("instructor.dashboard.simulator.desc", { defaultValue: "Create different vehicles and fault environments for each of the 5 labs — Scanner, Multimeter, Oscilloscope, Location and Schematic. Students on that vehicle will see your custom problem." })}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  { id: "scanner", label: "Scanner", color: "#F47822" },
                  { id: "multimeter", label: "Multimeter", color: "#EAB308" },
                  { id: "oscilloscope", label: "Scope", color: "#22C55E" },
                  { id: "location", label: "Location", color: "#06B6D4" },
                  { id: "schematic", label: "Schematic", color: "#8B5CF6" },
                ].map((lab) => (
                  <span key={lab.id} className="rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide" style={{ color: lab.color, borderColor: `${lab.color}40`, background: `${lab.color}18` }}>{lab.label}</span>
                ))}
              </div>
            </div>
          </div>
          <Link
            to="/instructor/simulator"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-black text-white shadow-[0_8px_20px_rgba(244,120,34,.28)] transition hover:brightness-[1.06] hover:shadow-[0_12px_28px_rgba(244,120,34,.38)]"
          >
            {t("instructor.dashboard.simulator.cta", {
              defaultValue: "Open builder",
            })}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_10px_30px_rgba(58,58,58,.045)] sm:p-6">
          <SectionHeading
            icon={BookOpen}
            title={t("instructor.dashboard.pipeline.title")}
            subtitle={t("instructor.dashboard.pipeline.subtitle")}
            action={
              <Link
                to="/instructor/courses"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#F47822]"
              >
                {t("instructor.dashboard.pipeline.manage")} <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
              </Link>
            }
          />
          <div className="mt-6 grid gap-5 md:grid-cols-[.8fr_1.2fr] md:items-center">
            <div
              className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#F47822 ${Math.round((data.statistics.published / courseTotal) * 100)}%, #F2F2F2 0)`,
              }}
            >
              <div className="flex h-[106px] w-[106px] flex-col items-center justify-center rounded-full bg-white">
                <strong className="text-3xl font-semibold tracking-tight text-[#3A3A3A]">
                  {data.statistics.total}
                </strong>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#3A3A3A]/42">
                  {t("instructor.dashboard.pipeline.coursesLabel")}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {courseDistribution.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#3A3A3A]/60">
                      {item.label}
                    </span>
                    <span className="font-bold text-[#3A3A3A]">
                      {item.value}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#3A3A3A]/7">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{
                        width: `${Math.round((item.value / courseTotal) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="rounded-2xl border border-[#F47822]/20 bg-[#FFF8F4] p-5 sm:p-6">
          <SectionHeading
            icon={BarChart3}
            title={t("instructor.dashboard.pulse.title")}
            subtitle={t("instructor.dashboard.pulse.subtitle")}
          />
          <div className="mt-6 grid grid-cols-2 gap-3">
            <PulseCard
              label={t("instructor.dashboard.pulse.inProgress")}
              value={data.progress.in_progress}
              icon={Clock3}
            />
            <PulseCard
              label={t("instructor.dashboard.pulse.completed")}
              value={data.progress.completed}
              icon={CheckCircle2}
            />
            <PulseCard
              label={t("instructor.dashboard.pulse.newMonth")}
              value={data.students.new_this_month}
              icon={UserPlus}
            />
            <PulseCard
              label={t("instructor.dashboard.pulse.avgProgress")}
              value={`${data.overview.average_progress}%`}
              icon={BarChart3}
            />
          </div>
          <Link
            to="/instructor/students"
            className="mt-5 flex h-11 items-center justify-between rounded-xl border border-[#F47822]/15 bg-white px-4 text-xs font-bold text-[#3A3A3A] shadow-[0_5px_14px_rgba(58,58,58,.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F47822]/35 hover:bg-[#F47822] hover:text-white hover:shadow-[0_10px_22px_rgba(244,120,34,.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/35"
          >
            <span>{t("instructor.dashboard.pulse.review")}</span>
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
          </Link>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_10px_30px_rgba(58,58,58,.045)] sm:p-6">
          <SectionHeading
            icon={ClipboardCheck}
            title={t("instructor.dashboard.activity.title")}
            subtitle={t("instructor.dashboard.activity.subtitle")}
            action={
              <span className="rounded-full bg-[#F47822]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#F47822]">
                {t("instructor.dashboard.activity.latest", { count: data.recent_activity.length })}
              </span>
            }
          />
          {data.recent_activity.length ? (
            <div className="mt-5 divide-y divide-[#3A3A3A]/7">
              {data.recent_activity.slice(0, 6).map((activity, index) => (
                <ActivityRow
                  key={`${activity.type}-${activity.occurred_at}-${index}`}
                  activity={activity}
                />
              ))}
            </div>
          ) : (
            <EmptyActivity />
          )}
        </section>
        <section className="relative overflow-hidden rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_10px_30px_rgba(58,58,58,.045)] sm:p-6">
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">
                {t("instructor.dashboard.checklistCard.eyebrow")}
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-[#3A3A3A]">
                {t("instructor.dashboard.checklistCard.title")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/50">
                {t("instructor.dashboard.checklistCard.description")}
              </p>
            </div>
            <div className="shrink-0 rounded-xl border border-[#F47822]/15 bg-[#FFF8F4] px-3 py-2 text-center">
              <p className="text-lg font-bold leading-none text-[#F47822]">
                {checklistDone}/{checklist.length}
              </p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[.1em] text-[#3A3A3A]/45">
                {t("instructor.dashboard.checklistCard.complete")}
              </p>
            </div>
          </div>
          <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-[#3A3A3A]/8">
            <div
              className="h-full rounded-full bg-[#F47822] transition-[width] duration-500"
              style={{ width: `${(checklistDone / checklist.length) * 100}%` }}
            />
          </div>
          <div className="relative mt-4 space-y-2">
            {checklist.map((item) => (
              <ChecklistItem
                key={item.text}
                complete={item.complete}
                text={item.text}
              />
            ))}
          </div>
          <Link
            to="/instructor/courses"
            className="relative mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(244,120,34,.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#de6414] hover:shadow-[0_12px_26px_rgba(244,120,34,.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/35"
          >
            {t("instructor.dashboard.checklistCard.open")} <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
          </Link>
        </section>
      </div>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 backdrop-blur-sm transition hover:border-[#F47822]/30 hover:bg-white/[0.09]">
      <p className="text-[10px] font-black uppercase tracking-[.14em] text-white/40">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-black tracking-tight text-white sm:text-[1.65rem]">
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-4 text-white/45">{detail}</p>
    </div>
  );
}
function SectionHeading({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: typeof BookOpen;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-semibold text-[#3A3A3A]">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/45">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
function PulseCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Clock3;
}) {
  return (
    <div className="rounded-xl border border-[#F47822]/12 bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#3A3A3A]/40">
          {label}
        </p>
        <Icon className="h-3.5 w-3.5 text-[#F47822]" />
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight text-[#3A3A3A]">
        {value}
      </p>
    </div>
  );
}
function ChecklistItem({
  complete,
  text,
}: {
  complete: boolean;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#FCFCFC] px-3 py-3">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${complete ? "bg-emerald-100 text-emerald-600" : "bg-[#F47822]/10 text-[#F47822]"}`}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
      </span>
      <span
        className={`text-xs ${complete ? "text-[#3A3A3A]/45 line-through" : "font-medium text-[#3A3A3A]/70"}`}
      >
        {text}
      </span>
    </div>
  );
}
function ActivityRow({
  activity,
}: {
  activity: {
    type: string;
    student_name: string;
    course_title: string;
    description: string;
    score?: number;
    occurred_at: string | null;
  };
}) {
  const Icon =
    activity.type === "enrollment"
      ? UserPlus
      : activity.type === "course_completed"
        ? CheckCircle2
        : ClipboardCheck;
  const { t, i18n } = useTranslation();
  const date = activity.occurred_at
    ? new Intl.DateTimeFormat(i18n.language, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(activity.occurred_at))
    : t("instructor.dashboard.recently");
  return (
    <div className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-[#3A3A3A]">
          <span className="font-semibold">{activity.student_name}</span>
          <span className="text-[#3A3A3A]/60"> {activity.description} </span>
          <span className="font-medium">{activity.course_title}</span>
          {activity.score !== undefined && (
            <span className="text-[#3A3A3A]/60"> · {activity.score}%</span>
          )}
        </p>
        <p className="mt-1 text-[11px] text-[#3A3A3A]/40">{date}</p>
      </div>
    </div>
  );
}
function EmptyActivity() {
  const { t } = useTranslation();
  return (
    <div className="mt-5 rounded-xl border border-dashed border-[#3A3A3A]/12 bg-[#FCFCFC] px-5 py-8 text-center">
      <p className="text-sm font-medium text-[#3A3A3A]">
        {t("instructor.dashboard.activity.emptyTitle")}
      </p>
      <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/45">
        {t("instructor.dashboard.activity.emptyDesc")}
      </p>
    </div>
  );
}
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-72 animate-pulse rounded-3xl bg-black/5" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl bg-black/5"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl bg-black/5" />
        <div className="h-80 animate-pulse rounded-2xl bg-black/5" />
      </div>
    </div>
  );
}
