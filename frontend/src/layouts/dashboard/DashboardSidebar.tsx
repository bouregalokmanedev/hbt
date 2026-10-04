import {
    Award,
    BookOpen,
    BrainCircuit,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    CreditCard,
    Heart,
    LayoutDashboard,
    LifeBuoy,
    LogOut,
    MessageSquare,
    BellRing,
    MonitorPlay,
    Receipt,
    Settings,
    Sparkles,
    Stethoscope,
    Trophy,
    UserRound,
    X,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSidebarBadges } from "@/features/notifications/hooks/useSidebarBadges";
import { UserAvatar } from "@/components/ui";
import hbtLogo from "@/assets/brand/hbt-logo-full.png";
import hbtCompactLogo from "@/assets/brand/hbt-logo.jpg";

interface DashboardSidebarProps {
    open: boolean;
    collapsed: boolean;
    locked?: boolean;
    onClose: () => void;
    onToggleCollapse: () => void;
}

interface NavigationItem {
    labelKey: string;
    to: string;
    icon: React.ElementType;
}

const homeItems: NavigationItem[] = [
    {
        labelKey: "dashboard.sidebar.dashboard",
        to: "/dashboard",
        icon: LayoutDashboard,
    },
];

const learningItems: NavigationItem[] = [
    {
        labelKey: "dashboard.sidebar.myCourses",
        to: "/my-courses",
        icon: BookOpen,
    },
    {
        labelKey: "dashboard.sidebar.catalog",
        to: "/catalog",
        icon: BookOpen,
    },
    {
        labelKey: "dashboard.sidebar.assessments",
        to: "/assessments",
        icon: ClipboardCheck,
    },
];

const labsItems: NavigationItem[] = [
    {
        labelKey: "dashboard.sidebar.simulator",
        to: "/simulator",
        icon: MonitorPlay,
    },
    {
        labelKey: "dashboard.sidebar.diagnostics",
        to: "/diagnostics",
        icon: Stethoscope,
    },
    {
        labelKey: "dashboard.sidebar.mentor",
        to: "/ai-mentor",
        icon: BrainCircuit,
    },
];

const rewardsItems: NavigationItem[] = [
    {
        labelKey: "dashboard.sidebar.achievements",
        to: "/achievements",
        icon: Trophy,
    },
    {
        labelKey: "dashboard.sidebar.certificates",
        to: "/certificates",
        icon: Award,
    },
    {
        labelKey: "dashboard.sidebar.favourite",
        to: "/favourite",
        icon: Heart,
    },
];

const inboxItems: NavigationItem[] = [
    {
        labelKey: "dashboard.sidebar.messages",
        to: "/messages",
        icon: MessageSquare,
    },
    {
        labelKey: "dashboard.sidebar.announcements",
        to: "/announcements",
        icon: BellRing,
    },
    {
        labelKey: "dashboard.sidebar.support",
        to: "/support",
        icon: LifeBuoy,
    },
];

const accountItems: NavigationItem[] = [
    {
        labelKey: "dashboard.sidebar.subscription",
        to: "/subscription",
        icon: CreditCard,
    },
    {
        labelKey: "dashboard.sidebar.billing",
        to: "/billing",
        icon: Receipt,
    },
];

interface NavigationSectionProps {
    title: string;
    items: NavigationItem[];
    collapsed: boolean;
    onClose: () => void;
    badges: Record<string, number>;
}

function formatBadgeCount(count: number): string {
    return count > 99 ? "99+" : String(count);
}

