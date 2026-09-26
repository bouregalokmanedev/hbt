import { useEffect, useState } from "react";
import { Check, X, ShieldCheck, Users, Activity, BookOpen, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAuthStore } from "@/features/auth";
import { authApi } from "@/features/auth/api/auth.api";
import { UserAvatar } from "@/components/ui";
import { ProfileHeader } from "@/features/profile/components/ProfileHeader";
import { ProfileInformation } from "@/features/profile/components/ProfileInformation";
import { adminApi } from "@/features/admin/api/adminApi";
import type { ProfileFormData } from "@/features/profile/pages/ProfilePage";

function createFormData(user: NonNullable<ReturnType<typeof useAuth>["user"]>): ProfileFormData {
  const rawPhone = user.phone ?? "";
  let phoneCountryCode = "+213";
  let phoneNumber = "";
  const normalizedPhone = rawPhone.replace(/\s/g, "").replace(/\+/g, "+");
  const countryCodes = ["+213","+33","+39","+44","+49","+34","+1","+971","+966","+90","+20","+212","+216","+218","+222","+221","+225","+234","+27","+91","+86","+81","+82","+61","+55","+52","+7"];
  const matched = countryCodes.sort((a,b)=>b.length-a.length).find(c=> normalizedPhone.startsWith(c));
  if (matched) { phoneCountryCode = matched; phoneNumber = normalizedPhone.slice(matched.length).replace(/^\+/,""); }
  else { phoneNumber = normalizedPhone.replace(/\D/g,""); }
  return {
    avatar: user.avatar ?? null,
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    username: user.username ?? "",
    phone: phoneNumber,
    phone_country_code: phoneCountryCode,
    country: user.country ?? "",
    bio: user.bio ?? "",
    language: user.language ?? "en",
    timezone: user.timezone ?? "UTC",
  };
}

