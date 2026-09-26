import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/lib/api/errors";

import { adminApi } from "../api/adminApi";
import { ErrorAdminPage, LoadingAdminPage, Status } from "./AdminUi";

function errorMessage(reason: unknown, fallback: string): string {
  if (reason instanceof ApiError && reason.errors) {
    const first = Object.values(reason.errors).flat().find((item): item is string => typeof item === "string");
    if (first) return first;
  }
  return reason instanceof Error ? reason.message : fallback;
}

export function QuizDetailDrawer({ quizId, onClose }: { quizId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [attemptsOpen, setAttemptsOpen] = useState(false);
  const [attemptsPage, setAttemptsPage] = useState(1);

  const detail = useQuery({ queryKey: ["admin", "quiz", quizId], queryFn: () => adminApi.quizDetail(quizId) });
  const attempts = useQuery({
    queryKey: ["admin", "quiz", quizId, "attempts", attemptsPage],
    queryFn: () => adminApi.quizAttempts(quizId, { page: attemptsPage, per_page: 8 }),
    enabled: attemptsOpen,
  });

  const run = async (key: string, work: () => Promise<unknown>, success: string, close = false) => {
    if (busy !== null) return;
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      await work();
      await client.invalidateQueries({ queryKey: ["admin", "quiz"] });
      await client.invalidateQueries({ queryKey: ["admin", "quizzes"] });
      setNotice(success);
      if (close) onClose();
    } catch (reason) {
      setError(errorMessage(reason, t("admin.drawers.quiz.actionError")));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={t("admin.drawers.quiz.dialogAria")}>
      <button type="button" aria-label={t("admin.drawers.quiz.closeInspection")} onClick={onClose} className="absolute inset-0 bg-[#3A3A3A]/45 backdrop-blur-[2px]" />
      <aside className="absolute inset-y-0 end-0 flex w-full max-w-xl flex-col overflow-hidden bg-[#F7F7F7] shadow-2xl">
        <div className="h-1.5 w-full bg-[#F47822]" />
        <div className="flex items-start justify-between gap-3 border-b border-[#3A3A3A]/8 bg-white p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">{t("admin.drawers.quiz.eyebrow")}</p>
            <h2 className="mt-1 truncate text-lg font-bold text-[#3A3A3A]">{detail.data?.title ?? t("admin.common.loading")}</h2>
            {detail.data && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Status value={detail.data.status} />
                <span className="rounded-full bg-[#3A3A3A]/5 px-2.5 py-1 text-[10px] font-bold text-[#3A3A3A]/55">
                  {detail.data.course ?? t("admin.drawers.quiz.noCourse")} · {detail.data.section ?? ""}
                </span>
              </div>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label={t("admin.drawers.quiz.close")} className="rounded-lg p-1.5 text-[#3A3A3A]/45 transition hover:bg-[#F3F3F3] hover:text-[#3A3A3A]">
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
              <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <Stat label={t("admin.drawers.quiz.stats.questions")} value={detail.data.stats.questions_count} />
                <Stat label={t("admin.drawers.quiz.stats.attempts")} value={detail.data.stats.attempts_count} />
                <Stat label={t("admin.drawers.quiz.stats.passRate")} value={detail.data.stats.pass_rate === null ? "—" : `${detail.data.stats.pass_rate}%`} />
                <Stat label={t("admin.drawers.quiz.stats.avgScore")} value={detail.data.stats.average_percentage === null ? "—" : `${detail.data.stats.average_percentage}%`} />
              </section>

              <section>
                <SectionTitle>{t("admin.drawers.quiz.questionsTitle", { count: detail.data.questions.length })}</SectionTitle>
                <div className="mt-2.5 space-y-2.5">
                  {detail.data.questions.map((question) => (
                    <div key={question.id} className="rounded-2xl border border-[#3A3A3A]/8 bg-white px-4 py-3.5">
                      <p className="text-xs font-bold text-[#3A3A3A]">
                        {question.position}. {question.question}
                      </p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-[#3A3A3A]/40">
                        {t("admin.drawers.quiz.pointsMeta", { type: question.type, count: question.points })}
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {question.options.map((option) => (
                          <li
                            key={option.id}
                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${
                              option.is_correct ? "bg-emerald-50 font-bold text-emerald-700" : "bg-[#FCFCFC] text-[#3A3A3A]/60"
                            }`}
                          >
                            {option.is_correct && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                            <span className="truncate">{option.option}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {detail.data.questions.length === 0 && (
                    <p className="rounded-xl bg-white px-4 py-3 text-xs text-[#3A3A3A]/50">{t("admin.drawers.quiz.noQuestions")}</p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-4">
                <div className="flex items-center justify-between">
                  <SectionTitle>{t("admin.drawers.quiz.moderate")}</SectionTitle>
                  <button
                    type="button"
                    onClick={() => setEditing((open) => !open)}
                    className="rounded-lg border border-[#3A3A3A]/10 px-3 py-1.5 text-[11px] font-bold text-[#3A3A3A]/65 transition hover:border-[#F47822]/40 hover:text-[#F47822]"
                  >
                    {editing ? t("admin.common.close") : t("admin.common.edit")}
                  </button>
                </div>
                {editing && (
                  <QuizEditForm
                    key={detail.data.id}
                    initial={{
                      title: detail.data.title,
                      description: detail.data.description ?? "",
                      status: detail.data.status,
                      pass_percentage: detail.data.pass_percentage,
                      max_attempts: detail.data.max_attempts,
                      time_limit: detail.data.time_limit,
                    }}
                    disabled={busy !== null}
                    onSubmit={(payload) => {
                      setEditing(false);
                      void run("update", () => adminApi.updateQuiz(quizId, payload), t("admin.drawers.quiz.notices.updated"));
                    }}
                  />
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.data.status === "published" && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void run("disable", () => adminApi.disableQuiz(quizId), t("admin.drawers.quiz.notices.disabled"))}
                      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                    >
                      {t("admin.drawers.quiz.disableQuiz")}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void run("delete", () => adminApi.deleteQuiz(quizId), t("admin.drawers.quiz.notices.deleted"), true)}
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
                    {t("admin.drawers.quiz.attemptsTitle", { count: detail.data.stats.attempts_count })}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-[#3A3A3A]/40 transition-transform ${attemptsOpen ? "rotate-180" : ""}`} />
                </button>
                {attemptsOpen && (
                  <div className="mt-2.5 space-y-2">
                    {attempts.isLoading && <p className="text-xs text-[#3A3A3A]/50">{t("admin.drawers.quiz.loadingAttempts")}</p>}
                    {attempts.data?.data.map((attempt) => (
                      <AttemptRow
                        key={attempt.id}
                        title={attempt.student ?? attempt.email ?? t("admin.drawers.quiz.anonymous")}
                        subtitle={`${attempt.score ?? "—"}/${attempt.total_points ?? "—"}${attempt.percentage != null ? ` · ${attempt.percentage}%` : ""} · ${t("admin.drawers.quiz.tryNumber", { n: attempt.attempt_number })}${attempt.tab_switch_count ? ` · ${t("admin.drawers.quiz.tabSwitches", { count: attempt.tab_switch_count })}` : ""}`}
                        ok={attempt.passed}
                        lines={attempt.answers.map((answer) => ({
                          text: answer.question ?? t("admin.drawers.quiz.questionFallback"),
                          ok: answer.is_correct,
                        }))}
                      />
                    ))}
                    {attempts.data && attempts.data.data.length === 0 && (
                      <p className="rounded-xl bg-white px-4 py-3 text-xs text-[#3A3A3A]/50">{t("admin.drawers.quiz.noAttempts")}</p>
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

export function AttemptRow({
  title,
  subtitle,
  ok,
  lines,
}: {
  title: string;
  subtitle: string;
  ok: boolean;
  lines?: Array<{ text: string; ok: boolean }>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl bg-white px-4 py-3">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-3 text-left rtl:text-right">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${ok ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold text-[#3A3A3A]">{title}</span>
          <span className="mt-0.5 block truncate text-[11px] text-[#3A3A3A]/50">{subtitle}</span>
        </span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {ok ? t("admin.drawers.quiz.passed") : t("admin.drawers.quiz.failed")}
        </span>
        {lines && lines.length > 0 && (
          <ChevronDown className={`h-4 w-4 shrink-0 text-[#3A3A3A]/40 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>
      {open && lines && lines.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-[#3A3A3A]/8 pt-2">
          {lines.map((line, index) => (
            <li key={index} className="flex items-start gap-2 text-[11px]">
              <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${line.ok ? "text-emerald-500" : "text-red-300"}`} />
              <span className="text-[#3A3A3A]/65">{line.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QuizEditForm({
  initial,
  disabled,
  onSubmit,
}: {
  initial: {
    title: string;
    description: string;
    status: string;
    pass_percentage: number;
    max_attempts: number | null;
    time_limit: number | null;
  };
  disabled: boolean;
  onSubmit: (payload: Record<string, string | number | null>) => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: initial.title,
    description: initial.description,
    status: initial.status,
    pass_percentage: initial.pass_percentage,
    max_attempts: initial.max_attempts ?? 0,
    time_limit: initial.time_limit ?? 0,
  });
  const inputClass = "h-10 w-full rounded-xl border border-[#3A3A3A]/10 bg-white px-3 text-xs outline-none transition focus:border-[#F47822]";

  return (
    <div className="mt-3 grid gap-2.5">
      <label className="grid gap-1 text-[11px] font-bold text-[#3A3A3A]/60">
        {t("admin.drawers.quiz.form.title")}
        <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className={inputClass} />
      </label>
      <label className="grid gap-1 text-[11px] font-bold text-[#3A3A3A]/60">
        {t("admin.drawers.quiz.form.description")}
        <input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className={inputClass} />
      </label>
      <div className="grid grid-cols-3 gap-2.5">
        <label className="grid gap-1 text-[11px] font-bold text-[#3A3A3A]/60">
          {t("admin.drawers.quiz.form.status")}
          <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={inputClass}>
            {["draft", "published", "archived"].map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-[#3A3A3A]/60">
          {t("admin.drawers.quiz.form.passPct")}
          <input type="number" min={0} max={100} value={form.pass_percentage} onChange={(event) => setForm((current) => ({ ...current, pass_percentage: Number(event.target.value) }))} className={inputClass} />
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-[#3A3A3A]/60">
          {t("admin.drawers.quiz.form.maxTries")}
          <input type="number" min={0} value={form.max_attempts} onChange={(event) => setForm((current) => ({ ...current, max_attempts: Number(event.target.value) }))} className={inputClass} />
        </label>
      </div>
      <button
        type="button"
        disabled={disabled || !form.title.trim()}
        onClick={() =>
          onSubmit({
            title: form.title.trim(),
            description: form.description.trim() || null,
            status: form.status,
            pass_percentage: form.pass_percentage,
            max_attempts: form.max_attempts > 0 ? form.max_attempts : null,
            time_limit: form.time_limit > 0 ? form.time_limit : null,
          })
        }
        className="rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#e96916] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t("admin.drawers.quiz.form.saveChanges")}
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
