import { useDeferredValue, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  Search,
  Star,
  UserCheck,
  UsersRound,
  X,
} from "lucide-react";

import { adminApi } from "../api/adminApi";
import type { AdminInstructor } from "../types/admin";
import { useTranslation } from "react-i18next";

import { AVATAR_SQUARE_SHAPE } from "@/components/ui";
import {
  AdminHeading,
  AdminPanel,
  ErrorAdminPage,
  LoadingAdminPage,
  PageControls,
  Status,
} from "../components/AdminUi";
import { InstructorDetailDrawer } from "../components/InstructorDetailDrawer";

export function AdminInstructorsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const deferred = useDeferredValue(search);
  const client = useQueryClient();

  const instructors = useQuery({
    queryKey: ["admin", "instructors", deferred, status, page],
    queryFn: () => adminApi.instructors({ search: deferred, status, page, per_page: 12 }),
  });

  if (instructors.isLoading) return <LoadingAdminPage />;
  if (instructors.isError || !instructors.data)
    return <ErrorAdminPage onRetry={() => void instructors.refetch()} />;

  const data = instructors.data;
  const selected: AdminInstructor | undefined = selectedId
    ? data.data.find((entry) => entry.id === selectedId)
    : undefined;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <AdminHeading
        eyebrow={t("admin.instructors.eyebrow")}
        title={t("admin.instructors.title")}
        description={t("admin.instructors.description")}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Mini label={t("admin.instructors.metrics.instructors")} value={data.meta.total} icon={<UsersRound className="h-4 w-4" />} />
        <Mini
          label={t("admin.instructors.metrics.coursesTaught")}
          value={data.data.reduce((sum, entry) => sum + entry.courses_count, 0)}
          icon={<BookOpen className="h-4 w-4" />}
        />
        <Mini
          label={t("admin.instructors.metrics.verifiedTeam")}
          value={data.data.filter((entry) => entry.verified).length}
          icon={<UserCheck className="h-4 w-4" />}
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
              placeholder={t("admin.instructors.searchPh")}
              className={`h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] text-sm outline-none transition focus:border-[#F47822] ${isRTL ? "pl-3 pr-10" : "pl-10 pr-3"}`}
            />
          </label>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-xs font-semibold text-[#3A3A3A]/70 outline-none transition focus:border-[#F47822]"
          >
            <option value="">{t("admin.instructors.filters.allStatuses")}</option>
            <option value="active">{t("admin.instructors.filters.active")}</option>
            <option value="suspended">{t("admin.instructors.filters.suspended")}</option>
          </select>
          {(search || status) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("");
                setPage(1);
              }}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 px-4 text-xs font-bold text-[#3A3A3A]/60 transition hover:border-[#F47822]/40 hover:text-[#F47822]"
            >
              <X className="h-3.5 w-3.5" /> {t("admin.instructors.clear")}
            </button>
          )}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left rtl:text-right">
            <thead className="border-b border-[#3A3A3A]/8 text-[10px] font-bold uppercase tracking-[.13em] text-[#3A3A3A]/40">
              <tr>
                <th className="pb-3">{t("admin.instructors.headers.instructor")}</th>
                <th className="pb-3">{t("admin.instructors.headers.courses")}</th>
                <th className="pb-3">{t("admin.instructors.headers.students")}</th>
                <th className="pb-3">{t("admin.instructors.headers.rating")}</th>
                <th className="pb-3">{t("admin.instructors.headers.status")}</th>
                <th className="pb-3 text-right rtl:text-left">{t("admin.instructors.headers.actions")}</th>
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
                        <span className="flex items-center gap-1.5 text-sm font-semibold hover:text-[#F47822]">
                          {entry.name}
                          {entry.verified && <UserCheck className="h-3.5 w-3.5 text-emerald-600" />}
                        </span>
                        <span className="mt-0.5 block text-xs text-[#3A3A3A]/45">{entry.email}</span>
                      </span>
                    </button>
                  </td>
                  <td className="py-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3A3A3A]/70">
                      <BookOpen className="h-3.5 w-3.5 text-[#3A3A3A]/35" />
                      {entry.courses_count}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3A3A3A]/70">
                      <Award className="h-3.5 w-3.5 text-[#3A3A3A]/35" />
                      {entry.students_taught}
                    </span>
                  </td>
                  <td className="py-4">
                    {entry.average_rating === null ? (
                      <span className="text-xs text-[#3A3A3A]/40">—</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#3A3A3A]/70">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {entry.average_rating.toFixed(1)}
                      </span>
                    )}
                  </td>
                  <td className="py-4">
                    <Status value={entry.status} />
                  </td>
                  <td className="py-4 text-right rtl:text-left">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(entry.id);
                        void client.invalidateQueries({ queryKey: ["admin", "instructor"] });
                      }}
                      className="rounded-lg border border-[#3A3A3A]/10 px-3 py-2 text-xs font-bold text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                    >
                      {t("admin.instructors.profile")}
                    </button>
                  </td>
                </tr>
              ))}
              {data.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[#3A3A3A]/45">
                    {t("admin.instructors.empty")}
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

      {selected && (
        <InstructorDetailDrawer instructor={selected} onClose={() => setSelectedId(null)} />
      )}
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
