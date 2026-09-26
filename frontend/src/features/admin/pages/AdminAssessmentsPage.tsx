import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Award, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { adminApi } from "../api/adminApi";
import type { AdminAssessment, AdminQuiz } from "../types/admin";
import {
  AdminHeading,
  AdminPanel,
  ErrorAdminPage,
  LoadingAdminPage,
  PageControls,
  Status,
} from "../components/AdminUi";
import { AssessmentDetailDrawer } from "../components/AssessmentDetailDrawer";
import { QuizDetailDrawer } from "../components/QuizDetailDrawer";

type Tab = "quizzes" | "assessments";

export function AdminAssessmentsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("quizzes");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);

  const switchTab = (next: Tab) => {
    setTab(next);
    setPage(1);
    setSelectedQuiz(null);
    setSelectedAssessment(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <AdminHeading
        eyebrow={t("admin.assessments.eyebrow")}
        title={t("admin.assessments.title")}
        description={t("admin.assessments.description")}
      />

      <div className="flex gap-1.5 self-start rounded-2xl bg-white p-1.5 shadow-[0_4px_14px_rgba(58,58,58,.05)]">
        <TabButton active={tab === "quizzes"} onClick={() => switchTab("quizzes")} icon={<ClipboardCheck className="h-3.5 w-3.5 rtl:-scale-x-100" />} label={t("admin.assessments.tabs.quizzes")} />
        <TabButton active={tab === "assessments"} onClick={() => switchTab("assessments")} icon={<Award className="h-3.5 w-3.5 rtl:-scale-x-100" />} label={t("admin.assessments.tabs.assessments")} />
      </div>

      {tab === "quizzes" ? (
        <QuizTable
          search={search}
          setSearch={setSearch}
          status={status}
          setStatus={setStatus}
          page={page}
          setPage={setPage}
          onSelect={setSelectedQuiz}
        />
      ) : (
        <AssessmentTable
          search={search}
          setSearch={setSearch}
          status={status}
          setStatus={setStatus}
          page={page}
          setPage={setPage}
          onSelect={setSelectedAssessment}
        />
      )}

      {selectedQuiz && <QuizDetailDrawer quizId={selectedQuiz} onClose={() => setSelectedQuiz(null)} />}
      {selectedAssessment && (
        <AssessmentDetailDrawer assessmentId={selectedAssessment} onClose={() => setSelectedAssessment(null)} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
        active ? "bg-[#3A3A3A] text-white shadow" : "text-[#3A3A3A]/55 hover:text-[#3A3A3A]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Toolbar({
  search,
  setSearch,
  status,
  setStatus,
  setPage,
  statuses,
}: {
  search: string;
  setSearch: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  setPage: (value: number) => void;
  statuses: string[];
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  return (
    <div className="flex flex-wrap gap-3">
      <label className="relative min-w-[220px] flex-1">
        <Search className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#3A3A3A]/40 ${isRTL ? "right-3" : "left-3"}`} />
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder={t("admin.assessments.searchPh")}
          className={`h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] text-sm outline-none transition focus:border-[#F47822] ${isRTL ? "pl-3 pr-10" : "pl-10 pr-3"}`}
        />
      </label>
      <select
        value={status}
        onChange={(event) => {
          setStatus(event.target.value);
          setPage(1);
        }}
        className="h-11 rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 text-xs font-semibold capitalize text-[#3A3A3A]/70 outline-none transition focus:border-[#F47822]"
      >
        <option value="">{t("admin.assessments.allStatuses")}</option>
        {statuses.map((entry) => (
          <option key={entry} value={entry}>
            {entry}
          </option>
        ))}
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
          <X className="h-3.5 w-3.5" /> {t("admin.assessments.clear")}
        </button>
      )}
    </div>
  );
}

function QuizTable(props: {
  search: string;
  setSearch: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  page: number;
  setPage: (value: number) => void;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { search, status, page } = props;
  const deferred = useDeferredValue(search);
  const list = useQuery({
    queryKey: ["admin", "quizzes", deferred, status, page],
    queryFn: () => adminApi.quizzes({ search: deferred, status, page, per_page: 12 }),
  });

  if (list.isLoading) return <LoadingAdminPage />;
  if (list.isError || !list.data) return <ErrorAdminPage onRetry={() => void list.refetch()} />;

  const data = list.data;
  return (
    <AdminPanel>
      <Toolbar {...props} statuses={["draft", "published", "archived"]} />
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[840px] text-left rtl:text-right">
          <thead className="border-b border-[#3A3A3A]/8 text-[10px] font-bold uppercase tracking-[.13em] text-[#3A3A3A]/40">
            <tr>
              <th className="pb-3">{t("admin.assessments.headers.quiz")}</th>
              <th className="pb-3">{t("admin.assessments.headers.course")}</th>
              <th className="pb-3">{t("admin.assessments.headers.status")}</th>
              <th className="pb-3">{t("admin.assessments.headers.questions")}</th>
              <th className="pb-3">{t("admin.assessments.headers.attempts")}</th>
              <th className="pb-3">{t("admin.assessments.headers.passRate")}</th>
              <th className="pb-3 text-right rtl:text-left">{t("admin.assessments.headers.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3A3A3A]/7">
            {data.data.map((quiz: AdminQuiz) => (
              <tr key={quiz.id} className="transition hover:bg-[#FCFCFC]">
                <td className="py-4">
                  <button type="button" onClick={() => props.onSelect(quiz.id)} className="max-w-xs text-left rtl:text-right">
                    <span className="block truncate text-sm font-semibold hover:text-[#F47822]">{quiz.title}</span>
                    <span className="mt-0.5 block text-xs text-[#3A3A3A]/45">{t("admin.assessments.passThreshold", { value: quiz.pass_percentage })}</span>
                  </button>
                </td>
                <td className="max-w-[200px] truncate py-4 text-xs text-[#3A3A3A]/60">{quiz.course ?? "—"}</td>
                <td className="py-4">
                  <Status value={quiz.status} />
                </td>
                <td className="py-4 text-xs font-bold text-[#3A3A3A]/70">{quiz.questions_count}</td>
                <td className="py-4 text-xs font-bold text-[#3A3A3A]/70">{quiz.attempts_count}</td>
                <td className="py-4 text-xs font-bold text-[#3A3A3A]/70">
                  {quiz.pass_rate === null ? "—" : `${quiz.pass_rate}%`}
                </td>
                <td className="py-4 text-right rtl:text-left">
                  <button
                    type="button"
                    onClick={() => props.onSelect(quiz.id)}
                    className="rounded-lg border border-[#3A3A3A]/10 px-3 py-2 text-xs font-bold text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                  >
                    {t("admin.assessments.inspect")}
                  </button>
                </td>
              </tr>
            ))}
            {data.data.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-[#3A3A3A]/45">
                  {t("admin.assessments.emptyQuizzes")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-5">
        <PageControls page={data.meta.current_page} lastPage={data.meta.last_page} onPage={props.setPage} />
      </div>
    </AdminPanel>
  );
}

function AssessmentTable(props: {
  search: string;
  setSearch: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  page: number;
  setPage: (value: number) => void;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { search, status, page } = props;
  const deferred = useDeferredValue(search);
  const list = useQuery({
    queryKey: ["admin", "assessments", deferred, status, page],
    queryFn: () => adminApi.assessments({ search: deferred, status, page, per_page: 12 }),
  });

  if (list.isLoading) return <LoadingAdminPage />;
  if (list.isError || !list.data) return <ErrorAdminPage onRetry={() => void list.refetch()} />;

  const data = list.data;
  return (
    <AdminPanel>
      <Toolbar {...props} statuses={["draft", "published"]} />
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[840px] text-left rtl:text-right">
          <thead className="border-b border-[#3A3A3A]/8 text-[10px] font-bold uppercase tracking-[.13em] text-[#3A3A3A]/40">
            <tr>
              <th className="pb-3">{t("admin.assessments.headers.assessment")}</th>
              <th className="pb-3">{t("admin.assessments.headers.course")}</th>
              <th className="pb-3">{t("admin.assessments.headers.status")}</th>
              <th className="pb-3">{t("admin.assessments.headers.minScore")}</th>
              <th className="pb-3">{t("admin.assessments.headers.attempts")}</th>
              <th className="pb-3">{t("admin.assessments.headers.passRate")}</th>
              <th className="pb-3 text-right rtl:text-left">{t("admin.assessments.headers.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3A3A3A]/7">
            {data.data.map((assessment: AdminAssessment) => (
              <tr key={assessment.id} className="transition hover:bg-[#FCFCFC]">
                <td className="py-4">
                  <button type="button" onClick={() => props.onSelect(assessment.id)} className="max-w-xs text-left rtl:text-right">
                    <span className="block truncate text-sm font-semibold hover:text-[#F47822]">
                      {assessment.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-[#3A3A3A]/45">
                      {assessment.is_required ? t("admin.assessments.required") : t("admin.assessments.optional")}
                    </span>
                  </button>
                </td>
                <td className="max-w-[200px] truncate py-4 text-xs text-[#3A3A3A]/60">{assessment.course ?? "—"}</td>
                <td className="py-4">
                  <Status value={assessment.status} />
                </td>
                <td className="py-4 text-xs font-bold text-[#3A3A3A]/70">{assessment.minimum_score}%</td>
                <td className="py-4 text-xs font-bold text-[#3A3A3A]/70">{assessment.attempts_count}</td>
                <td className="py-4 text-xs font-bold text-[#3A3A3A]/70">
                  {assessment.pass_rate === null ? "—" : `${assessment.pass_rate}%`}
                </td>
                <td className="py-4 text-right rtl:text-left">
                  <button
                    type="button"
                    onClick={() => props.onSelect(assessment.id)}
                    className="rounded-lg border border-[#3A3A3A]/10 px-3 py-2 text-xs font-bold text-[#3A3A3A]/70 transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                  >
                    {t("admin.assessments.inspect")}
                  </button>
                </td>
              </tr>
            ))}
            {data.data.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-[#3A3A3A]/45">
                  {t("admin.assessments.emptyAssessments")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-5">
        <PageControls page={data.meta.current_page} lastPage={data.meta.last_page} onPage={props.setPage} />
      </div>
    </AdminPanel>
  );
}
