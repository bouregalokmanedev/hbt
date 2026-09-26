import {
  Award,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  Download,
  Eye,
  LockKeyhole,
  Mail,
  Palette,
  ShieldCheck,
  Smartphone,
  SlidersHorizontal,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  isStrongPassword,
  PasswordRequirements,
} from "@/features/auth/components/PasswordRequirements";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useUpdateProfile } from "@/features/auth/hooks/useUpdateProfile";
import { authStorage } from "@/lib/storage/auth-storage";
import {
  settingsApi,
  type SettingsGroup,
  type StudentSettings,
} from "../api/settings.api";
import { setTheme } from "@/lib/theme";

type Tab =
  | "profile"
  | "appearance"
  | "notifications"
  | "privacy"
  | "learning"
  | "security"
  | "achievements"
  | "assessment"
  | "data";
type ProfileDraft = {
  first_name: string;
  last_name: string;
  username: string;
  phone: string;
  country: string;
  bio: string;
};
const tabDefs: Array<{ id: Tab; icon: typeof UserRound; labelKey: string; descKey: string }> = [
  { id: "profile", icon: UserRound, labelKey: "settingsPage.tabs.profile", descKey: "settingsPage.tabsDesc.profile" },
  { id: "appearance", icon: Palette, labelKey: "settingsPage.tabs.appearance", descKey: "settingsPage.tabsDesc.appearance" },
  { id: "notifications", icon: Bell, labelKey: "settingsPage.tabs.notifications", descKey: "settingsPage.tabsDesc.notifications" },
  { id: "privacy", icon: ShieldCheck, labelKey: "settingsPage.tabs.privacy", descKey: "settingsPage.tabsDesc.privacy" },
  { id: "learning", icon: BookOpen, labelKey: "settingsPage.tabs.learning", descKey: "settingsPage.tabsDesc.learning" },
  { id: "security", icon: LockKeyhole, labelKey: "settingsPage.tabs.security", descKey: "settingsPage.tabsDesc.security" },
  { id: "achievements", icon: Award, labelKey: "settingsPage.tabs.achievements", descKey: "settingsPage.tabsDesc.achievements" },
  {
    id: "assessment",
    icon: SlidersHorizontal,
    labelKey: "settingsPage.tabs.assessment",
    descKey: "settingsPage.tabsDesc.assessment",
  },
  { id: "data", icon: Download, labelKey: "settingsPage.tabs.data", descKey: "settingsPage.tabsDesc.data" },
];

const toggleKeys = [
  "email_enabled",
  "push_enabled",
  "in_app_enabled",
  "course_updates",
  "lesson_reminders",
  "quiz_reminders",
  "assessment_results",
  "certificate_issued",
  "achievement_unlocked",
  "course_completion",
  "security_alerts",
  "marketing",
  "show_learning_activity",
  "show_achievements",
  "show_certificates",
  "show_course_progress",
  "allow_personalized_recommendations",
  "allow_analytics",
  "send_read_receipts",
  "autoplay_lessons",
  "resume_last_position",
  "show_completed_lessons",
  "show_quiz_explanations",
  "confirm_before_quiz_submit",
  "show_timer",
  "confirm_before_submit",
  "show_result_breakdown",
  "email_result_notifications",
] as const;

