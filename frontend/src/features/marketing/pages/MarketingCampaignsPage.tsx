import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { marketingApi, type Discount } from "../api/marketing.api";

const emptyForm = {
    name: "",
    code: "",
    description: "",
    type: "percent" as "percent" | "fixed",
    value: "10",
    applies_to: "all" as "all" | "courses" | "plans",
    max_uses: "",
};

export function MarketingCampaignsPage() {
    const { t } = useTranslation();
    const [items, setItems] = useState<Discount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<Discount | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            setItems(await marketingApi.discounts());
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("marketing.campaigns.errorLoad"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const body: Record<string, unknown> = {
                name: form.name.trim(),
                code: form.code.trim() || null,
                description: form.description.trim() || null,
                type: form.type,
                value: Number(form.value),
                applies_to: form.applies_to,
                max_uses: form.max_uses ? Number(form.max_uses) : null,
                active: true,
            };
            if (editing) {
                await marketingApi.updateDiscount(editing.id, body);
            } else {
                await marketingApi.createDiscount(body);
            }
            setForm(emptyForm);
            setEditing(null);
            await load();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("marketing.campaigns.errorSave"));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id: string) => {
        if (!window.confirm(t("marketing.campaigns.confirmDelete"))) return;
        try {
            await marketingApi.deleteDiscount(id);
            await load();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("marketing.campaigns.errorDelete"));
        }
    };

    const startEdit = (item: Discount) => {
        setEditing(item);
        setForm({
            name: item.name,
            code: item.code ?? "",
            description: item.description ?? "",
            type: item.type,
            value: String(item.value),
            applies_to: item.applies_to,
            max_uses: item.max_uses === null ? "" : String(item.max_uses),
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <main className="mx-auto max-w-[1280px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <header>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">{t("marketing.shared.eyebrow")}</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A]">{t("marketing.campaigns.title")}</h1>
                <p className="mt-1 text-sm text-[#3A3A3A]/55">{t("marketing.campaigns.description")}</p>
            </header>

            {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

            <form onSubmit={submit} className="grid gap-3 rounded-3xl border border-[#3A3A3A]/8 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-xs font-bold text-[#3A3A3A]">
                    {t("marketing.campaigns.form.name")}
                    <input value={form.name} onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))} required maxLength={150} placeholder={t("marketing.campaigns.form.namePh")} className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 text-sm font-normal outline-none focus:border-[#F47822]" />
                </label>
                <label className="text-xs font-bold text-[#3A3A3A]">
                    {t("marketing.campaigns.form.code")}
                    <input value={form.code} onChange={(event) => setForm((f) => ({ ...f, code: event.target.value.toUpperCase().replace(/\s+/g, "") }))} maxLength={40} placeholder={t("marketing.campaigns.form.codePh")} dir="ltr" className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 font-mono text-sm font-normal outline-none focus:border-[#F47822]" />
                </label>
                <label className="text-xs font-bold text-[#3A3A3A]">
                    {t("marketing.campaigns.form.type")}
                    <select value={form.type} onChange={(event) => setForm((f) => ({ ...f, type: event.target.value as "percent" | "fixed" }))} className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 text-sm font-normal outline-none focus:border-[#F47822]">
                        <option value="percent">{t("marketing.campaigns.form.typePercent")}</option>
                        <option value="fixed">{t("marketing.campaigns.form.typeFixed")}</option>
                    </select>
                </label>
                <label className="text-xs font-bold text-[#3A3A3A]">
                    {form.type === "percent" ? t("marketing.campaigns.form.valuePercent") : t("marketing.campaigns.form.valueFixed")}
                    <input value={form.value} onChange={(event) => setForm((f) => ({ ...f, value: event.target.value }))} required type="number" min={1} max={form.type === "percent" ? 100 : undefined} className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 text-sm font-normal outline-none focus:border-[#F47822]" />
                </label>
                <label className="text-xs font-bold text-[#3A3A3A]">
                    {t("marketing.campaigns.form.appliesTo")}
                    <select value={form.applies_to} onChange={(event) => setForm((f) => ({ ...f, applies_to: event.target.value as "all" | "courses" | "plans" }))} className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 text-sm font-normal outline-none focus:border-[#F47822]">
                        <option value="all">{t("marketing.campaigns.form.appliesAll")}</option>
                        <option value="courses">{t("marketing.campaigns.form.appliesCourses")}</option>
                        <option value="plans">{t("marketing.campaigns.form.appliesPlans")}</option>
                    </select>
                </label>
                <label className="text-xs font-bold text-[#3A3A3A]">
                    {t("marketing.campaigns.form.maxUses")}
                    <input value={form.max_uses} onChange={(event) => setForm((f) => ({ ...f, max_uses: event.target.value }))} type="number" min={1} className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 text-sm font-normal outline-none focus:border-[#F47822]" />
                </label>
                <label className="text-xs font-bold text-[#3A3A3A] sm:col-span-2 lg:col-span-1">
                    {t("marketing.campaigns.form.note")}
                    <input value={form.description} onChange={(event) => setForm((f) => ({ ...f, description: event.target.value }))} maxLength={1000} placeholder={t("marketing.campaigns.form.notePh")} className="mt-1.5 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 text-sm font-normal outline-none focus:border-[#F47822]" />
                </label>
                <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
                    <button type="submit" disabled={saving || !form.name.trim() || !form.value} className="h-11 flex-1 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white hover:bg-[#E96D18] disabled:opacity-50">
                        {saving ? t("marketing.campaigns.form.saving") : editing ? t("marketing.campaigns.form.saveChanges") : t("marketing.campaigns.form.create")}
                    </button>
                    {editing && (
                        <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }} className="h-11 rounded-xl border border-[#3A3A3A]/10 px-4 text-xs font-bold text-[#3A3A3A]/60">
                            {t("marketing.campaigns.form.cancel")}
                        </button>
                    )}
                </div>
            </form>

            {loading ? (
                <div className="h-40 animate-pulse rounded-3xl bg-white" />
            ) : items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#3A3A3A]/15 bg-white p-10 text-center">
                    <p className="text-sm font-bold text-[#3A3A3A]">{t("marketing.campaigns.empty.title")}</p>
                    <p className="mt-1 text-xs text-[#3A3A3A]/50">{t("marketing.campaigns.empty.hint")}</p>
                </div>
            ) : (
                <ul className="grid gap-4 lg:grid-cols-2">
                    {items.map((item) => (
                        <li key={item.id} className="rounded-3xl border border-[#3A3A3A]/8 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-bold text-[#3A3A3A]">{item.name}</h2>
                                    <p className="mt-1 font-mono text-xs text-[#F47822]">{item.code ?? t("marketing.campaigns.card.noCode")}</p>
                                </div>
                                <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${item.live ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                    {item.live ? t("marketing.campaigns.card.live") : t("marketing.campaigns.card.off")}
                                </span>
                            </div>
                            <p className="mt-3 text-xs text-[#3A3A3A]/55">
                                {item.type === "percent" ? t("marketing.campaigns.card.percentOff", { value: item.value }) : t("marketing.campaigns.card.fixedOff", { value: item.value })} · {item.applies_to === "all" ? t("marketing.campaigns.card.appliesAll") : item.applies_to === "courses" ? t("marketing.campaigns.card.appliesCourses") : item.applies_to === "plans" ? t("marketing.campaigns.card.appliesPlans") : item.applies_to} · {t("marketing.campaigns.card.used", { count: item.used_count })}{item.max_uses ? `/${item.max_uses}` : ""}
                            </p>
                            <div className="mt-4 flex gap-2">
                                <button type="button" onClick={() => startEdit(item)} className="rounded-xl border border-[#3A3A3A]/10 px-4 py-2 text-xs font-bold text-[#3A3A3A]/65 hover:border-[#F47822]/40 hover:text-[#F47822]">
                                    {t("marketing.campaigns.card.edit")}
                                </button>
                                <button type="button" onClick={() => void remove(item.id)} className="rounded-xl px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
                                    {t("marketing.campaigns.card.delete")}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
