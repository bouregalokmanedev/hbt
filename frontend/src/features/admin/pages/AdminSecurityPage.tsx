import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, CircleAlert, Download, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import { adminApi } from "../api/adminApi";
import {
  AdminHeading,
  AdminPanel,
  ErrorAdminPage,
  LoadingAdminPage,
  PageControls,
} from "../components/AdminUi";

export function AdminSecurityPage() {
  const { t, i18n } = useTranslation();
  const client = useQueryClient();
  const [authPage, setAuthPage] = useState(1);
  const [authEvent, setAuthEvent] = useState("");
  const [authSearch, setAuthSearch] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionActive, setSessionActive] = useState("");
  const [revokedId, setRevokedId] = useState<string | null>(null);

  const overview = useQuery({ queryKey: ["admin", "security", "overview"], queryFn: adminApi.securityOverview });
  const authLogs = useQuery({
    queryKey: ["admin", "security", "auth-logs", authPage, authEvent, authSearch, authSuccess],
    queryFn: () =>
      adminApi.securityAuthLogs({
        event: authEvent || undefined,
        search: authSearch || undefined,
        successful: authSuccess || undefined,
        page: authPage,
        per_page: 12,
      }),
  });
  const sessions = useQuery({
    queryKey: ["admin", "security", "sessions", sessionPage, sessionSearch, sessionActive],
    queryFn: () =>
      adminApi.securitySessions({
        search: sessionSearch || undefined,
        active: sessionActive || undefined,
        page: sessionPage,
        per_page: 10,
      }),
  });
  const alerts = useQuery({ queryKey: ["admin", "security", "alerts"], queryFn: adminApi.securityAlerts });

  const revoke = async (id: string) => {
    setRevokedId(id);
    try {
      await adminApi.revokeSecuritySession(id);
      await client.invalidateQueries({ queryKey: ["admin", "security"] });
    } finally {
      setRevokedId(null);
    }
  };

  if (overview.isLoading) return <LoadingAdminPage />;
  if (overview.isError || !overview.data) return <ErrorAdminPage onRetry={() => void overview.refetch()} />;
  const stats = overview.data;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <AdminHeading
        eyebrow={t("admin.security.eyebrow")}
        title={t("admin.security.title")}
        description={t("admin.security.description")}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={t("admin.security.kpi.failedLogins")} value={stats.failed_logins_24h} hint={t("admin.security.kpi.in7Days", { count: stats.failed_logins_7d })} tone="red" />
        <Kpi label={t("admin.security.kpi.successfulLogins")} value={stats.successful_logins_24h} hint={t("admin.security.kpi.verifiedSignins")} tone="green" />
        <Kpi label={t("admin.security.kpi.activeSessions")} value={stats.active_sessions} hint={t("admin.security.kpi.totalSuffix", { count: stats.total_sessions })} tone="brand" />
        <Kpi label={t("admin.security.kpi.suspendedAccounts")} value={stats.suspended_accounts} hint={t("admin.security.kpi.targetedSuffix", { count: stats.potentially_locked_accounts })} tone="dark" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label={t("admin.security.kpi.adminActions")} value={stats.admin_actions_24h} hint={t("admin.security.kpi.auditTrail")} tone="dark" />
        <Kpi label={t("admin.security.kpi.passwordChanges")} value={stats.password_changes_7d} hint={t("admin.security.kpi.credentialHygiene")} tone="brand" />
        <Kpi label={t("admin.security.kpi.roleChanges")} value={stats.role_changes_7d} hint={t("admin.security.kpi.privilegeMoves")} tone="red" />
      </div>

      <AdminPanel>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">{t("admin.security.alerts.tag")}</p>
            <h2 className="mt-2 text-lg font-semibold">{t("admin.security.alerts.title")}</h2>
          </div>
          <ShieldAlert className="h-5 w-5 text-[#F47822]" />
        </div>
        {alerts.isLoading && <p className="mt-3 text-sm text-[#3A3A3A]/50">{t("admin.security.alerts.checking")}</p>}
        {alerts.data && alerts.data.length === 0 && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <Activity className="h-4 w-4" /> {t("admin.security.alerts.allClear")}
          </p>
        )}
        {alerts.data && alerts.data.length > 0 && (
          <ul className="mt-4 space-y-2.5">
            {alerts.data.map((alert, index) => (
              <li
                key={`${alert.title}-${index}`}
                className={`rounded-2xl border px-4 py-3 ${alert.severity === "critical" ? "border-red-200 bg-red-50" : alert.severity === "warning" ? "border-amber-200 bg-amber-50" : "border-[#3A3A3A]/10 bg-[#FCFCFC]"}`}
              >
                <p className="flex items-center gap-2 text-xs font-bold text-[#3A3A3A]">
                  <CircleAlert
                    className={`h-4 w-4 ${alert.severity === "critical" ? "text-red-500" : alert.severity === "warning" ? "text-amber-500" : "text-[#3A3A3A]/40"}`}
                  />
                  {alert.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/60">{alert.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>

      <AdminPanel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">{t("admin.security.auth.tag")}</p>
            <h2 className="mt-2 text-lg font-semibold">{t("admin.security.auth.title")}</h2>
          </div>
          <a href="/admin/activity" className="text-xs font-bold text-[#F47822] hover:underline">
            {t("admin.security.auth.openAudit")}
          </a>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={authSearch}
            onChange={(event) => {
              setAuthSearch(event.target.value);
              setAuthPage(1);
            }}
            placeholder={t("admin.security.auth.searchPh")}
            className="h-10 min-w-[180px] flex-1 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-xs outline-none focus:border-[#F47822]"
          />
          <select
            value={authEvent}
            onChange={(event) => {
              setAuthEvent(event.target.value);
              setAuthPage(1);
            }}
            className="h-10 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-xs font-semibold outline-none focus:border-[#F47822]"
          >
            <option value="">{t("admin.security.auth.allEvents")}</option>
            <option value="login.success">{t("admin.security.auth.loginSuccess")}</option>
            <option value="login.failed">{t("admin.security.auth.loginFailed")}</option>
            <option value="login.mfa_challenge">{t("admin.security.auth.mfaChallenge")}</option>
            <option value="logout">{t("admin.security.auth.logout")}</option>
          </select>
          <select
            value={authSuccess}
            onChange={(event) => {
              setAuthSuccess(event.target.value);
              setAuthPage(1);
            }}
            className="h-10 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-xs font-semibold outline-none focus:border-[#F47822]"
          >
            <option value="">{t("admin.security.auth.anyOutcome")}</option>
            <option value="true">{t("admin.security.auth.successful")}</option>
            <option value="false">{t("admin.security.auth.failed")}</option>
          </select>
          {(authSearch || authEvent || authSuccess) && (
            <button
              type="button"
              onClick={() => {
                setAuthSearch("");
                setAuthEvent("");
                setAuthSuccess("");
                setAuthPage(1);
              }}
              className="h-10 rounded-xl border border-[#3A3A3A]/10 px-4 text-xs font-bold text-[#3A3A3A]/60"
            >
              {t("admin.security.auth.clear")}
            </button>
          )}
        </div>

        {authLogs.isLoading ? (
          <p className="mt-4 text-sm text-[#3A3A3A]/50">{t("admin.security.auth.loading")}</p>
        ) : authLogs.data ? (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left rtl:text-right">
                <thead className="border-b border-[#3A3A3A]/8 text-[10px] font-bold uppercase tracking-[.13em] text-[#3A3A3A]/40">
                  <tr>
                    <th className="pb-3">{t("admin.security.auth.headers.account")}</th>
                    <th className="pb-3">{t("admin.security.auth.headers.event")}</th>
                    <th className="pb-3">{t("admin.security.auth.headers.outcome")}</th>
                    <th className="pb-3">{t("admin.security.auth.headers.network")}</th>
                    <th className="pb-3">{t("admin.security.auth.headers.when")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A3A3A]/7">
                  {authLogs.data.data.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[#FCFCFC]">
                      <td className="py-3">
                        <p className="text-xs font-bold text-[#3A3A3A]">{entry.email ?? "—"}</p>
                        <p className="text-[11px] text-[#3A3A3A]/45">{entry.user?.name ?? entry.browser ?? ""}</p>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-[#3A3A3A]/60">{entry.event}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${entry.successful ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                          {entry.successful ? t("admin.security.auth.success") : entry.failure_reason ?? t("admin.security.auth.failedFallback")}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-[#3A3A3A]/50">{entry.ip_address ?? "—"}</td>
                      <td className="py-3 text-[11px] text-[#3A3A3A]/45">
                        {entry.created_at ? new Date(entry.created_at).toLocaleString(i18n.language) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <PageControls page={authLogs.data.meta.current_page} lastPage={authLogs.data.meta.last_page} onPage={setAuthPage} />
            </div>
          </>
        ) : null}
      </AdminPanel>

      <AdminPanel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">{t("admin.security.sessions.tag")}</p>
            <h2 className="mt-2 text-lg font-semibold">{t("admin.security.sessions.title")}</h2>
          </div>
          <a href={`${window.location.origin}/api/v1/admin/security/export/auth-logs`} download className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F47822] hover:underline">
            <Download className="h-3.5 w-3.5" /> {t("admin.security.sessions.exportCsv")}
          </a>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={sessionSearch}
            onChange={(event) => {
              setSessionSearch(event.target.value);
              setSessionPage(1);
            }}
            placeholder={t("admin.security.sessions.searchPh")}
            className="h-10 min-w-[180px] flex-1 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-xs outline-none focus:border-[#F47822]"
          />
          <select
            value={sessionActive}
            onChange={(event) => {
              setSessionActive(event.target.value);
              setSessionPage(1);
            }}
            className="h-10 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-xs font-semibold outline-none focus:border-[#F47822]"
          >
            <option value="">{t("admin.security.sessions.allSessions")}</option>
            <option value="true">{t("admin.security.sessions.activeOnly")}</option>
            <option value="false">{t("admin.security.sessions.ended")}</option>
          </select>
        </div>

        {sessions.isLoading ? (
          <p className="mt-4 text-sm text-[#3A3A3A]/50">{t("admin.security.sessions.loading")}</p>
        ) : sessions.data ? (
          <>
            <ul className="mt-4 space-y-2">
              {sessions.data.data.map((session) => (
                <li key={session.id} className="flex items-center gap-3 rounded-xl bg-[#FCFCFC] px-4 py-3">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${session.active ? "bg-emerald-500" : "bg-[#3A3A3A]/20"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-[#3A3A3A]">
                      {session.user?.name ?? t("admin.security.sessions.unknown")} · {session.user?.email ?? session.ip_address ?? "—"}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[10px] text-[#3A3A3A]/45">
                      {session.browser ?? "—"} · {session.platform ?? ""} · {session.ip_address ?? ""}
                    </span>
                  </span>
                  {session.active ? (
                    <button
                      type="button"
                      disabled={revokedId === session.id}
                      onClick={() => void revoke(session.id)}
                      className="shrink-0 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      {t("admin.security.sessions.revoke")}
                    </button>
                  ) : (
                    <span className="shrink-0 rounded-full bg-[#3A3A3A]/5 px-2 py-1 text-[10px] font-bold text-[#3A3A3A]/45">
                      {t("admin.security.sessions.ended")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <PageControls page={sessions.data.meta.current_page} lastPage={sessions.data.meta.last_page} onPage={setSessionPage} />
            </div>
          </>
        ) : null}
      </AdminPanel>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number | string;
  hint: string;
  tone: "red" | "green" | "brand" | "dark";
}) {
  const tones = {
    red: "bg-red-50 text-red-500",
    green: "bg-emerald-50 text-emerald-600",
    brand: "bg-[#F47822]/10 text-[#F47822]",
    dark: "bg-[#3A3A3A]/8 text-[#3A3A3A]",
  } as const;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#3A3A3A]/8 bg-white px-4 py-3.5 shadow-[0_4px_14px_rgba(58,58,58,.04)]">
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>
        <ShieldAlert className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-[10px] font-bold uppercase tracking-[.12em] text-[#3A3A3A]/42">{label}</span>
        <span className="mt-0.5 block text-lg font-bold leading-none">{value}</span>
        <span className="mt-0.5 block text-[10px] text-[#3A3A3A]/40">{hint}</span>
      </span>
    </div>
  );
}
