import { Crown, Flame, Loader2, Medal, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "@/lib/api/client";

export interface LeaderboardBadge {
    id: string;
    earned_at?: string | null;
}

export interface LeaderboardEntry {
    user_id: string;
    name: string;
    username: string | null;
    avatar?: string | null;
    total_xp: number;
    level: number;
    current_streak: number;
    badges?: LeaderboardBadge[];
}

export interface LeaderboardMe {
    user_id: string;
    name?: string;
    username?: string | null;
    avatar?: string | null;
    total_xp: number;
    level: number;
    rank: number;
    current_streak: number;
    badges?: LeaderboardBadge[];
}

export interface LeaderboardPayload {
    top: LeaderboardEntry[];
    me: LeaderboardMe | null;
}

const MEDAL = [
    { bg: "bg-gradient-to-br from-amber-400 to-amber-500", text: "text-white", ring: "ring-amber-300/60" },
    { bg: "bg-gradient-to-br from-zinc-300 to-zinc-400", text: "text-zinc-800", ring: "ring-zinc-200/80" },
    { bg: "bg-gradient-to-br from-amber-600 to-amber-700", text: "text-white", ring: "ring-amber-700/40" },
];

function rankBadge(rank: number) {
    if (rank <= 3) {
        const m = MEDAL[rank - 1];
        return (
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black tabular-nums ring-2 ${m.bg} ${m.text} ${m.ring}`}>
                {rank === 1 ? <Crown className="h-3.5 w-3.5" /> : rank}
            </span>
        );
    }
    return (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#3A3A3A]/6 dark:bg-white/8 text-[11px] font-black tabular-nums text-[#3A3A3A]/55 dark:text-white/55">
            {rank}
        </span>
    );
}

function Row({
    entry,
    rank,
    isMe,
    showYou,
}: {
    entry: LeaderboardEntry;
    rank: number;
    isMe: boolean;
    showYou?: boolean;
}) {
    const { t } = useTranslation();
    return (
        <li
            className={[
                "flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition",
                isMe
                    ? "border-[#F47822]/45 bg-[#F47822]/8 shadow-[0_4px_14px_rgba(244,120,34,0.12)]"
                    : "border-transparent bg-[#3A3A3A]/[0.03] dark:bg-white/[0.04] hover:border-[#3A3A3A]/10 dark:hover:border-white/10",
            ].join(" ")}
        >
            {rankBadge(rank)}
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{entry.name}</span>
                    {isMe && (
                        <span className="shrink-0 rounded-full bg-[#F47822] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                            {showYou || isMe ? t("dashboard.leaderboard.you") : ""}
                        </span>
                    )}
                </span>
                {entry.username ? (
                    <span className="block truncate text-[11px] font-medium text-[#3A3A3A]/40 dark:text-white/40">@{entry.username}</span>
                ) : null}
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
                {entry.current_streak >= 3 && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-500">
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
}

/** Compact dashboard widget: top 3 + current student (highlighted). */
export function LeaderboardCard() {
    const { t } = useTranslation();
    const [top, setTop] = useState<LeaderboardEntry[]>([]);
    const [me, setMe] = useState<LeaderboardMe | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        api<LeaderboardPayload>("/v1/leaderboard?limit=3")
            .then((data) => {
                if (cancelled) return;
                setTop(data.top ?? []);
                setMe(data.me);
            })
            .catch(() => {
                if (!cancelled) {
                    setTop([]);
                    setMe(null);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                        <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">{t("dashboard.leaderboard.title")}</h3>
                        <p className="text-xs text-muted-foreground">{t("dashboard.leaderboard.subtitle")}</p>
                    </div>
                </div>
                <div className="mt-5 flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("dashboard.leaderboard.loading")}
                </div>
            </section>
        );
    }

    if (top.length === 0) {
        return (
            <section
                data-testid="leaderboard-empty"
                className="rounded-3xl border border-border bg-card p-6 shadow-sm"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                        <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">{t("dashboard.leaderboard.title")}</h3>
                        <p className="text-xs text-muted-foreground">{t("dashboard.leaderboard.empty")}</p>
                    </div>
                </div>
            </section>
        );
    }

    const meUserId = me?.user_id ?? null;
    const meInTop = meUserId ? top.some((e) => e.user_id === meUserId) : false;
    const meRow =
        me && me.name
            ? ({
                  user_id: me.user_id,
                  name: me.name,
                  username: me.username ?? null,
                  total_xp: me.total_xp,
                  level: me.level,
                  current_streak: me.current_streak,
              } satisfies LeaderboardEntry)
            : null;
    const meRank = me?.rank ?? null;

    return (
        <section className="overflow-hidden rounded-3xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] shadow-[0_10px_36px_rgba(58,58,58,0.07)]">
            {/* Header — same surface as AI Mentor card */}
            <div className="relative overflow-hidden bg-[#3A3A3A] px-5 py-4 text-white sm:px-6">
                <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#F47822]/20 blur-3xl rtl:-left-20 rtl:right-auto" />
                <div className="pointer-events-none absolute -bottom-24 -left-20 h-40 w-40 rounded-full bg-[#F47822]/10 blur-3xl rtl:-right-20 rtl:left-auto" />
                <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822] shadow-[0_8px_20px_rgba(244,120,34,0.22)]">
                            <Trophy className="h-5 w-5 text-white" />
                        </span>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F47822]">
                                {t("dashboard.leaderboard.podium")}
                            </p>
                            <h3 className="mt-0.5 text-base font-semibold text-white">{t("dashboard.leaderboard.title")}</h3>
                            <p className="text-[11px] text-white/55">{t("dashboard.leaderboard.subtitle")}</p>
                        </div>
                    </div>
                    {me && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/55 tabular-nums" dir="ltr">
                            #{me.rank} · {me.total_xp.toLocaleString()} XP
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-2 p-4 sm:p-5">
                <ol className="space-y-2">
                    {top.map((entry, idx) => (
                        <Row
                            key={entry.user_id}
                            entry={entry}
                            rank={idx + 1}
                            isMe={Boolean(meUserId && entry.user_id === meUserId)}
                        />
                    ))}
                </ol>

                {!meInTop && meRow && meRank !== null && meRank > 3 ? (
                    <>
                        <div className="flex items-center gap-2 py-1" aria-hidden="true">
                            <span className="h-px flex-1 bg-[#3A3A3A]/10 dark:bg-white/10" />
                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#3A3A3A]/35 dark:text-white/35">
                                {t("dashboard.leaderboard.yourRank")}
                            </span>
                            <span className="h-px flex-1 bg-[#3A3A3A]/10 dark:bg-white/10" />
                        </div>
                        <ol>
                            <Row entry={meRow} rank={meRank} isMe showYou />
                        </ol>
                    </>
                ) : null}

                <Link
                    to="/achievements"
                    className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#3A3A3A]/10 dark:border-white/10 bg-[#FCFCFC] dark:bg-[#232329] px-4 py-2.5 text-xs font-bold text-[#3A3A3A]/65 dark:text-white/65 transition hover:border-[#F47822]/40 hover:bg-[#F47822]/5 hover:text-[#F47822]"
                >
                    <Medal className="h-3.5 w-3.5" />
                    {t("dashboard.leaderboard.viewFull")}
                </Link>
            </div>
        </section>
    );
}
