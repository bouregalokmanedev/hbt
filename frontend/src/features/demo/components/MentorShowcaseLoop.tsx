import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BookOpenCheck,
  BrainCircuit,
  ListChecks,
  Sparkles,
  Target,
  Lightbulb,
} from "lucide-react";

type ShowcaseKind = "hint" | "quiz" | "guide" | "weakSpot";

interface ShowcaseTurn {
  kind: ShowcaseKind;
  question: string;
  answer: string;
}

const KIND_META: Record<
  ShowcaseKind,
  { icon: typeof Lightbulb; tone: string }
> = {
  hint: {
    icon: Lightbulb,
    tone: "bg-amber-500/15 text-amber-600 border-amber-500/25 dark:text-amber-400",
  },
  quiz: {
    icon: ListChecks,
    tone: "bg-sky-500/15 text-sky-600 border-sky-500/25 dark:text-sky-400",
  },
  guide: {
    icon: BookOpenCheck,
    tone:
      "bg-emerald-500/15 text-emerald-600 border-emerald-500/25 dark:text-emerald-400",
  },
  weakSpot: {
    icon: Target,
    tone: "bg-rose-500/15 text-rose-600 border-rose-500/25 dark:text-rose-400",
  },
};

const CHAR_MS = 16;
const THINK_MS = 700;
const HOLD_MS = 1600;
const QUESTION_MS = 450;

export function MentorShowcaseLoop() {
  const { t } = useTranslation();
  const kinds = useMemo<ShowcaseKind[]>(
    () => ["hint", "quiz", "guide", "weakSpot"],
    [],
  );

  const turns = useMemo<ShowcaseTurn[]>(
    () =>
      kinds.map((kind) => ({
        kind,
        question: t(`demo.mentorPage.showcase.turns.${kind}.q`),
        answer: t(`demo.mentorPage.showcase.turns.${kind}.a`),
      })),
    [kinds, t],
  );

  const [turnIndex, setTurnIndex] = useState(0);
  const [phase, setPhase] = useState<
    "question" | "thinking" | "typing" | "hold"
  >("question");
  const [typed, setTyped] = useState("");
  const timerRef = useRef<number | null>(null);

  const turn = turns[turnIndex] ?? turns[0];
  const Meta = KIND_META[turn.kind];
  const KindIcon = Meta.icon;

  useEffect(() => {
    setPhase("question");
    setTyped("");
  }, [turnIndex]);

  useEffect(() => {
    function clear() {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    clear();

    if (phase === "question") {
      timerRef.current = window.setTimeout(() => setPhase("thinking"), QUESTION_MS);
      return clear;
    }

    if (phase === "thinking") {
      timerRef.current = window.setTimeout(() => {
        setTyped("");
        setPhase("typing");
      }, THINK_MS);
      return clear;
    }

    if (phase === "typing") {
      if (typed.length >= turn.answer.length) {
        timerRef.current = window.setTimeout(() => setPhase("hold"), 200);
        return clear;
      }

      timerRef.current = window.setTimeout(() => {
        setTyped((prev) => {
          const nextLen = Math.min(prev.length + 2, turn.answer.length);
          return turn.answer.slice(0, nextLen);
        });
      }, CHAR_MS);
      return clear;
    }

    // hold → next turn
    timerRef.current = window.setTimeout(() => {
      setTurnIndex((prev) => (prev + 1) % turns.length);
    }, HOLD_MS);
    return clear;
  }, [phase, typed, turn.answer, turns.length]);

  return (
    <section
      aria-labelledby="mentor-showcase"
      data-testid="mentor-showcase"
      className="rounded-[28px] border border-[#3A3A3A]/10 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-[#1b1b20]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#F47822]">
            {t("demo.mentorPage.showcase.eyebrow")}
          </p>
          <h2
            id="mentor-showcase"
            className="mt-1 text-2xl font-black text-[#3A3A3A] dark:text-white"
          >
            {t("demo.mentorPage.showcase.title")}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#3A3A3A]/55 dark:text-white/55">
            {t("demo.mentorPage.showcase.desc")}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5" data-testid="mentor-showcase-kinds">
          {kinds.map((kind) => {
            const KindMeta = KIND_META[kind];
            const KindIconDot = KindMeta.icon;
            const active = turn.kind === kind;
            return (
              <span
                key={kind}
                data-testid={`mentor-showcase-kind-${kind}`}
                aria-hidden={!active}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] transition ${
                  active
                    ? KindMeta.tone
                    : "border-[#3A3A3A]/10 bg-[#F8F7F6] text-[#3A3A3A]/40 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/35"
                }`}
              >
                <KindIconDot className="h-3 w-3" />
                {t(`demo.mentorPage.showcase.kinds.${kind}`)}
              </span>
            );
          })}
        </div>
      </div>

      <div
        className="mt-6 overflow-hidden rounded-[22px] border border-[#3A3A3A]/10 bg-[#141414] dark:border-white/10"
        data-testid="mentor-showcase-chat"
      >
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
            <BrainCircuit className="h-3.5 w-3.5 text-[#F47822]" />
            {t("demo.mentorPage.showcase.windowTitle")}
          </div>
          <span className="font-mono text-[10px] text-white/30">
            {String(turnIndex + 1).padStart(2, "0")} / {String(turns.length).padStart(2, "0")}
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {/* Student question */}
          <div
            className="flex justify-end"
            data-testid="mentor-showcase-question"
          >
            <div className="max-w-[85%] rounded-2xl rounded-ee-sm bg-[#F47822] px-4 py-3 text-sm leading-6 text-white shadow-[0_8px_20px_rgba(244,120,34,0.2)]">
              {turn.question}
            </div>
          </div>

          {/* Mentor response */}
          <div
            className="flex justify-start"
            data-testid="mentor-showcase-answer"
          >
            <div className="max-w-[92%] rounded-2xl rounded-es-sm border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-6 text-white/85">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] ${Meta.tone}`}
                  data-testid="mentor-showcase-badge"
                >
                  <KindIcon className="h-3 w-3" />
                  {t(`demo.mentorPage.showcase.kinds.${turn.kind}`)}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-white/35">
                  <Sparkles className="h-3 w-3 text-[#F47822]" />
                  {t("demo.mentorPage.showcase.mentorLabel")}
                </span>
              </div>

              {phase === "thinking" ? (
                <span
                  className="inline-flex items-center gap-1"
                  data-testid="mentor-showcase-thinking"
                  aria-label={t("demo.mentorPage.showcase.thinking")}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F47822]"
                      style={{ animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                </span>
              ) : (
                <p
                  className="min-h-[1.5rem] whitespace-pre-wrap"
                  data-testid="mentor-showcase-typed"
                  data-phase={phase}
                >
                  {typed}
                  {phase === "typing" && (
                    <span
                      aria-hidden="true"
                      className="ms-0.5 inline-block h-4 w-[2px] translate-y-[2px] animate-pulse bg-[#F47822]"
                    />
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kinds.map((kind) => {
          const KindMeta = KIND_META[kind];
          const KindIconItem = KindMeta.icon;
          return (
            <li
              key={kind}
              className="rounded-2xl bg-[#F8F7F6] p-4 dark:bg-white/[0.03]"
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-xl border ${KindMeta.tone}`}
              >
                <KindIconItem className="h-4 w-4" />
              </span>
              <p className="mt-2.5 text-sm font-black text-[#3A3A3A] dark:text-white">
                {t(`demo.mentorPage.showcase.cards.${kind}.title`)}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/55 dark:text-white/55">
                {t(`demo.mentorPage.showcase.cards.${kind}.desc`)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
