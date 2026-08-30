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
const tabs: Array<{ id: Tab; label: string; icon: typeof UserRound }> = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: ShieldCheck },
  { id: "learning", label: "Learning preferences", icon: BookOpen },
  { id: "security", label: "Security", icon: LockKeyhole },
  { id: "achievements", label: "Certificates & achievements", icon: Award },
  {
    id: "assessment",
    label: "Assessment preferences",
    icon: SlidersHorizontal,
  },
  { id: "data", label: "Data & account", icon: Download },
];

const labels: Record<string, string> = {
  email_enabled: "Email notifications",
  push_enabled: "Push notifications",
  in_app_enabled: "In-app notifications",
  course_updates: "Course updates",
  lesson_reminders: "Lesson reminders",
  quiz_reminders: "Quiz reminders",
  assessment_results: "Assessment results",
  certificate_issued: "Certificate issued",
  achievement_unlocked: "Achievement unlocked",
  course_completion: "Course completion",
  security_alerts: "Security alerts",
  marketing: "Product updates and marketing",
  show_learning_activity: "Show learning activity",
  show_achievements: "Show achievements",
  show_certificates: "Show certificates",
  show_course_progress: "Show course progress",
  allow_personalized_recommendations: "Personalized recommendations",
  allow_analytics: "Help improve HBT with analytics",
  autoplay_lessons: "Autoplay lessons",
  resume_last_position: "Resume where I left off",
  show_completed_lessons: "Show completed lessons",
  show_quiz_explanations: "Show quiz explanations",
  confirm_before_quiz_submit: "Confirm before submitting a quiz",
  show_timer: "Show assessment timer",
  confirm_before_submit: "Confirm before submitting",
  show_result_breakdown: "Show detailed result breakdown",
  email_result_notifications: "Email my assessment results",
};

