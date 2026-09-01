import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BellRing,
  BookOpen,
  ChartNoAxesCombined,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { adminApi } from "../api/adminApi";
import {
  AdminHeading,
  AdminPanel,
  ErrorAdminPage,
  LoadingAdminPage,
  Metric,
  SectionLink,
} from "../components/AdminUi";

export function AdminDashboardPage() {
  const dashboard = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: adminApi.dashboard,
    staleTime: 20_000,
  });
  if (dashboard.isLoading) return <LoadingAdminPage />;
  if (dashboard.isError || !dashboard.data)
    return <ErrorAdminPage onRetry={() => void dashboard.refetch()} />;
  const { statistics, administrator } = dashboard.data;
  const courses = statistics.courses;
  const courseTotal = Math.max(courses.total, 1);
  const pipeline = [
    ["Published", courses.published, "bg-emerald-500"],
    ["Awaiting review", courses.review, "bg-amber-400"],
    ["Draft", courses.draft, "bg-slate-400"],
    ["Archived", courses.archived, "bg-[#3A3A3A]/30"],
  ] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-6 lg:space-y-7">
      <section className="overflow-hidden rounded-3xl bg-[#3A3A3A] px-6 py-7 text-white shadow-[0_18px_45px_rgba(58,58,58,.14)] sm:px-8 sm:py-8">
        <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-end">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#F9A16C]">
              Platform command center
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              A clearer view of your learning platform.
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/62">
              Monitor people, learning operations, moderation, and platform
              health from one focused workspace.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-white/42">
              Signed in as
            </p>
            <p className="mt-1 text-sm font-semibold">{administrator.name}</p>
            <p className="mt-1 text-[11px] text-white/52">
              {administrator.roles.join(" · ")}
            </p>
          </div>
        </div>
        <div className="mt-8 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
          <HeroMetric
            label="Active learners"
            value={statistics.learning.active_learners}
            detail={`${statistics.users.students} student accounts`}
          />
          <HeroMetric
            label="Live courses"
            value={courses.published}
            detail={`${courses.review} awaiting review`}
          />
          <HeroMetric
            label="Completion health"
            value={`${statistics.learning.average_progress}%`}
            detail={`${statistics.enrollments.completed} completed enrollments`}
          />
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="All users"
          value={statistics.users.total}
          detail={`${statistics.users.active} active accounts`}
          icon={<Users className="h-4 w-4" />}
        />
        <Metric
          label="Course library"
          value={courses.total}
          detail={`${courses.published} published`}
          accent
          icon={<BookOpen className="h-4 w-4" />}
        />
        <Metric
          label="Enrollments"
          value={statistics.enrollments.total}
          detail={`${statistics.enrollments.active} currently active`}
          icon={<GraduationCap className="h-4 w-4" />}
        />
        <Metric
          label="Completed learners"
          value={statistics.learning.completed_learners}
          detail="Verified course progress"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <AdminPanel className="overflow-hidden p-0">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#3A3A3A] via-[#3A3A3A] to-[#542d18] px-5 py-5 text-white sm:px-6">
            <div className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full border-[18px] border-[#F47822]/20" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F47822] text-white shadow-[0_6px_16px_rgba(244,120,34,.3)]">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F9A16C]">
                    Catalog health
                  </p>
                  <h2 className="mt-1 font-semibold">
                    Course moderation pipeline
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-white/55">
                    Keep quality and publishing workflow visible.
                  </p>
                </div>
              </div>
              <SectionLink to="/admin/courses">Review courses</SectionLink>
            </div>
            <div className="relative mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/45">
                  Published coverage
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {Math.round((courses.published / courseTotal) * 100)}%
                </p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/75">
                {courses.total} total courses
              </span>
            </div>
          </div>
          <div className="grid gap-5 p-5 md:grid-cols-[.8fr_1.2fr] md:items-center sm:p-6">
            <div
              className="relative mx-auto grid h-36 w-36 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#F47822 ${Math.round((courses.published / courseTotal) * 100)}%, #F1F1F1 0)`,
              }}
            >
              <div className="grid h-[106px] w-[106px] place-items-center rounded-full bg-white text-center shadow-inner">
                <strong className="text-3xl font-semibold">
                  {courses.total}
                </strong>
                <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#3A3A3A]/42">
                  Courses
                </span>
              </div>
            </div>
            <div className="space-y-2.5">
              {pipeline.map(([label, value, color]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#3A3A3A]/7 bg-[#FCFCFC] px-3.5 py-2.5 transition-colors hover:border-[#F47822]/20 hover:bg-[#FFF8F4]"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#3A3A3A]/60">
                      {label}
                    </span>
                    <strong className="text-[#3A3A3A]">{value}</strong>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#3A3A3A]/7">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{
                        width: `${Math.round((value / courseTotal) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AdminPanel>
        <AdminPanel className="border-[#F47822]/18 bg-[#FFF8F4]">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">
            Operational focus
          </p>
          <h2 className="mt-2 text-lg font-semibold">
            The actions that need attention
          </h2>
          <div className="mt-5 space-y-3">
            <Focus
              icon={ClipboardCheck}
              label="Review queue"
              value={`${courses.review} courses`}
              href="/admin/courses"
            />
            <Focus
              icon={Users}
              label="Account health"
              value={`${statistics.users.active} active users`}
              href="/admin/users"
            />
            <Focus
              icon={BellRing}
              label="Platform communications"
              value="Send announcement"
              href="/admin/announcements"
            />
            <Focus
              icon={Activity}
              label="Audit trail"
              value="Review recent activity"
              href="/admin/activity"
            />
          </div>
        </AdminPanel>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">
                Learning outcomes
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                Platform learning pulse
              </h2>
            </div>
            <ChartNoAxesCombined className="h-5 w-5 text-[#F47822]" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Pulse
              label="Average progress"
              value={`${statistics.learning.average_progress}%`}
            />
            <Pulse label="Completed" value={statistics.enrollments.completed} />
            <Pulse label="In progress" value={statistics.enrollments.active} />
            <Pulse label="Cancelled" value={statistics.enrollments.cancelled} />
          </div>
          <div className="mt-5">
            <SectionLink to="/admin/analytics">Open analytics</SectionLink>
          </div>
        </AdminPanel>
        <AdminPanel>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">
                Trust & control
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                Admin workspace status
              </h2>
            </div>
            <Activity className="h-5 w-5 text-[#F47822]" />
          </div>
          <p className="mt-3 text-sm leading-6 text-[#3A3A3A]/50">
            Every management action is protected by verified administrator
            access and recorded in the platform audit trail.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {dashboard.data.modules.map((module) => (
              <span
                key={module}
                className="rounded-full bg-[#3A3A3A]/5 px-3 py-1.5 text-[10px] font-bold capitalize text-[#3A3A3A]/58"
              >
                {module}
              </span>
            ))}
          </div>
          <div className="mt-6">
            <SectionLink to="/admin/system">Check platform health</SectionLink>
          </div>
        </AdminPanel>
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
    <div className="rounded-2xl border border-white/10 bg-white/[.07] px-4 py-3.5 transition-colors hover:bg-white/[.11]">
      <p className="text-[10px] font-bold uppercase tracking-[.13em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] text-white/55">{detail}</p>
    </div>
  );
}
function Focus({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="group flex items-center gap-3 rounded-2xl border border-[#F47822]/12 bg-white px-3.5 py-3.5 shadow-[0_4px_12px_rgba(58,58,58,.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F47822]/35 hover:bg-[#FFFDFC] hover:shadow-[0_9px_20px_rgba(244,120,34,.11)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/35"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#FFF1E8] text-[#F47822] transition-colors group-hover:bg-[#F47822] group-hover:text-white">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold text-[#3A3A3A]">{label}</span>
        <span className="mt-0.5 block text-[11px] text-[#3A3A3A]/45">
          {value}
        </span>
      </span>
      <span className="text-[#3A3A3A]/25 transition group-hover:translate-x-0.5 group-hover:text-[#F47822]">
        →
      </span>
    </Link>
  );
}
function Pulse({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-[#FCFCFC] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#3A3A3A]/40">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
