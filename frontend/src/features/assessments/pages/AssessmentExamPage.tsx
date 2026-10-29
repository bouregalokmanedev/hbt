import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Info,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/lib/api/errors";
import { errorMessage } from "@/lib/api/safe-error";
import { AttemptTimer } from "@/features/lessons/components/AttemptTimer";
import { TabWarning, TimeoutNotice } from "@/features/lessons/pages/QuizPlayerPage";
import {
  assessmentAttemptsApi,
  type AssessmentAnswerPayload,
  type AssessmentAttempt,
  type AssessmentQuestion,
  type AssessmentResult,
  type AssessmentQuestionType,
  type SaveAnswerPayload,
} from "../api/assessments.api";

const AUTOSAVE_DELAY_MS = 450;

const CONFIDENCE_LEVELS = [
  "guessing",
  "somewhat_confident",
  "confident",
  "very_confident",
] as const;

const CHOICE_TYPES = new Set<AssessmentQuestionType>([
  "single_choice",
  "multiple_choice",
  "true_false",
]);

interface AnswerState {
  optionIds: string[];
  value: string;
  orderedIds: string[];
  matches: Record<string, string>;
  confidence: string | null;
  /** Ordering questions only: the learner actually moved an item. */
  reordered: boolean;
}

type SaveState = "idle" | "saving" | "saved" | "failed";

const initialAnswer = (question: AssessmentQuestion): AnswerState => ({
  optionIds: [],
  value: "",
  orderedIds: question.options.map((option) => option.id),
  matches: {},
  confidence: null,
  reordered: false,
});

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => String(item)) : [];

const normalizeMatches = (value: unknown): Record<string, string> => {
  if (Array.isArray(value)) {
    return Object.fromEntries(
      value
        .filter(
          (pair): pair is { left: unknown; right: unknown } =>
            typeof pair === "object" && pair !== null && "left" in pair && "right" in pair,
        )
        .map((pair) => [String(pair.left), String(pair.right)]),
    );
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([left, right]) => [left, String(right)]),
    );
  }

  return {};
};

/** Keep the learner's saved order, then append any options added since. */
const mergeOrder = (saved: string[], optionIds: string[]): string[] => {
  const valid = saved.filter((id) => optionIds.includes(id));
  const missing = optionIds.filter((id) => !valid.includes(id));
  return [...Array.from(new Set(valid)), ...missing];
};

const hydrateAnswers = (attempt: AssessmentAttempt): Record<string, AnswerState> => {
  const savedRows = new Map(
    (attempt.answers ?? []).map((row) => [row.question_id, row]),
  );

  const hydrated: Record<string, AnswerState> = {};

  for (const question of attempt.assessment?.questions ?? []) {
    const state = initialAnswer(question);
    const row = savedRows.get(question.id);

    if (!row) {
      hydrated[question.id] = state;
      continue;
    }

    const raw = (row.answer ?? {}) as Record<string, unknown>;
    const optionIds = row.selected_option_ids.length > 0
      ? row.selected_option_ids
      : toStringArray(raw.selected_option_ids);

    state.optionIds = optionIds.filter((id) =>
      question.options.some((option) => option.id === id),
    );

    if (typeof raw.value === "string") {
      state.value = raw.value;
    } else if (typeof raw.value === "number") {
      state.value = String(raw.value);
    }

    const savedOrder = toStringArray(raw.ordered_ids);
    if (savedOrder.length > 0) {
      state.orderedIds = mergeOrder(
        savedOrder,
        question.options.map((option) => option.id),
      );
    }

    state.matches = normalizeMatches(raw.matches);
    state.confidence = row.confidence_level ?? null;
    state.reordered = question.type === "ordering" && savedOrder.length > 0;

    hydrated[question.id] = state;
  }

  return hydrated;
};

const isAnswered = (question: AssessmentQuestion, answer: AnswerState | undefined): boolean => {
  if (!answer) return false;

  switch (question.type) {
    case "single_choice":
    case "multiple_choice":
    case "true_false":
      return answer.optionIds.length > 0;
    case "ordering":
      // The initial order is a valid permutation, but an untouched ordering
      // question has not been answered and must not count towards submission.
      return answer.reordered
        && answer.orderedIds.length === question.options.length;
    case "matching":
      return (question.matching?.left ?? []).every(
        (left) => (answer.matches[left] ?? "").trim() !== "",
      );
    default:
      return answer.value.trim() !== "";
  }
};

