import { Activity, Award, Beaker, BookOpen, ChevronRight, CircleCheck, Cpu, Flame, Loader2, Search, Sparkles, Trophy, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useDashboard } from "../hooks/useDashboard";
import type { Achievement } from "../types/dashboard.types";
import { BadgeIcon } from "../components/BadgeIcon";
import { badgeAccent } from "../components/badge-icons";
import { Link } from "react-router-dom";
import { badgeText } from "../i18n/badge-text";
import { levelText } from "../i18n/level-text";
import {
  LeaderboardCard,
  type LeaderboardEntry,
  type LeaderboardMe,
  type LeaderboardPayload,
} from "../components/LeaderboardCard";
import { PodiumProfilePopup } from "../components/PodiumProfilePopup";
import { api } from "@/lib/api/client";

export function AchievementsPage() {
  const { t } = useTranslation();
  const { dashboard, isLoading, error } = useDashboard();
  if (isLoading && !dashboard)
    return (
      <main className="min-h-full p-8 text-sm text-[#3A3A3A]/50 dark:text-white/50">
        {t("dashboard.achievementsPage.loading")}
      </main>
    );
  if (error || !dashboard)
    return (
      <main className="min-h-full p-8 text-sm text-red-600 dark:text-red-400">
        {t("dashboard.achievementsPage.loadError")}
      </main>
    );
  const earned = dashboard.achievements.filter((badge) => badge.completed);
  const locked = dashboard.achievements.filter((badge) => !badge.completed);
  const level = dashboard.progression;
  const remaining = Math.max(0, level.next_level_xp - level.total_xp);
  return (
    <main className="min-h-full bg-[#F3F3F3] dark:bg-[#101013]">
      <div className="mx-auto max-w-[1280px] px-5 py-6 sm:px-8 sm:py-8">
        <section className="relative overflow-hidden rounded-[32px] bg-[#353535] px-6 py-7 text-white shadow-[0_18px_42px_rgba(58,58,58,.13)] sm:px-8 sm:py-9">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#F47822]/20 blur-3xl rtl:-left-20 rtl:right-auto" />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">
                <Sparkles className="h-3.5 w-3.5" />
                {t("dashboard.achievementsPage.eyebrow")}
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                {t("dashboard.achievementsPage.title")}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                {t("dashboard.achievementsPage.description")}
              </p>
            </div>
            <p className="rounded-2xl border border-white/10 bg-white/[.07] px-4 py-3 text-sm font-bold">
              {t("dashboard.achievementsPage.earnedBadge", { count: earned.length })}
            </p>
          </div>
        </section>
        <LevelProgressSection
          t={t}
          level={level.level}
          title={levelText(level.title, t)}
          totalXp={level.total_xp}
          nextLevelXp={level.next_level_xp}
          nextLevelTitle={levelText(level.next_level_title, t)}
          progressPercent={level.progress_percent}
          recentAwards={level.recent_awards}
        />
        <FullLeaderboardSection t={t} />
        <LearningStreakSection
          t={t}
          currentStreak={level.current_streak}
          longestStreak={level.longest_streak}
          learningDays={level.learning_days}
          keepStreakHref={dashboard.current_learning[0] ? `/courses/${dashboard.current_learning[0].id}` : null}
        />
        <BadgeSection
          t={t}
          title={t("dashboard.achievementsPage.earnedTitle")}
          description={t("dashboard.achievementsPage.earnedDesc")}
          badges={earned}
          earned
        />
        <BadgeSection
          t={t}
          title={t("dashboard.achievementsPage.nextTitle")}
          description={t("dashboard.achievementsPage.nextDesc")}
          badges={locked}
        />
      </div>
    </main>
  );
}

const STREAK_ACTIVITIES = [
  { key: "lesson", Icon: BookOpen },
  { key: "quiz", Icon: CircleCheck },
  { key: "diagnostic", Icon: Search },
  { key: "simulator", Icon: Cpu },
  { key: "assessment", Icon: Beaker },
  { key: "challenge", Icon: Zap },
] as const;

