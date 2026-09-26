import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  BellRing,
  BookOpen,
  ChartNoAxesCombined,
  CheckCircle2,
  ClipboardCheck,
  FlaskConical,
  Gauge,
  GraduationCap,
  HeartPulse,
  Inbox,
  KeyRound,
  LifeBuoy,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  TrendingUp,
  Users,
  UsersRound,
  Wallet,
  Webhook,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { adminApi } from "../api/adminApi";
import {
  AdminPanel,
  ErrorAdminPage,
  LoadingAdminPage,
  Metric,
  SectionLink,
  Status,
} from "../components/AdminUi";

const OPTIONAL_STALE = 60_000;

export function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const dashboard = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: adminApi.dashboard,
    staleTime: 20_000,
  });
  const health = useQuery({
    queryKey: ["admin", "system", "health"],
    queryFn: adminApi.systemHealth,
    staleTime: OPTIONAL_STALE,
    retry: false,
  });
  const commerce = useQuery({
    queryKey: ["admin", "dashboard", "commerce"],
    queryFn: adminApi.commerceOverview,
    staleTime: OPTIONAL_STALE,
    retry: false,
  });
  const labs = useQuery({
    queryKey: ["admin", "dashboard", "labs"],
    queryFn: adminApi.simulatorAnalytics,
    staleTime: OPTIONAL_STALE,
    retry: false,
  });
  const diagnostics = useQuery({
    queryKey: ["admin", "dashboard", "diagnostics"],
    queryFn: adminApi.diagnosticAnalytics,
    staleTime: OPTIONAL_STALE,
    retry: false,
  });
  const risk = useQuery({
    queryKey: ["admin", "risk", "dashboard"],
    queryFn: adminApi.riskDashboard,
    staleTime: OPTIONAL_STALE,
    retry: false,
  });
  const security = useQuery({
    queryKey: ["admin", "security", "overview"],
    queryFn: adminApi.securityOverview,
    staleTime: OPTIONAL_STALE,
    retry: false,
  });
  const activity = useQuery({
    queryKey: ["admin", "dashboard", "activity", 6],
    queryFn: () => adminApi.activity({ per_page: 6 }),
    staleTime: 30_000,
    retry: false,
  });
  const tickets = useQuery({
    queryKey: ["admin", "dashboard", "openTickets", 5],
    queryFn: () => adminApi.supportTickets({ status: "open", per_page: 5 }),
    staleTime: 30_000,
    retry: false,
  });

  if (dashboard.isLoading) return <LoadingAdminPage />;
  if (dashboard.isError || !dashboard.data)
    return <ErrorAdminPage onRetry={() => void dashboard.refetch()} />;

  const { statistics, administrator, governance, modules, meta } = dashboard.data;
  const courses = statistics.courses;
  const users = statistics.users;
  const learning = statistics.learning;
  const courseTotal = Math.max(courses.total, 1);
  const nf = new Intl.NumberFormat(i18n.language);
  const num = (value: number | null | undefined) =>
    typeof value === "number" ? nf.format(value) : "—";
  const pct = (value: number | null | undefined) =>
    typeof value === "number" ? `${Math.round(value)}%` : "—";
  const when = (value: string | null | undefined) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(i18n.language, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };
  const pipeline = [
    [t("admin.dashboard.pipeline.published"), courses.published, "bg-emerald-500"],
    [t("admin.dashboard.pipeline.awaitingReview"), courses.review, "bg-amber-400"],
    [t("admin.dashboard.pipeline.draft"), courses.draft, "bg-slate-400"],
    [t("admin.dashboard.pipeline.archived"), courses.archived, "bg-[#3A3A3A]/30"],
  ] as const;
  const healthStatus = health.data?.status;
  const statusTone = !healthStatus
    ? "bg-white/12 text-white/75"
    : healthStatus === "operational"
      ? "bg-emerald-400/15 text-emerald-300"
      : healthStatus === "degraded"
        ? "bg-amber-400/15 text-amber-300"
        : "bg-red-400/15 text-red-300";
  const revenueMax = Math.max(1, ...(commerce.data?.revenue_14d ?? []).map((day) => day.total));

  return (
    <div className="mx-auto max-w-7xl space-y-6 lg:space-y-7" data-testid="admin-dashboard">
      <section className="overflow-hidden rounded-3xl bg-[#3A3A3A] px-6 py-8 text-white shadow-[0_18px_45px_rgba(58,58,58,.14)] sm:px-8 sm:py-9">
        <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-start">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#F9A16C]">
              {t("admin.dashboard.hero.eyebrow")}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("admin.dashboard.hero.title")}
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/70">{t("admin.dashboard.hero.description")}</p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold ${statusTone}`}
                data-testid="admin-dashboard-status"
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {healthStatus ? healthStatus : t("admin.dashboard.hero.statusLoading")}
              </span>
              <span className="rounded-full bg-white/[.09] px-3.5 py-1.5 text-xs font-semibold text-white/70">
                {t("admin.dashboard.hero.phase", { phase: meta.phase })}
              </span>
              <span className="rounded-full bg-white/[.09] px-3.5 py-1.5 text-xs font-semibold text-white/70">
                {meta.api_version}
              </span>
              <span className="rounded-full bg-white/[.09] px-3.5 py-1.5 text-xs font-semibold text-white/70">
                {t("admin.dashboard.hero.updated", { time: when(meta.generated_at) })}
              </span>
            </div>
          </div>
          <div className="flex w-full flex-col gap-4 xl:w-auto xl:min-w-[20rem]">
            <div className="rounded-2xl border border-white/12 bg-white/[.07] px-4 py-3.5">
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-white/60">
                {t("admin.dashboard.hero.signedInAs")}
              </p>
              <p className="mt-1.5 text-base font-semibold">{administrator.name}</p>
              <p className="mt-0.5 text-xs text-white/65">{administrator.email}</p>
              <p className="mt-2 text-xs font-bold text-[#F9A16C]">
                {administrator.roles.join(" · ")}
              </p>
            </div>
            <div>
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[.14em] text-white/60">
                {t("admin.dashboard.hero.quickActions")}
              </p>
              <div className="flex flex-wrap gap-2">
                <QuickAction to="/admin/announcements" icon={Megaphone} label={t("admin.dashboard.hero.announcement")} />
                <QuickAction to="/admin/system" icon={HeartPulse} label={t("admin.dashboard.hero.systemHealth")} />
                <QuickAction to="/admin/support" icon={LifeBuoy} label={t("admin.dashboard.hero.support")} />
                {governance && <QuickAction to="/admin/roles" icon={KeyRound} label={t("admin.dashboard.hero.roles")} />}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 grid gap-3 border-t border-white/12 pt-6 sm:grid-cols-2 xl:grid-cols-4">
          <HeroMetric
            label={t("admin.dashboard.hero.activeLearners")}
            value={learning.active_learners}
            detail={t("admin.dashboard.hero.studentAccounts", { count: users.students })}
          />
          <HeroMetric
            label={t("admin.dashboard.hero.liveCourses")}
            value={courses.published}
            detail={t("admin.dashboard.hero.awaitingReview", { count: courses.review })}
          />
          <HeroMetric
            label={t("admin.dashboard.hero.completionHealth")}
            value={`${learning.average_progress}%`}
            detail={t("admin.dashboard.hero.completedEnrollments", { count: statistics.enrollments.completed })}
          />
          <HeroMetric
            label={t("admin.dashboard.hero.newThisMonth")}
            value={users.new_this_month}
            detail={t("admin.dashboard.hero.accountsTotal", { count: users.total })}
          />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label={t("admin.dashboard.metrics.allUsers")}
          value={users.total}
          detail={t("admin.dashboard.metrics.activeAccounts", { count: users.active })}
          icon={<Users className="h-5 w-5" />}
        />
        <Metric
          label={t("admin.dashboard.metrics.students")}
          value={users.students}
          detail={t("admin.dashboard.metrics.rolesLine", {
            instructors: users.instructors,
            admins: users.administrators,
          })}
          icon={<UsersRound className="h-5 w-5" />}
        />
        <Metric
          label={t("admin.dashboard.metrics.enrollments")}
          value={statistics.enrollments.total}
          detail={t("admin.dashboard.metrics.currentlyActive", { count: statistics.enrollments.active })}
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <Metric
          label={t("admin.dashboard.metrics.completedLearners")}
          value={learning.completed_learners}
          detail={t("admin.dashboard.metrics.progressDetail", { value: learning.average_progress })}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <Metric
          label={t("admin.dashboard.metrics.library")}
          value={courses.total}
          detail={t("admin.dashboard.metrics.published", { count: courses.published })}
          accent
          icon={<BookOpen className="h-5 w-5" />}
        />
        {labs.isLoading ? (
          <CardSkeleton />
        ) : (
          !labs.isError &&
          labs.data && (
            <Metric
              label={t("admin.dashboard.metrics.sessions")}
              value={num(labs.data.totals.sessions)}
              detail={t("admin.dashboard.metrics.sessionsDetail", {
                value: Math.round(labs.data.totals.pass_rate ?? 0),
              })}
              icon={<FlaskConical className="h-5 w-5" />}
            />
          )
        )}
        {diagnostics.isLoading ? (
          <CardSkeleton />
        ) : (
          !diagnostics.isError &&
          diagnostics.data && (
            <Metric
              label={t("admin.dashboard.metrics.attempts")}
              value={num(diagnostics.data.total_attempts)}
              detail={t("admin.dashboard.metrics.attemptsDetail", {
                value: Math.round(diagnostics.data.pass_rate ?? 0),
              })}
              icon={<Gauge className="h-5 w-5" />}
            />
          )
        )}
        {commerce.isLoading ? (
          <CardSkeleton />
        ) : (
          !commerce.isError &&
          commerce.data && (
            <Metric
              label={t("admin.dashboard.metrics.revenue")}
              value={`${nf.format(commerce.data.gross_revenue)} ${commerce.data.currency}`}
              detail={t("admin.dashboard.metrics.revenueDetail", {
                value: nf.format(commerce.data.net_revenue),
                currency: commerce.data.currency,
              })}
              accent
              icon={<Wallet className="h-5 w-5" />}
            />
          )
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel data-testid="admin-dashboard-health">
          <PanelHead
            eyebrow={t("admin.dashboard.health.eyebrow")}
            title={t("admin.dashboard.health.title")}
            icon={HeartPulse}
            action={<SectionLink to="/admin/system">{t("admin.dashboard.health.open")}</SectionLink>}
          />
          {health.isLoading ? (
            <div className="mt-6 space-y-2">
              {[0, 1, 2].map((row) => (
                <div key={row} className="h-11 animate-pulse rounded-2xl bg-[#3A3A3A]/6" />
              ))}
            </div>
          ) : health.isError || !health.data ? (
            <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3.5 text-sm text-red-700" role="alert">
              {t("admin.dashboard.health.unavailable")}
            </p>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Status value={health.data.status} />
                <span className="text-sm text-[#3A3A3A]/55">
                  {t("admin.dashboard.health.checkedAt", { time: when(health.data.checked_at) })}
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {Object.entries(health.data.checks).map(([name, check]) => (
                  <div key={name} className="rounded-2xl bg-[#F7F7F8] px-4 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-semibold text-[#3A3A3A]">
                        {name.replaceAll("_", " ")}
                      </p>
                      <Status value={check.status} />
                    </div>
                    <p className="mt-1 truncate text-xs text-[#3A3A3A]/50">
                      {check.driver ?? check.connection ?? t("admin.dashboard.health.checksFallback")}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </AdminPanel>

        {governance ? (
          <AdminPanel className="border-[#F47822]/20 bg-[#FFFDFB]" data-testid="admin-dashboard-governance">
            <PanelHead
              eyebrow={t("admin.dashboard.governance.eyebrow")}
              title={t("admin.dashboard.governance.title")}
              icon={ShieldCheck}
              action={
                <Link
                  to="/admin/roles"
                  className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#E96D18]"
                >
                  <KeyRound className="h-3.5 w-3.5" /> {t("admin.dashboard.governance.manageRoles")}
                </Link>
              }
            />

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCell label={t("admin.dashboard.governance.superAdmins")} value={governance.staff.super_admins} />
              <StatCell label={t("admin.dashboard.governance.admins")} value={governance.staff.admins} />
              <StatCell label={t("admin.dashboard.governance.supportAgents")} value={governance.staff.support} />
              <StatCell label={t("admin.dashboard.governance.instructors")} value={governance.staff.instructors} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                to="/admin/support"
                className="flex items-center gap-3 rounded-2xl bg-[#F7F7F8] px-4 py-3.5 transition hover:bg-[#FFF1E8]"
              >
                <LifeBuoy className="h-4 w-4 shrink-0 text-[#F47822]" />
                <span className="flex-1 text-sm font-medium text-[#3A3A3A]/75">
                  {t("admin.dashboard.governance.escalatedTickets")}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    governance.escalations > 0 ? "bg-[#F47822] text-white" : "bg-[#3A3A3A]/8 text-[#3A3A3A]/60"
                  }`}
                >
                  {governance.escalations}
                </span>
              </Link>
              <Link
                to="/admin/commerce"
                className="flex items-center gap-3 rounded-2xl bg-[#F7F7F8] px-4 py-3.5 transition hover:bg-[#FFF1E8]"
              >
                <Webhook className="h-4 w-4 shrink-0 text-[#F47822]" />
                <span className="flex-1 text-sm font-medium text-[#3A3A3A]/75">
                  {t("admin.dashboard.governance.failedWebhooks")}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    governance.failed_webhooks > 0 ? "bg-red-500 text-white" : "bg-[#3A3A3A]/8 text-[#3A3A3A]/60"
                  }`}
                >
                  {governance.failed_webhooks}
                </span>
              </Link>
            </div>

            {governance.recent_privileged_actions.length > 0 && (
              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#3A3A3A]/55">
                  {t("admin.dashboard.governance.recentActions")}
                </p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {governance.recent_privileged_actions.map((action, index) => (
                    <li
                      key={`${action.event}-${index}`}
                      className="truncate rounded-xl bg-[#F7F7F8] px-3.5 py-2.5 text-xs"
                    >
                      <span className="font-semibold text-[#3A3A3A]">{action.event}</span>
                      <span className="text-[#3A3A3A]/50"> · {action.subject}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 border-t border-[#3A3A3A]/8 pt-4">
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#3A3A3A]/55">
                {t("admin.dashboard.governance.modules")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {modules.map((module) => (
                  <span
                    key={module}
                    className="rounded-full bg-[#3A3A3A]/6 px-3 py-1.5 text-[11px] font-semibold capitalize text-[#3A3A3A]/65"
                  >
                    {module}
                  </span>
                ))}
              </div>
            </div>
          </AdminPanel>
        ) : (
          <AdminPanel>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#F47822]">
                  {t("admin.dashboard.trust.eyebrow")}
                </p>
                <h2 className="mt-1.5 text-lg font-semibold text-[#3A3A3A] sm:text-xl">
                  {t("admin.dashboard.trust.title")}
                </h2>
              </div>
              <Activity className="h-5 w-5 text-[#F47822]" />
            </div>
            <p className="mt-3 text-sm leading-6 text-[#3A3A3A]/60">{t("admin.dashboard.trust.description")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {modules.map((module) => (
                <span
                  key={module}
                  className="rounded-full bg-[#3A3A3A]/6 px-3 py-1.5 text-[11px] font-semibold capitalize text-[#3A3A3A]/65"
                >
                  {module}
                </span>
              ))}
            </div>
            <div className="mt-6">
              <SectionLink to="/admin/system">{t("admin.dashboard.trust.checkHealth")}</SectionLink>
            </div>
          </AdminPanel>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <AdminPanel>
          <PanelHead
            eyebrow={t("admin.dashboard.pulse.eyebrow")}
            title={t("admin.dashboard.pulse.title")}
            icon={ChartNoAxesCombined}
            action={<SectionLink to="/admin/analytics">{t("admin.dashboard.pulse.openAnalytics")}</SectionLink>}
          />
          <div className="mt-6 grid grid-cols-2 gap-3">
            <StatCell label={t("admin.dashboard.pulse.avgProgress")} value={`${learning.average_progress}%`} />
            <StatCell label={t("admin.dashboard.pulse.completed")} value={statistics.enrollments.completed} />
            <StatCell label={t("admin.dashboard.pulse.inProgress")} value={statistics.enrollments.active} />
            <StatCell label={t("admin.dashboard.pulse.cancelled")} value={statistics.enrollments.cancelled} />
          </div>
          <div className="mt-5">
            <SectionLink to="/admin/enrollments">{t("admin.dashboard.pulse.openEnrollments")}</SectionLink>
          </div>
        </AdminPanel>

        {commerce.isLoading ? (
          <PanelSkeleton />
        ) : (
          !commerce.isError &&
          commerce.data && (
            <AdminPanel data-testid="admin-dashboard-commerce">
              <PanelHead
                eyebrow={t("admin.dashboard.commerce.eyebrow")}
                title={t("admin.dashboard.commerce.title")}
                icon={TrendingUp}
                action={<SectionLink to="/admin/commerce">{t("admin.dashboard.commerce.open")}</SectionLink>}
              />
              <div className="mt-6 flex h-20 items-end gap-1.5">
                {commerce.data.revenue_14d.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.date} · ${nf.format(day.total)} ${commerce.data?.currency ?? ""}`}
                    className="flex-1 rounded-t bg-[#F47822]/70 transition hover:bg-[#F47822]"
                    style={{ height: `${Math.max(8, Math.round((day.total / revenueMax) * 100))}%` }}
                  />
                ))}
              </div>
              <p className="mt-2.5 text-xs font-semibold text-[#3A3A3A]/55">
                {t("admin.dashboard.commerce.trend")}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <StatCell label={t("admin.dashboard.commerce.gross")} value={num(commerce.data.gross_revenue)} sub={commerce.data.currency} />
                <StatCell label={t("admin.dashboard.commerce.net")} value={num(commerce.data.net_revenue)} sub={commerce.data.currency} />
                <StatCell label={t("admin.dashboard.commerce.refunded")} value={num(commerce.data.refunded)} />
                <StatCell
                  label={t("admin.dashboard.commerce.subscriptions")}
                  value={num(commerce.data.active_subscriptions)}
                  sub={t("admin.dashboard.commerce.transactions", {
                    purchases: commerce.data.purchases,
                    pending: commerce.data.pending_transactions,
                    failed: commerce.data.failed_transactions,
                  })}
                />
              </div>
            </AdminPanel>
          )
        )}

        {labs.isLoading || diagnostics.isLoading ? (
          <PanelSkeleton />
        ) : (labs.isError || !labs.data) && (diagnostics.isError || !diagnostics.data) ? null : (
          <AdminPanel data-testid="admin-dashboard-labs">
            <PanelHead
              eyebrow={t("admin.dashboard.labs.eyebrow")}
              title={t("admin.dashboard.labs.title")}
              icon={FlaskConical}
            />
            <div className="mt-6 grid grid-cols-2 gap-3">
              {labs.data && (
                <StatCell
                  label={t("admin.dashboard.labs.sessions")}
                  value={num(labs.data.totals.sessions)}
                  sub={t("admin.dashboard.labs.passRate", { value: Math.round(labs.data.totals.pass_rate ?? 0) })}
                />
              )}
              {labs.data && <StatCell label={t("admin.dashboard.labs.students")} value={num(labs.data.totals.students)} />}
              {diagnostics.data && (
                <StatCell
                  label={t("admin.dashboard.labs.attempts")}
                  value={num(diagnostics.data.total_attempts)}
                  sub={t("admin.dashboard.labs.avgScore", { value: pct(diagnostics.data.avg_score) })}
                />
              )}
              {diagnostics.data && (
                <StatCell label={t("admin.dashboard.labs.scenarios")} value={num(diagnostics.data.total_scenarios)} />
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
              <SectionLink to="/admin/simulator">{t("admin.dashboard.labs.openSimulator")}</SectionLink>
              <SectionLink to="/admin/diagnostics">{t("admin.dashboard.labs.openDiagnostics")}</SectionLink>
            </div>
          </AdminPanel>
        )}

        {security.isLoading ? (
          <PanelSkeleton />
        ) : (
          !security.isError &&
          security.data && (
            <AdminPanel data-testid="admin-dashboard-security">
              <PanelHead
                eyebrow={t("admin.dashboard.security.eyebrow")}
                title={t("admin.dashboard.security.title")}
                icon={ShieldAlert}
                action={<SectionLink to="/admin/security">{t("admin.dashboard.security.open")}</SectionLink>}
              />
              <div className="mt-6 grid grid-cols-2 gap-3">
                <StatCell label={t("admin.dashboard.security.failedLogins")} value={num(security.data.failed_logins_24h)} />
                <StatCell label={t("admin.dashboard.security.activeSessions")} value={num(security.data.active_sessions)} />
                <StatCell label={t("admin.dashboard.security.suspended")} value={num(security.data.suspended_accounts)} />
                <StatCell label={t("admin.dashboard.security.adminActions")} value={num(security.data.admin_actions_24h)} />
              </div>
              <p className="mt-4 text-xs leading-5 text-[#3A3A3A]/55">
                {t("admin.dashboard.security.weekLine", {
                  failed: security.data.failed_logins_7d ?? 0,
                  locked: security.data.potentially_locked_accounts ?? 0,
                })}
              </p>
            </AdminPanel>
          )
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {risk.isLoading ? (
          <PanelSkeleton />
        ) : (
          !risk.isError &&
          risk.data && (
            <AdminPanel data-testid="admin-dashboard-risk">
              <PanelHead
                eyebrow={t("admin.dashboard.risk.eyebrow")}
                title={t("admin.dashboard.risk.title")}
                icon={AlertTriangle}
                action={<SectionLink to="/admin/risk">{t("admin.dashboard.risk.open")}</SectionLink>}
              />
              <div className="mt-6 space-y-2.5">
                <LevelRow label={t("admin.dashboard.risk.levels.critical")} value={risk.data.by_level.critical} dot="bg-red-500" />
                <LevelRow label={t("admin.dashboard.risk.levels.high")} value={risk.data.by_level.high} dot="bg-[#F47822]" />
                <LevelRow label={t("admin.dashboard.risk.levels.medium")} value={risk.data.by_level.medium} dot="bg-amber-400" />
                <LevelRow label={t("admin.dashboard.risk.levels.low")} value={risk.data.by_level.low} dot="bg-emerald-500" />
              </div>
              <div className="mt-5 space-y-2.5">
                <LinkRow label={t("admin.dashboard.risk.openRisks")} value={risk.data.by_status.open} to="/admin/risk" />
                <LinkRow
                  label={t("admin.dashboard.risk.overdueReviews")}
                  value={risk.data.overdue_reviews}
                  to="/admin/risk"
                  warn={risk.data.overdue_reviews > 0}
                />
                <LinkRow
                  label={t("admin.dashboard.risk.failedControls")}
                  value={risk.data.failed_controls}
                  to="/admin/risk"
                  warn={risk.data.failed_controls > 0}
                />
              </div>
            </AdminPanel>
          )
        )}

        {tickets.isLoading ? (
          <PanelSkeleton />
        ) : (
          !tickets.isError &&
          tickets.data && (
            <AdminPanel data-testid="admin-dashboard-support">
              <PanelHead
                eyebrow={t("admin.dashboard.support.eyebrow")}
                title={t("admin.dashboard.support.title")}
                icon={Ticket}
                action={<SectionLink to="/admin/support">{t("admin.dashboard.support.open")}</SectionLink>}
              />
              <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#FFF8F4] px-4 py-3.5">
                <span className="text-sm font-medium text-[#3A3A3A]/70">{t("admin.dashboard.support.total")}</span>
                <strong className="text-2xl font-semibold text-[#F47822]">
                  {nf.format(tickets.data.meta.total)}
                </strong>
              </div>
              {tickets.data.data.length === 0 ? (
                <p className="mt-4 text-sm text-[#3A3A3A]/55">{t("admin.dashboard.support.empty")}</p>
              ) : (
                <ul className="mt-4 divide-y divide-[#3A3A3A]/8">
                  {tickets.data.data.slice(0, 4).map((ticket) => (
                    <li key={ticket.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#3A3A3A]">{ticket.subject}</p>
                        <p className="mt-0.5 truncate text-xs text-[#3A3A3A]/50">
                          {ticket.user} · {ticket.category}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          ticket.overdue
                            ? "bg-red-50 text-red-700"
                            : ticket.priority === "high" || ticket.priority === "urgent"
                              ? "bg-[#FFF1E8] text-[#C25609]"
                              : "bg-[#3A3A3A]/6 text-[#3A3A3A]/65"
                        }`}
                      >
                        {ticket.overdue ? t("admin.dashboard.support.overdue") : ticket.priority}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminPanel>
          )
        )}

        {activity.isLoading ? (
          <PanelSkeleton />
        ) : (
          !activity.isError &&
          activity.data && (
            <AdminPanel data-testid="admin-dashboard-activity">
              <PanelHead
                eyebrow={t("admin.dashboard.activityFeed.eyebrow")}
                title={t("admin.dashboard.activityFeed.title")}
                icon={Inbox}
                action={<SectionLink to="/admin/activity">{t("admin.dashboard.activityFeed.open")}</SectionLink>}
              />
              {activity.data.data.length === 0 ? (
                <p className="mt-6 text-sm text-[#3A3A3A]/55">{t("admin.dashboard.activityFeed.empty")}</p>
              ) : (
                <ul className="mt-5 divide-y divide-[#3A3A3A]/8">
                  {activity.data.data.map((entry) => (
                    <li key={entry.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#3A3A3A]">{entry.event}</p>
                        <p className="mt-0.5 truncate text-xs text-[#3A3A3A]/50">
                          {entry.actor?.name ?? t("admin.dashboard.activityFeed.system")} · {entry.target.type}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-[#3A3A3A]/50">{when(entry.occurred_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminPanel>
          )
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <AdminPanel className="overflow-hidden p-0">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#3A3A3A] via-[#3A3A3A] to-[#542d18] px-5 py-5 text-white sm:px-6">
            <div className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full border-[18px] border-[#F47822]/20" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex gap-3.5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#F47822] text-white shadow-[0_6px_16px_rgba(244,120,34,.3)]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#F9A16C]">
                    {t("admin.dashboard.catalog.eyebrow")}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold sm:text-xl">{t("admin.dashboard.catalog.title")}</h2>
                  <p className="mt-1 text-sm leading-6 text-white/65">{t("admin.dashboard.catalog.description")}</p>
                </div>
              </div>
              <SectionLink to="/admin/courses">{t("admin.dashboard.catalog.review")}</SectionLink>
            </div>
            <div className="relative mt-5 flex items-center justify-between gap-4 border-t border-white/12 pt-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.14em] text-white/60">
                  {t("admin.dashboard.catalog.coverage")}
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {Math.round((courses.published / courseTotal) * 100)}%
                </p>
              </div>
              <span className="rounded-full bg-white/12 px-3.5 py-1.5 text-xs font-bold text-white/85">
                {t("admin.dashboard.catalog.totalCourses", { count: courses.total })}
              </span>
            </div>
          </div>
          <div className="grid gap-6 p-6 md:grid-cols-[.8fr_1.2fr] md:items-center">
            <div
              className="relative mx-auto grid h-36 w-36 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#F47822 ${Math.round((courses.published / courseTotal) * 100)}%, #F1F1F1 0)`,
              }}
            >
              <div className="grid h-[106px] w-[106px] place-items-center rounded-full bg-white text-center shadow-inner">
                <strong className="text-3xl font-semibold">{courses.total}</strong>
                <span className="text-[11px] font-bold uppercase tracking-[.12em] text-[#3A3A3A]/55">
                  {t("admin.dashboard.catalog.courses")}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {pipeline.map(([label, value, color]) => (
                <div
                  key={label}
                  className="rounded-2xl bg-[#F7F7F8] px-4 py-3 transition-colors hover:bg-[#FFF8F4]"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[#3A3A3A]/70">{label}</span>
                    <strong className="text-[#3A3A3A]">{value}</strong>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#3A3A3A]/8">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${Math.round((value / courseTotal) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AdminPanel>
        <AdminPanel className="border-[#F47822]/18 bg-[#FFF8F4]">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#F47822]">
            {t("admin.dashboard.focus.eyebrow")}
          </p>
          <h2 className="mt-1.5 text-lg font-semibold text-[#3A3A3A] sm:text-xl">
            {t("admin.dashboard.focus.title")}
          </h2>
          <div className="mt-5 space-y-3">
            <Focus
              icon={ClipboardCheck}
              label={t("admin.dashboard.focus.reviewQueue")}
              value={t("admin.dashboard.focus.reviewQueueValue", { count: courses.review })}
              href="/admin/courses"
            />
            <Focus
              icon={Users}
              label={t("admin.dashboard.focus.accountHealth")}
              value={t("admin.dashboard.focus.accountHealthValue", { count: users.active })}
              href="/admin/users"
            />
            <Focus
              icon={BellRing}
              label={t("admin.dashboard.focus.communications")}
              value={t("admin.dashboard.focus.sendAnnouncement")}
              href="/admin/announcements"
            />
            <Focus
              icon={Activity}
              label={t("admin.dashboard.focus.audit")}
              value={t("admin.dashboard.focus.reviewActivity")}
              href="/admin/activity"
            />
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}

function PanelHead({
  eyebrow,
  title,
  icon: Icon,
  action,
}: {
  eyebrow: string;
  title: string;
  icon: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex gap-3.5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#FFF1E8] text-[#F47822]">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#F47822]">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold text-[#3A3A3A] sm:text-xl">{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}

function StatCell({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl bg-[#F7F7F8] px-4 py-3.5">
      <p className="text-xs font-semibold leading-5 text-[#3A3A3A]/65">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-[#3A3A3A]">{value}</p>
      {sub && <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/55">{sub}</p>}
    </div>
  );
}

function CardSkeleton() {
  return <div className="h-32 animate-pulse rounded-2xl bg-[#3A3A3A]/6" />;
}

function PanelSkeleton() {
  return <div className="h-64 animate-pulse rounded-2xl bg-[#3A3A3A]/6" />;
}

function LevelRow({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#F7F7F8] px-4 py-3">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
      <span className="text-sm font-medium text-[#3A3A3A]/70">{label}</span>
      <strong className="ms-auto text-lg font-semibold text-[#3A3A3A]">{value}</strong>
    </div>
  );
}

function LinkRow({ label, value, to, warn = false }: { label: string; value: number; to: string; warn?: boolean }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 rounded-2xl bg-[#F7F7F8] px-4 py-3 transition-colors hover:bg-[#FFF1E8]"
    >
      <span className="text-sm font-medium text-[#3A3A3A]/70">{label}</span>
      <strong className={`text-base font-semibold ${warn ? "text-[#F47822]" : "text-[#3A3A3A]"}`}>{value}</strong>
    </Link>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[.08] px-3.5 py-2.5 text-xs font-semibold text-white/85 transition hover:border-[#F47822]/60 hover:bg-[#F47822] hover:text-white"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
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
    <div className="rounded-2xl border border-white/12 bg-white/[.08] px-4 py-4 transition-colors hover:bg-white/[.12]">
      <p className="text-xs font-semibold leading-5 text-white/70">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs leading-5 text-white/65">{detail}</p>
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
      className="group flex items-center gap-3.5 rounded-2xl border border-[#F47822]/12 bg-white px-4 py-3.5 shadow-[0_4px_12px_rgba(58,58,58,.03)] transition-colors hover:border-[#F47822]/35 hover:bg-[#FFFDFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47822]/35"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FFF1E8] text-[#F47822] transition-colors group-hover:bg-[#F47822] group-hover:text-white">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#3A3A3A]">{label}</span>
        <span className="mt-0.5 block truncate text-xs text-[#3A3A3A]/55">{value}</span>
      </span>
      <span className="text-[#3A3A3A]/35 transition group-hover:text-[#F47822] rtl:-scale-x-100">→</span>
    </Link>
  );
}
