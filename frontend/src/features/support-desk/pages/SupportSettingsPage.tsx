import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    AlertTriangle,
    Download,
    GraduationCap,
    Inbox,
    LockKeyhole,
    Palette,
    Settings,
    ShieldCheck,
    UserRound,
    X,
} from "lucide-react";

import { isStrongPassword, PasswordRequirements } from "@/features/auth/components/PasswordRequirements";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useUpdateProfile } from "@/features/auth/hooks/useUpdateProfile";
import { authStorage } from "@/lib/storage/auth-storage";
import { settingsApi, type SettingsGroup, type StudentSettings } from "@/features/settings/api/settings.api";
import { TwoFactorCard } from "@/features/settings/components/TwoFactorCard";
import { loadDeskPrefs, saveDeskPrefs, type DeskPrefs } from "../deskPrefs";

type Tab = "profile" | "desk" | "notifications" | "appearance" | "security" | "data";

const DESK_TOGGLES = [
    "email_enabled",
    "push_enabled",
    "in_app_enabled",
    "security_alerts",
    "marketing",
];

const tabDefs: Array<{ id: Tab; icon: typeof UserRound; labelKey: string; descKey: string }> = [
    { id: "profile", icon: UserRound, labelKey: "supportDesk.settings.tabs.profile", descKey: "supportDesk.settings.tabs.profileDesc" },
    { id: "desk", icon: Inbox, labelKey: "supportDesk.settings.tabs.desk", descKey: "supportDesk.settings.tabs.deskDesc" },
    { id: "notifications", icon: AlertTriangle, labelKey: "supportDesk.settings.tabs.notifications", descKey: "supportDesk.settings.tabs.notificationsDesc" },
    { id: "appearance", icon: Palette, labelKey: "supportDesk.settings.tabs.appearance", descKey: "supportDesk.settings.tabs.appearanceDesc" },
    { id: "security", icon: LockKeyhole, labelKey: "supportDesk.settings.tabs.security", descKey: "supportDesk.settings.tabs.securityDesc" },
    { id: "data", icon: Download, labelKey: "supportDesk.settings.tabs.data", descKey: "supportDesk.settings.tabs.dataDesc" },
];