function useToggleLabels(): Record<string, string> {
  const { t } = useTranslation();

  return Object.fromEntries(
    toggleKeys.map((key) => [key, t(`settingsPage.toggles.${key}`)]),
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tabs = tabDefs.map((tab) => ({ ...tab, label: t(tab.labelKey), desc: t(tab.descKey) }));
  const { user, logout } = useAuth();
  const { updateProfile, isUpdating } = useUpdateProfile();
  const [tab, setTab] = useState<Tab>("profile");
  const [settings, setSettings] = useState<StudentSettings | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Awaited<
    ReturnType<typeof settingsApi.achievements>
  > | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [profile, setProfile] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    username: user?.username ?? "",
    phone: user?.phone ?? "",
    country: user?.country ?? "",
    bio: user?.bio ?? "",
  });

  useEffect(() => {
    void settingsApi
      .get()
      .then(setSettings)
      .catch((caught) =>
        setError(
          caught instanceof Error ? caught.message : t("settingsPage.notices.loadFail"),
        ),
      );
  }, []);
  useEffect(() => {
    if (tab === "achievements" && !achievements)
      void settingsApi
        .achievements()
        .then(setAchievements)
        .catch(() => setError(t("settingsPage.notices.achievementsFail")));
  }, [achievements, tab]);

  const save = async (
    path: string,
    data: SettingsGroup,
    key?: keyof StudentSettings,
  ) => {
    try {
      setFeedback(null);
      setError(null);
      const updated = await settingsApi.update(path, data);
      if (key)
        setSettings((current) => {
          if (!current) return current;
          // Only merge boolean/string keys — ignore model ids/timestamps
          // so SwitchGroup drafts stay clean after PATCH responses.
          const clean = Object.fromEntries(
            Object.entries(updated ?? {}).filter(
              ([, value]) =>
                typeof value === "boolean" || typeof value === "string" || typeof value === "number",
            ),
          );
          return { ...current, [key]: { ...current[key], ...clean } };
        });
      // Appearance applies instantly across the student dashboard.
      if (path === "appearance") {
        const raw = (updated as SettingsGroup)?.appearance ?? (data as SettingsGroup)?.appearance;
        if (raw === "light" || raw === "dark" || raw === "system") setTheme(raw);
      }
      setFeedback(t("settingsPage.notices.saved"));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("settingsPage.notices.saveFail"),
      );
      throw caught;
    }
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await updateProfile({
        ...profile,
        phone: profile.phone || null,
        country: profile.country || null,
        bio: profile.bio || null,
      });
      setFeedback(t("settingsPage.notices.profileUpdated"));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : t("settingsPage.notices.profileFail"),
      );
    }
  };

  const exportData = async () => {
    try {
      const data = await settingsApi.export();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "hbt-learning-data.json";
      link.click();
      URL.revokeObjectURL(url);
      setFeedback(t("settingsPage.notices.exportReady"));
    } catch {
      setError(t("settingsPage.notices.exportFail"));
    }
  };

  return (
    <main className="min-h-full bg-[#F3F3F3] dark:bg-[#101013]">
      <div className="mx-auto w-full max-w-[1320px] px-5 py-6 sm:px-8 sm:py-8">
        <header className="mb-6 rounded-3xl bg-[#3A3A3A] px-6 py-7 text-white shadow-[0_14px_38px_rgba(58,58,58,0.12)] sm:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">
            {t("settingsPage.header.eyebrow")}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {t("settingsPage.header.title")}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {t("settingsPage.header.description")}
          </p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit rounded-3xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-3 shadow-[0_10px_30px_rgba(58,58,58,0.05)] lg:sticky lg:top-6">
            <div className="mb-2 flex items-center justify-between px-2 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/35 dark:text-white/35">
                {t("settingsPage.header.menu")}
              </p>
              <span className="rounded-md bg-[#F47822]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#F47822]">
                {tabs.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:block lg:space-y-1">
              {tabs.map(({ id, label, desc, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-left text-xs font-semibold transition-all duration-200 rtl:text-right ${tab === id ? "bg-[#F47822] text-white shadow-[0_7px_16px_rgba(244,120,34,.2)]" : "text-[#3A3A3A]/60 dark:text-white/60 hover:bg-[#F47822]/6 hover:text-[#3A3A3A] dark:hover:text-[#ececef]"}`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${tab === id ? "bg-white/15 text-white" : "bg-[#3A3A3A]/5 dark:bg-white/5 text-[#3A3A3A]/45 dark:text-white/45 group-hover:bg-[#F47822]/10 group-hover:text-[#F47822]"}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold leading-none">{label}</span>
                    <span className={`hidden text-[10px] leading-none lg:block ${tab === id ? "text-white/70" : "text-[#3A3A3A]/40 dark:text-white/40"}`}>{desc}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-[#FFF8F4] dark:bg-white/5 p-3">
              <p className="text-[11px] font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("settingsPage.tabsHelpTitle")}</p>
              <p className="mt-1 text-[11px] leading-4 text-[#3A3A3A]/50 dark:text-white/50">{t("settingsPage.tabsHelpDesc")}</p>
              <a href="/support" className="mt-2 inline-flex text-xs font-bold text-[#F47822] hover:underline">{t("settingsPage.tabsHelpCta")}</a>
            </div>
          </aside>
          <section className="overflow-hidden rounded-3xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] shadow-[0_14px_34px_rgba(58,58,58,0.06)]">
            {feedback && (
              <Notice
                tone="success"
                message={feedback}
                onClose={() => setFeedback(null)}
              />
            )}
            {error && (
              <Notice
                tone="error"
                message={error}
                onClose={() => setError(null)}
              />
            )}
            {tab === "profile" && (
              <Profile
                profile={profile}
                setProfile={setProfile}
                email={user?.email ?? ""}
                onSubmit={saveProfile}
                saving={isUpdating}
              />
            )}
            {tab === "appearance" && (
              <Appearance
                group={settings?.appearance}
                onSave={(data) => save("appearance", data, "appearance")}
              />
            )}
            {tab === "notifications" && (
              <SwitchGroup
                title={t("settingsPage.notifications.title")}
                description={t("settingsPage.notifications.description")}
                group={settings?.notifications}
                onSave={(data) => save("notifications", data, "notifications")}
                autoSave
                testId="notification-toggles"
              />
            )}
            {tab === "privacy" && (
              <Privacy
                group={settings?.privacy}
                onSave={(data) => save("privacy", data, "privacy")}
              />
            )}
            {tab === "learning" && (
              <Learning
                group={settings?.learning}
                onSave={(data) => save("learning", data, "learning")}
              />
            )}
            {tab === "security" && (
              <>
                <Security
                  onSave={async (data) => {
                    await settingsApi.changePassword(data);
                    setFeedback(
                      "Your password was updated. You can continue learning securely.",
                    );
                  }}
                />
                <SecurityHistory />
              </>
            )}
            {tab === "achievements" && <Achievements data={achievements} />}
            {tab === "assessment" && (
              <SwitchGroup
                title={t("settingsPage.assessment.title")}
                description={t("settingsPage.assessment.description")}
                group={settings?.assessment}
                onSave={(data) => save("assessment", data, "assessment")}
                autoSave
                testId="assessment-toggles"
              />
            )}
            {tab === "data" && (
              <DataAccount
                onExport={exportData}
                onDelete={() => setDeleteOpen(true)}
              />
            )}
          </section>
        </div>
      </div>
      {deleteOpen && (
        <DeleteModal
          onClose={() => setDeleteOpen(false)}
          onDeleted={async () => {
            authStorage.clearToken();
            await logout();
            navigate("/login", { replace: true });
          }}
        />
      )}
    </main>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden border-b border-[#3A3A3A]/6 dark:border-white/6 px-6 py-6 sm:px-8">
      <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[#F47822]/8 blur-2xl rtl:-left-10 rtl:right-auto" />
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">
          {t("settingsPage.tagline")}
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef]">
          {title}
        </h2>
        <p className="mt-1.5 max-w-xl text-xs leading-5 text-[#3A3A3A]/55 dark:text-white/55">
          {description}
        </p>
      </div>
    </div>
  );
}
function Notice({
  tone,
  message,
  onClose,
}: {
  tone: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className={`m-5 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${tone === "success" ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"}`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="rounded-lg p-1 hover:bg-black/5">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
function Profile({
  profile,
  setProfile,
  email,
  onSubmit,
  saving,
}: {
  profile: ProfileDraft;
  setProfile: React.Dispatch<React.SetStateAction<ProfileDraft>>;
  email: string;
  onSubmit: (event: React.FormEvent) => void;
  saving: boolean;
}) {
  const { t } = useTranslation();
  const fields = [
    ["first_name", t("settingsPage.profile.firstName")],
    ["last_name", t("settingsPage.profile.lastName")],
    ["username", t("settingsPage.profile.username")],
    ["phone", t("settingsPage.profile.phone")],
    ["country", t("settingsPage.profile.country")],
  ] as const;
  return (
    <>
      <SectionHeader
        title={t("settingsPage.profile.title")}
        description={t("settingsPage.profile.description")}
      />
      <form onSubmit={onSubmit} className="p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map(([key, label]) => (
            <Field
              key={key}
              label={label}
              value={profile[key]}
              onChange={(value) =>
                setProfile((current) => ({ ...current, [key]: value }))
              }
            />
          ))}
          <Field label={t("settingsPage.profile.email")} value={email} disabled />
        </div>
        <div className="mt-5">
          <label className="mb-2 block text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">
            {t("settingsPage.profile.bio")}
          </label>
          <textarea
            value={profile.bio}
            onChange={(event) =>
              setProfile((current) => ({ ...current, bio: event.target.value }))
            }
            maxLength={500}
            rows={4}
            className="w-full rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-[#FAFAFA] dark:bg-[#232329] px-3.5 py-3 text-sm outline-none focus:border-[#F47822]"
          />
        </div>
        <div className="mt-6 flex justify-end border-t border-[#3A3A3A]/6 dark:border-white/6 pt-5">
          <button
            disabled={saving}
            className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {saving ? t("settingsPage.profile.saving") : t("settingsPage.profile.save")}
          </button>
        </div>
      </form>
    </>
  );
}
function Field({
  label,
  value,
  onChange,
  disabled = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-[#FAFAFA] dark:bg-[#232329] px-3.5 text-sm font-normal outline-none focus:border-[#F47822] disabled:cursor-not-allowed disabled:text-[#3A3A3A]/45 dark:disabled:text-white/45"
      />
    </label>
  );
}
function SwitchGroup({
  title,
  description,
  group,
  onSave,
  autoSave = false,
  testId,
}: {
  title: string;
  description: string;
  group?: SettingsGroup;
  onSave: (data: SettingsGroup) => Promise<void>;
  autoSave?: boolean;
  testId?: string;
}) {
  const { t } = useTranslation();
  const labels = useToggleLabels();
  const [draft, setDraft] = useState<SettingsGroup>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  useEffect(() => setDraft(group ?? {}), [group]);

  const booleanEntries = (source: SettingsGroup) =>
    Object.entries(source).filter(
      ([key, value]) => typeof value === "boolean" && labels[key],
    );

  const handleToggle = async (key: string, checked: boolean) => {
    const previous = draft[key];
    setDraft((current) => ({ ...current, [key]: checked }));

    if (!autoSave) return;

    setSavingKey(key);
    try {
      await onSave({ [key]: checked });
    } catch {
      setDraft((current) => ({ ...current, [key]: previous }));
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveAll = async () => {
    const payload = Object.fromEntries(booleanEntries(draft));
    setSavingAll(true);
    try {
      await onSave(payload);
    } catch {
      // Parent save() surfaces the error notice; keep draft for retry.
    } finally {
      setSavingAll(false);
    }
  };

  const entries = booleanEntries(draft);

  if (entries.length === 0 && !group) {
    return (
      <>
        <SectionHeader title={title} description={description} />
        <div className="p-5 sm:p-7" data-testid={testId ? `${testId}-loading` : undefined}>
          <p className="text-sm text-[#3A3A3A]/55 dark:text-white/55">
            {t("settingsPage.notices.loadFail")}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeader title={title} description={description} />
      <div className="p-5 sm:p-7" data-testid={testId}>
        <div className="space-y-3">
          {entries.map(([key, value]) => (
            <Toggle
              key={key}
              label={labels[key]}
              checked={Boolean(value)}
              busy={savingKey === key}
              onChange={(checked) => void handleToggle(key, checked)}
              testId={testId ? `${testId}-${key}` : undefined}
            />
          ))}
        </div>
        {!autoSave && (
          <div className="mt-6 flex justify-end border-t border-[#3A3A3A]/6 dark:border-white/6 pt-5">
            <button
              onClick={() => void handleSaveAll()}
              disabled={savingAll}
              data-testid={testId ? `${testId}-save` : undefined}
              className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
            >
              {savingAll ? t("settingsPage.profile.saving") : t("settingsPage.savePrefs")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
function Toggle({
  label,
  checked,
  onChange,
  busy = false,
  testId,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  busy?: boolean;
  testId?: string;
}) {
  return (
    <label
      data-testid={testId}
      data-busy={busy ? "true" : undefined}
      className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 transition ${checked ? "border-[#F47822]/20 bg-[#F47822]/[.035]" : "border-[#3A3A3A]/8 dark:border-white/8 bg-[#FAFAFA] dark:bg-[#232329] hover:border-[#3A3A3A]/15 dark:hover:border-white/15"} ${busy ? "opacity-70" : ""}`}
    >
      <span className="text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">{label}</span>
      <span
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[#F47822]" : "bg-[#3A3A3A]/15 dark:bg-white/15"}`}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={busy}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white dark:bg-[#1b1b20] shadow-sm transition ${checked ? "left-6 rtl:left-auto rtl:right-6" : "left-1 rtl:left-auto rtl:right-1"}`}
        />
      </span>
    </label>
  );
}
function Appearance({
  group,
  onSave,
}: {
  group?: SettingsGroup;
  onSave: (data: SettingsGroup) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [appearance, setAppearance] = useState("system");
  useEffect(
    () => setAppearance(String(group?.appearance ?? "system")),
    [group],
  );
  return (
    <>
      <SectionHeader
        title={t("settingsPage.appearance.title")}
        description={t("settingsPage.appearance.description")}
      />
      <div className="p-5 sm:p-7">
        <p className="text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("settingsPage.appearance.colorPref")}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(
            [
              ["system", t("settingsPage.appearance.system")],
              ["light", t("settingsPage.appearance.light")],
              ["dark", t("settingsPage.appearance.dark")],
            ] as const
          ).map(([option, label]) => (
            <button
              key={option}
              onClick={() => setAppearance(option)}
              className={`rounded-xl border px-4 py-4 text-sm font-semibold capitalize ${appearance === option ? "border-[#F47822] bg-[#F47822]/8 text-[#F47822]" : "border-[#3A3A3A]/10 dark:border-white/10 text-[#3A3A3A]/55 dark:text-white/55"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => void onSave({ appearance }).catch(() => undefined)}
            className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white"
          >
            {t("settingsPage.appearance.save")}
          </button>
        </div>
      </div>
    </>
  );
}
function Privacy({
  group,
  onSave,
}: {
  group?: SettingsGroup;
  onSave: (data: SettingsGroup) => Promise<void>;
}) {
  const { t } = useTranslation();
  const labels = useToggleLabels();
  const [draft, setDraft] = useState<SettingsGroup>({});
  useEffect(() => setDraft(group ?? {}), [group]);
  return (
    <>
      <SectionHeader
        title={t("settingsPage.privacy.title")}
        description={t("settingsPage.privacy.description")}
      />
      <div className="p-5 sm:p-7">
        <label className="text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">
          {t("settingsPage.privacy.visibility")}
          <select
            value={String(draft.profile_visibility ?? "private")}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                profile_visibility: event.target.value,
              }))
            }
            className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-[#FAFAFA] dark:bg-[#232329] px-3 text-sm"
          >
            <option value="private">{t("settingsPage.privacy.private")}</option>
            <option value="connections">{t("settingsPage.privacy.connections")}</option>
            <option value="public">{t("settingsPage.privacy.public")}</option>
          </select>
        </label>
        <div className="mt-5 space-y-3">
          {Object.entries(draft)
            .filter(([key, value]) => typeof value === "boolean" && labels[key])
            .map(([key, value]) => (
              <Toggle
                key={key}
                label={labels[key]}
                checked={Boolean(value)}
                onChange={(checked) =>
                  setDraft((current) => ({ ...current, [key]: checked }))
                }
              />
            ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => void onSave(draft).catch(() => undefined)}
            className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white"
          >
            {t("settingsPage.privacy.save")}
          </button>
        </div>
      </div>
    </>
  );
}
function Learning({
  group,
  onSave,
}: {
  group?: SettingsGroup;
  onSave: (data: SettingsGroup) => Promise<void>;
}) {
  const { t } = useTranslation();
  const labels = useToggleLabels();
  const [draft, setDraft] = useState<SettingsGroup>({});
  useEffect(() => setDraft(group ?? {}), [group]);
  return (
    <>
      <SectionHeader
        title={t("settingsPage.learning.title")}
        description={t("settingsPage.learning.description")}
      />
      <div className="p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("settingsPage.learning.dailyGoal")}
            value={String(draft.daily_learning_goal_minutes ?? 30)}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                daily_learning_goal_minutes: Number(value),
              }))
            }
          />
          <Field
            label={t("settingsPage.learning.weeklyGoal")}
            value={String(draft.weekly_learning_goal_minutes ?? 180)}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                weekly_learning_goal_minutes: Number(value),
              }))
            }
          />
        </div>
        <div className="mt-5 space-y-3">
          {Object.entries(draft)
            .filter(([key, value]) => typeof value === "boolean" && labels[key])
            .map(([key, value]) => (
              <Toggle
                key={key}
                label={labels[key]}
                checked={Boolean(value)}
                onChange={(checked) =>
                  setDraft((current) => ({ ...current, [key]: checked }))
                }
              />
            ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => void onSave(draft).catch(() => undefined)}
            className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white"
          >
            {t("settingsPage.learning.save")}
          </button>
        </div>
      </div>
    </>
  );
}
function Security({
  onSave,
}: {
  onSave: (data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;
}) {
  const { t, i18n } = useTranslation();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [code, setCode] = useState("");
  const [twoFactorMethod, setTwoFactorMethod] = useState<"email" | "phone">("email");
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [security, setSecurity] = useState<SettingsGroup | null>(null);
  const [sessions, setSessions] = useState<
    Array<{
      id: string;
      device_name: string;
      browser: string;
      platform: string;
      ip_address: string;
      last_activity_at: string;
      is_current: boolean;
    }>
  >([]);
  const [activity, setActivity] = useState<
    Array<{
      id: string;
      event: string;
      successful: boolean;
      ip_address: string;
      browser: string;
      platform: string;
      created_at: string;
    }>
  >([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = () => {
    void Promise.all([
      settingsApi.security(),
      settingsApi.sessions(),
      settingsApi.loginActivity(),
    ])
      .then(([s, ss, logs]) => {
        setSecurity(s);
        setSessions(ss);
        setActivity(logs);
      })
      .catch(() => setError(t("settingsPage.security.loadFail")));
  };
  useEffect(load, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isStrongPassword(password))
      return setError(t("settingsPage.security.weakPassword"));
    if (password !== confirmation) return setError(t("settingsPage.security.mismatch"));
    try {
      await onSave({
        current_password: current,
        password,
        password_confirmation: confirmation,
      });
      setCurrent("");
      setPassword("");
      setConfirmation("");
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : t("settingsPage.security.passwordFail"),
      );
    }
  };
  const enable = async () => {
    try {
      await settingsApi.enableTwoFactor(twoFactorMethod);
      setMessage(twoFactorMethod === "phone" ? t("settingsPage.security.codeSentPhone") : t("settingsPage.security.codeSentEmail"));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("settingsPage.security.beginFail"),
      );
    }
  };
  const verify = async () => {
    try {
      const next = await settingsApi.verifyTwoFactor(code, twoFactorMethod);
      setSecurity(next);
      setCode("");
      setMessage(t("settingsPage.security.enabledMsg"));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("settingsPage.security.verifyFail"),
      );
    }
  };
  const disable = async () => {
    if (!disablePassword) {
      setError(t("settingsPage.security.disablePasswordRequired"));
      return;
    }
    try {
      const next = await settingsApi.disableTwoFactor(disablePassword);
      setSecurity(next);
      setDisablePassword("");
      setConfirmDisable(false);
      setMessage(t("settingsPage.security.disabledMsg"));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("settingsPage.security.disableFail"),
      );
    }
  };
  return (
    <>
      <SectionHeader
        title={t("settingsPage.security.title")}
        description={t("settingsPage.security.description")}
      />
      <div className="space-y-7 p-5 sm:p-7">
        <section className="relative overflow-hidden rounded-3xl border border-[#F47822]/15 bg-white dark:bg-[#1b1b20] p-5 shadow-[0_10px_28px_rgba(58,58,58,.04)] sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#F47822]/10 blur-3xl" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F47822]/10 text-[#F47822]"><ShieldCheck className="h-5 w-5" /></div><div>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">{t("settingsPage.security.protection")}</p><h3 className="mt-1 font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("settingsPage.security.twoFa")}</h3>
              <p className="mt-1 text-xs text-[#3A3A3A]/55 dark:text-white/55">
                {t("settingsPage.security.chooseDelivery")}
              </p>
            </div></div>
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${security?.two_factor_enabled ? "bg-emerald-100 text-emerald-700 dark:text-emerald-400" : "bg-[#3A3A3A]/8 dark:bg-white/8 text-[#3A3A3A]/50 dark:text-white/50"}`}
            >
              {security?.two_factor_enabled ? t("settingsPage.security.enabled") : t("settingsPage.security.notEnabled")}
            </span>
          </div>
          {security?.two_factor_enabled ? (
            confirmDisable ? (
              <div data-testid="two-factor-disable-confirm" className="mt-5 rounded-2xl border border-red-200 bg-red-50/70 p-4">
                <p className="text-xs font-bold text-red-700 dark:text-red-300">{t("settingsPage.security.disableConfirmTitle")}</p>
                <p className="mt-1 text-[11px] leading-4 text-red-700/80 dark:text-red-300/80">{t("settingsPage.security.disableConfirmDesc")}</p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <label className="block min-w-[200px] flex-1 text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                    {t("settingsPage.security.currentPassword")}
                    <input
                      type="password"
                      value={disablePassword}
                      onChange={(event) => setDisablePassword(event.target.value)}
                      autoComplete="current-password"
                      data-testid="two-factor-disable-password"
                      className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#232329] px-3.5 text-sm outline-none focus:border-[#F47822]"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      data-testid="two-factor-disable-cancel"
                      onClick={() => { setConfirmDisable(false); setDisablePassword(""); setError(null); }}
                      className="h-11 rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-4 text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60 hover:bg-[#F3F3F3] dark:hover:bg-white/5"
                    >
                      {t("settingsPage.security.disableCancel")}
                    </button>
                    <button
                      type="button"
                      data-testid="two-factor-disable-submit"
                      disabled={!disablePassword}
                      onClick={() => void disable()}
                      className="h-11 rounded-xl bg-red-600 px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(220,38,38,.18)] disabled:opacity-50"
                    >
                      {t("settingsPage.security.confirmDisable")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50/70 p-4"><p className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300"><Check className="h-4 w-4" />{t("settingsPage.security.protectedWith", { method: String(security.two_factor_method ?? "email") === "phone" ? t("settingsPage.security.sms") : t("settingsPage.security.email") })}</p><button type="button" data-testid="two-factor-disable" onClick={() => { setError(null); setMessage(null); setDisablePassword(""); setConfirmDisable(true); }} className="rounded-xl border border-red-200 dark:border-red-500/20 bg-white dark:bg-[#1b1b20] px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-500/10">{t("settingsPage.security.disable")}</button></div>
            )
          ) : (
            <div className="mt-5">
              {message?.includes("6-digit") ? (
                <div className="rounded-2xl border border-[#F47822]/15 bg-[#F47822]/[.035] p-4"><p className="text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">{t("settingsPage.security.enterCode", { target: twoFactorMethod === "phone" ? t("settingsPage.security.sms").toLowerCase() : t("settingsPage.security.email").toLowerCase() })}</p><div className="mt-3 flex flex-wrap items-end gap-3"><Field label={t("settingsPage.security.codeLabel")} value={code} onChange={setCode}/><button onClick={() => void verify()} className="h-11 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(244,120,34,.2)]">{t("settingsPage.security.verifyEnable")}</button></div></div>
              ) : (
                <><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setTwoFactorMethod("email")} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${twoFactorMethod === "email" ? "border-[#F47822] bg-[#F47822]/[.045]" : "border-[#3A3A3A]/10 dark:border-white/10 hover:border-[#F47822]/35"}`}><Mail className="h-5 w-5 text-[#F47822]"/><span><span className="block text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("settingsPage.security.emailCode")}</span><span className="mt-0.5 block text-[10px] text-[#3A3A3A]/45 dark:text-white/45">{t("settingsPage.security.emailCodeDesc")}</span></span></button><button type="button" onClick={() => setTwoFactorMethod("phone")} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${twoFactorMethod === "phone" ? "border-[#F47822] bg-[#F47822]/[.045]" : "border-[#3A3A3A]/10 dark:border-white/10 hover:border-[#F47822]/35"}`}><Smartphone className="h-5 w-5 text-[#F47822]"/><span><span className="block text-xs font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("settingsPage.security.smsCode")}</span><span className="mt-0.5 block text-[10px] text-[#3A3A3A]/45 dark:text-white/45">{t("settingsPage.security.smsCodeDesc")}</span></span></button></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] leading-4 text-[#3A3A3A]/45 dark:text-white/45">{twoFactorMethod === "phone" ? t("settingsPage.security.smsRequires") : t("settingsPage.security.emailCodes")}</p><button onClick={() => void enable()} className="rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_18px_rgba(244,120,34,.2)]">{t("settingsPage.security.sendCode")}</button></div></>
              )}
            </div>
          )}
        </section>
        {message && (
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{message}</p>
        )}
        {error && <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("settingsPage.security.sessionsTitle")}</h3>
              <p className="mt-1 text-xs text-[#3A3A3A]/50 dark:text-white/50">
                {t("settingsPage.security.sessionsDesc")}
              </p>
            </div>
            <button
              onClick={() => void settingsApi.revokeOtherSessions().then(load)}
              className="text-xs font-bold text-[#F47822]"
            >
              {t("settingsPage.security.signOutOthers")}
            </button>
          </div>
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#3A3A3A]/8 dark:border-white/8 p-3.5"
              >
                <div>
                  <p className="text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                    {session.device_name || session.browser || "Unknown device"}{" "}
                    {session.is_current && (
                      <span className="ml-2 text-[10px] text-emerald-600 dark:text-emerald-400">
                        {t("settingsPage.security.current")}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                    {session.platform} · {session.ip_address} · {t("settingsPage.security.activeNow")}{" "}
                    {session.last_activity_at
                      ? new Date(session.last_activity_at).toLocaleString(i18n.language)
                      : t("settingsPage.security.recently")}
                  </p>
                </div>
                {!session.is_current && (
                  <button
                    onClick={() =>
                      void settingsApi.revokeSession(session.id).then(load)
                    }
                    className="text-xs font-bold text-red-600 dark:text-red-400"
                  >
                    {t("settingsPage.security.revoke")}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3 className="font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("settingsPage.security.activityTitle")}</h3>
          <p className="mt-1 text-xs text-[#3A3A3A]/50 dark:text-white/50">
            {t("settingsPage.security.activityDesc")}
          </p>
          <div className="mt-3 space-y-2">
            {activity.length ? (
              activity.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-4 rounded-xl bg-[#FAFAFA] dark:bg-[#232329] px-4 py-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                      {entry.event.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                      {entry.browser} · {entry.platform} · {entry.ip_address}
                    </p>
                  </div>
                  <div
                    className={`text-right text-[10px] font-bold ${entry.successful ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {entry.successful ? t("settingsPage.security.success") : t("settingsPage.security.failed")}
                    <p className="mt-1 font-medium text-[#3A3A3A]/40 dark:text-white/40">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-[#3A3A3A]/12 dark:border-white/12 p-4 text-xs text-[#3A3A3A]/45 dark:text-white/45">
                {t("settingsPage.security.activityEmpty")}
              </p>
            )}
          </div>
        </section>
        <form onSubmit={submit} className="border-t border-[#3A3A3A]/8 dark:border-white/8 pt-7">
          <h3 className="font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("settingsPage.security.changePassword")}</h3>
          <div className="mt-4 space-y-4">
            <Field
              label={t("settingsPage.security.currentPassword")}
              value={current}
              onChange={setCurrent}
            />
            <Field
              label={t("settingsPage.security.newPassword")}
              value={password}
              onChange={setPassword}
            />
            <PasswordRequirements password={password} />
            <Field
              label={t("settingsPage.security.confirmPassword")}
              value={confirmation}
              onChange={setConfirmation}
            />
          </div>
          <div className="mt-6 flex justify-end">
            <button className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white">
              {t("settingsPage.security.updatePassword")}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
function SecurityHistory() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<"sessions" | "activity" | null>(null);
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const show = async (type: "sessions" | "activity") => {
    setOpen(type);
    setLoading(true);
    try {
      setItems(
        (await (type === "sessions"
          ? settingsApi.sessions(true)
          : settingsApi.loginActivity(true))) as Array<Record<string, unknown>>,
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="border-t border-[#3A3A3A]/8 dark:border-white/8 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#FAFAFA] dark:bg-[#232329] p-4">
        <div>
          <p className="text-sm font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("settingsPage.security.needHistory")}</p>
          <p className="mt-1 text-xs text-[#3A3A3A]/50 dark:text-white/50">
            {t("settingsPage.security.historyDesc")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void show("sessions")}
            className="rounded-xl border border-[#F47822]/25 px-3 py-2 text-xs font-bold text-[#F47822]"
          >
            {t("settingsPage.security.viewSessions")}
          </button>
          <button
            onClick={() => void show("activity")}
            className="rounded-xl bg-[#F47822] px-3 py-2 text-xs font-bold text-white"
          >
            {t("settingsPage.security.viewActivity")}
          </button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A3A]/55 dark:bg-white/55 p-4 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white dark:bg-[#1b1b20] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">
                  {t("settingsPage.security.historyTag")}
                </p>
                <h3 className="mt-1 text-xl font-bold text-[#3A3A3A] dark:text-[#ececef]">
                  {t("settingsPage.security.allPrefix")}{" "}
                  {open === "sessions" ? t("settingsPage.security.allSessions") : t("settingsPage.security.allActivity")}
                </h3>
              </div>
              <button
                onClick={() => setOpen(null)}
                className="rounded-lg p-2 text-[#3A3A3A]/50 dark:text-white/50 hover:bg-[#F3F3F3] dark:hover:bg-[#101013]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 space-y-2">
              {loading ? (
                <p className="text-sm text-[#3A3A3A]/50 dark:text-white/50">{t("settingsPage.security.loading")}</p>
              ) : items.length ? (
                items.map((item) => (
                  <div
                    key={String(item.id)}
                    className="rounded-xl border border-[#3A3A3A]/8 dark:border-white/8 p-3 text-xs text-[#3A3A3A]/65 dark:text-white/65"
                  >
                    <p className="font-bold text-[#3A3A3A] dark:text-[#ececef]">
                      {String(
                        item.device_name ?? item.event ?? t("settingsPage.security.fallbackEvent"),
                      )}
                    </p>
                    <p className="mt-1">
                      {String(item.browser ?? "")} ·{" "}
                      {String(item.platform ?? "")} ·{" "}
                      {String(item.ip_address ?? "")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#3A3A3A]/50 dark:text-white/50">{t("settingsPage.security.noRecords")}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function Achievements({
  data,
}: {
  data: Awaited<ReturnType<typeof settingsApi.achievements>> | null;
}) {
  const { t } = useTranslation();

  return (
    <>
      <SectionHeader
        title={t("settingsPage.achievements.title")}
        description={t("settingsPage.achievements.description")}
      />
      <div className="p-5 sm:p-7">
        {!data ? (
          <p className="text-sm text-[#3A3A3A]/45 dark:text-white/45">{t("settingsPage.achievements.loading")}</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(data.summary).map(([key, value]) => (
                <div key={key} className="rounded-xl bg-[#F47822]/6 p-4">
                  <p className="text-2xl font-bold text-[#3A3A3A] dark:text-[#ececef]">{value}</p>
                  <p className="mt-1 text-[11px] font-semibold capitalize text-[#3A3A3A]/50 dark:text-white/50">
                    {key.replace(/[A-Z]/g, (letter) => ` ${letter}`)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-2">
              {data.certificates.length ? (
                data.certificates.map((certificate) => (
                  <div
                    key={certificate.id}
                    className="flex items-center justify-between rounded-xl border border-[#3A3A3A]/8 dark:border-white/8 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#3A3A3A] dark:text-[#ececef]">
                        {certificate.course_title}
                      </p>
                      <p className="mt-1 text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                        {certificate.certificate_number}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#F47822]" />
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-[#3A3A3A]/12 dark:border-white/12 p-6 text-center text-sm text-[#3A3A3A]/45 dark:text-white/45">
                  {t("settingsPage.achievements.empty")}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
function DataAccount({
  onExport,
  onDelete,
}: {
  onExport: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <SectionHeader
        title={t("settingsPage.data.title")}
        description={t("settingsPage.data.description")}
      />
      <div className="space-y-5 p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#3A3A3A]/8 dark:border-white/8 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-bold text-[#3A3A3A] dark:text-[#ececef]">{t("settingsPage.data.exportTitle")}</h3>
            <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">
              {t("settingsPage.data.exportDesc")}
            </p>
          </div>
          <button
            onClick={onExport}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#F47822]/25 px-4 py-2.5 text-xs font-bold text-[#F47822] hover:bg-[#F47822]/5"
          >
            <Download className="h-4 w-4" />
            {t("settingsPage.data.exportBtn")}
          </button>
        </div>
        <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/50 p-5">
          <h3 className="font-bold text-red-700 dark:text-red-400">{t("settingsPage.data.deleteTitle")}</h3>
          <p className="mt-1 text-xs leading-5 text-red-700/70">
            {t("settingsPage.data.deleteDesc")}
          </p>
          <button
            onClick={onDelete}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            {t("settingsPage.data.deleteBtn")}
          </button>
        </div>
      </div>
    </>
  );
}
function DeleteModal({
  onClose,
  onDeleted,
}: {
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("not_using");
  const [other, setOther] = useState("");
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const reasons: Array<[string, string]> = [
    ["not_using", t("settingsPage.deleteModal.reasons.not_using")],
    ["content", t("settingsPage.deleteModal.reasons.content")],
    ["technical", t("settingsPage.deleteModal.reasons.technical")],
    ["privacy", t("settingsPage.deleteModal.reasons.privacy")],
    ["cost", t("settingsPage.deleteModal.reasons.cost")],
    ["other", t("settingsPage.deleteModal.reasons.other")],
  ];
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setBusy(true);
      await settingsApi.deleteAccount({
        reason,
        other_reason: other || undefined,
        current_password: password,
        confirm_deletion: confirmed,
      });
      await onDeleted();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : t("settingsPage.deleteModal.fail"),
      );
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A3A]/55 dark:bg-white/55 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white dark:bg-[#1b1b20] p-6 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-600 dark:text-red-400">
              Account deletion
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#3A3A3A] dark:text-[#ececef]">
              {t("settingsPage.deleteModal.title")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#3A3A3A]/45 dark:text-white/45 hover:bg-[#F3F3F3] dark:hover:bg-[#101013]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#3A3A3A]/55 dark:text-white/55">
          {t("settingsPage.deleteModal.description")}
        </p>
        <div className="mt-5 space-y-2">
          {reasons.map(([value, label]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${reason === value ? "border-[#F47822] bg-[#F47822]/5" : "border-[#3A3A3A]/10 dark:border-white/10"}`}
            >
              <input
                type="radio"
                checked={reason === value}
                onChange={() => setReason(value)}
              />
              {label}
            </label>
          ))}
        </div>
        {reason === "other" && (
          <textarea
            value={other}
            onChange={(event) => setOther(event.target.value)}
            required
            placeholder={t("settingsPage.deleteModal.otherPh")}
            className="mt-3 min-h-24 w-full rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 p-3 text-sm outline-none focus:border-[#F47822]"
          />
        )}
        <div className="mt-4">
          <Field
            label={t("settingsPage.deleteModal.passwordLabel")}
            value={password}
            onChange={setPassword}
          />
        </div>
        <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#3A3A3A]/60 dark:text-white/60">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-1 accent-red-600"
          />
          {t("settingsPage.deleteModal.confirm")}
        </label>
        {error && (
          <p className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 px-4 py-2.5 text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60"
          >
            {t("settingsPage.deleteModal.keep")}
          </button>
          <button
            disabled={!confirmed || !password || busy}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy ? t("settingsPage.deleteModal.deleting") : t("settingsPage.deleteModal.delete")}
          </button>
        </div>
      </form>
    </div>
  );
}
