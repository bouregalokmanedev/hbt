import { Globe, Home, Menu, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { changeLanguage } from "@/i18n";
import { api } from "@/lib/api/api";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function AdminNavbar({ onMenuClick }: { onMenuClick(): void }) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const { user, updateUser } = useAuth();

  const handleLanguageSwitch = () => {
    const next = isArabic ? "en" : "ar";
    changeLanguage(next);
    if (user) {
      void api<{ locale: string }>("/v1/auth/locale", {
        method: "PATCH",
        body: { locale: next },
      })
        .then(() => updateUser({ ...user, language: next }))
        .catch(() => undefined);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center border-b border-[#3A3A3A]/8 bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label={t("admin.nav.openAria")}
        className="grid h-10 w-10 place-items-center rounded-xl text-[#3A3A3A]/60 transition hover:bg-[#3A3A3A]/5 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="ml-auto flex items-center gap-2 rtl:ml-0 rtl:mr-auto">
        <button
          type="button"
          onClick={handleLanguageSwitch}
          aria-label={isArabic ? t("admin.nav.switchToEnglish") : t("admin.nav.switchToArabic")}
          title={isArabic ? t("admin.nav.switchToEnglish") : t("admin.nav.switchToArabic")}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-2.5 text-[#3A3A3A]/60 shadow-[0_4px_12px_rgba(58,58,58,.04)] transition-all hover:-translate-y-0.5 hover:border-[#F47822]/35 hover:bg-[#FFF8F4] hover:text-[#F47822]"
        >
          <Globe className="h-4 w-4" />
          <span className="text-[11px] font-bold">
            {isArabic ? "EN" : "AR"}
          </span>
        </button>
        <Link
          to="/"
          aria-label={t("admin.nav.homeAria")}
          className="grid h-9 w-9 place-items-center rounded-xl border border-[#F47822]/18 bg-[#FFF8F4] text-[#F47822] transition hover:-translate-y-0.5 hover:bg-[#F47822] hover:text-white"
        >
          <Home className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2 rounded-full bg-[#F47822]/9 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em] text-[#F47822]">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t("admin.nav.secureArea")}
        </div>
      </div>
    </header>
  );
}