export function SupportSettingsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { updateProfile, isUpdating } = useUpdateProfile();
    const [tab, setTab] = useState<Tab>("profile");
    const [settings, setSettings] = useState<StudentSettings | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState({
        first_name: user?.first_name ?? "",
        last_name: user?.last_name ?? "",
        username: user?.username ?? "",
        phone: user?.phone ?? "",
        country: user?.country ?? "",
        bio: user?.bio ?? "",
    });

    const tabs = tabDefs.map((def) => ({
        ...def,
        label: t(def.labelKey),
        desc: t(def.descKey),
    }));

    useEffect(() => {
        void settingsApi
            .get()
            .then(setSettings)
            .catch(() => setError(t("supportDesk.settings.notices.loadFail")));
    }, [t]);

    const save = async (path: string, data: SettingsGroup, key?: keyof StudentSettings) => {
        try {
            setFeedback(null);
            setError(null);
            const updated = await settingsApi.update(path, data);
            if (key) setSettings((c) => (c ? { ...c, [key]: { ...c[key], ...updated } } : c));
            setFeedback(t("supportDesk.settings.notices.saved"));
        } catch (e) {
            setError(e instanceof Error ? e.message : t("supportDesk.settings.notices.saveFail"));
        }
    };

    const saveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfile({
                ...profile,
                phone: profile.phone || null,
                country: profile.country || null,
                bio: profile.bio || null,
            });
            setFeedback(t("supportDesk.settings.notices.profileUpdated"));
        } catch (e) {
            setError(e instanceof Error ? e.message : t("supportDesk.settings.notices.profileFail"));
        }
    };

    const exportData = async () => {
        try {
            const data = await settingsApi.export();
            const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = "hbt-support-data.json";
            a.click();
            URL.revokeObjectURL(url);
            setFeedback(t("supportDesk.settings.notices.exportReady"));
        } catch {
            setError(t("supportDesk.settings.notices.exportFail"));
        }
    };

    return (
        <main className="min-h-full bg-[#F3F3F3]">
            <div className="mx-auto w-full max-w-[1320px] px-5 py-6 sm:px-8 sm:py-8">
                <header className="mb-6 rounded-3xl bg-[#3A3A3A] px-6 py-7 text-white shadow-[0_14px_38px_rgba(58,58,58,0.12)] sm:px-8">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">
                        {t("supportDesk.settings.eyebrow")}
                    </p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                        {t("supportDesk.settings.title")}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-white/60">{t("supportDesk.settings.description")}</p>
                </header>

                <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                    <aside className="h-fit rounded-3xl border border-[#3A3A3A]/8 bg-white p-3 shadow-[0_10px_30px_rgba(58,58,58,0.05)] lg:sticky lg:top-6">
                        <div className="mb-2 flex items-center justify-between px-2 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/35">
                                {t("supportDesk.settings.menuTitle")}
                            </p>
                            <span className="rounded-md bg-[#F47822]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#F47822]">
                                {tabs.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:block lg:space-y-1">
                            {tabs.map(({ id, label, icon: Icon, desc }) => (
                                <button
                                    key={id}
                                    type="button"
                                    data-testid={`support-settings-tab-${id}`}
                                    onClick={() => setTab(id)}
                                    className={`group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-left rtl:text-right transition-all duration-200 ${
                                        tab === id
                                            ? "bg-[#F47822] text-white shadow-[0_7px_16px_rgba(244,120,34,.2)]"
                                            : "text-[#3A3A3A]/60 hover:bg-[#F47822]/6 hover:text-[#3A3A3A]"
                                    }`}
                                >
                                    <span
                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${
                                            tab === id
                                                ? "bg-white/15 text-white"
                                                : "bg-[#3A3A3A]/5 text-[#3A3A3A]/45 group-hover:bg-[#F47822]/10 group-hover:text-[#F47822]"
                                        }`}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-xs font-semibold leading-none">{label}</span>
                                        <span
                                            className={`hidden text-[10px] leading-none lg:block ${
                                                tab === id ? "text-white/70" : "text-[#3A3A3A]/40"
                                            }`}
                                        >
                                            {desc}
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 rounded-xl bg-[#FFF8F4] p-3">
                            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#3A3A3A]">
                                <ShieldCheck className="h-3.5 w-3.5 text-[#F47822]" /> {t("supportDesk.settings.roleCard.title")}
                            </p>
                            <p className="mt-1 text-[11px] leading-4 text-[#3A3A3A]/50">{t("supportDesk.settings.roleCard.desc")}</p>
                            <a href="/support-desk/tickets" className="mt-2 inline-flex text-xs font-bold text-[#F47822] hover:underline">
                                {t("supportDesk.settings.roleCard.queueLink")}
                            </a>
                        </div>
                    </aside>

                    <section className="overflow-hidden rounded-3xl border border-[#3A3A3A]/8 bg-white shadow-[0_14px_34px_rgba(58,58,58,0.06)]">
                        {feedback && <Notice tone="success" message={feedback} onClose={() => setFeedback(null)} />}
                        {error && <Notice tone="error" message={error} onClose={() => setError(null)} />}

                        {tab === "profile" && (
                            <ProfileTab
                                profile={profile}
                                setProfile={setProfile}
                                email={user?.email ?? ""}
                                onSubmit={saveProfile}
                                saving={isUpdating}
                            />
                        )}
                        {tab === "desk" && <DeskTab onSaved={(msg) => setFeedback(msg)} />}
                        {tab === "notifications" && (
                            <SwitchGroup
                                title={t("supportDesk.settings.notificationsTab.title")}
                                description={t("supportDesk.settings.notificationsTab.description")}
                                group={settings?.notifications}
                                onSave={(d) => save("notifications", d, "notifications")}
                            />
                        )}
                        {tab === "appearance" && (
                            <AppearanceTab group={settings?.appearance} onSave={(d) => save("appearance", d, "appearance")} />
                        )}
                        {tab === "security" && <SecurityTab onSaved={(msg) => setFeedback(msg)} />}
                        {tab === "data" && <DataTab onExport={exportData} />}
                    </section>
                </div>
            </div>
        </main>
    );
}

function Notice({ tone, message, onClose }: { tone: "success" | "error"; message: string; onClose: () => void }) {
    return (
        <div
            className={`m-5 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                tone === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-600"
            }`}
        >
            <span>{message}</span>
            <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-black/5">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

function Header({ title, description }: { title: string; description: string }) {
    const { t } = useTranslation();
    return (
        <div className="relative overflow-hidden border-b border-[#3A3A3A]/6 px-6 py-6 sm:px-8">
            <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[#F47822]/8 blur-2xl rtl:-left-10 rtl:right-auto" />
            <div className="relative">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">
                    {t("supportDesk.settings.sectionTag")}
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-[#3A3A3A]">{title}</h2>
                <p className="mt-1.5 max-w-xl text-xs leading-5 text-[#3A3A3A]/55">{description}</p>
            </div>
        </div>
    );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <label className="block text-xs font-semibold text-[#3A3A3A]">
            {label}
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3.5 text-sm outline-none focus:border-[#F47822]"
            />
        </label>
    );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
    return (
        <label
            className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 transition ${
                checked ? "border-[#F47822]/20 bg-[#F47822]/[.035]" : "border-[#3A3A3A]/8 bg-[#FAFAFA]"
            }`}
        >
            <span className="text-sm font-semibold text-[#3A3A3A]">{label}</span>
            <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-[#F47822]" : "bg-[#3A3A3A]/15"}`}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="peer absolute inset-0 opacity-0"
                />
                <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                        checked ? "left-6 rtl:left-1 rtl:right-6" : "left-1 rtl:left-auto rtl:right-1"
                    }`}
                />
            </span>
        </label>
    );
}

function ProfileTab({
    profile,
    setProfile,
    email,
    onSubmit,
    saving,
}: {
    profile: { first_name: string; last_name: string; username: string; phone: string; country: string; bio: string };
    setProfile: React.Dispatch<
        React.SetStateAction<{ first_name: string; last_name: string; username: string; phone: string; country: string; bio: string }>
    >;
    email: string;
    onSubmit: (e: React.FormEvent) => void;
    saving: boolean;
}) {
    const { t } = useTranslation();
    const fields: Array<[keyof typeof profile, string]> = [
        ["first_name", t("supportDesk.settings.profileTab.firstName")],
        ["last_name", t("supportDesk.settings.profileTab.lastName")],
        ["username", t("supportDesk.settings.profileTab.username")],
        ["phone", t("supportDesk.settings.profileTab.phone")],
        ["country", t("supportDesk.settings.profileTab.country")],
    ];
    return (
        <>
            <Header title={t("supportDesk.settings.profileTab.title")} description={t("supportDesk.settings.profileTab.description")} />
            <form onSubmit={onSubmit} className="p-5 sm:p-7">
                <div className="grid gap-5 sm:grid-cols-2">
                    {fields.map(([k, label]) => (
                        <label key={k} className="block text-xs font-semibold text-[#3A3A3A]">
                            {label}
                            <input
                                value={profile[k]}
                                onChange={(e) => setProfile((c) => ({ ...c, [k]: e.target.value }))}
                                className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3.5 text-sm outline-none focus:border-[#F47822]"
                            />
                        </label>
                    ))}
                    <label className="block text-xs font-semibold text-[#3A3A3A]">
                        {t("supportDesk.settings.profileTab.email")}
                        <input
                            value={email}
                            disabled
                            className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3.5 text-sm text-[#3A3A3A]/45"
                        />
                    </label>
                </div>
                <label className="mt-5 block text-xs font-semibold text-[#3A3A3A]">
                    {t("supportDesk.settings.profileTab.bio")}
                    <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile((c) => ({ ...c, bio: e.target.value }))}
                        maxLength={500}
                        rows={4}
                        placeholder={t("supportDesk.settings.profileTab.bioPh")}
                        className="mt-2 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3.5 py-3 text-sm outline-none focus:border-[#F47822]"
                    />
                </label>
                <div className="mt-6 flex justify-end border-t border-[#3A3A3A]/6 pt-5">
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
                    >
                        {saving ? t("supportDesk.settings.profileTab.saving") : t("supportDesk.settings.profileTab.save")}
                    </button>
                </div>
            </form>
        </>
    );
}

function DeskTab({ onSaved }: { onSaved: (msg: string) => void }) {
    const { t } = useTranslation();
    const [prefs, setPrefs] = useState<DeskPrefs>(() => loadDeskPrefs());

    const statusOptions = [
        { value: "", label: t("supportDesk.settings.deskTab.statusAll") },
        { value: "open", label: t("supportDesk.tickets.filters.open") },
        { value: "pending", label: t("supportDesk.tickets.filters.pending") },
        { value: "resolved", label: t("supportDesk.tickets.filters.resolved") },
        { value: "closed", label: t("supportDesk.tickets.filters.closed") },
    ];
    const assignedOptions = [
        { value: "", label: t("supportDesk.settings.deskTab.assignedAny") },
        { value: "me", label: t("supportDesk.tickets.filters.mine") },
        { value: "unassigned", label: t("supportDesk.tickets.filters.unassigned") },
    ];

    return (
        <>
            <Header title={t("supportDesk.settings.deskTab.title")} description={t("supportDesk.settings.deskTab.description")} />
            <div className="p-5 sm:p-7">
                <div className="rounded-2xl border border-[#F47822]/15 bg-[#FFF8F4] p-4">
                    <p className="text-xs font-bold text-[#F47822] flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4" /> {t("supportDesk.settings.deskTab.personalisedTitle")}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/60">{t("supportDesk.settings.deskTab.personalisedDesc")}</p>
                </div>

                <label className="mt-5 block text-xs font-semibold text-[#3A3A3A]">
                    {t("supportDesk.settings.deskTab.defaultFilter")}
                    <select
                        data-testid="desk-default-status"
                        value={prefs.defaultStatus}
                        onChange={(e) => setPrefs((c) => ({ ...c, defaultStatus: e.target.value }))}
                        className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 text-sm"
                    >
                        {statusOptions.map((o) => (
                            <option key={o.value || "all"} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </label>
                <p className="mt-1.5 text-[11px] text-[#3A3A3A]/45">{t("supportDesk.settings.deskTab.defaultFilterDesc")}</p>

                <label className="mt-5 block text-xs font-semibold text-[#3A3A3A]">
                    {t("supportDesk.settings.deskTab.defaultAssigned")}
                    <select
                        data-testid="desk-default-assigned"
                        value={prefs.defaultAssigned}
                        onChange={(e) => setPrefs((c) => ({ ...c, defaultAssigned: e.target.value }))}
                        className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 text-sm"
                    >
                        {assignedOptions.map((o) => (
                            <option key={o.value || "any"} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        data-testid="desk-prefs-save"
                        onClick={() => {
                            saveDeskPrefs(prefs);
                            onSaved(t("supportDesk.settings.deskTab.saved"));
                        }}
                        className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white"
                    >
                        {t("supportDesk.settings.deskTab.save")}
                    </button>
                </div>
            </div>
        </>
    );
}

function SwitchGroup({
    title,
    description,
    group,
    onSave,
}: {
    title: string;
    description: string;
    group?: Record<string, unknown>;
    onSave: (d: Record<string, unknown>) => Promise<void>;
}) {
    const { t } = useTranslation();
    const [draft, setDraft] = useState<Record<string, unknown>>({});
    useEffect(() => setDraft(group ?? {}), [group]);
    const entries = Object.entries(draft).filter(([k, v]) => typeof v === "boolean" && DESK_TOGGLES.includes(k));
    return (
        <>
            <Header title={title} description={description} />
            <div className="p-5 sm:p-7">
                <div className="space-y-3">
                    {entries.map(([k, v]) => (
                        <Toggle
                            key={k}
                            label={t(`supportDesk.settings.toggles.${k}`)}
                            checked={Boolean(v)}
                            onChange={(c) => setDraft((cur) => ({ ...cur, [k]: c }))}
                        />
                    ))}
                    {entries.length === 0 && (
                        <p className="text-xs text-[#3A3A3A]/45">{t("supportDesk.settings.notificationsTab.empty")}</p>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        onClick={() => void onSave(draft)}
                        className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white"
                    >
                        {t("supportDesk.settings.notificationsTab.save")}
                    </button>
                </div>
            </div>
        </>
    );
}

function AppearanceTab({ group, onSave }: { group?: Record<string, unknown>; onSave: (d: Record<string, unknown>) => Promise<void> }) {
    const { t } = useTranslation();
    const [appearance, setAppearance] = useState("system");
    useEffect(() => setAppearance(String((group as Record<string, unknown>)?.appearance ?? "system")), [group]);
    const options = ["system", "light", "dark"];
    return (
        <>
            <Header title={t("supportDesk.settings.appearanceTab.title")} description={t("supportDesk.settings.appearanceTab.description")} />
            <div className="p-5 sm:p-7">
                <p className="text-xs font-semibold text-[#3A3A3A]">{t("supportDesk.settings.appearanceTab.colorPref")}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {options.map((o) => (
                        <button
                            key={o}
                            type="button"
                            onClick={() => setAppearance(o)}
                            className={`rounded-xl border px-4 py-4 text-sm font-semibold capitalize ${
                                appearance === o
                                    ? "border-[#F47822] bg-[#F47822]/8 text-[#F47822]"
                                    : "border-[#3A3A3A]/10 text-[#3A3A3A]/55"
                            }`}
                        >
                            {t(`supportDesk.settings.appearanceTab.${o}`)}
                        </button>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        onClick={() => void onSave({ appearance })}
                        className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white"
                    >
                        {t("supportDesk.settings.appearanceTab.save")}
                    </button>
                </div>
            </div>
        </>
    );
}

function SecurityTab({ onSaved }: { onSaved: (msg: string) => void }) {
    const { t } = useTranslation();
    const [current, setCurrent] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isStrongPassword(password)) return setError(t("supportDesk.settings.securityTab.weak"));
        if (password !== confirmation) return setError(t("supportDesk.settings.securityTab.mismatch"));
        try {
            await settingsApi.changePassword({
                current_password: current,
                password,
                password_confirmation: confirmation,
            });
            setCurrent("");
            setPassword("");
            setConfirmation("");
            setError(null);
            onSaved(t("supportDesk.settings.securityTab.updated"));
        } catch (err) {
            setError(err instanceof Error ? err.message : t("supportDesk.settings.securityTab.fail"));
        }
    };

    return (
        <>
            <Header title={t("supportDesk.settings.securityTab.title")} description={t("supportDesk.settings.securityTab.description")} />
            <div className="space-y-7 p-5 sm:p-7">
                <TwoFactorCard />
                <form onSubmit={submit} className="space-y-4 border-t border-[#3A3A3A]/6 pt-6">
                    <h3 className="font-bold text-[#3A3A3A]">{t("supportDesk.settings.securityTab.changeTitle")}</h3>
                    <Field label={t("supportDesk.settings.securityTab.current")} value={current} onChange={setCurrent} />
                    <Field label={t("supportDesk.settings.securityTab.newPass")} value={password} onChange={setPassword} />
                    <PasswordRequirements password={password} />
                    <Field label={t("supportDesk.settings.securityTab.confirm")} value={confirmation} onChange={setConfirmation} />
                    {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
                    <div className="flex justify-end">
                        <button type="submit" className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white">
                            {t("supportDesk.settings.securityTab.update")}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

function DataTab({ onExport }: { onExport: () => void }) {
    const { t } = useTranslation();
    return (
        <>
            <Header title={t("supportDesk.settings.dataTab.title")} description={t("supportDesk.settings.dataTab.description")} />
            <div className="space-y-5 p-5 sm:p-7">
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#3A3A3A]/8 p-5 sm:flex-row sm:items-center">
                    <div>
                        <h3 className="font-bold text-[#3A3A3A]">{t("supportDesk.settings.dataTab.exportTitle")}</h3>
                        <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/50">{t("supportDesk.settings.dataTab.exportDesc")}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onExport}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#F47822]/25 px-4 py-2.5 text-xs font-bold text-[#F47822] hover:bg-[#F47822]/5"
                    >
                        <Download className="h-4 w-4" />
                        {t("supportDesk.settings.dataTab.exportBtn")}
                    </button>
                </div>
                <div className="rounded-2xl border border-[#F47822]/15 bg-[#FFF8F4] p-5">
                    <h3 className="font-bold text-[#F47822] flex items-center gap-1.5">
                        <Settings className="h-4 w-4" /> {t("supportDesk.settings.dataTab.noteTitle")}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/60">{t("supportDesk.settings.dataTab.noteDesc")}</p>
                </div>
            </div>
        </>
    );
}
