import {
    Activity,
    BarChart3,
    BellRing,
    BookOpen,
    Briefcase,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    CreditCard,
    FlaskConical,
    GraduationCap,
    KeyRound,
    LayoutDashboard,
    LifeBuoy,
    LogOut,
    MonitorCog,
    MessageCircle,
    PieChart,
    Settings,
    ShieldAlert,
    ShieldCheck,
    Stethoscope,
    UserRound,
    UserRoundCheck,
    Users,
    X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth";
import { UserAvatar } from "@/components/ui";
import { useSidebarBadges } from "@/features/notifications/hooks/useSidebarBadges";
import hbtLogo from "@/assets/brand/hbt-logo-full.png";
import hbtCompactLogo from "@/assets/brand/hbt-logo.jpg";

interface NavEntry {
    labelKey: string;
    to: string;
    icon: React.ElementType;
}

interface NavSection {
    titleKey: string;
    items: NavEntry[];
}

const sections: NavSection[] = [
    {
        titleKey: "admin.sidebar.overview",
        items: [{ labelKey: "admin.sidebar.overview", to: "/admin", icon: LayoutDashboard }],
    },
    {
        titleKey: "admin.sidebar.people",
        items: [
            { labelKey: "admin.sidebar.peopleAll", to: "/admin/users", icon: Users },
            { labelKey: "admin.sidebar.students", to: "/admin/students", icon: GraduationCap },
            { labelKey: "admin.sidebar.instructors", to: "/admin/instructors", icon: Briefcase },
            { labelKey: "admin.sidebar.enrollments", to: "/admin/enrollments", icon: UserRoundCheck },
        ],
    },
    {
        titleKey: "admin.sidebar.learning",
        items: [
            { labelKey: "admin.sidebar.courseReview", to: "/admin/courses", icon: BookOpen },
            { labelKey: "admin.sidebar.assessments", to: "/admin/assessments", icon: ClipboardCheck },
            { labelKey: "admin.sidebar.diagnostics", to: "/admin/diagnostics", icon: Stethoscope },
            { labelKey: "admin.sidebar.simulator", to: "/admin/simulator", icon: FlaskConical },
        ],
    },
    {
        titleKey: "admin.sidebar.business",
        items: [
            { labelKey: "admin.sidebar.commerce", to: "/admin/commerce", icon: CreditCard },
            { labelKey: "admin.sidebar.analytics", to: "/admin/analytics", icon: BarChart3 },
            { labelKey: "admin.sidebar.crmStats", to: "/admin/crm-stats", icon: PieChart },
            { labelKey: "admin.sidebar.activity", to: "/admin/activity", icon: Activity },
        ],
    },
    {
        titleKey: "admin.sidebar.communication",
        items: [
            { labelKey: "admin.sidebar.staffHub", to: "/admin/staff-hub", icon: Users },
            { labelKey: "admin.sidebar.announcements", to: "/admin/announcements", icon: BellRing },
            { labelKey: "admin.sidebar.messages", to: "/admin/messages", icon: MessageCircle },
            { labelKey: "admin.sidebar.support", to: "/admin/support", icon: LifeBuoy },
        ],
    },
    {
        titleKey: "admin.sidebar.governance",
        items: [
            { labelKey: "admin.sidebar.risk", to: "/admin/risk", icon: ShieldAlert },
            { labelKey: "admin.sidebar.security", to: "/admin/security", icon: ShieldCheck },
            { labelKey: "admin.sidebar.roles", to: "/admin/roles", icon: KeyRound },
            { labelKey: "admin.sidebar.system", to: "/admin/system", icon: MonitorCog },
            { labelKey: "admin.sidebar.settings", to: "/admin/settings", icon: Settings },
        ],
    },
];

interface Props { open: boolean; collapsed: boolean; onClose(): void; onToggle(): void; }

export function AdminSidebar({ open, collapsed, onClose, onToggle }: Props) {
    const { user, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const { badges } = useSidebarBadges();
    const isRTL = i18n.language === "ar";
    const navigate = useNavigate();
    // Access control lives here too: only Super Admins ever see the Roles
    // section (the API returns 403 for everyone else).
    const isSuperAdmin = user?.roles?.includes("Super Admin") ?? false;
    const visibleSections = sections.map((section) => ({
        ...section,
        items: section.items.filter((item) => item.to !== "/admin/roles" || isSuperAdmin),
    }));

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate("/login", { replace: true });
        }
    };

    return <>
        {open && <button type="button" aria-label={t("admin.sidebar.closeAria")} onClick={onClose} className="fixed inset-0 z-40 bg-[#3A3A3A]/30 backdrop-blur-sm lg:hidden" />}
        <aside className={`fixed inset-y-0 start-0 z-50 flex w-[272px] flex-col border-e border-[#3A3A3A]/8 bg-[#FCFCFC] shadow-[12px_0_40px_rgba(58,58,58,.07)] rtl:shadow-[-12px_0_40px_rgba(58,58,58,.07)] transition-all duration-300 ${collapsed ? "lg:w-[78px]" : "lg:w-[272px]"} ${open ? "translate-x-0" : isRTL ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
            <div className={`flex h-[76px] shrink-0 items-center border-b border-[#3A3A3A]/7 bg-white/80 px-5 ${collapsed ? "justify-center px-0" : "justify-between"}`}>
                {!collapsed ? (
                    <div className="flex min-w-0 items-center">
                        <img src={hbtLogo} alt="HBTronics" className="h-8 w-auto max-w-[150px] object-contain object-left rtl:object-right" />
                        {isSuperAdmin && <span className="ms-2 shrink-0 rounded-full bg-[#3A3A3A] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">{t("admin.superBadge")}</span>}
                    </div>
                ) : (
                    <img src={hbtCompactLogo} alt="HBTronics" className="h-9 w-9 rounded-lg object-cover" />
                )}
                <button type="button" onClick={onClose} aria-label={t("admin.sidebar.closeAria")} className="grid h-8 w-8 place-items-center rounded-lg text-[#3A3A3A]/45 lg:hidden"><X className="h-4 w-4" /></button>
            </div>
            {/* Collapse toggle floating just outside the sidebar edge */}
            <button
                type="button"
                onClick={onToggle}
                aria-label={collapsed ? t("admin.sidebar.expandAria") : t("admin.sidebar.collapseAria")}
                title={collapsed ? t("admin.sidebar.expandAria") : t("admin.sidebar.collapseAria")}
                className="absolute -right-4 top-24 hidden h-8 w-8 items-center justify-center rounded-full border border-[#3A3A3A]/10 bg-white text-[#3A3A3A]/55 shadow-[0_4px_14px_rgba(58,58,58,0.12)] transition hover:border-[#F47822]/30 hover:text-[#F47822] lg:flex rtl:-left-4 rtl:right-auto"
            >
                {collapsed ? <ChevronRight className="h-4 w-4 rtl:-scale-x-100" /> : <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />}
            </button>
            <nav className="flex-1 overflow-y-auto px-3 py-5 [scrollbar-width:thin]">
                {!collapsed && <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[.18em] text-[#3A3A3A]/32">{t("admin.sidebar.control")}</p>}
                {visibleSections.map((section) => (
                    <div key={section.titleKey} className="mb-4 last:mb-0">
                        {!collapsed && <p className="mb-1 px-3 text-[9px] font-bold uppercase tracking-[.18em] text-[#3A3A3A]/32">{t(section.titleKey)}</p>}
                        <div className="space-y-1">
                            {section.items.map(({ labelKey, to, icon: Icon }) => {
                                const badgeCount =
                                    to === "/admin/messages"
                                        ? (badges.messages ?? 0)
                                        : to === "/admin/announcements"
                                          ? (badges.announcements ?? 0)
                                          : 0;
                                return (
                                <NavLink key={to} to={to} end={to === "/admin"} onClick={onClose} title={collapsed ? t(labelKey) : undefined} className={({ isActive }) => `relative flex h-11 items-center gap-3 rounded-xl px-3 text-xs font-semibold transition-all ${isActive ? "bg-[#F47822] text-white shadow-[0_8px_18px_rgba(244,120,34,.2)]" : "text-[#3A3A3A]/58 hover:bg-white hover:text-[#3A3A3A] hover:shadow-sm"} ${collapsed ? "justify-center px-0" : ""}`}>
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {!collapsed && <span className="truncate">{t(labelKey)}</span>}
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
                            })}
                        </div>
                    </div>
                ))}
            </nav>
            <div className="shrink-0 border-t border-[#3A3A3A]/8 p-3">
                {/* Profile */}
                <NavLink
                    to="/admin/profile"
                    onClick={onClose}
                    title={collapsed ? t("admin.sidebar.profile") : undefined}
                    className={({ isActive }) =>
                        `
                        group relative flex h-10 items-center gap-3 rounded-xl px-3
                        text-xs font-medium transition-all
                        ${isActive ? "bg-[#F47822]/10 text-[#F47822]" : "text-[#3A3A3A]/55 hover:bg-[#3A3A3A]/5 hover:text-[#3A3A3A]"}
                        ${collapsed ? "justify-center px-0" : ""}
                        `
                    }
                >
                    <UserRound className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{t("admin.sidebar.profile")}</span>}
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
                                    {user?.first_name} {user?.last_name}
                                </p>
                                <p className="truncate text-[10px] text-[#3A3A3A]/40">{user?.email}</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => void handleLogout()}
                                title={t("admin.sidebar.logout")}
                                aria-label={t("admin.sidebar.logout")}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#3A3A3A]/35 transition hover:bg-red-50 hover:text-red-500"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </aside>
    </>;
}
