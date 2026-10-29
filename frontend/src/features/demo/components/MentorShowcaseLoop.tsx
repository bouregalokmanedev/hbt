import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpenCheck,
  BrainCircuit,
  Lightbulb,
  ListChecks,
  Pause,
  Play,
  Sparkles,
  Target,
} from "lucide-react";

type ShowcaseKind = "hint" | "quiz" | "guide" | "weakSpot";

interface ShowcaseTurn {
  kind: ShowcaseKind;
  question: string;
  answer: string;
}

const KIND_META: Record<
  ShowcaseKind,
  { icon: typeof Lightbulb; tone: string; accent: string }
> = {
  hint: {
    icon: Lightbulb,
    tone: "border-amber-400/30 bg-amber-50 text-amber-600",
    accent: "#FBBF24",
  },
  quiz: {
    icon: ListChecks,
    tone: "border-sky-400/30 bg-sky-50 text-sky-600",
    accent: "#38BDF8",
  },
  guide: {
    icon: BookOpenCheck,
    tone: "border-emerald-400/30 bg-emerald-50 text-emerald-600",
    accent: "#34D399",
  },
  weakSpot: {
    icon: Target,
    tone: "border-rose-400/30 bg-rose-50 text-rose-600",
    accent: "#FB7185",
  },
};

const CHAR_MS = 14;
const THINK_MS = 800;
const HOLD_MS = 3600;
const QUESTION_MS = 550;

