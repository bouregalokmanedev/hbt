import { Check, Copy, Gift, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { referralsApi, type ReferralStats } from "../api/referrals.api";

const AMBASSADOR_TARGET = 3;

export function ReferralsPage() {
    const { t } = useTranslation();
    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void referralsApi
            .stats()
            .then((data) => {
                if (!cancelled) setStats(data);
            })
            .catch((cause: unknown) => {
                if (!cancelled) setError(cause instanceof Error ? cause.message : t("referrals.loadFail"));
            });
        return () => {
            cancelled = true;
        };
    }, [t]);

    const inviteLink = stats?.code ? `${window.location.origin}/register?ref=${stats.code}` : "";

    const copy = async () => {
        if (!inviteLink) return;
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard unavailable — the link stays visible to copy manually.
        }
    };

    const share = async () => {
        if (!inviteLink) return;
        if (typeof navigator.share === "function") {
            try {
                await navigator.share({ title: "HBTronics", text: t("referrals.shareText"), url: inviteLink });
                return;
            } catch {
                // User dismissed — fall back to copy.
            }
        }
        await copy();
    };

    return (
        <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
            <header className="overflow-hidden rounded-3xl bg-[#3A3A3A] px-6 py-7 text-white sm:px-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">{t("referrals.eyebrow")}</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{t("referrals.title")}</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">{t("referrals.description")}</p>
            </header>

            {error && (
                <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                </p>
            )}

            {!stats && !error ? (
                <div className="mt-5 h-48 animate-pulse rounded-3xl bg-white dark:bg-[#1b1b20]" />
            ) : stats ? (
                <>
                    <section className="mt-5 rounded-3xl border border-[#3A3A3A]/8 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#1b1b20] sm:p-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("referrals.linkTitle")}</p>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <code dir="ltr" className="h-12 min-w-0 flex-1 truncate rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-4 py-3 font-mono text-xs text-[#3A3A3A] dark:border-white/10 dark:bg-white/5 dark:text-[#ececef]">
                                {inviteLink || "…"}
                            </code>
                            <span className="flex gap-2">
                                <button type="button" onClick={() => void copy()} className="inline-flex h-12 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 px-4 text-xs font-bold text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:text-[#ececef]">
                                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    {t("referrals.copy")}
                                </button>
                                <button type="button" onClick={() => void share()} className="inline-flex h-12 items-center rounded-xl bg-[#F47822] px-5 text-xs font-bold text-white transition hover:bg-[#E96D18]">
                                    {t("referrals.share")}
                                </button>
                            </span>
                        </div>
                        {stats.code && (
                            <p className="mt-2 font-mono text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                                {t("referrals.codeLabel")}: {stats.code}
                            </p>
                        )}
                    </section>

                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#1b1b20]">
                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/40 dark:text-white/40">
                                <Users className="h-3.5 w-3.5 text-[#F47822]" /> {t("referrals.invites")}
                            </p>
                            <p className="mt-2 text-3xl font-black text-[#3A3A3A] dark:text-[#ececef]">{stats.invites}</p>
                        </div>
                        <div className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-[#1b1b20]">
                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/40 dark:text-white/40">
                                <Gift className="h-3.5 w-3.5 text-[#F47822]" /> {t("referrals.xp")}
                            </p>
                            <p className="mt-2 text-3xl font-black text-[#3A3A3A] dark:text-[#ececef]">+{stats.xp_earned}</p>
                            <p className="mt-1 text-[11px] text-[#3A3A3A]/45 dark:text-white/45">{t("referrals.perSignup", { xp: stats.reward_xp })}</p>
                        </div>
                        <div className="rounded-2xl border border-[#F47822]/20 bg-[#FFF8F4] p-5 shadow-sm dark:bg-[#F47822]/10">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("referrals.ambassador")}</p>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#3A3A3A]/10">
                                <div className="h-full rounded-full bg-[#F47822] transition-all" style={{ width: `${Math.min(100, Math.round((stats.invites / AMBASSADOR_TARGET) * 100))}%` }} />
                            </div>
                            <p className="mt-2 text-[11px] font-bold text-[#3A3A3A]/60 dark:text-white/60">
                                {t("referrals.ambassadorProgress", { done: Math.min(stats.invites, AMBASSADOR_TARGET), total: AMBASSADOR_TARGET })}
                            </p>
                        </div>
                    </div>
                </>
            ) : null}
        </main>
    );
}
