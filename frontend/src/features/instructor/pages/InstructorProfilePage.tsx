import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X, Award, BookOpen, Users, TrendingUp, Star, GraduationCap } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAuthStore } from "@/features/auth";
import { authApi } from "@/features/auth/api/auth.api";
import { UserAvatar } from "@/components/ui";
import { ProfileHeader } from "@/features/profile/components/ProfileHeader";
import { ProfileInformation } from "@/features/profile/components/ProfileInformation";
import { useInstructorDashboard } from "@/features/instructor/hooks/useInstructorDashboard";
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

export function InstructorProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const updateProfile = useAuthStore((s)=>s.updateProfile);
  const updateUser = useAuthStore((s)=>s.updateUser);
  const { data } = useInstructorDashboard();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string|null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [form, setForm] = useState<ProfileFormData|null>(null);

  useEffect(()=>{ if(user && !isEditing) setForm(createFormData(user)); },[user, isEditing]);
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
      setSaveError(e instanceof Error? e.message:t("instructor.profile.saveErrorFallback"));
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
    }catch(e){ setSaveError(e instanceof Error? e.message:t("instructor.profile.saveErrorFallback")); }
    finally{ setIsSaving(false); }
  };

  return (
    <main className="min-h-full bg-[#F3F3F3]">
      {saveSuccess && (
        <div className="fixed right-5 top-5 z-[99999] w-[calc(100%-40px)] max-w-[400px] animate-[profileToastIn_0.3s_ease-out] rtl:left-5 rtl:right-auto">
          <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
            <div className="flex items-start gap-3 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"><Check className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#3A3A3A]">{t("instructor.profile.toastUpdated")}</p><p className="mt-1 text-xs leading-5 text-[#3A3A3A]/55">{t("instructor.profile.toastUpdatedDesc")}</p></div>
              <button type="button" onClick={()=>setSaveSuccess(false)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#3A3A3A]/30 hover:bg-[#3A3A3A]/5"><X className="h-4 w-4" /></button>
            </div>
            <div className="h-1 w-full bg-emerald-500/10"><div className="h-full w-full origin-left bg-emerald-500 animate-[profileToastProgress_3s_linear_forwards]" /></div>
          </div>
        </div>
      )}
      {saveError && (
        <div className="fixed right-5 top-5 z-[99999] w-[calc(100%-40px)] max-w-[400px] animate-[profileToastIn_0.3s_ease-out] rtl:left-5 rtl:right-auto">
          <div className="overflow-hidden rounded-2xl border border-red-500/20 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
            <div className="flex items-start gap-3 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500"><X className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#3A3A3A]">{t("instructor.profile.toastFailed")}</p><p className="mt-1 text-xs leading-5 text-[#3A3A3A]/55">{saveError}</p></div>
              <button type="button" onClick={()=>setSaveError(null)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#3A3A3A]/30 hover:bg-[#3A3A3A]/5"><X className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="space-y-5">
          <ProfileHeader user={user} isEditing={isEditing} onEdit={handleEdit} onAvatarChange={handleAvatarChange} avatar={form.avatar} />

          {/* Instructor insight band */}
          <section className="grid gap-3 sm:grid-cols-3">
            <StatCard icon={BookOpen} label={t("instructor.profile.stats.courses")} value={data?.statistics.total ?? 0} hint={t("instructor.profile.stats.publishedHint", { count: data?.statistics.published ?? 0 })} />
            <StatCard icon={Users} label={t("instructor.profile.stats.learners")} value={data?.students.total ?? 0} hint={t("instructor.profile.stats.activeHint", { count: data?.students.active ?? 0 })} />
            <StatCard icon={Star} label={t("instructor.profile.stats.quizScore")} value={`${data?.learning.average_quiz_score ?? 0}%`} hint={t("instructor.profile.stats.taughtHint", { count: data?.learning.total_time_hours ?? 0 })} />
          </section>

          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <ProfileInformation user={user} form={form} isEditing={isEditing} isSaving={isSaving} onEdit={handleEdit} onCancel={handleCancel} onSave={handleSave} onFieldChange={updateField} />

              {/* Teaching focus */}
              <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,0.05)] sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]"><GraduationCap className="h-5 w-5" /></span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("instructor.profile.teaching.eyebrow")}</p>
                    <h3 className="text-sm font-semibold text-[#3A3A3A]">{t("instructor.profile.teaching.title")}</h3>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-[#FAFAFA] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/40">{t("instructor.profile.teaching.completion")}</p>
                    <p className="mt-1 text-lg font-bold text-[#3A3A3A]">{data?.overview.completion_rate ?? 0}%</p>
                  </div>
                  <div className="rounded-xl bg-[#FAFAFA] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/40">{t("instructor.profile.teaching.avgProgress")}</p>
                    <p className="mt-1 text-lg font-bold text-[#3A3A3A]">{data?.overview.average_progress ?? 0}%</p>
                  </div>
                  <div className="rounded-xl bg-[#FAFAFA] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/40">{t("instructor.profile.teaching.inProgress")}</p>
                    <p className="mt-1 text-lg font-bold text-[#3A3A3A]">{data?.progress.in_progress ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-[#FAFAFA] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/40">{t("instructor.profile.teaching.completed")}</p>
                    <p className="mt-1 text-lg font-bold text-[#3A3A3A]">{data?.progress.completed ?? 0}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-[#3A3A3A]/45">
                  {t("instructor.profile.teaching.note")}
                </p>
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-2xl border border-[#F47822]/15 bg-[#FFF8F4] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">{t("instructor.profile.card.eyebrow")}</p>
                <h3 className="mt-1 text-sm font-bold text-[#3A3A3A]">{t("instructor.profile.card.title")}</h3>
                <div className="mt-4 flex items-center gap-3">
                  <UserAvatar user={user} className="h-12 w-12" fallbackClassName="bg-[#F47822] text-white font-bold" />
                  <div>
                    <p className="text-sm font-bold text-[#3A3A3A]">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-[#3A3A3A]/50">@{user.username} · {t("instructor.profile.card.role")}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-[#3A3A3A]/60 line-clamp-3">{user.bio || t("instructor.profile.card.bioFallback")}</p>
              </section>

              <section className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 shadow-[0_8px_30px_rgba(58,58,58,0.05)]">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#F47822]" />
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#3A3A3A]">{t("instructor.profile.links.title")}</p>
                </div>
                <div className="mt-3 grid gap-2">
                  <a href="/instructor/courses" className="rounded-xl bg-[#3A3A3A] px-4 py-3 text-xs font-semibold text-white hover:bg-[#F47822] transition">{t("instructor.profile.links.courses")}</a>
                  <a href="/instructor/revenue" className="rounded-xl border border-[#3A3A3A]/8 bg-[#FAFAFA] px-4 py-3 text-xs font-semibold text-[#3A3A3A] hover:border-[#F47822]/20">{t("instructor.profile.links.revenue")}</a>
                  <a href="/instructor/lounge" className="rounded-xl border border-[#F47822]/15 bg-[#FFF8F4] px-4 py-3 text-xs font-semibold text-[#F47822] hover:bg-[#F47822]/10 transition">{t("instructor.profile.links.lounge")}</a>
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
