import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Flame,
    Trophy,
    Users,
    Swords,
    UserPlus,
} from "lucide-react";

import {
    challengesApi,
    type ActivityItem,
    type Challenge,
    type LeaderboardBoard,
    type Peer,
    type ReviewBoard,
    type Rival,
    type RivalResult,
    type TodayBoard,
} from "../api/challenges.api";

function statusTone(status: Challenge["status"]): string {
    if (status === "claimed" || status === "completed") {
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
    }
    if (status === "in_progress") {
        return "bg-[#F47822]/15 text-[#F47822]";
    }
    return "bg-[#3A3A3A]/10 text-[#3A3A3A]/60 dark:bg-white/10 dark:text-white/60";
}

function statusLabel(t: (k: string, o?: Record<string, unknown>) => string, status: Challenge["status"]): string {
    if (status === "claimed") return t("challenges.status.claimed");
    if (status === "completed") return t("challenges.status.completed");
    if (status === "in_progress") return t("challenges.status.inProgress");
    return t("challenges.status.pending");
}

export function ChallengesPage() {
    const { t, i18n } = useTranslation();

    const [today, setToday] = useState<TodayBoard | null>(null);
    const [review, setReview] = useState<ReviewBoard | null>(null);
    const [board, setBoard] = useState<LeaderboardBoard | null>(null);
    const [feed, setFeed] = useState<ActivityItem[]>([]);
    const [rivals, setRivals] = useState<Rival[]>([]);
    const [peers, setPeers] = useState<Peer[]>([]);
    const [result, setResult] = useState<RivalResult | null>(null);
    const [activeRivalId, setActiveRivalId] = useState<string | null>(null);
    const [showPeers, setShowPeers] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [tDay, rev, lb, act, riv, peer] = await Promise.all([
                challengesApi.today(),
                challengesApi.review(),
                challengesApi.leaderboard(20),
                challengesApi.activity(30),
                challengesApi.rivals(),
                challengesApi.peers(),
            ]);
            setToday(tDay);
            setReview(rev);
            setBoard(lb);
            setFeed(act);
            setRivals(riv);
            setPeers(peer);
        } catch {
            setError(t("challenges.loadError"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        void loadAll();
    }, [loadAll]);

    const handleClaim = async (id: string) => {
        setBusyId(id);
        try {
            await challengesApi.claim(id);
            const tDay = await challengesApi.today();
            setToday(tDay);
            const lb = await challengesApi.leaderboard(20);
            setBoard(lb);
        } catch {
            setError(t("challenges.claimError"));
        } finally {
            setBusyId(null);
        }
    };

    const handleChallenge = async (userId: string) => {
        setBusyId(userId);
        try {
            const { rival } = await challengesApi.challenge(userId);
            setRivals((prev) => [rival, ...prev.filter((r) => r.id !== rival.id)]);
            setShowPeers(false);
        } catch {
            setError(t("challenges.rivalError"));
        } finally {
            setBusyId(null);
        }
    };

    const handleAccept = async (id: string) => {
        setBusyId(id);
        try {
            const { rival } = await challengesApi.accept(id);
            setRivals((prev) => prev.map((r) => (r.id === rival.id ? rival : r)));
        } catch {
            setError(t("challenges.rivalError"));
        } finally {
            setBusyId(null);
        }
    };

    const handleShare = async (id: string) => {
        setBusyId(id);
        try {
            const shared = await challengesApi.share(id);
            setResult(shared);
            setActiveRivalId(id);
        } catch {
            setError(t("challenges.shareError"));
        } finally {
            setBusyId(null);
        }
    };

    const fmtTime = (value: string | null | undefined): string => {
        if (!value) return "—";
        return new Intl.DateTimeFormat(i18n.language, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
    };

    if (loading) {
        return (
            <main className="min-h-full bg-background" data-testid="challenges-page">
                <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
                    <div className="h-10 w-48 animate-pulse rounded-xl bg-[#3A3A3A]/10 dark:bg-white/10" />
                    <div className="mt-6 h-40 animate-pulse rounded-3xl bg-[#3A3A3A]/8 dark:bg-white/8" />
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="h-56 animate-pulse rounded-3xl bg-[#3A3A3A]/8 dark:bg-white/8" />
                        <div className="h-56 animate-pulse rounded-3xl bg-[#3A3A3A]/8 dark:bg-white/8" />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-full bg-background" data-testid="challenges-page">
            <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#3A3A3A]/10 px-3 py-2 text-xs font-semibold text-[#3A3A3A]/70 transition hover:border-[#F47822]/30 hover:text-[#F47822] dark:border-white/10 dark:text-white/70 dark:hover:text-[#F47822]"
                >
                    <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
                    {t("challenges.backToDashboard")}
                </Link>

                <section className="mt-4 overflow-hidden rounded-3xl bg-[#3A3A3A] p-7 text-white shadow-[0_12px_35px_rgba(58,58,58,0.12)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                        {t("challenges.eyebrow")}
                    </p>
                    <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
                        <div>
                            <h1 className="text-2xl font-bold">{t("challenges.title")}</h1>
                            <p className="mt-1 max-w-xl text-sm text-white/60">{t("challenges.description")}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <div className="flex min-w-[120px] items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-3.5 py-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47822]">
                                    <Flame className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/50">
                                        {t("challenges.summary.progress")}
                                    </p>
                                    <p className="text-lg font-bold leading-none">
                                        {today?.summary.done ?? 0}/{today?.summary.total ?? 0}
                                    </p>
                                </div>
                            </div>
                            <div className="flex min-w-[120px] items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-3.5 py-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F47822]">
                                    <Trophy className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/50">
                                        {t("challenges.summary.xp")}
                                    </p>
                                    <p className="text-lg font-bold leading-none">
                                        {today?.summary.xp_claimed ?? 0}/{today?.summary.xp_available ?? 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {error ? (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400" role="alert">
                        {error}
                    </div>
                ) : null}

                <div className="mt-6 grid gap-5 lg:grid-cols-3">
                    {/* My board */}
                    <section className="rounded-3xl border border-[#3A3A3A]/10 bg-white p-6 shadow-[0_8px_30px_rgba(58,58,58,0.05)] dark:border-white/10 dark:bg-[#1b1b20] lg:col-span-2">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#F47822]">
                                    {t("challenges.myBoardEyebrow")}
                                </p>
                                <h2 className="mt-1 text-lg font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                                    {t("challenges.myBoardTitle")}
                                </h2>
                            </div>
                            <span className="rounded-full bg-[#F47822]/10 px-3 py-1 text-xs font-semibold text-[#F47822]">
                                {today?.summary.done ?? 0} / {today?.summary.total ?? 0}
                            </span>
                        </div>

                        {(today?.challenges ?? []).length === 0 ? (
                            <p className="mt-5 rounded-2xl border border-dashed border-[#3A3A3A]/15 px-4 py-8 text-center text-sm text-[#3A3A3A]/55 dark:border-white/15 dark:text-white/55">
                                {t("challenges.notRanked")}
                            </p>
                        ) : (
                        <ul className="mt-5 space-y-3">
                            {(today?.challenges ?? []).map((challenge) => (
                                <li
                                    key={challenge.id}
                                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#3A3A3A]/8 p-4 transition hover:border-[#F47822]/30 dark:border-white/8"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                                        {challenge.status === "completed" || challenge.status === "claimed" ? (
                                            <CheckCircle2 className="h-5 w-5" />
                                        ) : (
                                            <Clock3 className="h-5 w-5" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold text-[#3A3A3A] dark:text-[#ececef]">{challenge.title}</p>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusTone(challenge.status)}`}>
                                                {statusLabel(t, challenge.status)}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-sm text-[#3A3A3A]/55 dark:text-white/55">{challenge.description}</p>
                                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#3A3A3A]/45 dark:text-white/45">
                                            <span>+{challenge.xp} XP</span>
                                            <span>
                                                {challenge.progress}/{challenge.target}
                                            </span>
                                            {challenge.completed_at ? <span>{fmtTime(challenge.completed_at)}</span> : null}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {challenge.status === "completed" ? (
                                            <button
                                                type="button"
                                                onClick={() => void handleClaim(challenge.id)}
                                                disabled={busyId === challenge.id}
                                                className="rounded-xl bg-[#F47822] px-3.5 py-2 text-xs font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
                                            >
                                                {t("challenges.claim")}
                                            </button>
                                        ) : null}
                                        {challenge.route ? (
                                            <Link
                                                to={challenge.route}
                                                className="inline-flex items-center gap-1 rounded-xl border border-[#3A3A3A]/10 px-3 py-2 text-xs font-semibold text-[#3A3A3A]/70 transition hover:border-[#F47822]/30 hover:text-[#F47822] dark:border-white/10 dark:text-white/70"
                                            >
                                                {t("challenges.go")}
                                                <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                                            </Link>
                                        ) : null}
                                    </div>
                                </li>
                            ))}
                        </ul>
                        )}
                    </section>

                    {/* Today's race leaderboard */}
                    <section className="rounded-3xl border border-[#3A3A3A]/10 bg-white p-6 shadow-[0_8px_30px_rgba(58,58,58,0.05)] dark:border-white/10 dark:bg-[#1b1b20]">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-[#F47822]" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#F47822]">
                                    {t("challenges.leaderboardEyebrow")}
                                </p>
                                <h2 className="mt-0.5 text-lg font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                                    {t("challenges.leaderboardTitle")}
                                </h2>
                            </div>
                        </div>

                        {board?.me ? (
                            <div className="mt-4 rounded-2xl bg-[#F47822]/10 p-3 text-sm">
                                <p className="font-semibold text-[#F47822]">{t("challenges.yourRank")}</p>
                                <p className="mt-1 text-[#3A3A3A]/70 dark:text-white/70">
                                    {board.me.completed} · {board.me.xp} XP · {fmtTime(board.me.last_finished_at)}
                                </p>
                            </div>
                        ) : (
                            <p className="mt-4 rounded-2xl bg-[#3A3A3A]/8 p-3 text-sm text-[#3A3A3A]/60 dark:bg-white/8 dark:text-white/60">
                                {t("challenges.notRanked")}
                            </p>
                        )}

                        <ol className="mt-4 space-y-2">
                            {(board?.top ?? []).map((entry, index) => (
                                <li
                                    key={entry.user_id}
                                    className="flex items-center gap-3 rounded-xl border border-[#3A3A3A]/8 p-3 dark:border-white/8"
                                >
                                    <span className="w-6 text-center text-sm font-bold text-[#F47822]">{index + 1}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">{entry.name}</p>
                                        <p className="text-xs text-[#3A3A3A]/45 dark:text-white/45">
                                            {entry.completed} · {entry.xp} XP · {fmtTime(entry.last_finished_at)}
                                        </p>
                                    </div>
                                </li>
                            ))}
                            {!board?.top?.length ? (
                                <li className="rounded-xl border border-dashed border-[#3A3A3A]/15 p-4 text-center text-sm text-[#3A3A3A]/50 dark:border-white/15 dark:text-white/50">
                                    {t("challenges.leaderboardEmpty")}
                                </li>
                            ) : null}
                        </ol>
                    </section>
                </div>

                {/* Review + feed + rivals */}
                <div className="mt-6 grid gap-5 lg:grid-cols-3">
                    {/* Yesterday review */}
                    <section className="rounded-3xl border border-[#3A3A3A]/10 bg-white p-6 shadow-[0_8px_30px_rgba(58,58,58,0.05)] dark:border-white/10 dark:bg-[#1b1b20]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#F47822]">
                            {t("challenges.reviewEyebrow")}
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                            {t("challenges.reviewTitle")}
                        </h2>
                        <p className="mt-1 text-sm text-[#3A3A3A]/55 dark:text-white/55">
                            {t("challenges.reviewDesc", { date: review?.date ?? "" })}
                        </p>

                        <div className="mt-4 rounded-2xl bg-[#3A3A3A]/8 p-4 dark:bg-white/8">
                            <p className="text-3xl font-bold text-[#3A3A3A] dark:text-[#ececef]">
                                {review?.summary.done ?? 0}/{review?.summary.total ?? 0}
                            </p>
                            <p className="mt-1 text-xs text-[#3A3A3A]/50 dark:text-white/50">
                                {t("challenges.reviewXp", { xp: review?.summary.xp_claimed ?? 0 })}
                            </p>
                        </div>

                        <ul className="mt-4 space-y-2">
                            {(review?.challenges ?? []).map((c) => (
                                <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                                    <span className="truncate text-[#3A3A3A]/70 dark:text-white/70">{c.title}</span>
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusTone(c.status)}`}>
                                        {statusLabel(t, c.status)}
                                    </span>
                                </li>
                            ))}
                            {!review?.challenges?.length ? (
                                <li className="text-sm text-[#3A3A3A]/45 dark:text-white/45">{t("challenges.reviewEmpty")}</li>
                            ) : null}
                        </ul>
                    </section>

                    {/* Peer activity feed */}
                    <section className="rounded-3xl border border-[#3A3A3A]/10 bg-white p-6 shadow-[0_8px_30px_rgba(58,58,58,0.05)] dark:border-white/10 dark:bg-[#1b1b20]">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-[#F47822]" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#F47822]">
                                    {t("challenges.feedEyebrow")}
                                </p>
                                <h2 className="mt-0.5 text-lg font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                                    {t("challenges.feedTitle")}
                                </h2>
                            </div>
                        </div>

                        <ul className="mt-4 space-y-3">
                            {feed.map((item) => (
                                <li key={item.id} className="rounded-xl border border-[#3A3A3A]/8 p-3 dark:border-white/8">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">{item.name}</p>
                                        <span className="shrink-0 text-[10px] text-[#3A3A3A]/40 dark:text-white/40">
                                            {fmtTime(item.completed_at)}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-sm text-[#3A3A3A]/60 dark:text-white/60">
                                        {t("challenges.feedCompleted", { challenge: item.challenge ?? "—" })}
                                    </p>
                                    <p className="mt-1 text-xs text-[#F47822]">+{item.xp} XP</p>
                                </li>
                            ))}
                            {!feed.length ? (
                                <li className="rounded-xl border border-dashed border-[#3A3A3A]/15 p-4 text-center text-sm text-[#3A3A3A]/50 dark:border-white/15 dark:text-white/50">
                                    {t("challenges.feedEmpty")}
                                </li>
                            ) : null}
                        </ul>
                    </section>

                    {/* Rivals / challenge students */}
                    <section className="rounded-3xl border border-[#3A3A3A]/10 bg-white p-6 shadow-[0_8px_30px_rgba(58,58,58,0.05)] dark:border-white/10 dark:bg-[#1b1b20]">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Swords className="h-5 w-5 text-[#F47822]" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#F47822]">
                                        {t("challenges.rivalsEyebrow")}
                                    </p>
                                    <h2 className="mt-0.5 text-lg font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                                        {t("challenges.rivalsTitle")}
                                    </h2>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPeers((v) => !v)}
                                className="inline-flex items-center gap-1 rounded-xl border border-[#3A3A3A]/10 px-3 py-2 text-xs font-semibold text-[#3A3A3A]/70 transition hover:border-[#F47822]/30 hover:text-[#F47822] dark:border-white/10 dark:text-white/70"
                            >
                                <UserPlus className="h-3.5 w-3.5" />
                                {t("challenges.challengeSomeone")}
                            </button>
                        </div>

                        {showPeers ? (
                            <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-[#3A3A3A]/8 p-2 dark:border-white/8">
                                {peers.map((peer) => (
                                    <li key={peer.user_id} className="flex items-center justify-between gap-2">
                                        <span className="truncate text-sm text-[#3A3A3A]/70 dark:text-white/70">{peer.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => void handleChallenge(peer.user_id)}
                                            disabled={busyId === peer.user_id}
                                            className="rounded-lg bg-[#F47822] px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60"
                                        >
                                            {t("challenges.challenge")}
                                        </button>
                                    </li>
                                ))}
                                {!peers.length ? (
                                    <li className="p-2 text-center text-sm text-[#3A3A3A]/50 dark:text-white/50">
                                        {t("challenges.peersEmpty")}
                                    </li>
                                ) : null}
                            </ul>
                        ) : null}

                        <ul className="mt-4 space-y-3">
                            {rivals.map((rival) => (
                                <li key={rival.id} className="rounded-xl border border-[#3A3A3A]/8 p-3 dark:border-white/8">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                                                {rival.peer.name}
                                            </p>
                                            <p className="text-xs text-[#3A3A3A]/50 dark:text-white/50">
                                                {rival.direction === "sent"
                                                    ? t("challenges.sentTo")
                                                    : t("challenges.receivedFrom")}{" "}
                                                ·{" "}
                                                {rival.status === "pending"
                                                    ? t("challenges.status.pending")
                                                    : rival.status === "accepted"
                                                      ? t("challenges.status.accepted")
                                                      : t("challenges.status.declined")}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 gap-2">
                                            {rival.status === "pending" && rival.direction === "received" ? (
                                                <button
                                                    type="button"
                                                    onClick={() => void handleAccept(rival.id)}
                                                    disabled={busyId === rival.id}
                                                    className="rounded-lg bg-[#F47822] px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60"
                                                >
                                                    {t("challenges.accept")}
                                                </button>
                                            ) : null}
                                            {rival.status === "accepted" ? (
                                                <button
                                                    type="button"
                                                    onClick={() => void handleShare(rival.id)}
                                                    disabled={busyId === rival.id}
                                                    className="rounded-lg border border-[#F47822]/30 px-2.5 py-1.5 text-[11px] font-semibold text-[#F47822] disabled:opacity-60"
                                                >
                                                    {t("challenges.viewResult")}
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                </li>
                            ))}
                            {!rivals.length ? (
                                <li className="rounded-xl border border-dashed border-[#3A3A3A]/15 p-4 text-center text-sm text-[#3A3A3A]/50 dark:border-white/15 dark:text-white/50">
                                    {t("challenges.rivalsEmpty")}
                                </li>
                            ) : null}
                        </ul>
                    </section>
                </div>

                {/* Shared head-to-head result modal-ish panel */}
                {result && activeRivalId ? (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-label={t("challenges.resultTitle")}
                        onClick={() => {
                            setResult(null);
                            setActiveRivalId(null);
                        }}
                    >
                        <div
                            className="w-full max-w-lg rounded-3xl border border-[#3A3A3A]/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#1b1b20]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#F47822]">
                                        {t("challenges.resultEyebrow")}
                                    </p>
                                    <h3 className="mt-1 text-xl font-bold text-[#3A3A3A] dark:text-[#ececef]">
                                        {t("challenges.resultTitle")}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setResult(null);
                                        setActiveRivalId(null);
                                    }}
                                    className="rounded-lg border border-[#3A3A3A]/10 px-2.5 py-1.5 text-xs font-semibold text-[#3A3A3A]/60 dark:border-white/10 dark:text-white/60"
                                >
                                    {t("challenges.close")}
                                </button>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                {[result.you, result.them].map((side) => (
                                    <div
                                        key={side.user_id}
                                        className={`rounded-2xl border p-4 ${
                                            result.winner?.user_id === side.user_id
                                                ? "border-[#F47822]/40 bg-[#F47822]/10"
                                                : "border-[#3A3A3A]/10 dark:border-white/10"
                                        }`}
                                    >
                                        <p className="text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">{side.name}</p>
                                        <p className="mt-2 text-2xl font-bold text-[#F47822]">
                                            {side.completed}/{side.total}
                                        </p>
                                        <p className="mt-1 text-xs text-[#3A3A3A]/55 dark:text-white/55">
                                            {side.xp_claimed} XP · {fmtTime(side.last_finished_at)}
                                        </p>
                                        <ul className="mt-3 space-y-1">
                                            {side.challenges.map((c) => (
                                                <li key={c.key} className="flex items-center justify-between text-xs">
                                                    <span className="truncate text-[#3A3A3A]/60 dark:text-white/60">{c.title}</span>
                                                    <span
                                                        className={
                                                            c.status === "completed" || c.status === "claimed"
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : "text-[#3A3A3A]/40 dark:text-white/40"
                                                        }
                                                    >
                                                        {c.progress}/{c.target}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>

                            <p className="mt-4 text-center text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                                {result.winner
                                    ? t("challenges.winnerIs", { name: result.winner.name })
                                    : t("challenges.tie")}
                            </p>
                        </div>
                    </div>
                ) : null}
            </div>
        </main>
    );
}
