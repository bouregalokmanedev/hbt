import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Award, Bell, BookOpen, Check, Download, Eye, LockKeyhole, Palette, ShieldCheck, SlidersHorizontal, Trash2, UserRound, X, GraduationCap, Users, Megaphone } from "lucide-react";
import { isStrongPassword, PasswordRequirements } from "@/features/auth/components/PasswordRequirements";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useUpdateProfile } from "@/features/auth/hooks/useUpdateProfile";
import { authStorage } from "@/lib/storage/auth-storage";
import { settingsApi, type SettingsGroup, type StudentSettings } from "@/features/settings/api/settings.api";
import { TwoFactorCard } from "@/features/settings/components/TwoFactorCard";

type Tab = "profile"|"teaching"|"notifications"|"privacy"|"security"|"appearance"|"data";
type ProfileDraft = { first_name:string; last_name:string; username:string; phone:string; country:string; bio:string; };

const tabDefs: Array<{ id: Tab; icon: typeof UserRound; labelKey: string; descKey: string }> = [
  { id: "profile", icon: UserRound, labelKey: "instructor.settings.tabs.profile", descKey: "instructor.settings.tabs.profileDesc" },
  { id: "teaching", icon: GraduationCap, labelKey: "instructor.settings.tabs.teaching", descKey: "instructor.settings.tabs.teachingDesc" },
  { id: "notifications", icon: Bell, labelKey: "instructor.settings.tabs.notifications", descKey: "instructor.settings.tabs.notificationsDesc" },
  { id: "privacy", icon: ShieldCheck, labelKey: "instructor.settings.tabs.privacy", descKey: "instructor.settings.tabs.privacyDesc" },
  { id: "appearance", icon: Palette, labelKey: "instructor.settings.tabs.appearance", descKey: "instructor.settings.tabs.appearanceDesc" },
  { id: "security", icon: LockKeyhole, labelKey: "instructor.settings.tabs.security", descKey: "instructor.settings.tabs.securityDesc" },
  { id: "data", icon: Download, labelKey: "instructor.settings.tabs.data", descKey: "instructor.settings.tabs.dataDesc" },
];

function useLabelsTop(): Record<string, string> {
  const { t } = useTranslation();
  return {
    email_enabled: t("settingsPage.toggles.email_enabled"),
    push_enabled: t("settingsPage.toggles.push_enabled"),
    in_app_enabled: t("settingsPage.toggles.in_app_enabled"),
    course_updates: t("settingsPage.toggles.course_updates"),
    lesson_reminders: t("settingsPage.toggles.lesson_reminders"),
    quiz_reminders: t("settingsPage.toggles.quiz_reminders"),
    assessment_results: t("settingsPage.toggles.assessment_results"),
    certificate_issued: t("settingsPage.toggles.certificate_issued"),
    achievement_unlocked: t("settingsPage.toggles.achievement_unlocked"),
    course_completion: t("settingsPage.toggles.course_completion"),
    security_alerts: t("settingsPage.toggles.security_alerts"),
    new_enrollment: t("instructor.settings.toggles.new_enrollment"),
    student_question: t("instructor.settings.toggles.student_question"),
    course_review_needed: t("instructor.settings.toggles.course_review_needed"),
    show_learning_activity: t("settingsPage.toggles.show_learning_activity"),
    show_achievements: t("settingsPage.toggles.show_achievements"),
    show_certificates: t("settingsPage.toggles.show_certificates"),
    show_course_progress: t("settingsPage.toggles.show_course_progress"),
    allow_personalized_recommendations: t("settingsPage.toggles.allow_personalized_recommendations"),
    send_read_receipts: t("settingsPage.toggles.send_read_receipts"),
    autoplay_lessons: t("settingsPage.toggles.autoplay_lessons"),
    resume_last_position: t("settingsPage.toggles.resume_last_position"),
  };
}

