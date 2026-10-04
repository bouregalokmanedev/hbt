import {
    BarChart3,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Cpu,
    LayoutDashboard,
    LogOut,
    MessageCircle,
    Megaphone,
    Settings,
    Stethoscope,
    UserRound,
    Users,
    X,
} from "lucide-react";

import {
    NavLink,
    useNavigate,
} from "react-router-dom";

import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSidebarBadges } from "@/features/notifications/hooks/useSidebarBadges";
import { UserAvatar } from "@/components/ui";

interface InstructorSidebarProps {
    open: boolean;
    collapsed: boolean;
    onClose: () => void;
    onToggleCollapse: () => void;
}

interface NavigationItem {
    labelKey: string;
    to: string;
    icon: React.ElementType;
}

const navigationItems: NavigationItem[] = [
    {
        labelKey: "instructor.sidebar.dashboard",
        to: "/instructor",
        icon: LayoutDashboard,
    },
    {
        labelKey: "instructor.sidebar.myCourses",
        to: "/instructor/courses",
        icon: BookOpen,
    },
    {
        labelKey: "instructor.sidebar.students",
        to: "/instructor/students",
        icon: Users,
    },
    {
        labelKey: "instructor.sidebar.diagnostics",
        to: "/instructor/diagnostics",
        icon: Stethoscope,
    },
    {
        labelKey: "instructor.sidebar.simulator",
        to: "/instructor/simulator",
        icon: Cpu,
    },
    {
        labelKey: "instructor.sidebar.revenue",
        to: "/instructor/revenue",
        icon: BarChart3,
    },
    {
        labelKey: "instructor.sidebar.staffHub",
        to: "/instructor/staff-hub",
        icon: Users,
    },
    {
        labelKey: "instructor.sidebar.messages",
        to: "/instructor/messages",
        icon: MessageCircle,
    },
    {
        labelKey: "instructor.sidebar.announcements",
        to: "/instructor/announcements",
        icon: Megaphone,
    },
];

