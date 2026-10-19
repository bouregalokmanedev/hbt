import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { marketingApi, type FeaturedSlot } from "../api/marketing.api";

export function MarketingFeaturedPage() {
    const { t } = useTranslation();
    const [items, setItems] = useState<FeaturedSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [courseId, setCourseId] = useState("");
    const [badge, setBadge] = useState("");
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            setItems(await marketingApi.featured());
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("marketing.featured.errorLoad"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const add = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!courseId.trim()) return;
        setSaving(true);
        setError(null);
        try {
            await marketingApi.addFeatured({
                course_id: courseId.trim(),
                badge_label: badge.trim() || undefined,
                position: items.length,
            });
            setCourseId("");
            setBadge("");
            await load();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("marketing.featured.errorAdd"));
        } finally {
            setSaving(false);
        }
    };

    const move = async (item: FeaturedSlot, direction: -1 | 1) => {
        try {
            await marketingApi.updateFeatured(item.id, { position: Math.max(0, item.position + direction) });
            await load();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("marketing.featured.errorMove"));
        }
    };

    const toggle = async (item: FeaturedSlot) => {
        try {
            await marketingApi.updateFeatured(item.id, { active: !item.active });
            await load();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("marketing.featured.errorUpdate"));
        }
    };

    const remove = async (id: string) => {
        if (!window.confirm(t("marketing.featured.confirmRemove"))) return;
        try {
            await marketingApi.removeFeatured(id);
            await load();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("marketing.featured.errorRemove"));
        }
    };

    return (
        <main className="mx-auto max-w-[1100px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <header>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">{t("marketing.shared.eyebrow")}</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A]">{t("marketing.featured.title")}</h1>
                <p className="mt-1 text-sm text-[#3A3A3A]/55">{t("marketing.featured.description")}</p>
            </header>

            {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

            <form onSubmit={add} className="grid gap-3 rounded-3xl border border-[#3A3A3A]/8 bg-white p-5 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                <label className="text-xs font-bold text-[#3A3A3A]">
                    {t("marketing.featured.form.courseId")}
                    <input value={courseId} onChange={(event) => setCourseId(event.target.value)} required placeholder={t("marketing.featured.form.courseIdPh")} dir="ltr" className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 font-mono text-xs font-normal outline-none focus:border-[#F47822]" />
                </label>
                <label className="text-xs font-bold text-[#3A3A3A]">
                    {t("marketing.featured.form.badge")}
                    <input value={badge} onChange={(event) => setBadge(event.target.value)} maxLength={60} placeholder={t("marketing.featured.form.badgePh")} className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 text-sm font-normal outline-none focus:border-[#F47822]" />
                </label>
                <button type="submit" disabled={saving || !courseId.trim()} className="h-11 rounded-xl bg-[#F47822] px-5 text-xs font-bold text-white hover:bg-[#E96D18] disabled:opacity-50">
                    {saving ? t("marketing.featured.form.adding") : t("marketing.featured.form.submit")}
                </button>
            </form>

            {loading ? (
                <div className="h-40 animate-pulse rounded-3xl bg-white" />
            ) : items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#3A3A3A]/15 bg-white p-10 text-center">
                    <p className="text-sm font-bold text-[#3A3A3A]">{t("marketing.featured.empty.title")}</p>
                    <p className="mt-1 text-xs text-[#3A3A3A]/50">{t("marketing.featured.empty.hint")}</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {items.map((item) => (
                        <li key={item.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#3A3A3A]/8 bg-white p-4 shadow-sm">
                            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F47822]/10 text-xs font-black text-[#F47822]">#{item.position}</span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold text-[#3A3A3A]">{item.course_title ?? item.course_id}</span>
                                <span className="text-[11px] text-[#3A3A3A]/45">{item.badge_label ?? t("marketing.featured.row.noBadge")} · {item.active ? t("marketing.featured.row.visible") : t("marketing.featured.row.hidden")}</span>
                            </span>
                            <span className="flex gap-1.5">
                                <button type="button" onClick={() => void move(item, -1)} aria-label={t("marketing.featured.row.moveUp")} className="rounded-lg border border-[#3A3A3A]/10 px-2.5 py-1.5 text-xs font-bold">↑</button>
                                <button type="button" onClick={() => void move(item, 1)} aria-label={t("marketing.featured.row.moveDown")} className="rounded-lg border border-[#3A3A3A]/10 px-2.5 py-1.5 text-xs font-bold">↓</button>
                                <button type="button" onClick={() => void toggle(item)} className="rounded-lg border border-[#3A3A3A]/10 px-2.5 py-1.5 text-xs font-bold">{item.active ? t("marketing.featured.row.hide") : t("marketing.featured.row.show")}</button>
                                <button type="button" onClick={() => void remove(item.id)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">{t("marketing.featured.row.remove")}</button>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
