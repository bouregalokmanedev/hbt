import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ShieldAlert, Flame, Clock, CheckCircle2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { adminApi } from "../api/adminApi";
import { AdminHeading, AdminPanel, ErrorAdminPage, LoadingAdminPage } from "../components/AdminUi";

export function AdminRiskPage() {
  const { t, i18n } = useTranslation();
  const client = useQueryClient();
  const [title, setTitle] = useState("");
  const [probability, setProbability] = useState(3);
  const [impact, setImpact] = useState(3);
  const dashboard = useQuery({ queryKey: ["admin", "risk", "dashboard"], queryFn: adminApi.riskDashboard });
  const risks = useQuery({ queryKey: ["admin", "risks"], queryFn: () => adminApi.risks({ per_page: 10 }) });
  const incidents = useQuery({ queryKey: ["admin", "incidents"], queryFn: () => adminApi.incidents({ per_page: 5 }) });
  const overdue = useQuery({ queryKey: ["admin", "risk", "overdue"], queryFn: adminApi.riskOverdue });
  const failed = useQuery({ queryKey: ["admin", "risk", "failed-controls"], queryFn: adminApi.riskFailedControls });

  const levelForScore = (score: number) => {
    if (score <= 4) return t("admin.risk.levels.low");
    if (score <= 9) return t("admin.risk.levels.medium");
    if (score <= 16) return t("admin.risk.levels.high");
    return t("admin.risk.levels.critical");
  };

  const createRisk = async () => {
    if (!title.trim()) return;
    await adminApi.createRisk({ title: title.trim(), probability, impact });
    setTitle("");
    void client.invalidateQueries({ queryKey: ["admin", "risk"] });
    void client.invalidateQueries({ queryKey: ["admin", "risks"] });
    void dashboard.refetch();
  };

  if (dashboard.isLoading) return <LoadingAdminPage />;
  if (dashboard.isError || !dashboard.data) return <ErrorAdminPage onRetry={() => void dashboard.refetch()} />;

  const data = dashboard.data;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <AdminHeading eyebrow={t("admin.risk.eyebrow")} title={t("admin.risk.title")} description={t("admin.risk.description")} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={t("admin.risk.kpi.critical")} value={data.by_level.critical} tone="red" />
        <Kpi label={t("admin.risk.kpi.high")} value={data.by_level.high} tone="amber" />
        <Kpi label={t("admin.risk.kpi.medium")} value={data.by_level.medium} tone="dark" />
        <Kpi label={t("admin.risk.kpi.low")} value={data.by_level.low} tone="green" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label={t("admin.risk.kpi.openRisks")} value={data.by_status.open ?? data.by_level.critical + data.by_level.high + data.by_level.medium + data.by_level.low} tone="dark" />
        <Kpi label={t("admin.risk.kpi.overdueReviews")} value={data.overdue_reviews} tone={data.overdue_reviews ? "red" : "green"} />
        <Kpi label={t("admin.risk.kpi.failedControls")} value={data.failed_controls} tone={data.failed_controls ? "amber" : "green"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel>
          <h2 className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4 text-[#F47822]" /> {t("admin.risk.createTitle")}</h2>
          <div className="mt-4 grid gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("admin.risk.titlePh")} aria-label={t("admin.risk.createTitle")} className="h-11 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-sm outline-none focus:border-[#F47822]" />
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-xs font-semibold">{t("admin.risk.probability")}<input type="number" min={1} max={5} value={probability} onChange={(e) => setProbability(Number(e.target.value))} className="h-10 rounded-xl border border-[#3A3A3A]/10 px-3 outline-none" /></label>
              <label className="grid gap-1 text-xs font-semibold">{t("admin.risk.impact")}<input type="number" min={1} max={5} value={impact} onChange={(e) => setImpact(Number(e.target.value))} className="h-10 rounded-xl border border-[#3A3A3A]/10 px-3 outline-none" /></label>
            </div>
            <p className="text-xs text-[#3A3A3A]/50">{t("admin.risk.score", { score: probability * impact, level: levelForScore(probability * impact) })}</p>
            <button type="button" onClick={() => void createRisk()} className="inline-flex items-center gap-1.5 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#E96D18]"><Plus className="h-4 w-4" /> {t("admin.risk.add")}</button>
          </div>
        </AdminPanel>

        <AdminPanel>
          <h2 className="flex items-center gap-2 font-semibold"><Flame className="h-4 w-4 text-red-500" /> {t("admin.risk.incidentsTitle")}</h2>
          {incidents.data && incidents.data.data.length ? (
            <ul className="mt-3 space-y-2">
              {incidents.data.data.slice(0, 5).map((inc) => (
                <li key={inc.id} className="flex items-center justify-between rounded-xl bg-[#FCFCFC] px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold">{inc.incident_number} — {inc.title}</span>
                  <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize rtl:ml-0 rtl:mr-2 ${inc.severity === "critical" ? "bg-red-50 text-red-600" : inc.severity === "high" ? "bg-amber-50 text-amber-700" : "bg-[#3A3A3A]/8 text-[#3A3A3A]"}`}>{inc.severity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[#3A3A3A]/50">{t("admin.risk.incidentsEmpty")}</p>
          )}
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel>
          <h2 className="flex items-center gap-2 font-semibold"><Clock className="h-4 w-4 text-amber-500" /> {t("admin.risk.overdueTitle")}</h2>
          {overdue.data && overdue.data.length ? (
            <ul className="mt-3 space-y-2">
              {overdue.data.map((r) => (
                <li key={r.id} className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs"><span className="font-bold">{r.title}</span><span className="ml-2 text-[#3A3A3A]/50 rtl:ml-0 rtl:mr-2">{t("admin.risk.due", { date: r.next_review_at ? new Date(r.next_review_at).toLocaleDateString(i18n.language) : t("admin.risk.noDate") })}</span></li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" /> {t("admin.risk.overdueEmpty")}</p>
          )}
        </AdminPanel>

        <AdminPanel>
          <h2 className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-[#F47822]" /> {t("admin.risk.failedTitle")}</h2>
          {failed.data && failed.data.length ? (
            <ul className="mt-3 space-y-2">
              {failed.data.map((c) => (
                <li key={c.id} className="rounded-xl bg-red-50 px-3 py-2.5 text-xs"><span className="font-bold">{c.name}</span><span className="text-[#3A3A3A]/50"> — {c.risk ?? ""}</span></li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" /> {t("admin.risk.failedEmpty")}</p>
          )}
        </AdminPanel>
      </div>

      <AdminPanel>
        <h2 className="font-semibold">{t("admin.risk.recentTitle")}</h2>
        {risks.data && risks.data.data.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-xs rtl:text-right">
              <thead className="border-b border-[#3A3A3A]/8 text-[10px] uppercase tracking-wide text-[#3A3A3A]/40"><tr><th className="pb-2">{t("admin.risk.headers.title")}</th><th className="pb-2">{t("admin.risk.headers.level")}</th><th className="pb-2">{t("admin.risk.headers.score")}</th><th className="pb-2">{t("admin.risk.headers.status")}</th></tr></thead>
              <tbody className="divide-y divide-[#3A3A3A]/7">
                {risks.data.data.slice(0, 8).map((r) => (
                  <tr key={r.id}><td className="py-2 font-semibold">{r.title}</td><td className="capitalize">{r.level}</td><td>{r.score}</td><td className="capitalize">{r.status}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#3A3A3A]/50">{t("admin.risk.empty")}</p>
        )}
      </AdminPanel>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: "red" | "amber" | "dark" | "green" }) {
  const tones = { red: "bg-red-50 text-red-600", amber: "bg-amber-50 text-amber-700", dark: "bg-[#3A3A3A] text-white", green: "bg-emerald-50 text-emerald-700" } as const;
  return (
    <div className={`rounded-2xl border p-4 ${tone === "dark" ? "border-[#3A3A3A] bg-[#3A3A3A] text-white" : "border-[#3A3A3A]/8 bg-white"}`}>
      <p className={`text-[10px] font-bold uppercase tracking-wide ${tone === "dark" ? "text-white/50" : "text-[#3A3A3A]/40"}`}>{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
