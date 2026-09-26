import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/lib/api/errors";

import { adminApi } from "../api/adminApi";
import { ErrorAdminPage, LoadingAdminPage, Status } from "./AdminUi";
import { AttemptRow } from "./QuizDetailDrawer";

function errorMessage(reason: unknown, fallback: string): string {
  if (reason instanceof ApiError && reason.errors) {
    const first = Object.values(reason.errors).flat().find((item): item is string => typeof item === "string");
    if (first) return first;
  }
  return reason instanceof Error ? reason.message : fallback;
}

export function AssessmentDetailDrawer({ assessmentId, onClose }: { assessmentId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [attemptsOpen, setAttemptsOpen] = useState(false);
  const [attemptsPage, setAttemptsPage] = useState(1);

  const detail = useQuery({ queryKey: ["admin", "assessment", assessmentId], queryFn: () => adminApi.assessmentDetail(assessmentId) });
  const attempts = useQuery({
    queryKey: ["admin", "assessment", assessmentId, "attempts", attemptsPage],
    queryFn: () => adminApi.assessmentAttempts(assessmentId, { page: attemptsPage, per_page: 8 }),
    enabled: attemptsOpen,
  });

  const run = async (key: string, work: () => Promise<unknown>, success: string, close = false) => {
    if (busy !== null) return;
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      await work();
      await client.invalidateQueries({ queryKey: ["admin", "assessment"] });
      await client.invalidateQueries({ queryKey: ["admin", "assessments"] });
      setNotice(success);
      if (close) onClose();
    } catch (reason) {
      setError(errorMessage(reason, t("admin.drawers.assessment.actionError")));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={t("admin.drawers.assessment.dialogAria")}>
      <button type="button" aria-label={t("admin.drawers.assessment.closeInspection")} onClick={onClose} className="absolute inset-0 bg-[#3A3A3A]/45 backdrop-blur-[2px]" />
      <aside className="absolute inset-y-0 end-0 flex w-full max-w-xl flex-col overflow-hidden bg-[#F7F7F7] shadow-2xl">
        <div className="h-1.5 w-full bg-[#F47822]" />
        <div className="flex items-start justify-between gap-3 border-b border-[#3A3A3A]/8 bg-white p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">{t("admin.drawers.assessment.eyebrow")}</p>
            <h2 className="mt-1 truncate text-lg font-bold text-[#3A3A3A]">{detail.data?.title ?? t("admin.common.loading")}</h2>
            {detail.data && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Status value={detail.data.status} />
                <span className="rounded-full bg-[#3A3A3A]/5 px-2.5 py-1 text-[10px] font-bold text-[#3A3A3A]/55">
                  {detail.data.course ?? t("admin.drawers.assessment.noCourse")}
                  {detail.data.is_required ? ` · ${t("admin.drawers.assessment.required")}` : ` · ${t("admin.drawers.assessment.optional")}`}
                </span>
              </div>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label={t("admin.drawers.assessment.close")} className="rounded-lg p-1.5 text-[#3A3A3A]/45 transition hover:bg-[#F3F3F3] hover:text-[#3A3A3A]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {notice && (
            <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {notice}
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {detail.isLoading && <LoadingAdminPage />}
          {detail.isError && <ErrorAdminPage onRetry={() => void detail.refetch()} />}
          {detail.data && (
            <>
              <section className="grid grid-cols-3 gap-2.5">
                <Stat label={t("admin.drawers.assessment.stats.attempts")} value={detail.data.stats.attempts_count} />
                <Stat label={t("admin.drawers.assessment.stats.passRate")} value={detail.data.stats.pass_rate === null ? "—" : `${detail.data.stats.pass_rate}%`} />
                <Stat label={t("admin.drawers.assessment.stats.results")} value={detail.data.stats.results_count} />
              </section>

              {detail.data.description && (
                <p className="rounded-2xl bg-white px-4 py-3 text-xs leading-5 text-[#3A3A3A]/60">{detail.data.description}</p>
              )}

              <section className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-4">
                <div className="flex items-center justify-between">
                  <SectionTitle>{t("admin.drawers.assessment.moderate")}</SectionTitle>
                  <button
                    type="button"
                    onClick={() => setEditing((open) => !open)}
                    className="rounded-lg border border-[#3A3A3A]/10 px-3 py-1.5 text-[11px] font-bold text-[#3A3A3A]/65 transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                  >
                    {editing ? t("admin.common.close") : t("admin.common.edit")}
                  </button>
                </div>
                {editing && (
                  <AssessmentEditForm
                    key={detail.data.id}
                    initial={{
                      title: detail.data.title,
                      description: detail.data.description ?? "",
                      status: detail.data.status,
                      minimum_score: detail.data.minimum_score ?? 0,
                      max_attempts: detail.data.max_attempts,
                      is_required: detail.data.is_required,
                    }}
                    disabled={busy !== null}
                    onSubmit={(payload) => {
                      setEditing(false);
                      void run("update", () => adminApi.updateAssessment(assessmentId, payload), t("admin.drawers.assessment.notices.updated"));
                    }}
                  />
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.data.status === "published" && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void run("disable", () => adminApi.disableAssessment(assessmentId), t("admin.drawers.assessment.notices.disabled"))}
                      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                    >
                      {t("admin.drawers.assessment.disableAssessment")}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void run("delete", () => adminApi.deleteAssessment(assessmentId), t("admin.drawers.assessment.notices.deleted"), true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-red-600 ring-1 ring-red-200 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4 rtl:-scale-x-100" /> {t("admin.common.delete")}
                  </button>
                </div>
              </section>

              <section>
                <button
                  type="button"
                  onClick={() => setAttemptsOpen((open) => !open)}
                  className="flex w-full items-center justify-between rounded-2xl border border-[#3A3A3A]/10 bg-white px-4 py-3.5 text-left rtl:text-right"
                >
                  <span className="text-xs font-bold text-[#3A3A3A]">
                    {t("admin.drawers.assessment.attemptsTitle", { count: detail.data.stats.attempts_count })}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-[#3A3A3A]/40 transition-transform ${attemptsOpen ? "rotate-180" : ""}`} />
                </button>
                {attemptsOpen && (
                  <div className="mt-2.5 space-y-2">
                    {attempts.isLoading && <p className="text-xs text-[#3A3A3A]/50">{t("admin.drawers.assessment.loadingAttempts")}</p>}
                    {attempts.data?.data.map((attempt) => (
                      <AttemptRow
                        key={attempt.id}
                        title={attempt.student ?? attempt.email ?? t("admin.drawers.assessment.anonymous")}
                        subtitle={`${t("admin.drawers.assessment.scoreLabel", { value: attempt.result_score ?? attempt.score ?? "—" })} · ${t("admin.drawers.assessment.tryNumber", { n: attempt.attempt_number })}${attempt.tab_switch_count ? ` · ${t("admin.drawers.assessment.tabSwitches", { count: attempt.tab_switch_count })}` : ""}`}
                        ok={attempt.result_passed ?? attempt.passed}
                        lines={attempt.answers.map((answer) => ({
                          text: answer.question ?? t("admin.drawers.assessment.questionFallback"),
                          ok: answer.is_correct,
                        }))}
                      />
                    ))}
                    {attempts.data && attempts.data.data.length === 0 && (
                      <p className="rounded-xl bg-white px-4 py-3 text-xs text-[#3A3A3A]/50">{t("admin.drawers.assessment.noAttempts")}</p>
                    )}
                    {attempts.data && attempts.data.meta.last_page > 1 && (
                      <div className="flex items-center justify-between text-xs text-[#3A3A3A]/50">
                        <span>
                          {t("admin.common.pageOf", { page: attempts.data.meta.current_page, last: attempts.data.meta.last_page })}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={attemptsPage <= 1}
                            onClick={() => setAttemptsPage((page) => page - 1)}
                            className="rounded-lg border border-[#3A3A3A]/10 px-3 py-1.5 font-bold disabled:opacity-40"
                          >
                            {t("admin.common.prev")}
                          </button>
                          <button
                            type="button"
                            disabled={attemptsPage >= attempts.data.meta.last_page}
                            onClick={() => setAttemptsPage((page) => page + 1)}
                            className="rounded-lg bg-[#3A3A3A] px-3 py-1.5 font-bold text-white disabled:opacity-40"
                          >
                            {t("admin.common.next")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function AssessmentEditForm({
  initial,
  disabled,
  onSubmit,
}: {
  initial: {
    title: string;
    description: string;
    status: string;
    minimum_score: number;
    max_attempts: number | null;
    is_required: boolean;
  };
  disabled: boolean;
  onSubmit: (payload: Record<string, string | number | boolean | null>) => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: initial.title,
    description: initial.description,
    status: initial.status,
    minimum_score: initial.minimum_score,
    max_attempts: initial.max_attempts ?? 0,
    is_required: initial.is_required,
  });
  const inputClass = "h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-xs outline-none transition focus:border-[#F47822]";

  return (
    <div className="mt-3 grid gap-2.5">
      <label className="grid gap-1 text-[11px] font-bold text-[#3A3A3A]/60">
        {t("admin.drawers.assessment.form.title")}
        <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className={inputClass} />
      </label>
      <label className="grid gap-1 text-[11px] font-bold text-[#3A3A3A]/60">
        {t("admin.drawers.assessment.form.description")}
        <input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className={inputClass} />
      </label>
      <div className="grid grid-cols-3 gap-2.5">
        <label className="grid gap-1 text-[11px] font-bold text-[#3A3A3A]/60">
          {t("admin.drawers.assessment.form.status")}
          <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={inputClass}>
            {["draft", "published"].map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-[#3A3A3A]/60">
          {t("admin.drawers.assessment.form.minScore")}
          <input type="number" min={0} max={100} value={form.minimum_score} onChange={(event) => setForm((current) => ({ ...current, minimum_score: Number(event.target.value) }))} className={inputClass} />
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-[#3A3A3A]/60">
          {t("admin.drawers.assessment.form.maxTries")}
          <input type="number" min={0} value={form.max_attempts} onChange={(event) => setForm((current) => ({ ...current, max_attempts: Number(event.target.value) }))} className={inputClass} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold text-[#3A3A3A]/70">
        <input
          type="checkbox"
          checked={form.is_required}
          onChange={(event) => setForm((current) => ({ ...current, is_required: event.target.checked }))}
          className="h-4 w-4 rounded accent-[#F47822]"
        />
        {t("admin.drawers.assessment.form.requiredCheck")}
      </label>
      <button
        type="button"
        disabled={disabled || !form.title.trim()}
        onClick={() =>
          onSubmit({
            title: form.title.trim(),
            description: form.description.trim() || null,
            status: form.status,
            minimum_score: form.minimum_score,
            max_attempts: form.max_attempts > 0 ? form.max_attempts : null,
            is_required: form.is_required,
          })
        }
        className="rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#e96916] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t("admin.drawers.assessment.form.saveChanges")}
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white px-3.5 py-3 text-center shadow-[0_4px_14px_rgba(58,58,58,.05)]">
      <p className="text-xl font-bold text-[#3A3A3A]">{value}</p>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-[.1em] text-[#3A3A3A]/45">{label}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3A3A3A]/45">{children}</h3>;
}