export function AdminProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const updateProfile = useAuthStore((s)=>s.updateProfile);
  const updateUser = useAuthStore((s)=>s.updateUser);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string|null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [form, setForm] = useState<ProfileFormData|null>(null);
  const [stats, setStats] = useState<{ users:number; pendingReviews:number; activeSessions:number } | null>(null);

  const isSuperAdmin = user?.roles?.includes("Super Admin") ?? false;

  useEffect(()=>{ if(user && !isEditing) setForm(createFormData(user)); },[user, isEditing]);
  useEffect(()=>{
    void adminApi.dashboard().then(d=>{
      setStats({
        users: d.statistics.users.total,
        pendingReviews: d.statistics.courses.review,
        activeSessions: d.statistics.users.active,
      });
    }).catch(()=> setStats(null));
  },[]);

  if(!user || !form) return null;

  const handleEdit = ()=>{ setForm(createFormData(user)); setSaveError(null); setSaveSuccess(false); setIsEditing(true); };
  const handleCancel = ()=>{ setForm(createFormData(user)); setSaveError(null); setSaveSuccess(false); setIsEditing(false); };
  const updateField = <K extends keyof ProfileFormData>(field:K, value:ProfileFormData[K])=> setForm(c=> c? {...c,[field]:value}:c);
  const handleAvatarChange = async (avatar: string | null) => {
    setSaveError(null);
    setSaveSuccess(false);
    setForm(c=> c? {...c, avatar}:c);
    try{
      const updated = await authApi.updateProfile({
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username ?? "",
        phone: user.phone ?? null,
        country: user.country ?? null,
        bio: user.bio ?? null,
        avatar,
        language: user.language ?? "en",
        timezone: user.timezone ?? "UTC",
      });
      updateUser(updated);
    }catch(e){
      setSaveError(e instanceof Error? e.message:t("admin.profile.saveFallback"));
      setForm(c=> c? {...c, avatar: user.avatar ?? null}:c);
    }
  };

  const handleSave = async ()=>{
    if(isSaving) return;
    setIsSaving(true); setSaveError(null); setSaveSuccess(false);
    try{
      const clean = form.phone.replace(/\D/g,"");
      const fullPhone = clean ? `${form.phone_country_code}${clean}` : null;
      await updateProfile({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        phone: fullPhone,
        country: form.country || null,
        bio: form.bio.trim() || null,
        avatar: form.avatar || null,
        language: form.language,
        timezone: form.timezone,
      });
      setSaveSuccess(true); setIsEditing(false);
      setTimeout(()=>setSaveSuccess(false),3000);
    }catch(e){ setSaveError(e instanceof Error? e.message:t("admin.profile.saveFallback")); }
    finally{ setIsSaving(false); }
  };

  return (
    <main className="min-h-full bg-[#F3F3F3]">
      {saveSuccess && (
        <div className="fixed right-5 top-5 z-[99999] w-[calc(100%-40px)] max-w-[400px] animate-[profileToastIn_0.3s_ease-out] rtl:left-5 rtl:right-auto">
          <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
            <div className="flex items-start gap-3 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"><Check className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#3A3A3A]">{t("admin.profile.updatedTitle")}</p><p className="mt-1 text-xs leading-5 text-[#3A3A3A]/55">{t("admin.profile.updatedDesc")}</p></div>
              <button type="button" aria-label={t("admin.profile.dismiss")} onClick={()=>setSaveSuccess(false)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#3A3A3A]/30 hover:bg-[#3A3A3A]/5"><X className="h-4 w-4" /></button>
            </div>
            <div className="h-1 w-full bg-emerald-500/10"><div className="h-full w-full origin-left bg-emerald-500 animate-[profileToastProgress_3s_linear_forwards] rtl:origin-right" /></div>
          </div>
        </div>
      )}
      {saveError && (
        <div className="fixed right-5 top-5 z-[99999] w-[calc(100%-40px)] max-w-[400px] animate-[profileToastIn_0.3s_ease-out] rtl:left-5 rtl:right-auto">
          <div className="overflow-hidden rounded-2xl border border-red-500/20 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
            <div className="flex items-start gap-3 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500"><X className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#3A3A3A]">{t("admin.profile.saveErrorTitle")}</p><p className="mt-1 text-xs leading-5 text-[#3A3A3A]/55">{saveError}</p></div>
              <button type="button" aria-label={t("admin.profile.dismiss")} onClick={()=>setSaveError(null)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#3A3A3A]/30 hover:bg-[#3A3A3A]/5"><X className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="space-y-5">
          <ProfileHeader user={user} isEditing={isEditing} onEdit={handleEdit} onAvatarChange={handleAvatarChange} avatar={form.avatar} />

          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${isSuperAdmin ? "bg-[#F47822] text-white" : "bg-[#3A3A3A] text-white"}`}>
              <ShieldCheck className="h-3.5 w-3.5" /> {isSuperAdmin ? t("admin.profile.roleSuper") : t("admin.profile.roleAdmin")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3A3A3A]/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#3A3A3A]/60">
              {user.email} · {user.roles?.join(" · ")}
            </span>
          </div>

          <section className="grid gap-3 sm:grid-cols-3">
            <StatCard icon={Users} label={t("admin.profile.stats.accounts")} value={stats?.users ?? "—"} hint={t("admin.profile.stats.accountsHint")} />
            <StatCard icon={AlertTriangle} label={t("admin.profile.stats.queue")} value={stats?.pendingReviews ?? "—"} hint={t("admin.profile.stats.queueHint")} />
            <StatCard icon={Activity} label={t("admin.profile.stats.active")} value={stats?.activeSessions ?? "—"} hint={t("admin.profile.stats.activeHint")} />
          </section>

          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <ProfileInformation user={user} form={form} isEditing={isEditing} isSaving={isSaving} onEdit={handleEdit} onCancel={handleCancel} onSave={handleSave} onFieldChange={updateField} />

              <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,0.05)] sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]"><BookOpenIcon /></span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("admin.profile.scope.eyebrow")}</p>
                    <h3 className="text-sm font-semibold text-[#3A3A3A]">{isSuperAdmin ? t("admin.profile.scope.titleSuper") : t("admin.profile.scope.titleAdmin")}</h3>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-[#FAFAFA] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/40">{t("admin.profile.scope.canDo")}</p><p className="mt-1 text-xs leading-5 text-[#3A3A3A]/65">{isSuperAdmin ? t("admin.profile.scope.canDoSuper") : t("admin.profile.scope.canDoAdmin")}</p></div>
                  <div className="rounded-xl bg-[#FAFAFA] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/40">{t("admin.profile.scope.cannotDo")}</p><p className="mt-1 text-xs leading-5 text-[#3A3A3A]/65">{isSuperAdmin ? t("admin.profile.scope.cannotSuper") : t("admin.profile.scope.cannotAdmin")}</p></div>
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-2xl border border-[#F47822]/15 bg-[#FFF8F4] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("admin.profile.card.eyebrow")}</p>
                <h3 className="mt-1 text-sm font-bold text-[#3A3A3A]">{t("admin.profile.card.title")}</h3>
                <div className="mt-4 flex items-center gap-3">
                  <UserAvatar user={user} className="h-12 w-12" fallbackClassName="bg-[#3A3A3A] text-white font-bold" />
                  <div><p className="text-sm font-bold text-[#3A3A3A]">{user.first_name} {user.last_name}</p><p className="text-xs text-[#3A3A3A]/50">@{user.username} · {isSuperAdmin ? t("admin.profile.card.superLabel") : t("admin.profile.card.adminLabel")}</p></div>
                </div>
                <p className="mt-3 line-clamp-3 text-xs leading-5 text-[#3A3A3A]/60">{user.bio || t("admin.profile.card.bioFallback")}</p>
              </section>

              <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,0.05)]">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#F47822]" /><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#3A3A3A]">{t("admin.profile.quick.title")}</p></div>
                <div className="mt-3 grid gap-2">
                  <a href="/admin/users" className="rounded-xl bg-[#3A3A3A] px-4 py-3 text-xs font-semibold text-white hover:bg-[#F47822] transition">{t("admin.profile.quick.managePeople")}</a>
                  <a href="/admin/activity" className="rounded-xl border border-[#3A3A3A]/8 bg-[#FAFAFA] px-4 py-3 text-xs font-semibold text-[#3A3A3A] hover:border-[#F47822]/20">{t("admin.profile.quick.auditTrail")}</a>
                  <a href="/admin/settings" className="rounded-xl border border-[#F47822]/15 bg-[#FFF8F4] px-4 py-3 text-xs font-semibold text-[#F47822] hover:bg-[#F47822]/10 transition">{t("admin.profile.quick.settingsLink")}</a>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes profileToastIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}@keyframes profileToastProgress{from{transform:scaleX(1)}to{transform:scaleX(0)}}`}</style>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: React.ElementType; label:string; value:number|string; hint:string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#3A3A3A]/8 bg-white px-4 py-4 shadow-[0_8px_30px_rgba(58,58,58,0.05)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]"><Icon className="h-5 w-5" /></span>
      <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/40">{label}</p><p className="text-lg font-bold text-[#3A3A3A]">{value}</p><p className="text-[11px] text-[#3A3A3A]/45">{hint}</p></div>
    </div>
  );
}
function BookOpenIcon(){ return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>; }
