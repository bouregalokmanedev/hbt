import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, BookOpen, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { AVATAR_SQUARE_SHAPE } from "@/components/ui";

import { adminApi } from "../api/adminApi";
import type { AdminStudent } from "../types/admin";
import {
  AdminHeading,
  AdminPanel,
  ErrorAdminPage,
  LoadingAdminPage,
  PageControls,
} from "../components/AdminUi";
import { StudentJourneyDrawer } from "../components/StudentJourneyDrawer";

export function AdminStudentsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const deferred = useDeferredValue(search);

  const students = useQuery({
    queryKey: ["admin", "students", deferred, page],
    queryFn: () => adminApi.students({ search: deferred, page, per_page: 12 }),
  });

  if (students.isLoading) return <LoadingAdminPage />;
  if (students.isError || !students.data)
    return <ErrorAdminPage onRetry={() => void students.refetch()} />;

  const data = students.data;
  const selected: AdminStudent | undefined = selectedId
    ? data.data.find((entry) => entry.id === selectedId)
    : undefined;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <AdminHeading
        eyebrow={t("admin.students.eyebrow")}
        title={t("admin.students.title")}
        description={t("admin.students.description")}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Mini label={t("admin.students.metrics.students")} value={data.meta.total} icon={<BookOpen className="h-4 w-4" />} />
        <Mini
          label={t("admin.students.metrics.enrolledPage")}
          value={data.data.reduce((sum, entry) => sum + entry.enrollments_count, 0)}
          icon={<Award className="h-4 w-4" />}
        />
        <Mini
          label={t("admin.students.metrics.certificatesPage")}
          value={data.data.reduce((sum, entry) => sum + entry.certificates_count, 0)}
          icon={<Award className="h-4 w-4" />}
        />
      </div>

      <AdminPanel>
        <div className="flex flex-wrap gap-3">
          <label className="relative min-w-[220px] flex-1">
            <Search className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/40 ${isRTL ? "right-3" : "left-3"}`} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t("admin.students.searchPh")}
              className={`h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] text-sm outline-none transition focus:border-[#F47822] ${isRTL ? "pl-3 pr-10" : "pl-10 pr-3"}`}
            />
          </label>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 px-4 text-xs font-bold text-[#3A3A3A]/60 transition hover:border-[#F47822]/40 hover:text-[#F47822]"
            >
              <X className="h-3.5 w-3.5" /> {t("admin.students.clear")}
            </button>
          )}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left rtl:text-right">
            <thead className="border-b border-[#3A3A3A]/8 text-[10px] font-bold uppercase tracking-[.13em] text-[#3A3A3A]/40">
              <tr>
                <th className="pb-3">{t("admin.students.headers.student")}</th>
                <th className="pb-3">{t("admin.students.headers.enrollments")}</th>
                <th className="pb-3">{t("admin.students.headers.completed")}</th>
                <th className="pb-3">{t("admin.students.headers.certificates")}</th>
                <th className="pb-3">{t("admin.students.headers.lastActive")}</th>
                <th className="pb-3 text-right rtl:text-left">{t("admin.students.headers.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3A3A3A]/7">
              {data.data.map((entry) => (
                <tr key={entry.id} className="transition hover:bg-[#FCFCFC]">
                  <td className="py-4">
                    <button type="button" onClick={() => setSelectedId(entry.id)} className="flex items-center gap-3 text-left rtl:text-right">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center ${AVATAR_SQUARE_SHAPE} bg-[#F47822]/10 text-xs font-bold text-[#F47822]`}>
                        {entry.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold hover:text-[#F47822]">{entry.name}</span>
                        <span className="mt-0.5 block text-xs text-[#3A3A3A]/45">{entry.email}</span>
                      </span>
                    </button>
                  </td>
                  <td className="py-4 text-xs font-bold text-[#3A3A3A]/70">{entry.enrollments_count}</td>
                  <td className="py-4 text-xs font-bold text-[#3A3A3A]/70">{entry.completed_count}</td>
                  <td className="py-4 text-xs font-bold text-[#3A3A3A]/70">{entry.certificates_count}</td>
                  <td className="py-4 text-xs text-[#3A3A3A]/50">
                    {entry.last_active_at ? new Date(entry.last_active_at).toLocaleDateString(i18n.language) : "—"}
                  </td>
                  <td className="py-4 text-right rtl:text-left">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedId(entry.id)}
                        className="rounded-lg border border-[#3A3A3A]/10 px-3 py-2 text-xs font-bold text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                      >
                        {t("admin.students.journey")}
                      </button>
                      <Link
                        to={`/admin/users?search=${encodeURIComponent(entry.email)}`}
                        className="rounded-lg bg-[#3A3A3A]/5 px-3 py-2 text-xs font-bold text-[#3A3A3A]/60 transition hover:bg-[#F47822]/10 hover:text-[#F47822]"
                      >
                        {t("admin.students.account")}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {data.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[#3A3A3A]/45">
                    {t("admin.students.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5">
          <PageControls page={data.meta.current_page} lastPage={data.meta.last_page} onPage={setPage} />
        </div>
      </AdminPanel>

      {selected && <StudentJourneyDrawer student={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function Mini({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#3A3A3A]/8 bg-white px-4 py-3.5 shadow-[0_4px_14px_rgba(58,58,58,.04)]">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">{icon}</span>
      <span>
        <span className="block text-[10px] font-bold uppercase tracking-[.12em] text-[#3A3A3A]/42">{label}</span>
        <span className="mt-0.5 block text-lg font-bold leading-none">{value}</span>
      </span>
    </div>
  );
}