export function SettingsPage() {
  const navigate = useNavigate();
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
          caught instanceof Error ? caught.message : "Unable to load settings.",
        ),
      );
  }, []);
  useEffect(() => {
    if (tab === "achievements" && !achievements)
      void settingsApi
        .achievements()
        .then(setAchievements)
        .catch(() => setError("Unable to load achievements."));
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
        setSettings((current) =>
          current
            ? { ...current, [key]: { ...current[key], ...updated } }
            : current,
        );
      setFeedback("Changes saved successfully.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save your changes.",
      );
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
      setFeedback("Profile updated successfully.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update profile.",
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
      setFeedback("Your data export is ready.");
    } catch {
      setError("Unable to prepare your data export.");
    }
  };

  return (
    <main className="min-h-full bg-[#F3F3F3]">
      <div className="mx-auto w-full max-w-[1320px] px-5 py-6 sm:px-8 sm:py-8">
        <header className="mb-6 rounded-3xl bg-[#3A3A3A] px-6 py-7 text-white shadow-[0_14px_38px_rgba(58,58,58,0.12)] sm:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">
            Your account
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Settings
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Control your profile, learning experience, privacy, and account
            security.
          </p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="h-fit rounded-3xl border border-[#3A3A3A]/8 bg-white p-3 shadow-[0_10px_30px_rgba(58,58,58,0.05)] lg:sticky lg:top-6">
            <div className="mb-2 flex items-center justify-between px-2 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/35">
                Settings menu
              </p>
              <span className="rounded-md bg-[#F47822]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#F47822]">
                {tabs.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:block lg:space-y-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-left text-xs font-semibold transition-all duration-200 ${tab === id ? "bg-[#F47822] text-white shadow-[0_7px_16px_rgba(244,120,34,.2)]" : "text-[#3A3A3A]/60 hover:bg-[#F47822]/6 hover:text-[#3A3A3A]"}`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${tab === id ? "bg-white/15 text-white" : "bg-[#3A3A3A]/5 text-[#3A3A3A]/45 group-hover:bg-[#F47822]/10 group-hover:text-[#F47822]"}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 leading-4">{label}</span>
                  {tab === id && (
                    <ChevronRight className="ml-auto hidden h-3.5 w-3.5 lg:block" />
                  )}
                </button>
              ))}
            </div>
          </aside>
          <section className="overflow-hidden rounded-3xl border border-[#3A3A3A]/8 bg-white shadow-[0_14px_34px_rgba(58,58,58,0.06)]">
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
                title="Notifications"
                description="Choose how HBT keeps you informed."
                group={settings?.notifications}
                onSave={(data) => save("notifications", data, "notifications")}
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
                title="Assessment preferences"
                description="Tailor how exams and results are presented."
                group={settings?.assessment}
                onSave={(data) => save("assessment", data, "assessment")}
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
  return (
    <div className="relative overflow-hidden border-b border-[#3A3A3A]/6 px-6 py-6 sm:px-8">
      <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[#F47822]/8 blur-2xl" />
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">
          Personalise your space
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-[#3A3A3A]">
          {title}
        </h2>
        <p className="mt-1.5 max-w-xl text-xs leading-5 text-[#3A3A3A]/55">
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
      className={`m-5 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600"}`}
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
  const fields = [
    ["first_name", "First name"],
    ["last_name", "Last name"],
    ["username", "Username"],
    ["phone", "Phone number"],
    ["country", "Country"],
  ] as const;
  return (
    <>
      <SectionHeader
        title="Profile"
        description="Keep your personal information current across HBT Learning."
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
          <Field label="Email address" value={email} disabled />
        </div>
        <div className="mt-5">
          <label className="mb-2 block text-xs font-semibold text-[#3A3A3A]">
            Bio
          </label>
          <textarea
            value={profile.bio}
            onChange={(event) =>
              setProfile((current) => ({ ...current, bio: event.target.value }))
            }
            maxLength={500}
            rows={4}
            className="w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3.5 py-3 text-sm outline-none focus:border-[#F47822]"
          />
        </div>
        <div className="mt-6 flex justify-end border-t border-[#3A3A3A]/6 pt-5">
          <button
            disabled={saving}
            className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save profile"}
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
    <label className="block text-xs font-semibold text-[#3A3A3A]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3.5 text-sm font-normal outline-none focus:border-[#F47822] disabled:cursor-not-allowed disabled:text-[#3A3A3A]/45"
      />
    </label>
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
  group?: SettingsGroup;
  onSave: (data: SettingsGroup) => Promise<void>;
}) {
  const [draft, setDraft] = useState<SettingsGroup>({});
  useEffect(() => setDraft(group ?? {}), [group]);
  const entries = Object.entries(draft).filter(
    ([key, value]) => typeof value === "boolean" && labels[key],
  );
  return (
    <>
      <SectionHeader title={title} description={description} />
      <div className="p-5 sm:p-7">
        <div className="space-y-3">
          {entries.map(([key, value]) => (
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
        <div className="mt-6 flex justify-end border-t border-[#3A3A3A]/6 pt-5">
          <button
            onClick={() => void onSave(draft)}
            className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white"
          >
            Save preferences
          </button>
        </div>
      </div>
    </>
  );
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 transition ${checked ? "border-[#F47822]/20 bg-[#F47822]/[.035]" : "border-[#3A3A3A]/8 bg-[#FAFAFA] hover:border-[#3A3A3A]/15"}`}
    >
      <span className="text-sm font-semibold text-[#3A3A3A]">{label}</span>
      <span
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[#F47822]" : "bg-[#3A3A3A]/15"}`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${checked ? "left-6" : "left-1"}`}
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
  const [appearance, setAppearance] = useState("system");
  useEffect(
    () => setAppearance(String(group?.appearance ?? "system")),
    [group],
  );
  return (
    <>
      <SectionHeader
        title="Appearance"
        description="Make the learning space comfortable for you."
      />
      <div className="p-5 sm:p-7">
        <p className="text-xs font-semibold text-[#3A3A3A]">Color preference</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {["system", "light", "dark"].map((option) => (
            <button
              key={option}
              onClick={() => setAppearance(option)}
              className={`rounded-xl border px-4 py-4 text-sm font-semibold capitalize ${appearance === option ? "border-[#F47822] bg-[#F47822]/8 text-[#F47822]" : "border-[#3A3A3A]/10 text-[#3A3A3A]/55"}`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => void onSave({ appearance })}
            className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white"
          >
            Save appearance
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
  const [draft, setDraft] = useState<SettingsGroup>({});
  useEffect(() => setDraft(group ?? {}), [group]);
  return (
    <>
      <SectionHeader
        title="Privacy"
        description="Decide what you share and how HBT personalizes your experience."
      />
      <div className="p-5 sm:p-7">
        <label className="text-xs font-semibold text-[#3A3A3A]">
          Profile visibility
          <select
            value={String(draft.profile_visibility ?? "private")}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                profile_visibility: event.target.value,
              }))
            }
            className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 text-sm"
          >
            <option value="private">Private</option>
            <option value="connections">Connections</option>
            <option value="public">Public</option>
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
            onClick={() => void onSave(draft)}
            className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white"
          >
            Save privacy
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
  const [draft, setDraft] = useState<SettingsGroup>({});
  useEffect(() => setDraft(group ?? {}), [group]);
  return (
    <>
      <SectionHeader
        title="Learning preferences"
        description="Personalize your daily learning rhythm and lesson experience."
      />
      <div className="p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Daily goal (minutes)"
            value={String(draft.daily_learning_goal_minutes ?? 30)}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                daily_learning_goal_minutes: Number(value),
              }))
            }
          />
          <Field
            label="Weekly goal (minutes)"
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
            onClick={() => void onSave(draft)}
            className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white"
          >
            Save learning preferences
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
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [code, setCode] = useState("");
  const [twoFactorMethod, setTwoFactorMethod] = useState<"email" | "phone">("email");
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
      .catch(() => setError("Unable to load all security details."));
  };
  useEffect(load, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isStrongPassword(password))
      return setError("Please meet all password requirements.");
    if (password !== confirmation) return setError("Passwords do not match.");
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
        caught instanceof Error ? caught.message : "Unable to update password.",
      );
    }
  };
  const enable = async () => {
    try {
      await settingsApi.enableTwoFactor(twoFactorMethod);
      setMessage(`We sent a 6-digit code to your ${twoFactorMethod === "phone" ? "phone number" : "verified email"}.`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to begin two-factor setup.",
      );
    }
  };
  const verify = async () => {
    try {
      const next = await settingsApi.verifyTwoFactor(code, twoFactorMethod);
      setSecurity(next);
      setCode("");
      setMessage("Two-factor authentication is now enabled.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "That code could not be verified.",
      );
    }
  };
  const disable = async () => {
    try {
      const next = await settingsApi.disableTwoFactor();
      setSecurity(next);
      setMessage("Two-factor authentication is disabled.");
    } catch {
      setError("Unable to disable two-factor authentication.");
    }
  };
  return (
    <>
      <SectionHeader
        title="Security"
        description="Manage your password, trusted sessions, sign-in history, and two-factor authentication."
      />
      <div className="space-y-7 p-5 sm:p-7">
        <section className="relative overflow-hidden rounded-3xl border border-[#F47822]/15 bg-white p-5 shadow-[0_10px_28px_rgba(58,58,58,.04)] sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#F47822]/10 blur-3xl" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F47822]/10 text-[#F47822]"><ShieldCheck className="h-5 w-5" /></div><div>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">Account protection</p><h3 className="mt-1 font-bold text-[#3A3A3A]">Two-factor authentication</h3>
              <p className="mt-1 text-xs text-[#3A3A3A]/55">
                Choose email or SMS delivery for your sign-in verification code.
              </p>
            </div></div>
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${security?.two_factor_enabled ? "bg-emerald-100 text-emerald-700" : "bg-[#3A3A3A]/8 text-[#3A3A3A]/50"}`}
            >
              {security?.two_factor_enabled ? "Enabled" : "Not enabled"}
            </span>
          </div>
          {security?.two_factor_enabled ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50/70 p-4"><p className="flex items-center gap-2 text-xs font-semibold text-emerald-800"><Check className="h-4 w-4" />Protected with {String(security.two_factor_method ?? "email") === "phone" ? "SMS" : "email"} verification</p><button onClick={() => void disable()} className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50">Disable</button></div>
          ) : (
            <div className="mt-5">
              {message?.includes("6-digit") ? (
                <div className="rounded-2xl border border-[#F47822]/15 bg-[#F47822]/[.035] p-4"><p className="text-xs font-semibold text-[#3A3A3A]">Enter the six-digit code we sent to your {twoFactorMethod === "phone" ? "phone" : "email"}.</p><div className="mt-3 flex flex-wrap items-end gap-3"><Field label="Verification code" value={code} onChange={setCode}/><button onClick={() => void verify()} className="h-11 rounded-xl bg-[#F47822] px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(244,120,34,.2)]">Verify and enable</button></div></div>
              ) : (
                <><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setTwoFactorMethod("email")} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${twoFactorMethod === "email" ? "border-[#F47822] bg-[#F47822]/[.045]" : "border-[#3A3A3A]/10 hover:border-[#F47822]/35"}`}><Mail className="h-5 w-5 text-[#F47822]"/><span><span className="block text-xs font-bold text-[#3A3A3A]">Email code</span><span className="mt-0.5 block text-[10px] text-[#3A3A3A]/45">Use your verified email</span></span></button><button type="button" onClick={() => setTwoFactorMethod("phone")} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${twoFactorMethod === "phone" ? "border-[#F47822] bg-[#F47822]/[.045]" : "border-[#3A3A3A]/10 hover:border-[#F47822]/35"}`}><Smartphone className="h-5 w-5 text-[#F47822]"/><span><span className="block text-xs font-bold text-[#3A3A3A]">SMS code</span><span className="mt-0.5 block text-[10px] text-[#3A3A3A]/45">Use your saved phone number</span></span></button></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] leading-4 text-[#3A3A3A]/45">{twoFactorMethod === "phone" ? "SMS requires a valid phone number and configured SMS provider." : "Email codes are sent to your verified account address."}</p><button onClick={() => void enable()} className="rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_18px_rgba(244,120,34,.2)]">Send verification code</button></div></>
              )}
            </div>
          )}
        </section>
        {message && (
          <p className="text-xs font-semibold text-emerald-700">{message}</p>
        )}
        {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#3A3A3A]">Active sessions</h3>
              <p className="mt-1 text-xs text-[#3A3A3A]/50">
                Devices that are currently signed in to your account.
              </p>
            </div>
            <button
              onClick={() => void settingsApi.revokeOtherSessions().then(load)}
              className="text-xs font-bold text-[#F47822]"
            >
              Sign out other devices
            </button>
          </div>
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#3A3A3A]/8 p-3.5"
              >
                <div>
                  <p className="text-sm font-semibold text-[#3A3A3A]">
                    {session.device_name || session.browser || "Unknown device"}{" "}
                    {session.is_current && (
                      <span className="ml-2 text-[10px] text-emerald-600">
                        CURRENT
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[11px] text-[#3A3A3A]/45">
                    {session.platform} · {session.ip_address} · active{" "}
                    {session.last_activity_at
                      ? new Date(session.last_activity_at).toLocaleString()
                      : "recently"}
                  </p>
                </div>
                {!session.is_current && (
                  <button
                    onClick={() =>
                      void settingsApi.revokeSession(session.id).then(load)
                    }
                    className="text-xs font-bold text-red-600"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3 className="font-bold text-[#3A3A3A]">Login activity</h3>
          <p className="mt-1 text-xs text-[#3A3A3A]/50">
            Your latest sign-in and security events.
          </p>
          <div className="mt-3 space-y-2">
            {activity.length ? (
              activity.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-4 rounded-xl bg-[#FAFAFA] px-4 py-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-[#3A3A3A]">
                      {entry.event.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 text-[11px] text-[#3A3A3A]/45">
                      {entry.browser} · {entry.platform} · {entry.ip_address}
                    </p>
                  </div>
                  <div
                    className={`text-right text-[10px] font-bold ${entry.successful ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {entry.successful ? "SUCCESS" : "FAILED"}
                    <p className="mt-1 font-medium text-[#3A3A3A]/40">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-[#3A3A3A]/12 p-4 text-xs text-[#3A3A3A]/45">
                Your sign-in activity will appear here.
              </p>
            )}
          </div>
        </section>
        <form onSubmit={submit} className="border-t border-[#3A3A3A]/8 pt-7">
          <h3 className="font-bold text-[#3A3A3A]">Change password</h3>
          <div className="mt-4 space-y-4">
            <Field
              label="Current password"
              value={current}
              onChange={setCurrent}
            />
            <Field
              label="New password"
              value={password}
              onChange={setPassword}
            />
            <PasswordRequirements password={password} />
            <Field
              label="Confirm new password"
              value={confirmation}
              onChange={setConfirmation}
            />
          </div>
          <div className="mt-6 flex justify-end">
            <button className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white">
              Update password
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
function SecurityHistory() {
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
    <div className="border-t border-[#3A3A3A]/8 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#FAFAFA] p-4">
        <div>
          <p className="text-sm font-bold text-[#3A3A3A]">Need more history?</p>
          <p className="mt-1 text-xs text-[#3A3A3A]/50">
            The security overview shows your latest three sessions and sign-in
            events.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void show("sessions")}
            className="rounded-xl border border-[#F47822]/25 px-3 py-2 text-xs font-bold text-[#F47822]"
          >
            View all sessions
          </button>
          <button
            onClick={() => void show("activity")}
            className="rounded-xl bg-[#F47822] px-3 py-2 text-xs font-bold text-white"
          >
            View all activity
          </button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A3A]/55 p-4 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">
                  Security history
                </p>
                <h3 className="mt-1 text-xl font-bold text-[#3A3A3A]">
                  All{" "}
                  {open === "sessions" ? "active sessions" : "login activity"}
                </h3>
              </div>
              <button
                onClick={() => setOpen(null)}
                className="rounded-lg p-2 text-[#3A3A3A]/50 hover:bg-[#F3F3F3]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 space-y-2">
              {loading ? (
                <p className="text-sm text-[#3A3A3A]/50">Loading…</p>
              ) : items.length ? (
                items.map((item) => (
                  <div
                    key={String(item.id)}
                    className="rounded-xl border border-[#3A3A3A]/8 p-3 text-xs text-[#3A3A3A]/65"
                  >
                    <p className="font-bold text-[#3A3A3A]">
                      {String(
                        item.device_name ?? item.event ?? "Security event",
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
                <p className="text-sm text-[#3A3A3A]/50">No records found.</p>
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
  return (
    <>
      <SectionHeader
        title="Certificates & achievements"
        description="Your learning milestones, ready to celebrate and share."
      />
      <div className="p-5 sm:p-7">
        {!data ? (
          <p className="text-sm text-[#3A3A3A]/45">Loading achievements…</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(data.summary).map(([key, value]) => (
                <div key={key} className="rounded-xl bg-[#F47822]/6 p-4">
                  <p className="text-2xl font-bold text-[#3A3A3A]">{value}</p>
                  <p className="mt-1 text-[11px] font-semibold capitalize text-[#3A3A3A]/50">
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
                    className="flex items-center justify-between rounded-xl border border-[#3A3A3A]/8 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#3A3A3A]">
                        {certificate.course_title}
                      </p>
                      <p className="mt-1 text-[11px] text-[#3A3A3A]/45">
                        {certificate.certificate_number}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#F47822]" />
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-[#3A3A3A]/12 p-6 text-center text-sm text-[#3A3A3A]/45">
                  Complete a course assessment to earn your first certificate.
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
  return (
    <>
      <SectionHeader
        title="Data & account"
        description="Download your learning record or manage your account status."
      />
      <div className="space-y-5 p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#3A3A3A]/8 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-bold text-[#3A3A3A]">Export your data</h3>
            <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/50">
              Download a JSON copy of your profile, settings, certificates, and
              assessment history.
            </p>
          </div>
          <button
            onClick={onExport}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#F47822]/25 px-4 py-2.5 text-xs font-bold text-[#F47822] hover:bg-[#F47822]/5"
          >
            <Download className="h-4 w-4" />
            Export data
          </button>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
          <h3 className="font-bold text-red-700">Delete account</h3>
          <p className="mt-1 text-xs leading-5 text-red-700/70">
            Deleting your account removes access immediately. We will ask why
            you are leaving and require your password before confirming.
          </p>
          <button
            onClick={onDelete}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete my account
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
  const [reason, setReason] = useState("not_using");
  const [other, setOther] = useState("");
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const reasons = [
    ["not_using", "I no longer use the platform"],
    ["content", "The courses did not meet my needs"],
    ["technical", "I experienced technical problems"],
    ["privacy", "I have privacy concerns"],
    ["cost", "Cost or subscription concerns"],
    ["other", "Other reason"],
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
        caught instanceof Error ? caught.message : "Unable to delete account.",
      );
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A3A]/55 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-600">
              Account deletion
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#3A3A3A]">
              Before you go, can you tell us why?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#3A3A3A]/45 hover:bg-[#F3F3F3]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#3A3A3A]/55">
          Your feedback helps us make HBT Learning better. Your account will be
          deactivated immediately after confirmation.
        </p>
        <div className="mt-5 space-y-2">
          {reasons.map(([value, label]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${reason === value ? "border-[#F47822] bg-[#F47822]/5" : "border-[#3A3A3A]/10"}`}
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
            placeholder="Tell us more (optional but helpful)"
            className="mt-3 min-h-24 w-full rounded-xl border border-[#3A3A3A]/10 p-3 text-sm outline-none focus:border-[#F47822]"
          />
        )}
        <div className="mt-4">
          <Field
            label="Enter your current password to confirm"
            value={password}
            onChange={setPassword}
          />
        </div>
        <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#3A3A3A]/60">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-1 accent-red-600"
          />
          I understand that I will lose access to my learning dashboard and
          account.
        </label>
        {error && (
          <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#3A3A3A]/10 px-4 py-2.5 text-xs font-bold text-[#3A3A3A]/60"
          >
            Keep my account
          </button>
          <button
            disabled={!confirmed || !password || busy}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy ? "Deleting…" : "Permanently delete"}
          </button>
        </div>
      </form>
    </div>
  );
}
