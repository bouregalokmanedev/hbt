import { Outlet, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BellRing, MessageCircle, Users } from "lucide-react";

interface StaffHubPageProps {
  /** The role-specific base path, e.g. `/admin/staff-hub`. */
  hubBase: string;
}

/**
 * Shell for the Staff Hub: a shared news feed, a shared discussion room and a
 * read-only roster, reachable from the Admin, Support and Instructor sidebars.
 *
 * Renders its own <main> so embedded children (MessagesPage) must not.
 */
export function StaffHubPage({ hubBase }: StaffHubPageProps) {
  const { t } = useTranslation();

  const tabs = [
    { to: hubBase, end: true, label: t("staffHub.tabOverview"), icon: Users },
    { to: `${hubBase}/news`, end: false, label: t("staffHub.tabNews"), icon: BellRing },
    { to: `${hubBase}/room`, end: false, label: t("staffHub.tabRoom"), icon: MessageCircle },
  ];

  return (
    <main className="min-h-full bg-[#F3F3F3] dark:bg-[#101013] px-4 py-5 sm:px-7 sm:py-7">
      <div className="mx-auto max-w-[1480px]">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.19em] text-[#F47822]">
              {t("staffHub.eyebrow")}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#ececef] sm:text-3xl">
              {t("staffHub.title")}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[#3A3A3A]/55 dark:text-white/55">
              {t("staffHub.description")}
            </p>
          </div>
        </header>

        <nav className="mb-5 inline-flex flex-wrap items-center gap-1 rounded-xl border border-[#3A3A3A]/8 dark:border-white/8 bg-white dark:bg-[#1b1b20] p-1 shadow-sm">
          {tabs.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                  isActive
                    ? "bg-[#F47822] text-white"
                    : "text-[#3A3A3A]/55 dark:text-white/55 hover:text-[#3A3A3A] dark:hover:text-[#ececef]"
                }`
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </div>
    </main>
  );
}
