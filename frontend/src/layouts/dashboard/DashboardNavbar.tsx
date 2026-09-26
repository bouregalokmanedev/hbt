import { Globe, Home, Menu, SlidersHorizontal } from "lucide-react";

import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/i18n";
import { NotificationMenu } from "@/features/notifications/components/NotificationMenu";
import { useDashboardUiStore } from "@/features/dashboard/stores/dashboard-ui.store";

interface DashboardNavbarProps {
  onMenuClick: () => void;
}

interface SectionConfig {
  title: string;
  description: string;
}

function useSectionConfig(): Record<string, SectionConfig> {
  const { t } = useTranslation();

  return {
    "/dashboard": {
      title: t("dashboard.nav.dashboardTitle"),
      description: t("dashboard.nav.dashboardDesc"),
    },

    "/my-courses": {
      title: t("dashboard.nav.coursesTitle"),
      description: t("dashboard.nav.coursesDesc"),
    },

    "/catalog": {
      title: t("dashboard.nav.catalogTitle"),
      description: t("dashboard.nav.catalogDesc"),
    },

    "/assessments": {
      title: t("dashboard.nav.assessmentsTitle"),
      description: t("dashboard.nav.assessmentsDesc"),
    },

    "/achievements": {
      title: t("dashboard.nav.achievementsTitle"),
      description: t("dashboard.nav.achievementsDesc"),
    },

    "/certificates": {
      title: t("dashboard.nav.certificatesTitle"),
      description: t("dashboard.nav.certificatesDesc"),
    },

    "/simulator": {
      title: t("dashboard.nav.simulatorTitle"),
      description: t("dashboard.nav.simulatorDesc"),
    },

    "/diagnostics": {
      title: t("dashboard.nav.diagnosticsTitle"),
      description: t("dashboard.nav.diagnosticsDesc"),
    },

    "/support": {
      title: t("dashboard.nav.supportTitle"),
      description: t("dashboard.nav.supportDesc"),
    },

    "/ai-mentor": {
      title: t("dashboard.nav.mentorTitle"),
      description: t("dashboard.nav.mentorDesc"),
    },

    "/messages": {
      title: t("dashboard.nav.messagesTitle"),
      description: t("dashboard.nav.messagesDesc"),
    },

    "/announcements": {
      title: t("dashboard.nav.announcementsTitle"),
      description: t("dashboard.nav.announcementsDesc"),
    },

    "/favourite": {
      title: t("dashboard.nav.favouriteTitle"),
      description: t("dashboard.nav.favouriteDesc"),
    },

    "/subscription": {
      title: t("dashboard.nav.subscriptionTitle"),
      description: t("dashboard.nav.subscriptionDesc"),
    },

    "/settings": {
      title: t("dashboard.nav.settingsTitle"),
      description: t("dashboard.nav.settingsDesc"),
    },

    "/profile": {
      title: t("dashboard.nav.profileTitle"),
      description: t("dashboard.nav.profileDesc"),
    },
  };
}

export function DashboardNavbar({ onMenuClick }: DashboardNavbarProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const sectionConfig = useSectionConfig();
  const isArabic = i18n.language === "ar";
  const customizing = useDashboardUiStore((state) => state.customizing);
  const toggleCustomizing = useDashboardUiStore(
    (state) => state.toggleCustomizing,
  );
  const onDashboard = location.pathname === "/dashboard";

  const currentSection =
    sectionConfig[location.pathname] ?? sectionConfig["/dashboard"];

  return (
    <header
      className="
                sticky
                top-0
                z-30
                flex
                h-[72px]
                shrink-0
                items-center
                border-b
                border-[#3A3A3A]/8 dark:border-white/8
                bg-white/90 dark:bg-[#1b1b20]/90
                transition-colors
        duration-300
                px-5
                backdrop-blur-xl
                sm:px-7
                lg:px-8
            "
    >
      <div className="flex w-full items-center justify-between gap-5">
        {/* ================================================== */}
        {/* LEFT SIDE */}
        {/* ================================================== */}

        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile menu */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-label={t("dashboard.sidebar.openAria")}
            className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            text-[#3A3A3A]/50 dark:text-white/50
                            transition
                            hover:bg-[#3A3A3A]/5 dark:hover:bg-white/5
                            hover:text-[#3A3A3A] dark:hover:text-[#ececef]
                            lg:hidden
                        "
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Current section */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1
                className="
                                truncate
                                text-sm
                                font-semibold
                                text-[#3A3A3A] dark:text-[#ececef]
                                sm:text-[15px]
                            "
              >
                {currentSection.title}
              </h1>

              <span
                className="
                                hidden
                                h-1
                                w-1
                                shrink-0
                                rounded-full
                                bg-[#F47822]
                                sm:block
                            "
              />
            </div>

            <p
              className="
                            mt-0.5
                            hidden
                            truncate
                            text-[10px]
                            text-[#3A3A3A]/40 dark:text-white/40
                            sm:block
                        "
            >
              {currentSection.description}
            </p>
          </div>
        </div>

        {/* ================================================== */}
        {/* RIGHT SIDE */}
        {/* ================================================== */}

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => changeLanguage(isArabic ? "en" : "ar")}
            aria-label={isArabic ? "Switch to English" : "التبديل إلى العربية"}
            title={isArabic ? "Switch to English" : "التبديل إلى العربية"}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] px-2.5 text-[#3A3A3A]/60 dark:text-white/60 shadow-[0_4px_12px_rgba(58,58,58,.04)] transition-all hover:-translate-y-0.5 hover:border-[#F47822]/35 hover:bg-[#FFF8F4] dark:hover:bg-[#F47822]/[0.08] hover:text-[#F47822]"
          >
            <Globe className="h-4 w-4" />
            <span className="text-[11px] font-bold">
              {isArabic ? "EN" : "AR"}
            </span>
          </button>
          <Link
            to="/"
            aria-label={t("dashboard.sidebar.homeAria")}
            className="grid h-9 w-9 place-items-center rounded-xl border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] text-[#3A3A3A]/60 dark:text-white/60 shadow-[0_4px_12px_rgba(58,58,58,.04)] transition-all hover:-translate-y-0.5 hover:border-[#F47822]/35 hover:bg-[#FFF8F4] dark:hover:bg-[#F47822]/[0.08] hover:text-[#F47822]"
          >
            <Home className="h-4 w-4" />
          </Link>
          {onDashboard && (
            <button
              type="button"
              data-testid="dashboard-customize"
              aria-label={t("dashboard.personalize.customize")}
              aria-pressed={customizing}
              title={
                customizing
                  ? t("dashboard.personalize.done")
                  : t("dashboard.personalize.customize")
              }
              onClick={toggleCustomizing}
              className={[
                "grid h-9 w-9 place-items-center rounded-xl border shadow-[0_4px_12px_rgba(58,58,58,.04)] transition-all",
                customizing
                  ? "border-[#F47822]/50 bg-[#F47822] text-white"
                  : "border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/60 hover:-translate-y-0.5 hover:border-[#F47822]/35 hover:bg-[#FFF8F4] hover:text-[#F47822] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/60 dark:hover:bg-[#F47822]/[0.08]",
              ].join(" ")}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          )}
          <NotificationMenu />
        </div>
      </div>
    </header>
  );
}
