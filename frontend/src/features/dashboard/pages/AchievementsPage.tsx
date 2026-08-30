import { Award, ChevronRight, Flame, Sparkles, Trophy, Zap } from "lucide-react";
import { useDashboard } from "../hooks/useDashboard";
import type { Achievement } from "../types/dashboard.types";
import { BadgeIcon } from "../components/BadgeIcon";
import { Link } from "react-router-dom";

export function AchievementsPage() {
  const { dashboard, isLoading, error } = useDashboard();
  if (isLoading && !dashboard)
    return (
      <main className="min-h-full p-8 text-sm text-[#3A3A3A]/50">
        Loading achievements…
      </main>
    );
  if (error || !dashboard)
    return (
      <main className="min-h-full p-8 text-sm text-red-600">
        Unable to load achievements.
      </main>
    );
  const earned = dashboard.achievements.filter((badge) => badge.completed);
  const locked = dashboard.achievements.filter((badge) => !badge.completed);
  const level = dashboard.progression;
  const remaining = Math.max(0, level.next_level_xp - level.total_xp);
  return (
    <main className="min-h-full bg-[#F3F3F3]">
      <div className="mx-auto max-w-[1280px] px-5 py-6 sm:px-8 sm:py-8">
        <section className="relative overflow-hidden rounded-[32px] bg-[#353535] px-6 py-7 text-white shadow-[0_18px_42px_rgba(58,58,58,.13)] sm:px-8 sm:py-9">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#F47822]/20 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#F47822]">
                <Sparkles className="h-3.5 w-3.5" />
                Learning journey
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                Achievements
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                Your skills, consistency, and milestones add up here.
              </p>
            </div>
            <p className="rounded-2xl border border-white/10 bg-white/[.07] px-4 py-3 text-sm font-bold">
              {earned.length} badges earned
            </p>
          </div>
        </section>
        <section className="mt-6 overflow-hidden rounded-[28px] border border-[#3A3A3A]/8 bg-white shadow-[0_12px_30px_rgba(58,58,58,.05)]">
          <div className="grid lg:grid-cols-[180px_1fr_260px]">
            <div className="flex min-h-40 items-center justify-center bg-[#F47822] p-6 text-center text-white">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/70">
                  Current level
                </p>
                <p className="mt-2 text-5xl font-black">{level.level}</p>
                <p className="mt-1 text-sm font-semibold">{level.title}</p>
              </div>
            </div>
            <div className="p-6 sm:p-7">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">
                    Level progress
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-[#3A3A3A]">
                    {level.total_xp.toLocaleString()} XP earned
                  </h2>
                  <p className="mt-1 text-sm text-[#3A3A3A]/50">
                    {remaining
                      ? `${remaining.toLocaleString()} XP until ${level.next_level_title}`
                      : "Maximum level reached"}
                  </p>
                </div>
                <span className="flex h-10 items-center gap-1 rounded-xl bg-[#F47822]/10 px-3 text-xs font-bold text-[#F47822]">
                  <Zap className="h-3.5 w-3.5" />
                  {level.progress_percent}%
                </span>
              </div>
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#3A3A3A]/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#F47822] to-[#ffab67] transition-all duration-700"
                  style={{ width: `${level.progress_percent}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] font-semibold text-[#3A3A3A]/40">
                <span>{level.title}</span>
                <span>{level.next_level_title}</span>
              </div>
            </div>
            <div className="border-t border-[#3A3A3A]/7 bg-[#FAFAFA] p-5 lg:border-l lg:border-t-0">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">
                Recent XP
              </p>
              <div className="mt-3 space-y-2">
                {level.recent_awards.slice(0, 6).map((award) => (
                  <div
                    key={award.id}
                    className="flex justify-between gap-2 text-xs"
                  >
                    <span className="truncate font-semibold text-[#3A3A3A]/65">
                      {award.metadata?.label ?? award.event.replace(/_/g, " ")}
                    </span>
                    <span className="font-bold text-[#F47822]">
                      +{award.xp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="mt-6 overflow-hidden rounded-[28px] border border-[#F47822]/15 bg-white shadow-[0_12px_30px_rgba(58,58,58,.05)]">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F47822]/10 text-[#F47822]"><Flame className="h-6 w-6" /></div>
              <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">New challenge</p><h2 className="mt-1 text-xl font-bold text-[#3A3A3A]">Learning streak</h2><p className="mt-1 max-w-xl text-sm leading-5 text-[#3A3A3A]/50">Build a daily learning habit and earn a small XP bonus from your third consecutive day.</p></div>
            </div>
            <div className="flex shrink-0 items-center gap-4 rounded-2xl bg-[#FAFAFA] px-4 py-3"><div><p className="text-[9px] font-bold uppercase tracking-wide text-[#3A3A3A]/40">Current streak</p><p className="mt-1 text-2xl font-black text-[#F47822]">{level.current_streak} <span className="text-xs font-bold text-[#3A3A3A]/45">days</span></p></div><div className="h-10 w-px bg-[#3A3A3A]/10"/><div><p className="text-[9px] font-bold uppercase tracking-wide text-[#3A3A3A]/40">Best streak</p><p className="mt-1 text-2xl font-black text-[#3A3A3A]">{level.longest_streak}</p></div></div>
          </div>
          <div className="grid gap-5 border-t border-[#3A3A3A]/7 bg-[#FDFDFD] px-6 py-5 sm:grid-cols-[1fr_auto] sm:px-7"><div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#3A3A3A]/40">Last 7 days</p><div className="mt-3 flex max-w-sm justify-between gap-2">{level.learning_days.map((day) => { const label = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date(`${day.date}T12:00:00`)); return <div key={day.date} className="flex flex-col items-center gap-1.5"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-bold ${day.active ? "bg-[#F47822] text-white" : "bg-[#3A3A3A]/8 text-[#3A3A3A]/35"}`}>{day.active ? "✓" : "·"}</span><span className="text-[9px] font-semibold text-[#3A3A3A]/40">{label}</span></div>; })}</div><p className="mt-4 text-xs leading-5 text-[#3A3A3A]/50"><span className="font-bold text-[#3A3A3A]">Tip:</span> A learning day is recorded after a tracked lesson, quiz, assessment, enrollment, or course action.</p></div><div className="flex flex-col justify-between gap-3 sm:min-w-[220px]"><div className="rounded-xl border border-[#F47822]/10 bg-[#F47822]/5 p-3 text-xs"><p className="font-bold text-[#3A3A3A]">Streak XP boosts</p><p className="mt-1 text-[10px] leading-4 text-[#3A3A3A]/50">3 days: +5–10 XP · 7 days: momentum bonus · 14 days: milestone reward</p></div>{dashboard.current_learning[0] && <Link to={`/courses/${dashboard.current_learning[0].id}`} className="inline-flex items-center justify-center rounded-xl bg-[#F3F3F3] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#F47822]">Keep your streak alive</Link>}</div></div>
        </section>
        <BadgeSection
          title="Earned badges"
          description="Milestones you have already unlocked."
          badges={earned}
          earned
        />
        <BadgeSection
          title="Next badges"
          description="Each badge explains exactly what to do next."
          badges={locked}
        />
      </div>
    </main>
  );
}
function BadgeSection({
  title,
  description,
  badges,
  earned = false,
}: {
  title: string;
  description: string;
  badges: Achievement[];
  earned?: boolean;
}) {
  return (
    <section className="mt-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#3A3A3A]">{title}</h2>
          <p className="mt-1 text-sm text-[#3A3A3A]/50">{description}</p>
        </div>
        <span className="text-sm font-bold text-[#F47822]">
          {badges.length}
        </span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((badge) => (
          <article
            key={badge.id}
            title={badge.description}
            className={`rounded-2xl border p-5 shadow-[0_6px_20px_rgba(58,58,58,.04)] transition hover:-translate-y-0.5 ${earned ? "border-[#3A3A3A]/8 bg-white" : "border-dashed border-[#3A3A3A]/15 bg-white/70"}`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
              <BadgeIcon
                title={badge.title}
                icon={badge.icon}
                locked={!earned}
                className="h-5 w-5"
              />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#3A3A3A]">
              {badge.title}
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/50">
              {badge.description}
            </p>
            <p className="mt-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#F47822]">
              {earned ? (
                <>
                  <Award className="h-3.5 w-3.5" />
                  Unlocked
                </>
              ) : (
                <>
                  <Trophy className="h-3.5 w-3.5" />
                  How to unlock
                </>
              )}
              <ChevronRight className="h-3.5 w-3.5" />
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
