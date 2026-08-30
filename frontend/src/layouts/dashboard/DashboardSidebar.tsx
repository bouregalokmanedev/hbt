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
    LogOut,
    MessageSquare,
    BellRing,
    MonitorPlay,
    Settings,
    Sparkles,
    Trophy,
    UserRound,
    X,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import hbtLogo from "@/assets/brand/hbt-logo-full.png";
import hbtCompactLogo from "@/assets/brand/hbt-logo.jpg";

interface DashboardSidebarProps {
    open: boolean;
    collapsed: boolean;
    onClose: () => void;
    onToggleCollapse: () => void;
}

interface NavigationItem {
    label: string;
    to: string;
    icon: React.ElementType;
}

const overviewItems: NavigationItem[] = [
    {
        label: "Dashboard",
        to: "/dashboard",
        icon: LayoutDashboard,
    },
];

const learningItems: NavigationItem[] = [
    {
        label: "My Courses",
        to: "/my-courses",
        icon: BookOpen,
    },
    {
        label: "Course Catalog",
        to: "/catalog",
        icon: BookOpen,
    },
    {
        label: "Assessments",
        to: "/assessments",
        icon: ClipboardCheck,
    },
];

const progressItems: NavigationItem[] = [
    {
        label: "Achievements",
        to: "/achievements",
        icon: Trophy,
    },
    {
        label: "Certificates",
        to: "/certificates",
        icon: Award,
    },
];

const toolsItems: NavigationItem[] = [
    {
        label: "Simulator",
        to: "/simulator",
        icon: MonitorPlay,
    },
    {
        label: "AI Mentor",
        to: "/ai-mentor",
        icon: BrainCircuit,
    },
    {
        label: "Messages",
        to: "/messages",
        icon: MessageSquare,
    },
    {
        label: "Announcements",
        to: "/announcements",
        icon: BellRing,
    },
];

const personalItems: NavigationItem[] = [
    {
        label: "Favourite",
        to: "/favourite",
        icon: Heart,
    },
    {
        label: "Subscription",
        to: "/subscription",
        icon: CreditCard,
    },
];

interface NavigationSectionProps {
    title: string;
    items: NavigationItem[];
    collapsed: boolean;
    onClose: () => void;
}

function NavigationSection({
    title,
    items,
    collapsed,
    onClose,
}: NavigationSectionProps) {
    return (
            <div className="mt-7 first:mt-0">
            {!collapsed && (
                <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-[#3A3A3A]/30">
                    {title}
                </p>
            )}

            <div className="space-y-1">
                {items.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end
                            onClick={onClose}
                            title={
                                collapsed
                                    ? item.label
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
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <span className="absolute -left-1 h-5 w-[3px] rounded-r-full bg-[#F47822]" />
                                    )}

                                    <Icon
                                        className={`
                                            h-4 w-4 shrink-0
                                            transition-colors
                                            ${
                                                isActive
                                                    ? "text-white"
                                                    : "text-[#3A3A3A]/40 group-hover:text-[#F47822]"
                                            }
                                        `}
                                    />

                                    {!collapsed && (
                                        <span className="truncate">
                                            {item.label}
                                        </span>
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
    onClose,
    onToggleCollapse,
}: DashboardSidebarProps) {
    const {
        user,
        logout,
    } = useAuth();

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

    const initials =
        `${firstName.charAt(0)}${lastName.charAt(0)}`
            .toUpperCase();

    return (
        <>
            {/* Mobile backdrop */}
            {open && (
                <button
                    type="button"
                    aria-label="Close navigation"
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
                    left-0
                    z-50
                    flex
                    flex-col
                    border-r
                    border-[#3A3A3A]/8
                    bg-[#FCFCFC]
                    shadow-[10px_0_36px_rgba(58,58,58,0.06)]
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
                        border-b border-[#3A3A3A]/6 bg-white/75 backdrop-blur-sm
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
                        aria-label={
                            collapsed
                                ? "Expand sidebar"
                                : "Collapse sidebar"
                        }
                        title={
                            collapsed
                                ? "Expand sidebar"
                                : "Collapse sidebar"
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
                            ${collapsed ? "absolute right-3 top-1/2 -translate-y-1/2" : ""}
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
                        aria-label="Close navigation"
                        className="
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-lg
                            text-[#3A3A3A]/40
                            transition
                            hover:bg-[#3A3A3A]/5
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
                        title="Overview"
                        items={overviewItems}
                        collapsed={collapsed}
                        onClose={onClose}
                    />

                    <NavigationSection
                        title="Learning"
                        items={learningItems}
                        collapsed={collapsed}
                        onClose={onClose}
                    />

                    <NavigationSection
                        title="Progress"
                        items={progressItems}
                        collapsed={collapsed}
                        onClose={onClose}
                    />

                    <NavigationSection
                        title="Tools"
                        items={toolsItems}
                        collapsed={collapsed}
                        onClose={onClose}
                    />

                    <NavigationSection
                        title="Personal"
                        items={personalItems}
                        collapsed={collapsed}
                        onClose={onClose}
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
                                text-left
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
                                -right-8
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
                                -left-10
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
                                    Unlock HBT Pro
                                </p>

                                <p className="
                                    mt-1
                                    text-[10px]
                                    leading-4
                                    text-white/45
                                ">
                                    Unlimited learning tools, AI support
                                    and advanced features.
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
                                        Explore Pro
                                    </span>

                                    <ChevronRight
                                        className="
                                            h-3
                                            w-3
                                            transition-transform
                                            duration-200
                                            group-hover:translate-x-1
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

                <div className="shrink-0 border-t border-[#3A3A3A]/6 p-3">
                    {/* Settings */}
                    <NavLink
                        to="/settings"
                        onClick={onClose}
                        title={
                            collapsed
                                ? "Settings"
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
                                    : "text-[#3A3A3A]/55 hover:bg-[#3A3A3A]/5 hover:text-[#3A3A3A]"
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
                                Settings
                            </span>
                        )}
                    </NavLink>

                    {/* Profile */}
                    <NavLink
                        to="/profile"
                        onClick={onClose}
                        title={
                            collapsed
                                ? "Profile"
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
                                    : "text-[#3A3A3A]/55 hover:bg-[#3A3A3A]/5 hover:text-[#3A3A3A]"
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
                                Profile
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
                            border-[#3A3A3A]/6
                            bg-[#F7F7F7]
                            p-2

                            ${
                                collapsed
                                    ? "justify-center"
                                    : ""
                            }
                        `}
                    >
                        {/* Avatar */}
                        <div className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-[#F47822]/10
                            text-xs
                            font-bold
                            text-[#F47822]
                        ">
                            {initials || "U"}
                        </div>

                        {!collapsed && (
                            <>
                                <div className="min-w-0 flex-1">
                                    <p className="
                                        truncate
                                        text-xs
                                        font-semibold
                                        text-[#3A3A3A]
                                    ">
                                        {firstName} {lastName}
                                    </p>

                                    <p className="
                                        truncate
                                        text-[10px]
                                        text-[#3A3A3A]/40
                                    ">
                                        {user?.email}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    title="Log out"
                                    aria-label="Log out"
                                    className="
                                        flex
                                        h-8
                                        w-8
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-lg
                                        text-[#3A3A3A]/35
                                        transition
                                        hover:bg-red-50
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