const hasAnyAnswer = (question: AssessmentQuestion, answer: AnswerState | undefined): boolean => {
  if (!answer) return false;

  switch (question.type) {
    case "single_choice":
    case "multiple_choice":
    case "true_false":
      return answer.optionIds.length > 0;
    case "ordering":
      return answer.reordered;
    case "matching":
      return Object.values(answer.matches).some((value) => value.trim() !== "");
    default:
      return answer.value.trim() !== "";
  }
};

const answerPayload = (
  question: AssessmentQuestion,
  answer: AnswerState,
): Omit<AssessmentAnswerPayload, "question_id"> | null => {
  const confidence = answer.confidence;
  const base = confidence ? { confidence_level: confidence } : {};

  switch (question.type) {
    case "single_choice":
    case "multiple_choice":
    case "true_false":
      return { option_ids: answer.optionIds, ...base };
    case "ordering":
      return { ordered_ids: answer.orderedIds, ...base };
    case "matching":
      return { matches: answer.matches, ...base };
    case "numeric": {
      const numeric = Number(answer.value);
      if (answer.value.trim() === "" || Number.isNaN(numeric)) return null;
      return { value: numeric, ...base };
    }
    default:
      return { value: answer.value, ...base };
  }
};

export function AssessmentExamPage() {
  const { t } = useTranslation();
  const { assessmentId } = useParams();

  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expired, setExpired] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [tabWarning, setTabWarning] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveState>("idle");
  const [round, setRound] = useState(0);

  const saveTimers = useRef<Record<string, number>>({});
  const pendingSaves = useRef(0);

  useEffect(() => {
    if (!assessmentId) return;

    let cancelled = false;

    setAttempt(null);
    setAnswers({});
    setResult(null);
    setError(null);
    setExpired(false);
    setBlocked(false);
    setConfirmOpen(false);
    setSaveStatus("idle");
    pendingSaves.current = 0;

    void assessmentAttemptsApi
      .start(assessmentId)
      .then((started) => {
        if (cancelled) return;

        setAttempt(started);
        setAnswers(hydrateAnswers(started));

        if (started.status === "expired") setExpired(true);
        if (started.status === "blocked") setBlocked(true);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(errorMessage(reason, t("assessments.startFail")));
      });

    return () => {
      cancelled = true;
    };
  }, [assessmentId, round, t]);

  useEffect(
    () => () => {
      Object.values(saveTimers.current).forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const expire = useCallback(async () => {
    if (!attempt || !assessmentId || expired) return;

    setExpired(true);

    try {
      await assessmentAttemptsApi.expire(assessmentId, attempt.id);
    } catch {
      // The server already timed the attempt out; the UI is correct.
    }
  }, [assessmentId, attempt, expired]);

  const warnTabSwitch = useCallback(async () => {
    if (!attempt || !assessmentId) return;

    try {
      const payload = await assessmentAttemptsApi.tabSwitch(assessmentId, attempt.id);
      if (payload?.blocked) {
        setBlocked(true);
      } else {
        setTabWarning(true);
      }
    } catch {
      setTabWarning(true);
    }
  }, [assessmentId, attempt]);

  const persistAnswer = useCallback(
    async (questionId: string, payload: SaveAnswerPayload) => {
      if (!assessmentId || !attempt) return;

      pendingSaves.current += 1;
      setSaveStatus("saving");

      try {
        await assessmentAttemptsApi.saveAnswer(
          assessmentId,
          attempt.id,
          questionId,
          payload,
        );

        pendingSaves.current = Math.max(0, pendingSaves.current - 1);
        if (pendingSaves.current === 0) setSaveStatus("saved");
      } catch (reason) {
        pendingSaves.current = Math.max(0, pendingSaves.current - 1);

        // A 422 means the attempt is closed, expired or blocked.
        if (reason instanceof ApiError && reason.isValidationError) {
          setExpired(true);
          return;
        }

        setSaveStatus("failed");
      }
    },
    [assessmentId, attempt],
  );

  const queueSave = useCallback(
    (questionId: string, payload: SaveAnswerPayload, delay = AUTOSAVE_DELAY_MS) => {
      window.clearTimeout(saveTimers.current[questionId]);
      saveTimers.current[questionId] = window.setTimeout(() => {
        void persistAnswer(questionId, payload);
      }, delay);
    },
    [persistAnswer],
  );

  const updateAnswer = useCallback(
    (
      question: AssessmentQuestion,
      patch: Partial<AnswerState>,
      saveImmediately = false,
    ) => {
      const previous = answers[question.id] ?? initialAnswer(question);
      const next: AnswerState = { ...previous, ...patch };

      setAnswers((current) => ({ ...current, [question.id]: next }));

      if (hasAnyAnswer(question, next)) {
        const payload = answerPayload(question, next);

        if (payload) {
          queueSave(
            question.id,
            payload,
            saveImmediately ? 0 : AUTOSAVE_DELAY_MS,
          );
        }
      }
    },
    [answers, queueSave],
  );

  const questions = useMemo(
    () => attempt?.assessment?.questions ?? [],
    [attempt],
  );

  const answeredCount = questions.filter((question) =>
    isAnswered(question, answers[question.id]),
  ).length;

  const unansweredRequired = questions.filter(
    (question) => question.required && !isAnswered(question, answers[question.id]),
  ).length;

  const hasAnyPayload = questions.some((question) =>
    hasAnyAnswer(question, answers[question.id]),
  );

  const canSubmit = !submitting
    && questions.length > 0
    && unansweredRequired === 0
    && (hasAnyPayload || questions.every((question) => !question.required));

  const chooseOption = (question: AssessmentQuestion, optionId: string) => {
    const current = answers[question.id]?.optionIds ?? [];

    if (question.type === "multiple_choice") {
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      updateAnswer(question, { optionIds: next }, true);
      return;
    }

    updateAnswer(question, { optionIds: [optionId] }, true);
  };

  const moveOrder = (question: AssessmentQuestion, index: number, direction: -1 | 1) => {
    const current = answers[question.id]?.orderedIds
      ?? question.options.map((option) => option.id);
    const target = index + direction;

    if (target < 0 || target >= current.length) return;

    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    updateAnswer(question, { orderedIds: next, reordered: true }, true);
  };

  const setMatch = (question: AssessmentQuestion, left: string, right: string) => {
    const current = answers[question.id]?.matches ?? {};
    updateAnswer(question, { matches: { ...current, [left]: right } }, true);
  };

  const setConfidence = (question: AssessmentQuestion, confidence: string) => {
    updateAnswer(question, { confidence: confidence || null }, true);
  };

  const submit = async () => {
    if (!assessmentId || !attempt) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = questions.flatMap((question) => {
        const answer = answers[question.id];
        if (!answer || !hasAnyAnswer(question, answer)) return [];

        const shaped = answerPayload(question, answer);
        return shaped ? [{ question_id: question.id, ...shaped }] : [];
      });

      const data = await assessmentAttemptsApi.submit(
        assessmentId,
        attempt.id,
        payload,
      );

      setResult(data);
      setConfirmOpen(false);
    } catch (reason) {
      setError(errorMessage(reason, t("assessments.submitFail")));
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => {
    if (!assessmentId) return;

    Object.values(saveTimers.current).forEach((timer) => window.clearTimeout(timer));
    saveTimers.current = {};
    setRound((value) => value + 1);
  };

  const saveLabel =
    saveStatus === "saving"
      ? t("assessments.checkpoint.saveSaving")
      : saveStatus === "saved"
        ? t("assessments.checkpoint.saveSaved")
        : saveStatus === "failed"
          ? t("assessments.checkpoint.saveFailed")
          : "";

  return (
    <main className="min-h-screen bg-background px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/assessments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#F47822] transition hover:text-[#df6817]"
        >
          <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
          {t("assessments.backBtn")}
        </Link>

        <section className="mt-5 overflow-hidden rounded-3xl border border-[#3A3A3A]/10 bg-white shadow-[0_12px_35px_rgba(58,58,58,0.08)] dark:border-white/10 dark:bg-[#1b1b20]">
          <header className="relative overflow-hidden bg-[#3A3A3A] p-6 text-white sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#F47822]/15 blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t("assessments.secureTag")}
                  </p>
                  <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    {attempt?.assessment?.title ?? t("assessments.preparing")}
                  </h1>
                  <p className="mt-2 text-sm text-white/60">{t("assessments.examDesc")}</p>
                </div>

                {attempt?.assessment ? (
                  <div className="hidden rounded-2xl border border-white/10 bg-white/[.07] p-3 text-right backdrop-blur-sm sm:block">
                    <p className="text-[9px] font-bold uppercase tracking-[.12em] text-white/45">
                      {t("assessments.passScore")}
                    </p>
                    <p className="mt-1 text-xl font-bold">{attempt.assessment.minimum_score}%</p>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {attempt?.assessment ? (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.06] px-3 py-2 text-xs text-white/70">
                    <Clock3 className="h-4 w-4 text-[#F47822]" />
                    {t("assessments.minuteLimitCount", {
                      count: attempt.assessment.time_limit_minutes ?? 30,
                    })}
                  </div>
                ) : null}

                {attempt?.assessment ? (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.06] px-3 py-2 text-xs text-white/70">
                    <ClipboardCheck className="h-4 w-4 text-[#F47822]" />
                    {t("assessments.questionsCount", { count: questions.length })}
                  </div>
                ) : null}

                {attempt?.assessment && attempt.status === "in_progress" ? (
                  <AttemptTimer
                    expiresAt={attempt.expires_at}
                    onExpire={() => void expire()}
                    onVisibilityWarning={() => void warnTabSwitch()}
                  />
                ) : null}
              </div>
            </div>
          </header>

          <div className="p-6 sm:p-8">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                <p>{error}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={retry}
                    className="rounded-xl bg-[#F47822] px-4 py-2 text-sm font-semibold text-white"
                  >
                    {t("common.tryAgain")}
                  </button>
                  <Link
                    to="/assessments"
                    className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 dark:border-red-500/40 dark:text-red-300"
                  >
                    {t("assessments.backBtn")}
                  </Link>
                </div>
              </div>
            ) : result ? (
              <ResultPanel
                result={result}
                onRetry={retry}
                canRetry={!result.passed}
                submitting={submitting}
              />
            ) : !attempt ? (
              <div className="flex flex-col items-center py-14">
                <Loader2 className="h-7 w-7 animate-spin text-[#F47822]" />
                <p className="mt-4 text-sm text-muted-foreground">
                  {t("assessments.loadingExam")}
                </p>
              </div>
            ) : blocked ? (
              <BlockedPanel />
            ) : expired || attempt.status === "expired" ? (
              <TimeoutNotice kind="assessment" to="/assessments" />
            ) : attempt.status !== "in_progress" ? (
              <BlockedPanel />
            ) : (
              <>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F7F7F7] px-4 py-3 text-xs dark:bg-[#101013]">
                  <span className="flex items-center gap-2 font-medium text-[#3A3A3A]/65 dark:text-white/65">
                    <ClipboardCheck className="h-4 w-4 text-[#F47822]" />
                    {t("assessments.attempt", { n: attempt.attempt_number })}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                      <span
                        className="block h-full rounded-full bg-[#F47822] transition-all"
                        style={{
                          width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%`,
                        }}
                      />
                    </span>
                    <span className="font-semibold text-[#F47822]">
                      {t("assessments.answered", { done: answeredCount, total: questions.length })}
                    </span>
                  </span>
                </div>

                <div className="space-y-7">
                  {questions.map((question, index) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      index={index}
                      answer={answers[question.id] ?? initialAnswer(question)}
                      disabled={submitting}
                      onChoose={(optionId) => chooseOption(question, optionId)}
                      onValue={(value) => updateAnswer(question, { value })}
                      onMove={(from, direction) => moveOrder(question, from, direction)}
                      onMatch={(left, right) => setMatch(question, left, right)}
                      onConfidence={(confidence) => setConfidence(question, confidence)}
                    />
                  ))}
                </div>

                <p
                  aria-live="polite"
                  className="mt-4 text-xs text-muted-foreground"
                >
                  {saveLabel || "\u00A0"}
                </p>

                <div className="mt-4 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Target className="h-4 w-4 shrink-0 text-[#F47822]" />
                    {unansweredRequired > 0
                      ? t("assessments.requiredLeft", { count: unansweredRequired })
                      : hasAnyPayload || questions.every((question) => !question.required)
                        ? t("assessments.mustAnswer")
                        : t("assessments.answerAtLeastOne")}
                  </p>

                  <button
                    type="button"
                    disabled={!canSubmit}
                    onClick={() => setConfirmOpen(true)}
                    className="inline-flex items-center justify-center rounded-xl bg-[#F47822] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(244,120,34,0.18)] transition hover:bg-[#df6817] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting
                      ? t("assessments.submitting")
                      : t("assessments.submitBtn")}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {tabWarning ? <TabWarning onClose={() => setTabWarning(false)} /> : null}

      {confirmOpen && attempt ? (
        <SubmitConfirm
          done={answeredCount}
          total={questions.length}
          busy={submitting}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => void submit()}
        />
      ) : null}
    </main>
  );
}

function QuestionCard({
  question,
  index,
  answer,
  disabled,
  onChoose,
  onValue,
  onMove,
  onMatch,
  onConfidence,
}: {
  question: AssessmentQuestion;
  index: number;
  answer: AnswerState;
  disabled: boolean;
  onChoose: (optionId: string) => void;
  onValue: (value: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onMatch: (left: string, right: string) => void;
  onConfidence: (confidence: string) => void;
}) {
  const { t } = useTranslation();
  const multiple = question.type === "multiple_choice";
  const matching = question.type === "matching" ? question.matching : null;
  const optionMap = new Map(question.options.map((option) => [option.id, option.option]));

  return (
    <section data-testid={`assessment-question-${index}`} className="rounded-2xl border border-border p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-base font-semibold text-foreground">
          <span className="me-2 text-[#F47822]">{index + 1}.</span>
          {question.question}
        </p>
        <span className="rounded-full bg-[#F47822]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#F47822]">
          {t("assessments.questionPoints", { points: question.points })}
        </span>
      </div>

      <p className="mt-1 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
        {t(`assessments.questionTypes.${question.type}`)}
        {!question.required ? (
          <span className="ms-2 text-[#F47822]">
            {t("assessments.checkpoint.optional")}
          </span>
        ) : null}
      </p>

      {multiple ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          {t("assessments.examHints.multiple")}
        </p>
      ) : null}

      {CHOICE_TYPES.has(question.type) ? (
        <div className="mt-3 grid gap-2">
          {question.options.map((option) => {
            const checked = answer.optionIds.includes(option.id);

            return (
              <label
                key={option.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${
                  checked
                    ? "border-[#F47822] bg-[#F47822]/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-[#F47822]/35"
                }`}
              >
                <input
                  className="accent-[#F47822]"
                  type={multiple ? "checkbox" : "radio"}
                  name={question.id}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onChoose(option.id)}
                />
                {option.option}
              </label>
            );
          })}
        </div>
      ) : null}

      {question.type === "ordering" ? (
        <>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            {t("assessments.examHints.ordering")}
          </p>
          <ol className="mt-3 space-y-2">
            {answer.orderedIds.map((id, position) => (
              <li
                key={id}
                className="flex items-center gap-2 rounded-xl border border-border bg-background p-2.5 text-sm"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F47822]/10 text-xs font-bold text-[#F47822]">
                  {position + 1}
                </span>
                <span className="min-w-0 flex-1 text-foreground">
                  {optionMap.get(id) ?? id}
                </span>
                <button
                  type="button"
                  aria-label={t("assessments.moveUp")}
                  disabled={disabled || position === 0}
                  onClick={() => onMove(position, -1)}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground transition hover:border-[#F47822]/40 hover:text-[#F47822] disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={t("assessments.moveDown")}
                  disabled={disabled || position === answer.orderedIds.length - 1}
                  onClick={() => onMove(position, 1)}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground transition hover:border-[#F47822]/40 hover:text-[#F47822] disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ol>
        </>
      ) : null}

      {matching ? (
        <>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            {t("assessments.examHints.matching")}
          </p>
          <div className="mt-3 space-y-2">
            {matching.left.map((left) => (
              <div
                key={left}
                className="grid items-center gap-2 rounded-xl border border-border p-2.5 sm:grid-cols-2"
              >
                <span className="text-sm font-medium text-foreground">{left}</span>
                <select
                  aria-label={t("assessments.matchAria", { item: left })}
                  value={answer.matches[left] ?? ""}
                  disabled={disabled}
                  onChange={(event) => onMatch(left, event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[#F47822]"
                >
                  <option value="">{t("assessments.matchPlaceholder")}</option>
                  {matching.right.map((right) => (
                    <option key={right} value={right}>
                      {right}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {question.type === "short_answer" || question.type === "long_answer" ? (
        question.type === "long_answer" ? (
          <textarea
            rows={5}
            value={answer.value}
            disabled={disabled}
            onChange={(event) => onValue(event.target.value)}
            placeholder={t("assessments.textPlaceholder")}
            className="mt-3 w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-[#F47822]"
          />
        ) : (
          <input
            type="text"
            value={answer.value}
            disabled={disabled}
            onChange={(event) => onValue(event.target.value)}
            placeholder={t("assessments.textPlaceholder")}
            className="mt-3 w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-[#F47822]"
          />
        )
      ) : null}

      {question.type === "numeric" ? (
        <input
          type="number"
          inputMode="decimal"
          step="any"
          value={answer.value}
          disabled={disabled}
          onChange={(event) => onValue(event.target.value)}
          placeholder={t("assessments.numericPlaceholder")}
          className="mt-3 w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-[#F47822] sm:max-w-xs"
        />
      ) : null}

      <label className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-semibold">{t("assessments.confidenceLabel")}</span>
        <select
          value={answer.confidence ?? ""}
          disabled={disabled}
          onChange={(event) => onConfidence(event.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#F47822]"
        >
          <option value="">{t("assessments.confidencePlaceholder")}</option>
          {CONFIDENCE_LEVELS.map((level) => (
            <option key={level} value={level}>
              {t(`assessments.confidence.${level}`)}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

function ResultPanel({
  result,
  onRetry,
  canRetry,
  submitting,
}: {
  result: AssessmentResult;
  onRetry: () => void;
  canRetry: boolean;
  submitting: boolean;
}) {
  const { t } = useTranslation();
  const score = Number(result.score);

  return (
    <div className="py-8 text-center" data-testid="assessment-result">
      <CheckCircle2
        className={
          result.passed
            ? "mx-auto h-14 w-14 text-emerald-600 dark:text-emerald-400"
            : "mx-auto h-14 w-14 text-red-500"
        }
      />
      <h2 className="mt-5 text-2xl font-bold text-foreground">
        {result.passed
          ? t("assessments.passedTitle")
          : t("assessments.notPassedTitle")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {result.passed
          ? t("assessments.scorePass", { score })
          : t("assessments.scoreFail", { score })}
      </p>

      <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
        {result.passed ? (
          <Link
            to="/certificates"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#df6817]"
          >
            {t("assessments.viewCerts")}
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
          </Link>
        ) : null}

        {canRetry ? (
          <button
            type="button"
            disabled={submitting}
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-xl border border-[#F47822]/30 px-5 py-3 text-sm font-semibold text-[#F47822] transition hover:bg-[#F47822]/5"
          >
            {t("assessments.retryBtn")}
          </button>
        ) : null}

        <Link
          to="/assessments"
          className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          {t("assessments.backBtn")}
        </Link>
      </div>
    </div>
  );
}

function BlockedPanel() {
  const { t } = useTranslation();

  return (
    <div className="py-8 text-center" data-testid="assessment-blocked">
      <ShieldAlert className="mx-auto h-14 w-14 text-red-500" />
      <h2 className="mt-5 text-2xl font-bold text-foreground">
        {t("assessments.blockedTitle")}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {t("assessments.blockedDesc")}
      </p>
      <Link
        to="/assessments"
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-semibold text-white"
      >
        {t("assessments.backBtn")}
      </Link>
    </div>
  );
}

function SubmitConfirm({
  done,
  total,
  busy,
  onCancel,
  onConfirm,
}: {
  done: number;
  total: number;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A3A]/55 p-5 dark:bg-white/55"
      role="dialog"
      aria-modal="true"
      data-testid="assessment-confirm-submit"
    >
      <div className="max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-[#1b1b20]">
        <Check className="mx-auto h-10 w-10 text-[#F47822]" />
        <h2 className="mt-4 text-xl font-bold text-[#3A3A3A] dark:text-[#ececef]">
          {t("assessments.checkpoint.confirmTitle")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/55 dark:text-white/55">
          {t("assessments.checkpoint.confirmBody", { done, total })}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            {t("assessments.checkpoint.confirmNo")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded-xl bg-[#F47822] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy
              ? t("assessments.submitting")
              : t("assessments.checkpoint.confirmYes")}
          </button>
        </div>
      </div>
    </div>
  );
}