export function InstructorSettingsPage(){
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { updateProfile, isUpdating } = useUpdateProfile();
  const [tab, setTab] = useState<Tab>("profile");
  const [settings, setSettings] = useState<StudentSettings|null>(null);
  const [feedback, setFeedback] = useState<string|null>(null);
  const [error, setError] = useState<string|null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [profile, setProfile] = useState({ first_name: user?.first_name ?? "", last_name: user?.last_name ?? "", username: user?.username ?? "", phone: user?.phone ?? "", country: user?.country ?? "", bio: user?.bio ?? "" });

  useEffect(()=>{ void settingsApi.get().then(setSettings).catch(()=> setError(t("instructor.settings.notices.loadFail"))); },[t]);

  const save = async (path:string, data:SettingsGroup, key?: keyof StudentSettings)=>{
    try{ setFeedback(null); setError(null); const updated = await settingsApi.update(path, data); if(key) setSettings(c=> c? {...c, [key]: {...c[key], ...updated}}:c); setFeedback(t("instructor.settings.notices.saved")); }catch(e){ setError(e instanceof Error? e.message:t("instructor.settings.notices.saveFail")); }
  };
  const saveProfile = async (e:React.FormEvent)=>{ e.preventDefault(); try{ await updateProfile({...profile, phone: profile.phone||null, country: profile.country||null, bio: profile.bio||null}); setFeedback(t("instructor.settings.notices.profileUpdated")); }catch(e){ setError(e instanceof Error? e.message:t("instructor.settings.notices.profileFail")); } };

  const exportData = async ()=>{ try{ const data = await settingsApi.export(); const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"})); const a=document.createElement("a"); a.href=url; a.download="hbt-instructor-data.json"; a.click(); URL.revokeObjectURL(url); setFeedback(t("instructor.settings.notices.exportReady")); }catch{ setError(t("instructor.settings.notices.exportFail")); } };

  const tabs = tabDefs.map((def) => ({ ...def, label: t(def.labelKey), desc: t(def.descKey) }));

  return (
    <main className="min-h-full bg-[#F3F3F3]">
      <div className="mx-auto w-full max-w-[1320px] px-5 py-6 sm:px-8 sm:py-8">
        <header className="mb-6 rounded-3xl bg-[#3A3A3A] px-6 py-7 text-white shadow-[0_14px_38px_rgba(58,58,58,0.12)] sm:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F47822]">{t("instructor.settings.eyebrow")}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{t("instructor.settings.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">{t("instructor.settings.description")}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit rounded-3xl border border-[#3A3A3A]/8 bg-white p-3 shadow-[0_10px_30px_rgba(58,58,58,0.05)] lg:sticky lg:top-6">
            <div className="mb-2 flex items-center justify-between px-2 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3A3A3A]/35">{t("instructor.settings.menu")}</p>
              <span className="rounded-md bg-[#F47822]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#F47822]">{tabs.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:block lg:space-y-1">
              {tabs.map(({id,label,icon:Icon,desc})=> (
                <button key={id} onClick={()=>setTab(id)} className={`group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-left rtl:text-right transition-all duration-200 ${tab===id ? "bg-[#F47822] text-white shadow-[0_7px_16px_rgba(244,120,34,.2)]" : "text-[#3A3A3A]/60 hover:bg-[#F47822]/6 hover:text-[#3A3A3A]"}`}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${tab===id ? "bg-white/15 text-white" : "bg-[#3A3A3A]/5 text-[#3A3A3A]/45 group-hover:bg-[#F47822]/10 group-hover:text-[#F47822]"}`}><Icon className="h-3.5 w-3.5" /></span>
                  <span className="min-w-0"><span className="block text-xs font-semibold leading-none">{label}</span><span className={`hidden text-[10px] leading-none lg:block ${tab===id?"text-white/70":"text-[#3A3A3A]/40"}`}>{desc}</span></span>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-[#FFF8F4] p-3">
              <p className="text-[11px] font-semibold text-[#3A3A3A]">{t("instructor.settings.loungeTitle")}</p>
              <p className="mt-1 text-[11px] leading-4 text-[#3A3A3A]/50">{t("instructor.settings.loungeDesc")}</p>
              <a href="/instructor/lounge" className="mt-2 inline-flex text-xs font-bold text-[#F47822] hover:underline">{t("instructor.settings.loungeCta")}</a>
            </div>
          </aside>

          <section className="overflow-hidden rounded-3xl border border-[#3A3A3A]/8 bg-white shadow-[0_14px_34px_rgba(58,58,58,0.06)]">
            {feedback && <Notice tone="success" message={feedback} onClose={()=>setFeedback(null)} />}
            {error && <Notice tone="error" message={error} onClose={()=>setError(null)} />}

            {tab==="profile" && (
              <ProfileTab profile={profile} setProfile={setProfile} email={user?.email??""} onSubmit={saveProfile} saving={isUpdating} />
            )}
            {tab==="teaching" && (
              <TeachingTab group={settings?.learning} onSave={(d)=>save("learning", d, "learning")} />
            )}
            {tab==="notifications" && (
              <SwitchGroup title={t("instructor.settings.notificationsTab.title")} description={t("instructor.settings.notificationsTab.description")} group={settings?.notifications} onSave={(d)=>save("notifications", d, "notifications")} instructor />
            )}
            {tab==="privacy" && (
              <PrivacyTab group={settings?.privacy} onSave={(d)=>save("privacy", d, "privacy")} />
            )}
            {tab==="appearance" && (
              <AppearanceTab group={settings?.appearance} onSave={(d)=>save("appearance", d, "appearance")} />
            )}
            {tab==="security" && (
              <SecurityTab onSaved={(msg)=>setFeedback(msg)} />
            )}
            {tab==="data" && (
              <DataTab onExport={exportData} onDelete={()=>setDeleteOpen(true)} />
            )}
          </section>
        </div>
      </div>
      {deleteOpen && <DeleteModal onClose={()=>setDeleteOpen(false)} onDeleted={async()=>{ authStorage.clearToken(); await logout(); navigate("/login",{replace:true}); }} />}
    </main>
  );
}

function Notice({tone,message,onClose}:{tone:"success"|"error"; message:string; onClose:()=>void}){
  return <div className={`m-5 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${tone==="success"?"border-emerald-200 bg-emerald-50 text-emerald-700":"border-red-200 bg-red-50 text-red-600"}`}><span>{message}</span><button onClick={onClose} className="rounded-lg p-1 hover:bg-black/5"><X className="h-4 w-4" /></button></div>;
}
function ProfileTab({profile,setProfile,email,onSubmit,saving}:{profile:{first_name:string;last_name:string;username:string;phone:string;country:string;bio:string}; setProfile: React.Dispatch<React.SetStateAction<{first_name:string;last_name:string;username:string;phone:string;country:string;bio:string}>>; email:string; onSubmit:(e:React.FormEvent)=>void; saving:boolean}){
  const { t } = useTranslation();
  const fields: Array<[keyof typeof profile,string]> = [["first_name",t("instructor.settings.profileTab.firstName")],["last_name",t("instructor.settings.profileTab.lastName")],["username",t("instructor.settings.profileTab.username")],["phone",t("instructor.settings.profileTab.phone")],["country",t("instructor.settings.profileTab.country")]];
  return (
    <>
      <Header title={t("instructor.settings.profileTab.title")} description={t("instructor.settings.profileTab.description")} />
      <form onSubmit={onSubmit} className="p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map(([k,label])=> (
            <label key={k} className="block text-xs font-semibold text-[#3A3A3A]">{label}<input value={profile[k]} onChange={e=>setProfile(c=>({...c,[k]:e.target.value}))} className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3.5 text-sm outline-none focus:border-[#F47822]" /></label>
          ))}
          <label className="block text-xs font-semibold text-[#3A3A3A]">{t("instructor.settings.profileTab.email")}<input value={email} disabled className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3.5 text-sm text-[#3A3A3A]/45" /></label>
        </div>
        <label className="mt-5 block text-xs font-semibold text-[#3A3A3A]">{t("instructor.settings.profileTab.bio")}<textarea value={profile.bio} onChange={e=>setProfile(c=>({...c,bio:e.target.value}))} maxLength={500} rows={4} placeholder={t("instructor.settings.profileTab.bioPh")} className="mt-2 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3.5 py-3 text-sm outline-none focus:border-[#F47822]" /></label>
        <div className="mt-6 flex justify-end border-t border-[#3A3A3A]/6 pt-5"><button disabled={saving} className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60">{saving?t("instructor.settings.profileTab.saving"):t("instructor.settings.profileTab.save")}</button></div>
      </form>
    </>
  );
}
function TeachingTab({group,onSave}:{group?: Record<string, unknown>; onSave:(d:Record<string,unknown>)=>Promise<void>}){
  const { t } = useTranslation();
  const [draft,setDraft]=useState<Record<string,unknown>>({});
  useEffect(()=> setDraft(group ?? {}),[group]);
  return (
    <>
      <Header title={t("instructor.settings.teachingTab.title")} description={t("instructor.settings.teachingTab.description")} />
      <div className="p-5 sm:p-7">
        <div className="space-y-3">
          <Toggle label={t("instructor.settings.teachingTab.enrollmentAlerts")} checked={Boolean(draft.course_updates)} onChange={c=>setDraft(s=>({...s,course_updates:c}))} />
          <Toggle label={t("instructor.settings.teachingTab.questionAlerts")} checked={Boolean((draft as Record<string,unknown>).student_question ?? true)} onChange={c=>setDraft(s=>({...s,student_question:c}))} />
          <Toggle label={t("instructor.settings.teachingTab.publishAlerts")} checked={Boolean((draft as Record<string,unknown>).course_published ?? true)} onChange={c=>setDraft(s=>({...s,course_published:c}))} />
        </div>
        <div className="mt-6 flex justify-end"><button onClick={()=>void onSave(draft)} className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white">{t("instructor.settings.teachingTab.save")}</button></div>
      </div>
    </>
  );
}
function SwitchGroup({title,description,group,onSave,instructor}:{title:string; description:string; group?: Record<string,unknown>; onSave:(d:Record<string,unknown>)=>Promise<void>; instructor?:boolean}){
  const { t } = useTranslation();
  const labelsTop = useLabelsTop();
  const [draft,setDraft]=useState<Record<string,unknown>>({});
  useEffect(()=> setDraft(group ?? {}),[group]);
  const entries = Object.entries(draft).filter(([k,v])=> typeof v==="boolean" && labelsTop[k]);
  return (
    <>
      <Header title={title} description={description} />
      <div className="p-5 sm:p-7">
        <div className="space-y-3">
          {entries.map(([k,v])=> (
            <Toggle key={k} label={labelsTop[k]} checked={Boolean(v)} onChange={c=>setDraft(cur=>({...cur,[k]:c}))} />
          ))}
          {instructor && <p className="text-[11px] text-[#3A3A3A]/40">{t("instructor.settings.notificationsTab.note")}</p>}
        </div>
        <div className="mt-6 flex justify-end"><button onClick={()=>void onSave(draft)} className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white">{t("instructor.settings.notificationsTab.save")}</button></div>
      </div>
    </>
  );
}
function PrivacyTab({group,onSave}:{group?: Record<string,unknown>; onSave:(d:Record<string,unknown>)=>Promise<void>}){
  const { t } = useTranslation();
  const labelsTop = useLabelsTop();
  const [draft,setDraft]=useState<Record<string,unknown>>({});
  useEffect(()=> setDraft(group ?? {}),[group]);
  return (
    <>
      <Header title={t("instructor.settings.privacyTab.title")} description={t("instructor.settings.privacyTab.description")} />
      <div className="p-5 sm:p-7">
        <label className="text-xs font-semibold text-[#3A3A3A]">{t("instructor.settings.privacyTab.visibility")}
          <select value={String((draft as Record<string,unknown>).profile_visibility ?? "public")} onChange={e=>setDraft(c=>({...c,profile_visibility:e.target.value}))} className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3 text-sm">
            <option value="public">{t("instructor.settings.privacyTab.public")}</option><option value="connections">{t("instructor.settings.privacyTab.connections")}</option><option value="private">{t("instructor.settings.privacyTab.private")}</option>
          </select>
        </label>
        <div className="mt-5 space-y-3">
          {Object.entries(draft).filter(([k,v])=> typeof v==="boolean" && labelsTop[k]).map(([k,v])=> (
            <Toggle key={k} label={labelsTop[k]} checked={Boolean(v)} onChange={c=>setDraft(cur=>({...cur,[k]:c}))} />
          ))}
        </div>
        <div className="mt-6 flex justify-end"><button onClick={()=>void onSave(draft)} className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white">{t("instructor.settings.privacyTab.save")}</button></div>
      </div>
    </>
  );
}
function AppearanceTab({group,onSave}:{group?: Record<string,unknown>; onSave:(d:Record<string,unknown>)=>Promise<void>}){
  const { t } = useTranslation();
  const [appearance,setAppearance]=useState("system");
  useEffect(()=> setAppearance(String((group as Record<string,unknown>)?.appearance ?? "system")),[group]);
  const options = [
    { id: "system", label: t("instructor.settings.appearanceTab.system") },
    { id: "light", label: t("instructor.settings.appearanceTab.light") },
    { id: "dark", label: t("instructor.settings.appearanceTab.dark") },
  ];
  return (
    <>
      <Header title={t("instructor.settings.appearanceTab.title")} description={t("instructor.settings.appearanceTab.description")} />
      <div className="p-5 sm:p-7">
        <p className="text-xs font-semibold text-[#3A3A3A]">{t("instructor.settings.appearanceTab.colorPref")}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {options.map(o=> (
            <button key={o.id} onClick={()=>setAppearance(o.id)} className={`rounded-xl border px-4 py-4 text-sm font-semibold capitalize ${appearance===o.id?"border-[#F47822] bg-[#F47822]/8 text-[#F47822]":"border-[#3A3A3A]/10 text-[#3A3A3A]/55"}`}>{o.label}</button>
          ))}
        </div>
        <div className="mt-6 flex justify-end"><button onClick={()=>void onSave({appearance})} className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white">{t("instructor.settings.appearanceTab.save")}</button></div>
      </div>
    </>
  );
}
function SecurityTab({onSaved}:{onSaved:(msg:string)=>void}){
  const { t } = useTranslation();
  const [current,setCurrent]=useState(""); const [password,setPassword]=useState(""); const [confirmation,setConfirmation]=useState(""); const [error,setError]=useState<string|null>(null);
  const submit = async (e:React.FormEvent)=>{ e.preventDefault(); if(!isStrongPassword(password)) return setError(t("instructor.settings.securityTab.weakPassword")); if(password!==confirmation) return setError(t("instructor.settings.securityTab.mismatch")); try{ await settingsApi.changePassword({current_password:current,password,password_confirmation:confirmation}); setCurrent(""); setPassword(""); setConfirmation(""); setError(null); onSaved(t("instructor.settings.securityTab.updated")); }catch(err){ setError(err instanceof Error? err.message:t("instructor.settings.securityTab.updateFail")); } };
  return (
    <>
      <Header title={t("instructor.settings.securityTab.title")} description={t("instructor.settings.securityTab.description")} />
      <div className="space-y-7 p-5 sm:p-7">
        <TwoFactorCard />
        <form onSubmit={submit} className="space-y-4 border-t border-[#3A3A3A]/6 pt-6">
          <h3 className="font-bold text-[#3A3A3A]">{t("instructor.settings.securityTab.changePassword")}</h3>
          <Field label={t("instructor.settings.securityTab.currentPassword")} value={current} onChange={setCurrent} />
          <Field label={t("instructor.settings.securityTab.newPassword")} value={password} onChange={setPassword} />
          <PasswordRequirements password={password} />
          <Field label={t("instructor.settings.securityTab.confirmPassword")} value={confirmation} onChange={setConfirmation} />
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
          <div className="flex justify-end"><button className="rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-bold text-white">{t("instructor.settings.securityTab.update")}</button></div>
        </form>
      </div>
    </>
  );
}
function DataTab({onExport,onDelete}:{onExport:()=>void; onDelete:()=>void}){
  const { t } = useTranslation();
  return (
    <>
      <Header title={t("instructor.settings.dataTab.title")} description={t("instructor.settings.dataTab.description")} />
      <div className="space-y-5 p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#3A3A3A]/8 p-5 sm:flex-row sm:items-center">
          <div><h3 className="font-bold text-[#3A3A3A]">{t("instructor.settings.dataTab.exportTitle")}</h3><p className="mt-1 text-xs leading-5 text-[#3A3A3A]/50">{t("instructor.settings.dataTab.exportDesc")}</p></div>
          <button onClick={onExport} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#F47822]/25 px-4 py-2.5 text-xs font-bold text-[#F47822] hover:bg-[#F47822]/5"><Download className="h-4 w-4" />{t("instructor.settings.dataTab.exportBtn")}</button>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5">
          <h3 className="font-bold text-red-700">{t("instructor.settings.dataTab.deleteTitle")}</h3><p className="mt-1 text-xs leading-5 text-red-700/70">{t("instructor.settings.dataTab.deleteDesc")}</p>
          <button onClick={onDelete} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700"><Trash2 className="h-4 w-4" />{t("instructor.settings.dataTab.deleteBtn")}</button>
        </div>
      </div>
    </>
  );
}
function Header({title,description}:{title:string;description:string}){
  const { t } = useTranslation();
  return (
    <div className="relative overflow-hidden border-b border-[#3A3A3A]/6 px-6 py-6 sm:px-8">
      <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[#F47822]/8 blur-2xl rtl:-left-10 rtl:right-auto" />
      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#F47822]">{t("instructor.settings.controlsEyebrow")}</p>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-[#3A3A3A]">{title}</h2>
      <p className="mt-1.5 max-w-xl text-xs leading-5 text-[#3A3A3A]/55">{description}</p>
    </div>
  );
}
function Field({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){
  return <label className="block text-xs font-semibold text-[#3A3A3A]">{label}<input value={value} onChange={e=>onChange(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#3A3A3A]/10 bg-[#FAFAFA] px-3.5 text-sm outline-none focus:border-[#F47822]" /></label>;
}
function Toggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(c:boolean)=>void}){
  return (
    <label className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 transition ${checked ? "border-[#F47822]/20 bg-[#F47822]/[.035]" : "border-[#3A3A3A]/8 bg-[#FAFAFA]"}`}>
      <span className="text-sm font-semibold text-[#3A3A3A]">{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked?"bg-[#F47822]":"bg-[#3A3A3A]/15"}`}><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} className="peer absolute inset-0 opacity-0" /><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${checked?"left-6 rtl:left-1 rtl:right-6":"left-1 rtl:left-auto rtl:right-1"}`} /></span>
    </label>
  );
}
function DeleteModal({onClose,onDeleted}:{onClose:()=>void; onDeleted:()=>Promise<void>}){
  const { t } = useTranslation();
  const [reason,setReason]=useState("not_using"); const [other,setOther]=useState(""); const [password,setPassword]=useState(""); const [confirmed,setConfirmed]=useState(false); const [error,setError]=useState<string|null>(null); const [busy,setBusy]=useState(false);
  const reasons = [
    ["not_using", t("instructor.settings.deleteModal.reasons.not_using")],
    ["content", t("instructor.settings.deleteModal.reasons.content")],
    ["technical", t("instructor.settings.deleteModal.reasons.technical")],
    ["privacy", t("instructor.settings.deleteModal.reasons.privacy")],
    ["cost", t("instructor.settings.deleteModal.reasons.cost")],
    ["other", t("instructor.settings.deleteModal.reasons.other")],
  ] as Array<[string, string]>;
  const submit = async (e:React.FormEvent)=>{ e.preventDefault(); try{ setBusy(true); await settingsApi.deleteAccount({reason, other_reason:other||undefined, current_password:password, confirm_deletion:confirmed}); await onDeleted(); }catch(err){ setError(err instanceof Error? err.message:t("instructor.settings.deleteModal.fail")); setBusy(false); } };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A3A]/55 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-600">{t("instructor.settings.deleteModal.tag")}</p><h2 className="mt-1 text-xl font-bold text-[#3A3A3A]">{t("instructor.settings.deleteModal.title")}</h2></div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#3A3A3A]/45 hover:bg-[#F3F3F3]"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5 space-y-2">
          {reasons.map(([v,l])=> (
            <label key={v} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${reason===v?"border-[#F47822] bg-[#F47822]/5":"border-[#3A3A3A]/10"}`}><input type="radio" checked={reason===v} onChange={()=>setReason(v)} />{l}</label>
          ))}
        </div>
        {reason==="other" && <textarea value={other} onChange={e=>setOther(e.target.value)} placeholder={t("instructor.settings.deleteModal.otherPh")} className="mt-3 min-h-24 w-full rounded-xl border border-[#3A3A3A]/10 p-3 text-sm outline-none focus:border-[#F47822]" />}
        <Field label={t("instructor.settings.deleteModal.passwordLabel")} value={password} onChange={setPassword} />
        <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#3A3A3A]/60"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} className="mt-1 accent-red-600" />{t("instructor.settings.deleteModal.confirm")}</label>
        {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-[#3A3A3A]/10 px-4 py-2.5 text-xs font-bold text-[#3A3A3A]/60">{t("instructor.settings.deleteModal.keep")}</button><button disabled={!confirmed || !password || busy} className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{busy?t("instructor.settings.deleteModal.deleting"):t("instructor.settings.deleteModal.delete")}</button></div>
      </form>
    </div>
  );
}
