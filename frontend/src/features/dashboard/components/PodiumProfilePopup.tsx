import { Flame, Gift, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { UserAvatar } from "@/components/ui";
import { ApiError } from "@/lib/api/errors";
import { api } from "@/lib/api/client";

import type { LeaderboardEntry } from "./LeaderboardCard";

type BonusState =
    | { status: "idle" }
    | { status: "sending" }
    | { status: "sent"; xp: number }
    | { status: "today" }
    | { status: "error" };

/**
 * Hover/focus card for a podium place: avatar, last badges, level, streak and
 * the two social actions (message the learner, send today's bonus XP).
 * The wrapping card in the achievements page owns the `group` classes.
 */
export function PodiumProfilePopup({
    entry,
    isMe,
}: {
    entry: LeaderboardEntry;
    isMe: boolean;
}) {
    const { t } = useTranslation();
    const [bonus, setBonus] = useState<BonusState>({ status: "idle" });
    const badges = entry.badges ?? [];

    const sendBonus = async () => {
        if (bonus.status === "sending" || bonus.status === "sent" || bonus.status === "today") return;
        setBonus({ status: "sending" });
        try {
            const result = await api<{ success: boolean; xp?: number }>("/v1/leaderboard/bonus", {
                method: "POST",
                body: { target_user_id: entry.user_id },
            });
            setBonus({ status: "sent", xp: result?.xp ?? 0 });
        } catch (cause) {
            if (cause instanceof ApiError && cause.status === 409) setBonus({ status: "today" });
            else setBonus({ status: "error" });
        }
    };

    const bonusLabel =
        bonus.status === "sending"
            ? t("dashboard.podium.bonusSending")
            : bonus.status === "sent"
                ? t("dashboard.podium.bonusSent", { xp: bonus.xp })
                : bonus.status === "today"
                    ? t("dashboard.podium.bonusToday")
                    : bonus.status === "error"
                        ? t("dashboard.podium.bonusFail")
                        : t("dashboard.podium.bonus");

    const bonusDone = bonus.status === "sent" || bonus.status === "today";

    return (
        <div className="pointer-events-none invisible absolute inset-x-0 top-full z-30 mt-2 opacity-0 transition duration-150 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100">
            <div className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-4 text-start shadow-[0_18px_40px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#1b1b20]">
                <div className="flex items-center gap-3">
                    <UserAvatar
                        user={{
                            avatar: entry.avatar ?? null,
                            first_name: entry.name.split(" ")[0] ?? "",
                            last_name: entry.name.split(" ").slice(1).join(" "),
                        }}
                        className="h-11 w-11"
                    />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#3A3A3A] dark:text-[#ececef]">
                            {entry.name}
                        </p>
                        {entry.username ? (
                            <p className="truncate text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                                @{entry.username}
                            </p>
                        ) : null}
                    </div>
                    <span className="ms-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F47822]/10 px-2 py-1 text-[10px] font-black text-[#F47822]">
                        <Sparkles className="h-3 w-3" />
                        {entry.total_xp.toLocaleString()} XP
                    </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                    {badges.length === 0 ? (
                        <span className="text-[11px] font-semibold text-[#3A3A3A]/45 dark:text-white/45">
                            {t("dashboard.podium.noBadges")}
                        </span>
                    ) : (
                        badges.map((badge) => (
                            <span
                                key={badge.id}
                                className="inline-flex items-center gap-1 rounded-full bg-[#3A3A3A]/6 px-2 py-1 text-[10px] font-bold text-[#3A3A3A]/70 dark:bg-white/8 dark:text-white/70"
                            >
                                {t(`badges.${badge.id}.title`, { defaultValue: badge.id })}
                            </span>
                        ))
                    )}
                </div>

                <div className="mt-3 flex items-center gap-3 text-[11px] font-bold text-[#3A3A3A]/55 dark:text-white/55">
                    <span>{t("dashboard.leaderboard.levelLabel")} {entry.level}</span>
                    {entry.current_streak > 0 ? (
                        <span className="inline-flex items-center gap-1 text-orange-500">
                            <Flame className="h-3.5 w-3.5" />
                            {t("dashboard.podium.streakDays", { days: entry.current_streak })}
                        </span>
                    ) : null}
                </div>

                {!isMe ? (
                    <div className="mt-3">
                        <button
                            type="button"
                            onClick={() => void sendBonus()}
                            disabled={bonus.status === "sending" || bonusDone}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#F47822] px-3 py-2 text-[11px] font-black text-white transition hover:bg-[#de6414] disabled:opacity-70"
                        >
                            {bonus.status === "sending" ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Gift className="h-3.5 w-3.5" />
                            )}
                            {bonusLabel}
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
