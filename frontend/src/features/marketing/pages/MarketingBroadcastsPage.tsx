import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { marketingApi, type BroadcastRow } from "../api/marketing.api";

const AUDIENCES = ["all", "students", "instructors"] as const;

export function MarketingBroadcastsPage() {
    const { t } = useTranslation();
    const [items, setItems] = useState<BroadcastRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [audience, setAudience] = useState("students");
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [actionUrl, setActionUrl] = useState("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            setItems(await marketingApi.broadcasts());
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("marketing.broadcasts.errorLoad"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const send = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!title.trim() || !message.trim()) return;
        setSending(true);
        setError(null);
        try {
            await marketingApi.sendBroadcast({
                audience,
                title: title.trim(),
                message: message.trim(),
                action_url: actionUrl.trim() || undefined,
            });
            setTitle("");
            setMessage("");
            setActionUrl("");
            setSent(true);
            window.setTimeout(() => setSent(false), 4000);
            await load();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("marketing.broadcasts.error"));
        } finally {
            setSending(false);
        }
    };

    return (
        <main className="mx-auto max-w-[1100px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <header>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">{t("marketing.shared.eyebrow")}</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A]">{t("marketing.broadcasts.title")}</h1>
                <p className="mt-1 text-sm text-[#3A3A3A]/55">{t("marketing.broadcasts.description")}</p>
            </header>

            {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
            {sent && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{t("marketing.broadcasts.sent")}</p>}

            <form onSubmit={send} className="grid gap-3 rounded-3xl border border-[#3A3A3A]/8 bg-white p-5 shadow-sm sm:grid-cols-[180px_minmax(0,1fr)]">
                <label className="text-xs font-bold text-[#3A3A3A]">
                    {t("marketing.broadcasts.audience.label")}
                    <select value={audience} onChange={(event) => setAudience(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 text-sm font-normal outline-none focus:border-[#F47822]">
                        {AUDIENCES.map((entry) => (
                            <option key={entry} value={entry}>{t(`marketing.broadcasts.audience.${entry}`)}</option>
                        ))}
                    </select>
                </label>
                <label className="text-xs font-bold text-[#3A3A3A]">
                    {t("marketing.broadcasts.titleField")}
                    <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={255} placeholder={t("marketing.broadcasts.titlePh")} className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 text-sm font-normal outline-none focus:border-[#F47822]" />
                </label>
                <label className="text-xs font-bold text-[#3A3A3A] sm:col-span-2">
                    {t("marketing.broadcasts.message")}
                    <textarea value={message} onChange={(event) => setMessage(event.target.value)} required maxLength={5000} rows={4} placeholder={t("marketing.broadcasts.messagePh")} className="mt-1.5 w-full resize-none rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 py-2.5 text-sm font-normal leading-6 outline-none focus:border-[#F47822]" />
                </label>
                <label className="text-xs font-bold text-[#3A3A3A]">
                    {t("marketing.broadcasts.actionUrl")}
                    <input value={actionUrl} onChange={(event) => setActionUrl(event.target.value)} maxLength={2048} placeholder="/pricing" dir="ltr" className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 text-sm font-normal outline-none focus:border-[#F47822]" />
                </label>
                <div className="flex items-end">
                    <button type="submit" disabled={sending || !title.trim() || !message.trim()} className="h-11 w-full rounded-xl bg-[#F47822] px-5 text-xs font-bold text-white hover:bg-[#E96D18] disabled:opacity-50 sm:w-auto">
                        {sending ? t("marketing.broadcasts.sending") : t("marketing.broadcasts.submit")}
                    </button>
                </div>
            </form>

            <section className="rounded-3xl border border-[#3A3A3A]/8 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-sm font-bold text-[#3A3A3A]">{t("marketing.broadcasts.list")}</h2>
                {loading ? (
                    <div className="mt-4 h-24 animate-pulse rounded-2xl bg-[#F7F7F7]" />
                ) : items.length === 0 ? (
                    <p className="mt-3 text-xs text-[#3A3A3A]/50">{t("marketing.broadcasts.empty")}</p>
                ) : (
                    <ul className="mt-4 divide-y divide-[#3A3A3A]/6">
                        {items.map((item) => (
                            <li key={item.id} className="flex items-center gap-3 py-3">
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-bold text-[#3A3A3A]">{item.title}</span>
                                    <span className="text-[11px] capitalize text-[#3A3A3A]/45">{t(`marketing.broadcasts.audience.${item.audience}`, { defaultValue: item.audience })}{item.created_at ? ` · ${new Date(item.created_at).toLocaleDateString()}` : ""}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}