function LearningStreakSection({
  t,
  currentStreak,
  longestStreak,
  learningDays,
  keepStreakHref,
}: {
  t: TFunction;
  currentStreak: number;
  longestStreak: number;
  learningDays: Array<{ date: string; active: boolean }>;
  keepStreakHref: string | null;
}) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const activeCount = learningDays.filter((day) => day.active).length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
      data-testid="learning-streak-section"
      aria-label={t("dashboard.achievementsPage.challengeTitle")}
      className="mt-6 overflow-hidden rounded-[28px] border border-[#F47822]/15 bg-white dark:bg-[#1b1b20] shadow-[0_12px_30px_rgba(58,58,58,.05)]"
    >
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#3A3A3A] via-[#333] to-[#2a2a2a] px-6 py-6 text-white sm:px-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#F47822]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-[#F47822]/15 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#F47822] shadow-[0_10px_26px_rgba(244,120,34,0.4)]">
              <div className="absolute inset-0 rounded-2xl bg-[#F47822] blur-xl opacity-60" aria-hidden="true" />
              <Flame className="relative h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">
                {t("dashboard.achievementsPage.challenge")}
              </p>
              <h2 className="mt-1 text-xl font-bold">
                {t("dashboard.achievementsPage.challengeTitle")}
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-5 text-white/55">
                {t("dashboard.achievementsPage.challengeDesc")}
              </p>
            </div>
          </div>

          <div
            className="flex shrink-0 items-center gap-3"
            data-testid="streak-counters"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[.07] px-4 py-3 text-center backdrop-blur">
              <p className="text-[9px] font-bold uppercase tracking-wide text-white/40">
                {t("dashboard.achievementsPage.streakNow")}
              </p>
              <p
                className="mt-1 text-3xl font-black tabular-nums text-[#F47822]"
                data-testid="current-streak"
                dir="ltr"
              >
                {currentStreak}
              </p>
              <p className="text-[10px] font-bold text-white/45">
                {t("dashboard.achievementsPage.daysUnit")}
              </p>
            </div>
            <div className="h-12 w-px bg-white/10" aria-hidden="true" />
            <div className="rounded-2xl border border-white/10 bg-white/[.07] px-4 py-3 text-center backdrop-blur">
              <p className="text-[9px] font-bold uppercase tracking-wide text-white/40">
                {t("dashboard.achievementsPage.streakBest")}
              </p>
              <p
                className="mt-1 text-3xl font-black tabular-nums text-white"
                data-testid="longest-streak"
                dir="ltr"
              >
                {longestStreak}
              </p>
              <p className="text-[10px] font-bold text-white/45">
                {t("dashboard.achievementsPage.daysUnit")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-6 bg-[#FDFDFD] px-6 py-6 dark:bg-[#16161a] sm:px-7 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          {/* Last 7 days */}
          <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#3A3A3A]/40 dark:text-white/40">
            {t("dashboard.achievementsPage.last7")}
            <span className="ms-2 font-black text-[#F47822]" data-testid="active-days-count" dir="ltr">
              {activeCount}/7
            </span>
          </p>
          <div className="mt-3 flex max-w-md justify-between gap-2" data-testid="learning-days">
            {learningDays.map((day) => {
              const label = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
                new Date(`${day.date}T12:00:00`),
              );
              const isToday = day.date === todayKey;
              return (
                <div key={day.date} className="flex flex-col items-center gap-1.5">
                  <span
                    data-testid={`learning-day-${day.date}`}
                    data-active={day.active ? "true" : "false"}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-[11px] font-black transition ${
                      day.active
                        ? "bg-gradient-to-br from-[#F47822] to-[#ff9a55] text-white shadow-[0_6px_16px_rgba(244,120,34,0.3)]"
                        : "border border-[#3A3A3A]/10 bg-[#3A3A3A]/[0.05] text-[#3A3A3A]/35 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/35"
                    } ${isToday ? "ring-2 ring-[#F47822]/40 ring-offset-2 ring-offset-[#FDFDFD] dark:ring-offset-[#16161a]" : ""}`}
                    aria-label={`${label}: ${day.active ? t("dashboard.achievementsPage.dayActive") : t("dashboard.achievementsPage.dayIdle")}`}
                  >
                    {day.active ? "✓" : "·"}
                  </span>
                  <span className="text-[9px] font-semibold text-[#3A3A3A]/40 dark:text-white/40">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* What counts */}
          <p className="mt-5 text-[9px] font-bold uppercase tracking-[.16em] text-[#3A3A3A]/40 dark:text-white/40">
            {t("dashboard.achievementsPage.countsTitle")}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2" data-testid="streak-activities">
            {STREAK_ACTIVITIES.map(({ key, Icon }) => (
              <span
                key={key}
                data-testid={`streak-activity-${key}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#F47822]/20 bg-[#F47822]/[0.07] px-2.5 py-1.5 text-[11px] font-bold text-[#D96319] dark:text-[#F47822]"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {t(`dashboard.achievementsPage.activities.${key}`)}
              </span>
            ))}
          </div>

          <p className="mt-4 text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">
            <span className="font-bold text-[#3A3A3A] dark:text-[#ececef]">
              {t("dashboard.achievementsPage.tip")}
            </span>{" "}
            {t("dashboard.achievementsPage.tipText")}
          </p>
        </div>

        {/* Side column */}
        <aside className="flex flex-col gap-3">
          <div className="rounded-2xl border border-[#F47822]/15 bg-[#F47822]/[0.06] p-4">
            <p className="flex items-center gap-1.5 text-xs font-black text-[#3A3A3A] dark:text-[#ececef]">
              <Zap className="h-3.5 w-3.5 text-[#F47822]" />
              {t("dashboard.achievementsPage.boosts")}
            </p>
            <p className="mt-1.5 text-[11px] leading-4 text-[#3A3A3A]/55 dark:text-white/55">
              {t("dashboard.achievementsPage.boostsDesc")}
            </p>
          </div>

          <div className="rounded-2xl border border-[#3A3A3A]/10 bg-[#FAFAFA] p-4 dark:border-white/10 dark:bg-[#232329]">
            <p className="flex items-center gap-1.5 text-xs font-black text-[#3A3A3A] dark:text-[#ececef]">
              <Activity className="h-3.5 w-3.5 text-[#F47822]" />
              {t("dashboard.achievementsPage.breakNoteTitle")}
            </p>
            <p className="mt-1.5 text-[11px] leading-4 text-[#3A3A3A]/55 dark:text-white/55">
              {t("dashboard.achievementsPage.breakNote")}
            </p>
          </div>

          {keepStreakHref && (
            <Link
              to={keepStreakHref}
              data-testid="keep-streak-cta"
              className="inline-flex items-center justify-center rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,0.2)] transition hover:bg-[#E96D18]"
            >
              {t("dashboard.achievementsPage.keepStreak")}
            </Link>
          )}
        </aside>
      </div>
    </motion.section>
  );
}
function FullLeaderboardSection({ t }: { t: TFunction }) {
  const [top, setTop] = useState<LeaderboardEntry[]>([]);
  const [me, setMe] = useState<LeaderboardMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<LeaderboardPayload>("/v1/leaderboard?limit=50")
      .then((data) => {
        if (cancelled) return;
        setTop(data.top ?? []);
        setMe(data.me);
      })
      .catch(() => {
        if (!cancelled) setLoadError(t("dashboard.achievementsPage.leaderboardLoadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const meUserId = me?.user_id ?? null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      aria-label={t("dashboard.leaderboard.title")}
      className="mt-6 overflow-hidden rounded-[28px] border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] shadow-[0_12px_30px_rgba(58,58,58,.06)]"
    >
      <div className="relative overflow-hidden bg-[#3A3A3A] px-6 py-5 text-white sm:px-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#F47822]/20 blur-3xl rtl:-left-20 rtl:right-auto" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-40 w-40 rounded-full bg-[#F47822]/10 blur-3xl rtl:-right-20 rtl:left-auto" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#F47822] shadow-[0_8px_20px_rgba(244,120,34,0.22)]">
              <Trophy className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F47822]">
                {t("dashboard.leaderboard.podium")}
              </p>
              <h2 className="mt-0.5 text-base font-semibold text-white">
                {t("dashboard.achievementsPage.leaderboardTitle")}
              </h2>
              <p className="mt-1 max-w-lg text-xs leading-5 text-white/55">
                {t("dashboard.achievementsPage.leaderboardDesc")}
              </p>
            </div>
          </div>
          {me && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-right">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35">
                {t("dashboard.leaderboard.meBanner")}
              </p>
              <p className="mt-0.5 text-lg font-semibold text-white tabular-nums" dir="ltr">
                #{me.rank}
                <span className="ms-2 text-xs font-semibold text-[#F47822]">
                  {me.total_xp.toLocaleString()} XP
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#3A3A3A]/50 dark:text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("dashboard.leaderboard.loading")}
          </div>
        ) : loadError ? (
          <p className="rounded-2xl bg-red-50 dark:bg-red-500/10 px-4 py-4 text-sm text-red-700 dark:text-red-400">
            {loadError}
          </p>
        ) : top.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#3A3A3A]/15 dark:border-white/15 px-4 py-8 text-center text-sm text-[#3A3A3A]/50 dark:text-white/50">
            {t("dashboard.achievementsPage.leaderboardEmpty")}
          </p>
        ) : (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              {top.slice(0, 3).map((entry, idx) => {
                const isMe = Boolean(meUserId && entry.user_id === meUserId);
                const medal =
                  idx === 0
                    ? "from-amber-400 to-amber-500 text-white"
                    : idx === 1
                      ? "from-zinc-300 to-zinc-400 text-zinc-800"
                      : "from-amber-600 to-amber-700 text-white";
                return (
                  <div key={entry.user_id} className="group relative" tabIndex={0}>
                    <div
                      className={`relative overflow-hidden rounded-2xl border p-4 text-center transition focus-visible:outline-2 focus-visible:outline-[#F47822]/60 ${
                        isMe
                          ? "border-[#F47822] bg-[#F47822]/8 shadow-[0_8px_22px_rgba(244,120,34,0.16)]"
                          : "border-[#3A3A3A]/8 dark:border-white/8 bg-[#FAFAFA] dark:bg-[#232329]"
                      }`}
                    >
                    <span
                      className={`mx-auto grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br text-sm font-black ring-2 ring-white/40 ${medal}`}
                    >
                      {idx === 0 ? <Trophy className="h-4 w-4" /> : idx + 1}
                    </span>
                    <p className="mt-2.5 truncate text-sm font-black text-[#3A3A3A] dark:text-[#ececef]">
                      {entry.name}
                    </p>
                    {entry.username && (
                      <p className="truncate text-[11px] text-[#3A3A3A]/40 dark:text-white/40">
                        @{entry.username}
                      </p>
                    )}
                    <p className="mt-2 text-base font-black tabular-nums text-[#F47822]" dir="ltr">
                      {entry.total_xp.toLocaleString()} XP
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
                      {t("dashboard.leaderboard.levelLabel")} {entry.level}
                      {entry.current_streak > 0 ? ` · ${entry.current_streak}🔥` : ""}
                    </p>
                    {isMe && (
                      <span className="mt-2 inline-block rounded-full bg-[#F47822] px-2 py-0.5 text-[9px] font-black uppercase text-white">
                        {t("dashboard.leaderboard.you")}
                      </span>
                    )}
                    </div>
                    <PodiumProfilePopup entry={entry} isMe={isMe} />
                  </div>
                );
              })}
            </div>

            <ol className="space-y-2">
              {top.map((entry, idx) => {
                const rank = idx + 1;
                const isMe = Boolean(meUserId && entry.user_id === meUserId);
                return (
                  <li
                    key={entry.user_id}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 sm:px-4 ${
                      isMe
                        ? "border-[#F47822]/45 bg-[#F47822]/8 shadow-[0_4px_14px_rgba(244,120,34,0.12)]"
                        : "border-transparent bg-[#3A3A3A]/[0.03] dark:bg-white/[0.04] hover:border-[#3A3A3A]/10 dark:hover:border-white/10"
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black tabular-nums ${
                        rank === 1
                          ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white ring-2 ring-amber-300/60"
                          : rank === 2
                            ? "bg-gradient-to-br from-zinc-300 to-zinc-400 text-zinc-800 ring-2 ring-zinc-200/80"
                            : rank === 3
                              ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white ring-2 ring-amber-700/40"
                              : "bg-[#3A3A3A]/6 dark:bg-white/8 text-[#3A3A3A]/55 dark:text-white/55"
                      }`}
                    >
                      {rank}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                          {entry.name}
                        </span>
                        {isMe && (
                          <span className="rounded-full bg-[#F47822] px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                            {t("dashboard.leaderboard.you")}
                          </span>
                        )}
                        <span className="hidden rounded-full bg-[#3A3A3A]/6 dark:bg-white/8 px-1.5 py-0.5 text-[10px] font-bold text-[#3A3A3A]/50 dark:text-white/50 sm:inline">
                          {t("dashboard.leaderboard.levelLabel")} {entry.level}
                        </span>
                      </span>
                      {entry.username && (
                        <span className="block truncate text-[11px] text-[#3A3A3A]/40 dark:text-white/40">
                          @{entry.username}
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {entry.current_streak >= 3 && (
                        <span className="hidden items-center gap-0.5 rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-500 sm:inline-flex">
                          <Flame className="h-3 w-3" />
                          {entry.current_streak}
                        </span>
                      )}
                      <span className="text-xs font-black tabular-nums text-[#F47822]" dir="ltr">
                        {entry.total_xp.toLocaleString()} XP
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>

            {!meUserId || !top.some((e) => e.user_id === meUserId) ? (
              me && me.rank > top.length ? (
                <>
                  <div className="my-3 flex items-center gap-2" aria-hidden="true">
                    <span className="h-px flex-1 bg-[#3A3A3A]/10 dark:bg-white/10" />
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#3A3A3A]/35 dark:text-white/35">
                      {t("dashboard.leaderboard.yourRank")}
                    </span>
                    <span className="h-px flex-1 bg-[#3A3A3A]/10 dark:bg-white/10" />
                  </div>
                  <ol>
                    <li className="flex items-center gap-3 rounded-2xl border border-[#F47822]/45 bg-[#F47822]/8 px-3 py-2.5 shadow-[0_4px_14px_rgba(244,120,34,0.12)] sm:px-4">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F47822] text-xs font-black tabular-nums text-white">
                        {me.rank}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">
                            {me.name ?? t("dashboard.leaderboard.you")}
                          </span>
                          <span className="rounded-full bg-[#F47822] px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                            {t("dashboard.leaderboard.you")}
                          </span>
                        </span>
                        {me.username && (
                          <span className="block truncate text-[11px] text-[#3A3A3A]/40 dark:text-white/40">
                            @{me.username}
                          </span>
                        )}
                      </span>
                      <span className="text-xs font-black tabular-nums text-[#F47822]" dir="ltr">
                        {me.total_xp.toLocaleString()} XP
                      </span>
                    </li>
                  </ol>
                </>
              ) : null
            ) : null}
          </>
        )}
      </div>
    </motion.section>
  );
}

function LevelProgressSection({
  t,
  level,
  title,
  totalXp,
  nextLevelXp,
  nextLevelTitle,
  progressPercent,
  recentAwards,
}: {
  t: TFunction;
  level: number;
  title: string;
  totalXp: number;
  nextLevelXp: number;
  nextLevelTitle: string;
  progressPercent: number;
  recentAwards: Array<{ id: string; event: string; xp: number; metadata?: { label?: string } }>;
}) {
  const remaining = Math.max(0, nextLevelXp - totalXp);
  const clamped = Math.min(100, Math.max(0, progressPercent));
  const ringRadius = 62;
  const ringCircumference = 2 * Math.PI * ringRadius;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      aria-label={t("dashboard.achievementsPage.progressAria")}
      className="relative mt-6 overflow-hidden rounded-[28px] border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] text-[#3A3A3A] dark:text-[#ececef] shadow-[0_12px_30px_rgba(58,58,58,.06)]"
    >
      {/* Ambient décor */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -end-24 -top-28 h-72 w-72 rounded-full bg-[#F47822]/10 blur-3xl" />
        <div className="absolute -bottom-32 -start-20 h-72 w-72 rounded-full bg-[#F47822]/[.07] blur-3xl" />
      </div>

      <div className="relative grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[auto_minmax(0,1fr)_270px]">
        {/* Level medallion */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-5"
        >
          <div className="relative h-36 w-36 shrink-0">
            <div className="absolute inset-0 rounded-full bg-[#F47822]/15 blur-xl" aria-hidden="true" />
            <svg viewBox="0 0 144 144" className="relative h-full w-full -rotate-90">
              <defs>
                <linearGradient id="hbt-level-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F47822" />
                  <stop offset="100%" stopColor="#ffc38f" />
                </linearGradient>
              </defs>
              <circle cx="72" cy="72" r={ringRadius} fill="none" stroke="#3A3A3A" strokeOpacity="0.08" strokeWidth="12" />
              <motion.circle
                cx="72"
                cy="72"
                r={ringRadius}
                fill="none"
                stroke="url(#hbt-level-ring)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                initial={{ strokeDashoffset: ringCircumference }}
                animate={{ strokeDashoffset: ringCircumference * (1 - clamped / 100) }}
                transition={{ duration: 1.1, ease: "easeOut", delay: 0.25 }}
                style={{ filter: "drop-shadow(0 0 6px rgba(244,120,34,0.55))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#3A3A3A]/45 dark:text-white/45">
                {t("dashboard.achievementsPage.levelLabel")}
              </span>
              <span className="text-5xl font-black tabular-nums text-[#3A3A3A] dark:text-[#ececef]" dir="ltr">
                {level}
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">
              <Sparkles className="h-3.5 w-3.5" />
              {t("dashboard.achievementsPage.progressLabel")}
            </p>
            <p className="mt-2 truncate text-2xl font-black tracking-tight">{title}</p>
            <p className="mt-1 text-sm font-semibold text-[#3A3A3A]/55 dark:text-white/55" dir="ltr">
              {totalXp.toLocaleString()} XP
            </p>
          </div>
        </motion.div>

        {/* Progress track */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="min-w-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold sm:text-xl">
              {t("dashboard.achievementsPage.xpEarned", { xp: totalXp.toLocaleString() })}
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F47822] px-3 py-1.5 text-xs font-black text-white shadow-[0_6px_18px_rgba(244,120,34,0.4)]">
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span dir="ltr">{clamped}%</span>
            </span>
          </div>
          <p className="mt-1.5 text-sm text-[#3A3A3A]/55 dark:text-white/55">
            {remaining
              ? t("dashboard.achievementsPage.xpUntil", {
                  xp: remaining.toLocaleString(),
                  title: nextLevelTitle,
                })
              : t("dashboard.achievementsPage.maxLevel")}
          </p>

          <div
            role="progressbar"
            aria-label={t("dashboard.achievementsPage.progressAria")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(clamped)}
            className="relative mt-5 h-3.5 overflow-hidden rounded-full bg-[#3A3A3A]/8 dark:bg-white/8"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${clamped}%` }}
              transition={{ duration: 1.1, ease: "easeOut", delay: 0.25 }}
              className="relative h-full rounded-full bg-gradient-to-r from-[#F47822] via-[#ff8f3d] to-[#ffc38f]"
            >
              <motion.span
                aria-hidden="true"
                className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                animate={{ x: ["-120%", "900%"] }}
                transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.4 }}
              />
            </motion.div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs">
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-[#3A3A3A]/[.05] dark:bg-white/[.05] px-3 py-1.5 font-bold text-[#3A3A3A]/75 dark:text-white/75">
              <Trophy className="h-3.5 w-3.5 shrink-0 text-[#F47822]" />
              <span className="truncate">{title}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#3A3A3A]/25 dark:text-white/25 rtl:-scale-x-100" aria-hidden="true" />
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-[#F47822]/30 bg-[#F47822]/10 px-3 py-1.5 font-bold text-[#D96319]">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{nextLevelTitle}</span>
            </span>
          </div>
        </motion.div>

        {/* Recent XP feed */}
        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 bg-[#FAFAFA] dark:bg-[#232329] p-5"
        >
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
            <Zap className="h-3.5 w-3.5" />
            {t("dashboard.achievementsPage.recentXp")}
          </p>
          {recentAwards.length === 0 ? (
            <p className="mt-3 text-xs leading-5 text-[#3A3A3A]/45 dark:text-white/45">
              {t("dashboard.achievementsPage.noRecentXp")}
            </p>
          ) : (
            <ul className="mt-3 max-h-44 space-y-1 overflow-y-auto [scrollbar-width:thin] ltr:pe-1 rtl:ps-1">
              {recentAwards.slice(0, 6).map((award, index) => (
                <motion.li
                  key={award.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.06 }}
                  className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-white dark:hover:bg-[#1b1b20]"
                >
                  <span className="truncate text-xs font-semibold text-[#3A3A3A]/65 dark:text-white/65">
                    {award.metadata?.label ?? award.event.replace(/_/g, " ")}
                  </span>
                  <span
                    dir="ltr"
                    className="shrink-0 rounded-full bg-[#F47822]/10 px-2 py-0.5 text-[11px] font-black text-[#F47822] tabular-nums"
                  >
                    +{award.xp}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.aside>
      </div>
    </motion.section>
  );
}

function BadgeSection({
  t,
  title,
  description,
  badges,
  earned = false,
}: {
  t: TFunction;
  title: string;
  description: string;
  badges: Achievement[];
  earned?: boolean;
}) {
  return (
    <section className="mt-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#3A3A3A] dark:text-[#ececef]">{title}</h2>
          <p className="mt-1 text-sm text-[#3A3A3A]/50 dark:text-white/50">{description}</p>
        </div>
        <span className="text-sm font-bold text-[#F47822]">
          {badges.length}
        </span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((badge) => {
          const text = badgeText(badge, t);
          const accent = badgeAccent(badge.id);
          return (
          <article
            key={badge.id}
            title={text.description ?? undefined}
            className={`rounded-2xl border p-5 shadow-[0_6px_20px_rgba(58,58,58,.04)] transition hover:-translate-y-0.5 ${earned ? "border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20]" : "border-dashed border-[#3A3A3A]/15 dark:border-white/15 bg-white/70"}`}
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={
                earned
                  ? { color: accent, backgroundColor: `${accent}1A` }
                  : { color: "#3A3A3A", backgroundColor: "rgba(58,58,58,0.06)" }
              }
            >
              <BadgeIcon
                id={badge.id}
                title={badge.title}
                icon={badge.icon}
                locked={!earned}
                className="h-5 w-5"
              />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#3A3A3A] dark:text-[#ececef]">
              {text.title}
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">
              {text.description}
            </p>
            <p className="mt-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#F47822]">
              {earned ? (
                <>
                  <Award className="h-3.5 w-3.5" />
                  {t("dashboard.achievementsPage.unlocked")}
                </>
              ) : (
                <>
                  <Trophy className="h-3.5 w-3.5" />
                  {t("dashboard.achievementsPage.howTo")}
                </>
              )}
              <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
            </p>
          </article>
          );
        })}
      </div>
    </section>
  );
}