export function InstructorSidebar({
    open,
    collapsed,
    onClose,
    onToggleCollapse,
}: InstructorSidebarProps) {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";

    const {
        user,
        logout,
    } = useAuth();

    const { badges } = useSidebarBadges();

    const navigate = useNavigate();

    const firstName =
        user?.first_name ?? "";

    const lastName =
        user?.last_name ?? "";

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate("/login", { replace: true });
        }
    };

    return (
        <>
            {open && (
                <button
                    type="button"
                    aria-label={t("instructor.sidebar.closeAria")}
                    onClick={onClose}
                    className="
                        fixed
                        inset-0
                        z-40
                        bg-[#3A3A3A]/25
                        backdrop-blur-sm
                        lg:hidden
                    "
                />
            )}

            <aside
                className={`
                    fixed
                    inset-y-0
                    start-0
                    z-50
                    flex
                    flex-col
                    border-e
                    border-[#3A3A3A]/8
                    bg-[#FCFCFC]
                    shadow-[10px_0_36px_rgba(58,58,58,0.06)]
                    rtl:shadow-[-10px_0_36px_rgba(58,58,58,0.06)]
                    transition-all
                    duration-300
                    w-[260px]

                    ${
                        collapsed
                            ? "lg:w-[76px]"
                            : "lg:w-[260px]"
                    }

                    ${
                        open
                            ? "translate-x-0"
                            : isRTL
                              ? "translate-x-full lg:translate-x-0"
                              : "-translate-x-full lg:translate-x-0"
                    }
                `}
            >
                <div
                    className={`
                        relative
                        flex
                        h-[72px]
                        shrink-0
                        items-center
                        border-b
                        border-[#3A3A3A]/6
                        bg-white/75
                        px-5
                        backdrop-blur-sm

                        ${
                            collapsed
                                ? "justify-center px-0"
                                : "justify-between"
                        }
                    `}
                >
                    {!collapsed && (
                        <div>
                            <p className="text-xs font-bold tracking-[0.18em] text-[#F47822]">
                                HBT
                            </p>

                            <p className="text-sm font-semibold text-[#3A3A3A]">
                                {t("instructor.badge")}
                            </p>
                        </div>
                    )}

                    {collapsed && (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F47822] text-xs font-bold text-white">
                            HBT
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        aria-label={
                            collapsed
                                ? t("instructor.sidebar.expandAria")
                                : t("instructor.sidebar.collapseAria")
                        }
                        className={`
                            hidden
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-lg
                            text-[#3A3A3A]/40
                            transition
                            hover:bg-[#3A3A3A]/5
                            hover:text-[#3A3A3A]
                            lg:flex

                            ${
                                collapsed
                                    ? "absolute right-3 top-1/2 -translate-y-1/2 rtl:left-3 rtl:right-auto"
                                    : ""
                            }
                        `}
                    >
                        {collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("instructor.sidebar.closeAria")}
                        className="
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-lg
                            text-[#3A3A3A]/40
                            hover:bg-[#3A3A3A]/5
                            lg:hidden
                        "
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5 [scrollbar-width:thin]">
                    <p
                        className={`
                            mb-2
                            px-3
                            text-[9px]
                            font-bold
                            uppercase
                            tracking-[0.18em]
                            text-[#3A3A3A]/30

                            ${
                                collapsed
                                    ? "sr-only"
                                    : ""
                            }
                        `}
                    >
                        {t("instructor.sidebar.section")}
                    </p>

                    <div className="space-y-1">
                        {navigationItems.map(
                            (item) => {
                                const Icon =
                                    item.icon;

                                const badgeCount =
                                    item.to === "/instructor/messages"
                                        ? (badges.messages ?? 0)
                                        : item.to === "/instructor/announcements"
                                          ? (badges.announcements ?? 0)
                                          : 0;

                                return (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end={
                                            item.to ===
                                            "/instructor"
                                        }
                                        onClick={onClose}
                                        title={
                                            collapsed
                                                ? t(item.labelKey)
                                                : undefined
                                        }
                                        className={({
                                            isActive,
                                        }) =>
                                            `
                                            group
                                            relative
                                            flex
                                            h-11
                                            items-center
                                            gap-3
                                            rounded-xl
                                            px-3
                                            text-xs
                                            font-medium
                                            transition-all
                                            ${
                                                isActive
                                                    ? "bg-[#F47822] text-white shadow-[0_7px_16px_rgba(244,120,34,.18)]"
                                                    : "text-[#3A3A3A]/60 hover:bg-white hover:text-[#3A3A3A] hover:shadow-sm"
                                            }

                                            ${
                                                collapsed
                                                    ? "justify-center px-0"
                                                    : ""
                                            }
                                        `
                                        }
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />

                                        {!collapsed && (
                                            <span className="truncate">
                                                {
                                                    t(item.labelKey)
                                                }
                                            </span>
                                        )}

                                        {badgeCount > 0 && !collapsed && (
                                            <span className="ms-auto shrink-0 rounded-full bg-[#F47822] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
                                                {badgeCount > 99 ? "99+" : badgeCount}
                                            </span>
                                        )}

                                        {badgeCount > 0 && collapsed && (
                                            <span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-[#F47822] ring-2 ring-[#FCFCFC]" />
                                        )}
                                    </NavLink>
                                );
                            },
                        )}
                    </div>
                </nav>

                <div className="shrink-0 border-t border-[#3A3A3A]/8 p-3">
                    {/* Settings */}
                    <NavLink
                        to="/instructor/settings"
                        onClick={onClose}
                        title={collapsed ? t("instructor.sidebar.settings") : undefined}
                        className={({ isActive }) =>
                            `
                            group relative flex h-10 items-center gap-3 rounded-xl px-3
                            text-xs font-medium transition-all
                            ${isActive ? "bg-[#F47822]/10 text-[#F47822]" : "text-[#3A3A3A]/55 hover:bg-[#3A3A3A]/5 hover:text-[#3A3A3A]"}
                            ${collapsed ? "justify-center px-0" : ""}
                            `
                        }
                    >
                        <Settings className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{t("instructor.sidebar.settings")}</span>}
                    </NavLink>

                    {/* Profile */}
                    <NavLink
                        to="/instructor/profile"
                        onClick={onClose}
                        title={collapsed ? t("instructor.sidebar.profile") : undefined}
                        className={({ isActive }) =>
                            `
                            group relative mt-1 flex h-10 items-center gap-3 rounded-xl px-3
                            text-xs font-medium transition-all
                            ${isActive ? "bg-[#F47822]/10 text-[#F47822]" : "text-[#3A3A3A]/55 hover:bg-[#3A3A3A]/5 hover:text-[#3A3A3A]"}
                            ${collapsed ? "justify-center px-0" : ""}
                            `
                        }
                    >
                        <UserRound className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{t("instructor.sidebar.profile")}</span>}
                    </NavLink>

                    {/* User */}
                    <div className={`mt-2 flex items-center gap-3 rounded-xl border border-[#3A3A3A]/6 bg-[#F7F7F7] p-2 ${collapsed ? "justify-center" : ""}`}>
                        <UserAvatar
                            user={user}
                            className="h-9 w-9"
                            fallbackClassName="bg-[#F47822]/10 text-xs font-bold text-[#F47822]"
                        />

                        {!collapsed && (
                            <>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-[#3A3A3A]">
                                        {firstName} {lastName}
                                    </p>
                                    <p className="truncate text-[10px] text-[#3A3A3A]/40">{user?.email}</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => void handleLogout()}
                                    title={t("instructor.sidebar.logout")}
                                    aria-label={t("instructor.sidebar.logout")}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#3A3A3A]/35 transition hover:bg-red-50 hover:text-red-500"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
