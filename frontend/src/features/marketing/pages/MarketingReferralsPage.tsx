import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { marketingApi, type ReferralOverview } from "../api/marketing.api";

export function MarketingReferralsPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<ReferralOverview | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        void marketingApi
            .referrals()
            .then((overview) => {
                if (!cancelled) setData(overview);
            })
            .catch((cause: unknown) => {
                if (!cancelled) setError(cause instanceof Error ? cause.message : t("marketing.referrals.error"));
            });
        return () => {
            cancelled = true;
        };
    }, []);

    if (error) {
        return (
            <main className="p-6">
                <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            </main>
        );
    }

    if (!data) {
        return (
            <main className="mx-auto max-w-[1100px] space-y-4 px-4 py-6">
                <div className="h-28 animate-pulse rounded-3xl bg-white" />
                <div className="h-64 animate-pulse rounded-3xl bg-white" />
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-[1100px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <header>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">{t("marketing.shared.eyebrow")}</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A]">{t("marketing.referrals.title")}</h1>
                <p className="mt-1 text-sm text-[#3A3A3A]/55">{t("marketing.referrals.description")}</p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/40">{t("marketing.referrals.signups")}</p>
                    <p className="mt-2 text-3xl font-black text-[#3A3A3A]">{data.total_referral_signups}</p>
                </div>
                <div className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/40">{t("marketing.referrals.ambassadors")}</p>
                    <p className="mt-2 text-3xl font-black text-[#F47822]">{data.ambassadors}</p>
                </div>
            </div>

            <section className="rounded-3xl border border-[#3A3A3A]/8 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-sm font-bold text-[#3A3A3A]">{t("marketing.referrals.top")}</h2>
                {data.top.length === 0 ? (
                    <p className="mt-3 text-xs text-[#3A3A3A]/50">{t("marketing.referrals.empty")}</p>
                ) : (
                    <ul className="mt-4 divide-y divide-[#3A3A3A]/6">
                        {data.top.map((row) => (
                            <li key={row.email ?? row.code ?? row.name} className="flex items-center gap-3 py-3">
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F47822]/10 text-xs font-black text-[#F47822]">
                                    {(row.name ?? "?").slice(0, 1).toUpperCase()}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-bold text-[#3A3A3A]">{row.name ?? "—"}</span>
                                    <span className="font-mono text-[11px] text-[#3A3A3A]/45">{row.code ?? t("marketing.referrals.noCode")}</span>
                                </span>
                                <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{t("marketing.referrals.invites", { count: row.invites })}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}