export function MentorShowcaseLoop() {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
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
  const [paused, setPaused] = useState(false);
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

    if (paused) {
      return clear;
    }

    if (phase === "question") {
      timerRef.current = window.setTimeout(
        () => setPhase("thinking"),
        QUESTION_MS,
      );
      return clear;
    }

    if (phase === "thinking") {
      timerRef.current = window.setTimeout(
        () => {
          if (prefersReduced) {
            setTyped(turn.answer);
            setPhase("hold");
            return;
          }
          setTyped("");
          setPhase("typing");
        },
        prefersReduced ? 300 : THINK_MS,
      );
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
  }, [phase, typed, turn.answer, turns.length, paused, prefersReduced]);

  const jumpTo = (index: number) => {
    setPaused(false);
    setTurnIndex(index);
  };

  return (
    <section
      aria-labelledby="mentor-showcase"
      data-testid="mentor-showcase"
      className="relative overflow-hidden rounded-[32px] border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_18px_45px_rgba(58,58,58,.07)] sm:p-8"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#F47822]/12 blur-[100px]" />
        <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-cyan-400/8 blur-[110px]" />
        <div className="absolute inset-0 opacity-[0.5] [background-image:linear-gradient(to_right,rgba(58,58,58,.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(58,58,58,.05)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#F47822]">
              <span className="h-px w-8 bg-[#F47822]" />
              01 / {t("demo.mentorPage.showcase.eyebrow")}
            </p>
            <h2
              id="mentor-showcase"
              className="mt-3 text-3xl font-black tracking-tight text-[#3A3A3A] sm:text-4xl"
            >
              {t("demo.mentorPage.showcase.title")}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#3A3A3A]/60">
              {t("demo.mentorPage.showcase.desc")}
            </p>
          </div>

          <div
            className="flex flex-wrap gap-1.5"
            data-testid="mentor-showcase-kinds"
          >
            {kinds.map((kind) => {
              const KindMeta = KIND_META[kind];
              const KindIconDot = KindMeta.icon;
              const active = turn.kind === kind;
              return (
                <span
                  key={kind}
                  data-testid={`mentor-showcase-kind-${kind}`}
                  aria-hidden={!active}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] transition-colors duration-300 ${
                    active
                      ? KindMeta.tone
                      : "border-[#3A3A3A]/8 bg-white text-[#3A3A3A]/35"
                  }`}
                >
                  <KindIconDot className="h-3 w-3" />
                  {t(`demo.mentorPage.showcase.kinds.${kind}`)}
                </span>
              );
            })}
          </div>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Chat console */}
          <div
            className="relative overflow-hidden rounded-[26px] border border-[#3A3A3A]/10 bg-[#FCFCFC] shadow-[0_24px_60px_rgba(58,58,58,.12)]"
            data-testid="mentor-showcase-chat"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#3A3A3A]/8 bg-white px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-400/70" />
                  <span className="h-2 w-2 rounded-full bg-amber-400/70" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
                </span>
                <span className="inline-flex items-center gap-1.5 truncate font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/40">
                  <BrainCircuit className="h-3.5 w-3.5 shrink-0 text-[#F47822]" />
                  {t("demo.mentorPage.showcase.windowTitle")}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span
                  className="font-mono text-[10px] text-[#3A3A3A]/35"
                  dir="ltr"
                >
                  {String(turnIndex + 1).padStart(2, "0")} /{" "}
                  {String(turns.length).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => setPaused((prev) => !prev)}
                  aria-label={
                    paused
                      ? t("demo.mentorPage.showcase.play")
                      : t("demo.mentorPage.showcase.pause")
                  }
                  aria-pressed={paused}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/45 shadow-sm transition hover:border-[#F47822]/35 hover:text-[#D96319]"
                >
                  {paused ? (
                    <Play className="h-3.5 w-3.5 rtl:-scale-x-100" />
                  ) : (
                    <Pause className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="relative min-h-[300px] p-4 sm:p-6">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#F47822]/[0.07] to-transparent"
              />

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={turnIndex}
                  initial={prefersReduced ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReduced ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="relative space-y-4"
                >
                  {/* Student question */}
                  <div
                    className="flex justify-end"
                    data-testid="mentor-showcase-question"
                  >
                    <p className="max-w-[86%] rounded-2xl rounded-ee-sm bg-gradient-to-br from-[#F47822] to-[#E96D18] px-4 py-3 text-sm leading-6 text-white shadow-[0_10px_30px_rgba(244,120,34,0.22)]">
                      {turn.question}
                    </p>
                  </div>

                  {/* Mentor response */}
                  <div
                    className="flex items-start gap-2.5"
                    data-testid="mentor-showcase-answer"
                  >
                    <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#F47822]/25 bg-[#F47822]/10">
                      <BrainCircuit className="h-4 w-4 text-[#F47822]" />
                    </span>

                    <div className="min-w-0 max-w-[90%] rounded-2xl rounded-es-sm border border-[#3A3A3A]/8 bg-white px-4 py-3 text-sm leading-6 text-[#3A3A3A]/75 shadow-sm">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] ${Meta.tone}`}
                          data-testid="mentor-showcase-badge"
                        >
                          <KindIcon className="h-3 w-3" />
                          {t(`demo.mentorPage.showcase.kinds.${turn.kind}`)}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#3A3A3A]/35">
                          <Sparkles className="h-3 w-3 text-[#F47822]" />
                          {t("demo.mentorPage.showcase.mentorLabel")}
                        </span>
                      </div>

                      {phase === "thinking" ? (
                        <span
                          className="inline-flex items-center gap-1.5 py-1"
                          data-testid="mentor-showcase-thinking"
                          aria-label={t("demo.mentorPage.showcase.thinking")}
                        >
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="h-1.5 w-1.5 rounded-full bg-[#F47822]"
                              animate={
                                prefersReduced
                                  ? undefined
                                  : { y: [0, -4, 0], opacity: [0.4, 1, 0.4] }
                              }
                              transition={{
                                duration: 0.9,
                                repeat: Infinity,
                                delay: i * 0.12,
                                ease: "easeInOut",
                              }}
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
                              className="ms-0.5 inline-block h-4 w-[2px] translate-y-[2px] animate-pulse bg-[#F47822] motion-reduce:animate-none"
                            />
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="border-t border-[#3A3A3A]/8 bg-white/70 px-4 py-3 sm:px-5">
              {/* Progress indicators */}
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {turns.map((item, index) => {
                  const ItemMeta = KIND_META[item.kind];
                  const isActive = index === turnIndex;
                  const isDone = index < turnIndex;
                  return (
                    <span
                      key={item.kind}
                      className="relative h-1 flex-1 overflow-hidden rounded-full bg-[#3A3A3A]/10"
                    >
                      {isActive && (
                        <motion.span
                          layoutId="mentor-showcase-progress"
                          className="absolute inset-0 rounded-full"
                          style={{ background: ItemMeta.accent }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 32,
                          }}
                        />
                      )}
                      {isDone && (
                        <span className="absolute inset-0 rounded-full bg-[#3A3A3A]/25" />
                      )}
                    </span>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-2.5 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#F47822]" />
                <span className="flex-1 truncate text-[11px] text-[#3A3A3A]/35">
                  {t("demo.mentorPage.showcase.inputPlaceholder")}
                </span>
                <span
                  aria-hidden="true"
                  className="grid h-6 w-6 place-items-center rounded-md bg-[#F47822]/15 text-[#D96319]"
                >
                  <ArrowUpRight className="h-3 w-3 rtl:-scale-x-100" />
                </span>
              </div>
            </div>
          </div>

          {/* Kind rail */}
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
            {kinds.map((kind, index) => {
              const KindMeta = KIND_META[kind];
              const KindIconItem = KindMeta.icon;
              const active = turn.kind === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => jumpTo(index)}
                  aria-pressed={active}
                  className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-start transition-colors duration-300 ${
                    active
                      ? "border-[#F47822]/35 bg-[#FFF7F1] shadow-sm"
                      : "border-[#3A3A3A]/8 bg-white hover:border-[#F47822]/25 hover:bg-[#FFF9F5]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="mentor-showcase-active-card"
                      aria-hidden="true"
                      className="absolute inset-y-3 start-0 w-0.5 rounded-full"
                      style={{ background: KindMeta.accent }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 32,
                      }}
                    />
                  )}

                  <div className="flex items-center gap-2.5">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border ${KindMeta.tone}`}
                    >
                      <KindIconItem className="h-4 w-4" />
                    </span>
                    <p className="flex-1 text-sm font-black text-[#3A3A3A]">
                      {t(`demo.mentorPage.showcase.cards.${kind}.title`)}
                    </p>
                    <span className="font-mono text-[9px] font-bold text-[#3A3A3A]/25">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-[#3A3A3A]/55">
                    {t(`demo.mentorPage.showcase.cards.${kind}.desc`)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
