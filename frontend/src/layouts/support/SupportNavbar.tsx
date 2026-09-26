import { Globe, Home, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { changeLanguage } from "@/i18n";
import { api } from "@/lib/api/api";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function SupportNavbar({ onMenuClick }: { onMenuClick: () => void }) {
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
        <header className="sticky top-0 z-30 flex h-[72px] items-center border-b border-[#3A3A3A]/8 bg-white/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <button
                type="button"
                onClick={onMenuClick}
                aria-label={t("supportDesk.nav.openAria")}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#3A3A3A]/60 transition hover:bg-[#3A3A3A]/5 lg:hidden"
            >
                <Menu className="h-5 w-5" />
            </button>
            <div className="ml-auto flex items-center gap-2 rtl:ml-0 rtl:mr-auto">
                <button
                    type="button"
                    onClick={handleLanguageSwitch}
                    aria-label={isArabic ? t("supportDesk.nav.switchToEnglish") : t("supportDesk.nav.switchToArabic")}
                    title={isArabic ? t("supportDesk.nav.switchToEnglish") : t("supportDesk.nav.switchToArabic")}
                    className="flex h-9 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-2.5 text-[#3A3A3A]/60 shadow-[0_4px_12px_rgba(58,58,58,.04)] transition-all hover:-translate-y-0.5 hover:border-[#F47822]/35 hover:bg-[#FFF8F4] hover:text-[#F47822]"
                >
                    <Globe className="h-4 w-4" />
                    <span className="text-[11px] font-bold">
                        {isArabic ? "EN" : "AR"}
                    </span>
                </button>
                <Link
                    to="/"
                    aria-label={t("supportDesk.nav.homeAria")}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-[#F47822]/18 bg-[#FFF8F4] text-[#F47822] transition hover:-translate-y-0.5 hover:bg-[#F47822] hover:text-white"
                >
                    <Home className="h-4 w-4" />
                </Link>
                <span className="rounded-full bg-[#F47822]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#F47822]">{t("supportDesk.badge")}</span>
            </div>
        </header>
    );
}