function NavigationSection({
    title,
    items,
    collapsed,
    onClose,
    badges,
}: NavigationSectionProps) {
    const { t } = useTranslation();

    return (
            <div className="mt-7 first:mt-0">
            {!collapsed && (
                <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-[#3A3A3A]/30 dark:text-white/30">
                    {title}
                </p>
            )}

            <div className="space-y-1">
                {items.map((item) => {
                    const Icon = item.icon;
                    const badgeCount = badges[item.to.replace(/^\//, "")] ?? 0;

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end
                            onClick={onClose}
                            title={
                                collapsed
                                    ? t(item.labelKey)
                                    : undefined
                            }
                            className={({ isActive }) =>
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
                                duration-200
                                ${
                                    isActive
                                        ? "bg-[#F47822] text-white shadow-[0_7px_16px_rgba(244,120,34,.18)]"
                                        : "text-[#3A3A3A]/60 dark:text-white/60 hover:bg-white dark:hover:bg-[#1b1b20] hover:text-[#3A3A3A] dark:hover:text-[#ececef] hover:shadow-sm"
                                }
                                ${
                                    collapsed
                                        ? "justify-center px-0"
                                        : ""
                                }
                                `
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <span className="absolute -left-1 h-5 w-[3px] rounded-r-full bg-[#F47822] rtl:-right-1 rtl:left-auto rtl:rounded-l-full rtl:rounded-r-none" />
                                    )}

                                    <Icon
                                        className={`
                                            h-4 w-4 shrink-0
                                            transition-colors
                                            ${
                                                isActive
                                                    ? "text-white"
                                                    : "text-[#3A3A3A]/40 dark:text-white/40 group-hover:text-[#F47822]"
                                            }
                                        `}
                                    />

                                    {!collapsed && (
                                        <span className="truncate">
                                            {t(item.labelKey)}
                                        </span>
                                    )}

                                    {badgeCount > 0 && !collapsed && (
                                        <span
                                            aria-label={t("dashboard.sidebar.unreadBadge", { count: badgeCount })}
                                            className={`
                                                ms-auto
                                                shrink-0
                                                rounded-full
                                                px-1.5
                                                py-0.5
                                                text-[10px]
                                                font-bold
                                                tabular-nums
                                                ${isActive ? "bg-white dark:bg-[#1b1b20] text-[#F47822]" : "bg-[#F47822] text-white"}
                                            `}
                                        >
                                            {formatBadgeCount(badgeCount)}
                                        </span>
                                    )}

                                    {badgeCount > 0 && collapsed && (
                                        <span
                                            aria-label={t("dashboard.sidebar.unreadBadge", { count: badgeCount })}
                                            className="absolute end-2 top-2 h-2 w-2 rounded-full bg-[#F47822] ring-2 ring-[#FCFCFC]"
                                        />
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
}

export function DashboardSidebar({
    open,
    collapsed,
    locked = false,
    onClose,
    onToggleCollapse,
}: DashboardSidebarProps) {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";

    const {
        user,
        logout,
    } = useAuth();

    const { badges } = useSidebarBadges();

    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
    };

    const handleProClick = () => {
        navigate("/pricing");
    };

    const firstName =
        user?.first_name ?? "";

    const lastName =
        user?.last_name ?? "";

    return (
        <>
            {/* Mobile backdrop */}
            {open && (
                <button
                    type="button"
                    aria-label={t("dashboard.sidebar.closeAria")}
                    onClick={onClose}
                    className="
                        fixed
                        inset-0
                        z-40
                        bg-[#3A3A3A]/25 dark:bg-white/25
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
                    border-[#3A3A3A]/8 dark:border-white/8
                    bg-[#FCFCFC] dark:bg-[#232329]
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
                {/* ================================================== */}
                {/* BRAND HEADER */}
                {/* ================================================== */}

                <div
                    className={`
                        relative
                        flex
                        gap-4
                        h-[72px]
                        shrink-0
                        items-center
                        border-b border-[#3A3A3A]/6 dark:border-white/6 bg-white/75 backdrop-blur-sm
                        px-5

                        ${
                            collapsed
                                ? "justify-center px-0"
                                : "justify-between"
                        }
                    `}
                >
                    {!collapsed && (
                        <div className="flex min-w-0 items-center">
                            <img src={hbtLogo} alt="HBT Learning" className="h-8 w-auto max-w-[150px] object-contain object-left" />
                        </div>
                    )}

                    {collapsed && <img src={hbtCompactLogo} alt="HBT Learning" className="h-9 w-9 rounded-lg object-cover" />}

                    {/* Desktop collapse */}
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        disabled={locked}
                        aria-label={
                            collapsed
                                ? t("dashboard.sidebar.expandAria")
                                : t("dashboard.sidebar.collapseAria")
                        }
                        title={
                            collapsed
                                ? t("dashboard.sidebar.expandAria")
                                : t("dashboard.sidebar.collapseAria")
                        }
                        className={`
                            hidden
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-lg
                            text-[#3A3A3A]/40 dark:text-white/40
                            transition
                            hover:bg-[#3A3A3A]/5 dark:hover:bg-white/5
                            hover:text-[#3A3A3A] dark:hover:text-[#ececef]
                            disabled:cursor-not-allowed
                            disabled:opacity-30
                            disabled:hover:bg-transparent
                            lg:flex
                            ${collapsed ? "absolute right-3 top-1/2 -translate-y-1/2 rtl:left-3 rtl:right-auto" : ""}
                        `}
                    >
                        {collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </button>

                    {/* Mobile close */}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("dashboard.sidebar.closeAria")}
                        className="
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-lg
                            text-[#3A3A3A]/40 dark:text-white/40
                            transition
                            hover:bg-[#3A3A3A]/5 dark:hover:bg-white/5
                            lg:hidden
                        "
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* ================================================== */}
                {/* NAVIGATION */}
                {/* ================================================== */}

                <nav className="flex-1 overflow-y-auto px-3 py-5 [scrollbar-width:thin]">
                    <NavigationSection
                        title={t("dashboard.sidebar.home")}
                        items={homeItems}
                        collapsed={collapsed}
                        onClose={onClose}
                        badges={badges}
                    />

                    <NavigationSection
                        title={t("dashboard.sidebar.learning")}
                        items={learningItems}
                        collapsed={collapsed}
                        onClose={onClose}
                        badges={badges}
                    />

                    <NavigationSection
                        title={t("dashboard.sidebar.labs")}
                        items={labsItems}
                        collapsed={collapsed}
                        onClose={onClose}
                        badges={badges}
                    />

                    <NavigationSection
                        title={t("dashboard.sidebar.rewards")}
                        items={rewardsItems}
                        collapsed={collapsed}
                        onClose={onClose}
                        badges={badges}
                    />

                    <NavigationSection
                        title={t("dashboard.sidebar.inbox")}
                        items={inboxItems}
                        collapsed={collapsed}
                        onClose={onClose}
                        badges={badges}
                    />

                    <NavigationSection
                        title={t("dashboard.sidebar.account")}
                        items={accountItems}
                        collapsed={collapsed}
                        onClose={onClose}
                        badges={badges}
                    />

                    {/* ================================================== */}
                    {/* PRO CARD */}
                    {/* ================================================== */}

                    {!collapsed && (
                        <button
                            type="button"
                            onClick={handleProClick}
                            className="
                                group
                                relative
                                mt-7
                                w-full
                                overflow-hidden
                                rounded-2xl
                                bg-[#3A3A3A]
                                p-4
                                text-start
                                transition-all
                                duration-300
                                hover:-translate-y-0.5
                                hover:shadow-[0_12px_30px_rgba(58,58,58,0.16)]
                                focus:outline-none
                                focus:ring-2
                                focus:ring-[#F47822]/30
                            "
                        >
                            {/* Background glow */}
                            <div className="
                                absolute
                                -end-8
                                -top-8
                                h-24
                                w-24
                                rounded-full
                                bg-[#F47822]/15
                                blur-2xl
                                transition-transform
                                duration-500
                                group-hover:scale-125
                            " />

                            <div className="
                                absolute
                                -bottom-10
                                -start-10
                                h-20
                                w-20
                                rounded-full
                                bg-[#F47822]/10
                                blur-2xl
                            " />

                            <div className="relative">
                                <div className="flex items-center justify-between">
                                    <div className="
                                        flex
                                        h-8
                                        w-8
                                        items-center
                                        justify-center
                                        rounded-lg
                                        bg-[#F47822]
                                    ">
                                        <Sparkles className="h-4 w-4 text-white" />
                                    </div>

                                    <span className="
                                        text-[9px]
                                        font-bold
                                        uppercase
                                        tracking-[0.12em]
                                        text-white/35
                                    ">
                                        PRO
                                    </span>
                                </div>

                                <p className="mt-3 text-xs font-semibold text-white">
                                    {t("dashboard.sidebar.proTitle")}
                                </p>

                                <p className="
                                    mt-1
                                    text-[10px]
                                    leading-4
                                    text-white/45
                                ">
                                    {t("dashboard.sidebar.proDesc")}
                                </p>

                                <div className="
                                    mt-3
                                    flex
                                    items-center
                                    gap-1.5
                                    text-[10px]
                                    font-semibold
                                    text-[#F47822]
                                ">
                                    <span>
                                        {t("dashboard.sidebar.proCta")}
                                    </span>

                                    <ChevronRight
                                        className="
                                            h-3
                                            w-3
                                            transition-transform
                                            duration-200
                                            group-hover:translate-x-1
                                            rtl:rotate-180
                                            rtl:group-hover:-translate-x-1
                                        "
                                    />
                                </div>
                            </div>
                        </button>
                    )}
                </nav>

                {/* ================================================== */}
                {/* BOTTOM AREA */}
                {/* ================================================== */}

                <div className="shrink-0 border-t border-[#3A3A3A]/6 dark:border-white/6 p-3">
                    {/* Settings */}
                    <NavLink
                        to="/settings"
                        onClick={onClose}
                        title={
                            collapsed
                                ? t("dashboard.sidebar.settings")
                                : undefined
                        }
                        className={({ isActive }) =>
                            `
                            group
                            relative
                            flex
                            h-10
                            items-center
                            gap-3
                            rounded-xl
                            px-3
                            text-xs
                            font-medium
                            transition-all
                            ${
                                isActive
                                    ? "bg-[#F47822]/10 text-[#F47822]"
                                    : "text-[#3A3A3A]/55 dark:text-white/55 hover:bg-[#3A3A3A]/5 dark:hover:bg-white/5 hover:text-[#3A3A3A] dark:hover:text-[#ececef]"
                            }
                            ${
                                collapsed
                                    ? "justify-center px-0"
                                    : ""
                            }
                            `
                        }
                    >
                        <Settings className="h-4 w-4 shrink-0" />

                        {!collapsed && (
                            <span>
                                {t("dashboard.sidebar.settings")}
                            </span>
                        )}
                    </NavLink>

                    {/* Profile */}
                    <NavLink
                        to="/profile"
                        onClick={onClose}
                        title={
                            collapsed
                                ? t("dashboard.sidebar.profile")
                                : undefined
                        }
                        className={({ isActive }) =>
                            `
                            group
                            relative
                            mt-1
                            flex
                            h-10
                            items-center
                            gap-3
                            rounded-xl
                            px-3
                            text-xs
                            font-medium
                            transition-all
                            ${
                                isActive
                                    ? "bg-[#F47822]/10 text-[#F47822]"
                                    : "text-[#3A3A3A]/55 dark:text-white/55 hover:bg-[#3A3A3A]/5 dark:hover:bg-white/5 hover:text-[#3A3A3A] dark:hover:text-[#ececef]"
                            }
                            ${
                                collapsed
                                    ? "justify-center px-0"
                                    : ""
                            }
                            `
                        }
                    >
                        <UserRound className="h-4 w-4 shrink-0" />

                        {!collapsed && (
                            <span>
                                {t("dashboard.sidebar.profile")}
                            </span>
                        )}
                    </NavLink>

                    {/* User */}
                    <div
                        className={`
                            mt-2
                            flex
                            items-center
                            gap-3
                            rounded-xl
                            border
                            border-[#3A3A3A]/6 dark:border-white/6
                            bg-[#F7F7F7] dark:bg-[#101013]
                            p-2

                            ${
                                collapsed
                                    ? "justify-center"
                                    : ""
                            }
                        `}
                    >
                        {/* Avatar */}
                        <UserAvatar
                            user={user}
                            className="h-9 w-9"
                            fallbackClassName="bg-[#F47822]/10 text-xs font-bold text-[#F47822]"
                        />

                        {!collapsed && (
                            <>
                                <div className="min-w-0 flex-1">
                                    <p className="
                                        truncate
                                        text-xs
                                        font-semibold
                                        text-[#3A3A3A] dark:text-[#ececef]
                                    ">
                                        {firstName} {lastName}
                                    </p>

                                    <p dir="ltr" className="
                                        truncate
                                        text-[10px]
                                        text-[#3A3A3A]/40 dark:text-white/40
                                        rtl:text-right
                                    ">
                                        {user?.email}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    title={t("dashboard.sidebar.logout")}
                                    aria-label={t("dashboard.sidebar.logout")}
                                    className="
                                        flex
                                        h-8
                                        w-8
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-lg
                                        text-[#3A3A3A]/35 dark:text-white/35
                                        transition
                                        hover:bg-red-50 dark:hover:bg-red-500/10
                                        hover:text-red-500
                                    "
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
