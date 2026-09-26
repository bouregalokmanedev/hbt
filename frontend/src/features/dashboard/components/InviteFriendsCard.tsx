import { Check, Copy, Gift, Loader2, Share2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "@/lib/api/client";
import { track } from "@/lib/track";

import { inviteUrlFor } from "../utils/referral";
import type { ReferralSummary } from "../types/dashboard.types";

/**
 * Growth card: one round trip mints (or returns) the learner's invite code,
 * then offers copy + native share so the referral loop starts from the dashboard.
 */
export function InviteFriendsCard() {
    const { t } = useTranslation();
    const [summary, setSummary] = useState<ReferralSummary | null>(null);
    const [failed, setFailed] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let cancelled = false;

        api<ReferralSummary>("/v1/referrals", { method: "POST" })
            .then((data) => {
                if (!cancelled) setSummary(data);
            })
            .catch(() => {
                if (!cancelled) setFailed(true);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const inviteUrl = summary ? inviteUrlFor(summary.code) : "";

    const copyLink = async (): Promise<boolean> => {
        if (!summary) return false;
        try {
            await navigator.clipboard.writeText(inviteUrlFor(summary.code));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            return true;
        } catch {
            return false;
        }
    };

    const handleCopy = async () => {
        const ok = await copyLink();
        if (ok) {
            track("referral_invite_shared", { source: "dashboard_copy" });
        }
    };

    const handleShare = async () => {
        if (!summary) return;

        if (typeof navigator.share === "function") {
            try {
                await navigator.share({
                    title: t("dashboard.invite.shareTitle"),
                    text: t("dashboard.invite.shareText"),
                    url: inviteUrlFor(summary.code),
                });
                track("referral_invite_shared", { source: "dashboard_share" });
            } catch {
                // Share sheet dismissed.
            }
            return;
        }

        await handleCopy();
    };

    return (
        <section
            data-testid="invite-friends-card"
            className="rounded-3xl border border-[#3A3A3A]/10 bg-white p-5 shadow-[0_10px_36px_rgba(58,58,58,0.06)] dark:border-white/10 dark:bg-[#1b1b20] sm:p-6"
        >
            <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                    <UserPlus className="h-5 w-5" />
                </span>

                <div className="flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F47822]">
                        {t("dashboard.invite.eyebrow")}
                    </p>

                    <h3 className="mt-0.5 text-base font-semibold text-[#3A3A3A] dark:text-white">
                        {t("dashboard.invite.title")}
                    </h3>
                </div>

                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                    <Gift className="h-4 w-4" />
                </span>
            </div>

            <p className="mt-3 text-sm text-[#3A3A3A]/55 dark:text-white/55">
                {t("dashboard.invite.subtitle", { xp: summary?.reward_xp ?? 25 })}
            </p>

            {failed ? (
                <p className="mt-4 text-sm text-red-600 dark:text-red-400" data-testid="invite-friends-error">
                    {t("dashboard.invite.error")}
                </p>
            ) : summary === null ? (
                <p className="mt-4 flex items-center gap-2 text-xs text-[#3A3A3A]/45 dark:text-white/45">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("dashboard.invite.loading")}
                </p>
            ) : (
                <>
                    <div className="mt-4 flex items-center gap-2">
                        <input
                            readOnly
                            value={inviteUrl}
                            aria-label={t("dashboard.invite.linkLabel")}
                            data-testid="invite-friends-link"
                            dir="ltr"
                            className="min-w-0 flex-1 truncate rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] px-3 py-2.5 text-xs text-[#3A3A3A] outline-none focus:border-[#F47822]/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80"
                        />

                        <button
                            type="button"
                            onClick={() => void handleCopy()}
                            data-testid="invite-friends-copy"
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#3A3A3A] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#F47822]"
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? t("dashboard.invite.copied") : t("dashboard.invite.copy")}
                        </button>

                        <button
                            type="button"
                            onClick={() => void handleShare()}
                            data-testid="invite-friends-share"
                            aria-label={t("dashboard.invite.share")}
                            className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-[#3A3A3A]/10 text-[#3A3A3A]/60 transition hover:border-[#F47822]/30 hover:bg-[#F47822]/5 hover:text-[#F47822] dark:border-white/10 dark:text-white/60"
                        >
                            <Share2 className="h-4 w-4" />
                        </button>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-[#3A3A3A]/8 bg-[#FCFCFC] px-3 py-2.5 dark:border-white/8 dark:bg-white/[0.04]">
                            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3A3A3A]/45 dark:text-white/45">
                                {t("dashboard.invite.invites")}
                            </dt>
                            <dd className="mt-0.5 text-lg font-bold text-[#3A3A3A] dark:text-white" data-testid="invite-friends-count">
                                {summary.invites}
                            </dd>
                        </div>

                        <div className="rounded-2xl border border-[#3A3A3A]/8 bg-[#FCFCFC] px-3 py-2.5 dark:border-white/8 dark:bg-white/[0.04]">
                            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3A3A3A]/45 dark:text-white/45">
                                {t("dashboard.invite.earned")}
                            </dt>
                            <dd className="mt-0.5 text-lg font-bold text-[#F47822]" data-testid="invite-friends-xp">
                                {summary.xp_earned}
                            </dd>
                        </div>
                    </dl>
                </>
            )}
        </section>
    );
}
