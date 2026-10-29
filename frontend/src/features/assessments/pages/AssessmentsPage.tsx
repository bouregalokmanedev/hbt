import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  LockKeyhole,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { errorMessage } from "@/lib/api/safe-error";
import {
  getAssessments,
  type Assessment,
} from "../api/assessments.api";

export function AssessmentsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Assessment | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    void getAssessments()
      .then((data) => setItems(data))
      .catch((reason: unknown) =>
        setError(errorMessage(reason, t("assessments.loadFail"))),
      )
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <main className="min-h-full bg-background p-8 text-sm text-muted-foreground">
        {t("assessments.loading")}
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-full bg-background p-8">
        <div
          role="alert"
          className="mx-auto flex max-w-xl flex-col items-start gap-1 rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10"
        >
          <AlertTriangle className="h-5 w-5 text-red-700 dark:text-red-400" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/20"
          >
            <RefreshCw className="h-4 w-4" />
            {t("common.tryAgain")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
        <section className="rounded-3xl bg-[#3A3A3A] p-7 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">
            {t("assessments.hero.eyebrow")}
          </p>
          <div className="mt-2 flex items-end justify-between gap-5">
            <div>
              <h1 className="text-2xl font-bold">{t("assessments.hero.title")}</h1>
              <p className="mt-1 text-sm text-white/60">
                {t("assessments.hero.description")}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
              <Award className="h-5 w-5 text-[#F47822]" />
              <b>{items.filter((item) => item.eligibility.eligible).length}</b>
            </div>
          </div>
        </section>

        {items.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-dashed border-[#3A3A3A]/15 bg-white p-10 text-center dark:border-white/15 dark:bg-[#1b1b20]">
            <ClipboardCheck className="mx-auto h-9 w-9 text-[#F47822]" />
            <h2 className="mt-4 text-lg font-bold text-[#3A3A3A] dark:text-[#ececef]">
              {t("assessments.emptyTitle")}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {t("assessments.emptyDesc")}
            </p>
            <Link
              to="/catalog"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-semibold text-white hover:bg-[#df6817]"
            >
              {t("assessments.emptyCta")}
              <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
          </section>
        ) : (
          <section className="mt-6 grid gap-5 lg:grid-cols-2">
            {items.map((item) => (
              <AssessmentCard
                key={item.id}
                assessment={item}
                onStart={() => setSelected(item)}
              />
            ))}
          </section>
        )}
      </div>

      {selected ? (
        <ExamInstructions
          assessment={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </main>
  );
}

function AssessmentCard({
  assessment,
  onStart,
}: {
  assessment: Assessment;
  onStart: () => void;
}) {
  const { t } = useTranslation();
  const history = assessment.attempt_history;
  const eligible = assessment.eligibility.eligible;
  const hasInProgress = Boolean(history?.in_progress_attempt_id);
  const exhausted =
    history != null
    && history.remaining_attempts === 0
    && !hasInProgress;
  const onCooldown =
    history?.cooldown_until != null
    && new Date(history.cooldown_until).getTime() > Date.now();
  const unlocked = eligible && (history?.can_start ?? true) && !exhausted && !onCooldown;

  const buttonLabel = !eligible
    ? t("assessments.lockedBtn")
    : exhausted
      ? t("assessments.noAttemptsLeft")
      : onCooldown
        ? t("assessments.cooldownBtn")
        : hasInProgress
          ? t("assessments.resumeBtn")
          : history?.passed
            ? t("assessments.retakeBtn")
            : history && history.attempts_count > 0
              ? t("assessments.retryBtn")
              : t("assessments.startBtn");

  const attemptsLabel = assessment.max_attempts === null
    ? t("assessments.unlimitedAttempts")
    : t("assessments.attemptsUsed", {
        used: history?.attempts_count ?? 0,
        max: assessment.max_attempts,
      });

  return (
    <article
      data-testid="assessment-card"
      className="rounded-3xl border border-[#3A3A3A]/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1b1b20]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-[#F47822]" />
          {history?.passed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              {t("assessments.passedBadge")}
            </span>
          ) : null}
        </div>

        {eligible ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <LockKeyhole className="h-5 w-5 text-[#3A3A3A]/35 dark:text-white/35" />
        )}
      </div>

      <p className="mt-5 text-[10px] font-bold uppercase tracking-[.15em] text-[#F47822]">
        {assessment.course_title}
      </p>
      <h2 className="mt-2 text-xl font-bold">{assessment.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{assessment.description}</p>

      <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
        <Requirement
          label={t("assessments.reqLessons")}
          value={`${assessment.eligibility.lessons.completed}/${assessment.eligibility.lessons.required}`}
        />
        <Requirement
          label={t("assessments.reqQuizzes")}
          value={`${assessment.eligibility.quizzes.completed}/${assessment.eligibility.quizzes.required}`}
        />
        <Requirement
          label={t("assessments.reqScenarios")}
          value={`${assessment.eligibility.scenarios.completed}/${assessment.eligibility.scenarios.required}`}
        />
      </div>

      {history && history.attempts_count > 0 ? (
        <div className="mt-4 grid gap-2 rounded-2xl bg-[#F7F7F7] p-3 text-xs dark:bg-[#101013] sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("assessments.bestScore")}
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 font-bold text-foreground">
              <Trophy className="h-3.5 w-3.5 text-[#F47822]" />
              {history.best_score === null
                ? "—"
                : `${Math.round(Number(history.best_score))}%`}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("assessments.attempts")}
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 font-bold text-foreground">
              <RotateCcw className="h-3.5 w-3.5 text-[#F47822]" />
              {attemptsLabel}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("assessments.remainingAttempts")}
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 font-bold text-foreground">
              <Timer className="h-3.5 w-3.5 text-[#F47822]" />
              {history.remaining_attempts === null
                ? t("assessments.openAttempts")
                : history.remaining_attempts}
            </p>
          </div>
        </div>
      ) : null}

      {onCooldown && history?.cooldown_until ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
          {t("assessments.cooldownNote", {
            time: new Date(history.cooldown_until).toLocaleString(),
          })}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        {unlocked ? (
          <button
            type="button"
            onClick={onStart}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#F47822] px-4 py-3 text-sm font-semibold text-white hover:bg-[#df6817]"
          >
            <PlayCircle className="h-4 w-4" />
            {buttonLabel}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#3A3A3A]/10 px-4 py-3 text-sm text-[#3A3A3A]/40 dark:bg-white/10 dark:text-white/40"
          >
            {buttonLabel}
          </button>
        )}

        {history?.passed ? (
          <Link
            to="/certificates"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#F47822]/30 px-4 py-3 text-sm font-semibold text-[#F47822] transition hover:bg-[#F47822]/5"
          >
            <Award className="h-4 w-4" />
            {t("assessments.viewCerts")}
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function ExamInstructions({
  assessment,
  onClose,
}: {
  assessment: Assessment;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const history = assessment.attempt_history;
  const resuming = Boolean(history?.in_progress_attempt_id);
  const minutes = assessment.time_limit_minutes ?? 30;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A3A]/60 p-5 backdrop-blur-sm dark:bg-white/60">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exam-instructions-title"
        className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#1b1b20]"
      >
        <header className="relative overflow-hidden bg-[#3A3A3A] px-6 py-7 text-white sm:px-7">
          <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-[#F47822]/20 blur-3xl" />
          <button
            type="button"
            onClick={onClose}
            className="absolute end-4 top-4 rounded-lg p-1.5 text-white/55 transition hover:bg-white/10 hover:text-white"
            aria-label={t("assessments.closeAria")}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">
              {resuming ? t("assessments.resumeTag") : t("assessments.examTag")}
            </p>
            <h2
              id="exam-instructions-title"
              className="mt-2 max-w-md text-2xl font-bold tracking-tight"
            >
              {resuming ? t("assessments.resumeTitle") : t("assessments.readyTitle")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/60">{assessment.title}</p>
          </div>
        </header>

        <div className="p-6 sm:p-7">
          <div className="grid grid-cols-3 gap-3">
            <Info
              icon={Clock3}
              label={t("assessments.duration")}
              value={t("assessments.minuteLimitCount", { count: minutes })}
            />
            <Info
              icon={ClipboardCheck}
              label={t("assessments.questions")}
              value={`${assessment.questions_count}`}
            />
            <Info
              icon={Award}
              label={t("assessments.attempts")}
              value={
                assessment.max_attempts
                  ? t("assessments.attemptsUsed", {
                      used: history?.attempts_count ?? 0,
                      max: assessment.max_attempts,
                    })
                  : t("assessments.unlimitedAttempts")
              }
            />
          </div>

          <div className="mt-5 rounded-2xl border border-[#F47822]/15 bg-[#F47822]/5 p-4">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10">
                <ShieldCheck className="h-4 w-4 text-[#F47822]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                  {t("assessments.focusedTitle")}
                </h3>
                <ul className="mt-2 space-y-1 text-xs leading-5 text-[#3A3A3A]/60 dark:text-white/60">
                  <li>• {t("assessments.ruleTimer", { count: minutes })}</li>
                  <li>• {t("assessments.ruleTabs")}</li>
                  <li>• {t("assessments.ruleSubmit")}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#3A3A3A]/10 px-4 py-3 text-sm font-semibold text-[#3A3A3A]/65 transition hover:bg-[#F7F7F7] dark:border-white/10 dark:text-white/65 dark:hover:bg-[#101013]"
            >
              {t("assessments.notNow")}
            </button>
            <Link
              to={`/assessments/${assessment.id}/exam`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,.2)] transition hover:bg-[#df6817]"
            >
              {resuming ? t("assessments.resumeBtn") : t("assessments.beginBtn")}
              <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[#F7F7F7] p-3 dark:bg-[#101013]">
      <Icon className="h-4 w-4 text-[#F47822]" />
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
        {label}
      </p>
      <p className="mt-1 text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">
        {value}
      </p>
    </div>
  );
}

function Requirement({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F7F7F7] p-3 dark:bg-[#101013]">
      <span className="text-[#3A3A3A]/50 dark:text-white/50">{label}</span>
      <b className="mt-1 block">{value}</b>
    </div>
  );
}
