import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FilePlus2,
  RefreshCw,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { InstructorStats } from "../components/InstructorStats";
import { useInstructorDashboard } from "../hooks/useInstructorDashboard";

export function InstructorDashboardPage() {
  const { data, isLoading, isError, refetch } = useInstructorDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900">
          Unable to load instructor dashboard
        </h2>
        <p className="mt-2 text-sm text-red-700">
          We couldn't retrieve your teaching insights.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(244,120,34,.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#de6414] hover:shadow-[0_12px_25px_rgba(244,120,34,.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/40"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }

  const courseDistribution = [
    {
      label: "Published",
      value: data.statistics.published,
      color: "bg-emerald-500",
    },
    {
      label: "In review",
      value: data.statistics.review,
      color: "bg-amber-400",
    },
    { label: "Draft", value: data.statistics.draft, color: "bg-slate-400" },
    {
      label: "Archived",
      value: data.statistics.archived,
      color: "bg-[#3A3A3A]/30",
    },
  ];
  const courseTotal = Math.max(data.statistics.total, 1);
  const checklist = [
    {
      complete: data.statistics.published > 0,
      text: "Publish a course learners can enroll in",
    },
    {
      complete: data.statistics.draft === 0 || data.statistics.total === 0,
      text: "Review unfinished course drafts",
    },
    {
      complete: data.students.total > 0,
      text: "Welcome your first enrolled learner",
    },
    {
      complete: data.learning.average_quiz_score > 0,
      text: "Add a checkpoint quiz for learners",
    },
    {
      complete: data.overview.average_progress > 0,
      text: "Track your first learner milestone",
    },
    {
      complete: data.students.active > 0,
      text: "Keep an active learner engaged",
    },
    {
      complete: data.overview.completion_rate >= 50,
      text: "Reach a 50% course completion rate",
    },
  ];
  const checklistDone = checklist.filter((item) => item.complete).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 lg:space-y-7">
      <section className="overflow-hidden rounded-3xl bg-[#3A3A3A] px-6 py-7 text-white shadow-[0_18px_45px_rgba(58,58,58,.14)] sm:px-8 sm:py-8">
        <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-end">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#F9A16C]">
              Teaching command center
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Build learning experiences that move people forward.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/62">
              Keep a close eye on course health, learner momentum, and the
              milestones that matter across your teaching library.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/instructor/courses/new"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#de6414] hover:shadow-[0_13px_28px_rgba(244,120,34,.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <FilePlus2 className="h-4 w-4" />
              Create course
            </Link>
            <Link
              to="/instructor/students"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/[.06] px-4 text-xs font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/[.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <Users className="h-4 w-4" />
              View learners
            </Link>
          </div>
        </div>
        <div className="mt-8 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
          <HeroMetric
            label="Courses managed"
            value={data.statistics.total}
            detail={`${data.statistics.published} live to learners`}
          />
          <HeroMetric
            label="Learners reached"
            value={data.students.total}
            detail={`${data.students.active} active right now`}
          />
          <HeroMetric
            label="Teaching quality"
            value={`${data.learning.average_quiz_score}%`}
            detail="Average checkpoint score"
          />
        </div>
      </section>

      <InstructorStats data={data} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_10px_30px_rgba(58,58,58,.045)] sm:p-6">
          <SectionHeading
            icon={BookOpen}
            title="Course pipeline"
            subtitle="A real-time view of your course publication workflow."
            action={
              <Link
                to="/instructor/courses"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#F47822]"
              >
                Manage courses <ArrowRight className="h-3.5 w-3.5" />
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
                  Courses
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
            title="Learning pulse"
            subtitle="How learners are moving through your teaching."
          />
          <div className="mt-6 grid grid-cols-2 gap-3">
            <PulseCard
              label="In progress"
              value={data.progress.in_progress}
              icon={Clock3}
            />
            <PulseCard
              label="Completed"
              value={data.progress.completed}
              icon={CheckCircle2}
            />
            <PulseCard
              label="New this month"
              value={data.students.new_this_month}
              icon={UserPlus}
            />
            <PulseCard
              label="Avg. progress"
              value={`${data.overview.average_progress}%`}
              icon={BarChart3}
            />
          </div>
          <Link
            to="/instructor/students"
            className="mt-5 flex h-11 items-center justify-between rounded-xl border border-[#F47822]/15 bg-white px-4 text-xs font-bold text-[#3A3A3A] shadow-[0_5px_14px_rgba(58,58,58,.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F47822]/35 hover:bg-[#F47822] hover:text-white hover:shadow-[0_10px_22px_rgba(244,120,34,.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/35"
          >
            <span>Review learner progress</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_10px_30px_rgba(58,58,58,.045)] sm:p-6">
          <SectionHeading
            icon={ClipboardCheck}
            title="Recent learning activity"
            subtitle="Enrollments, course milestones, and quiz performance from your learners."
            action={
              <span className="rounded-full bg-[#F47822]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#F47822]">
                {data.recent_activity.length} latest
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
                Teaching checklist
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-[#3A3A3A]">
                Keep your library moving
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/50">
                A few focused steps to turn your content into a stronger
                learning journey.
              </p>
            </div>
            <div className="shrink-0 rounded-xl border border-[#F47822]/15 bg-[#FFF8F4] px-3 py-2 text-center">
              <p className="text-lg font-bold leading-none text-[#F47822]">
                {checklistDone}/{checklist.length}
              </p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[.1em] text-[#3A3A3A]/45">
                Complete
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
            Open course library <ArrowRight className="h-3.5 w-3.5" />
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
    <div className="rounded-xl bg-white/[.07] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[.13em] text-white/40">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-[11px] text-white/50">{detail}</p>
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
  const date = activity.occurred_at
    ? new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(activity.occurred_at))
    : "Recently";
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
  return (
    <div className="mt-5 rounded-xl border border-dashed border-[#3A3A3A]/12 bg-[#FCFCFC] px-5 py-8 text-center">
      <p className="text-sm font-medium text-[#3A3A3A]">
        Learning activity will appear here
      </p>
      <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/45">
        Student enrollments, milestones, and quiz submissions will populate this
        feed.
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
