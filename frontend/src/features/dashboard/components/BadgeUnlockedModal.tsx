import { Award, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Achievement } from "../types/dashboard.types";
import { useTranslation } from "react-i18next";
import { BadgeIcon } from "./BadgeIcon";
import { badgeAccent } from "./badge-icons";
import { badgeText } from "../i18n/badge-text";

interface BadgeUnlockedModalProps {
    userId: string;
    achievements: Achievement[];
}

export function BadgeUnlockedModal({
    userId,
    achievements,
}: BadgeUnlockedModalProps) {
    const { t } = useTranslation();
    const [queue, setQueue] = useState<Achievement[]>([]);
    const [ready, setReady] = useState(false);
    const storageKey = `hbt-seen-badges-${userId}`;

    useEffect(() => {
        const earnedIds = achievements
            .filter((achievement) => achievement.completed)
            .map((achievement) => achievement.id);
        const stored = localStorage.getItem(storageKey);

        if (!ready) {
            if (stored === null) {
                localStorage.setItem(storageKey, JSON.stringify(earnedIds));
            } else {
                const seenIds: string[] = JSON.parse(stored);
                const newBadges = achievements.filter(
                    (achievement) =>
                        achievement.completed &&
                        !seenIds.includes(achievement.id),
                );

                if (newBadges.length) {
                    setQueue(newBadges);
                    localStorage.setItem(
                        storageKey,
                        JSON.stringify([...new Set([...seenIds, ...earnedIds])]),
                    );
                }
            }

            setReady(true);
        }
    }, [achievements, ready, storageKey]);

    const badge = queue[0];
    if (!badge) return null;

    const accent = badgeAccent(badge.id);

    const dismiss = () => setQueue((current) => current.slice(1));

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#3A3A3A]/60 dark:bg-white/60 p-5 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="badge-unlocked-title"
        >
            <section className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white dark:bg-[#1b1b20] p-7 text-center shadow-2xl">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#F47822]/15 to-transparent" />
                <button
                    type="button"
                    onClick={dismiss}
                    className="absolute end-4 top-4 rounded-lg p-1.5 text-[#3A3A3A]/45 dark:text-white/45 transition hover:bg-[#F3F3F3] dark:hover:bg-[#101013] hover:text-[#3A3A3A] dark:hover:text-[#ececef]"
                    aria-label={t("dashboard.badgeModal.close")}
                >
                    <X className="h-5 w-5" />
                </button>

                <div
                    className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] border text-4xl shadow-[0_10px_28px_rgba(244,120,34,.15)]"
                    style={{ color: accent, backgroundColor: `${accent}1A`, borderColor: `${accent}40` }}
                >
                    <BadgeIcon id={badge.id} title={badge.title} icon={badge.icon} className="relative h-9 w-9" />
                </div>
                <p className="relative mt-5 text-[10px] font-bold uppercase tracking-[.2em] text-[#F47822]">{t("dashboard.badgeModal.title")}</p>
                <h2 id="badge-unlocked-title" className="relative mt-2 text-2xl font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("dashboard.achievements.unlockedTitle", { title: badgeText(badge, t).title })}</h2>
                <p className="relative mt-3 text-sm leading-6 text-[#3A3A3A]/60 dark:text-white/60">{badgeText(badge, t).description}</p>
                <div className="relative mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-[#F47822]">
                    <Award className="h-4 w-4" /> {t("dashboard.badgeModal.subtitle")}
                </div>
                <button
                    type="button"
                    onClick={dismiss}
                    className="relative mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F47822] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,.22)] transition hover:bg-[#E96D18]"
                >
                    <Check className="h-4 w-4" /> {t("dashboard.badgeModal.keepLearning")}
                </button>
            </section>
        </div>
    );
}
