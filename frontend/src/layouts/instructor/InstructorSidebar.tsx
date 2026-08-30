import {
    BarChart3,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    MessageCircle,
    Megaphone,
    Users,
    X,
} from "lucide-react";

import {
    NavLink,
    useNavigate,
} from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";

interface InstructorSidebarProps {
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

const navigationItems: NavigationItem[] = [
    {
        label: "Dashboard",
        to: "/instructor",
        icon: LayoutDashboard,
    },
    {
        label: "My Courses",
        to: "/instructor/courses",
        icon: BookOpen,
    },
    {
        label: "Students",
        to: "/instructor/students",
        icon: Users,
    },
    {
        label: "Messages",
        to: "/instructor/messages",
        icon: MessageCircle,
    },
    {
        label: "Announcements",
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
    const {
        user,
        logout,
    } = useAuth();

    const navigate = useNavigate();

    const firstName =
        user?.first_name ?? "";

    const lastName =
        user?.last_name ?? "";

    const initials =
        `${firstName.charAt(0)}${lastName.charAt(0)}`
            .toUpperCase();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <>
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
                                Instructor
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

                            ${
                                collapsed
                                    ? "absolute right-3 top-1/2 -translate-y-1/2"
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
                        aria-label="Close navigation"
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

                <nav className="flex-1 px-3 py-5">
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
                        Instructor
                    </p>

                    <div className="space-y-1">
                        {navigationItems.map(
                            (item) => {
                                const Icon =
                                    item.icon;

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
                                                ? item.label
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
                                            <span>
                                                {
                                                    item.label
                                                }
                                            </span>
                                        )}
                                    </NavLink>
                                );
                            },
                        )}
                    </div>
                </nav>

                <div className="border-t border-[#3A3A3A]/8 p-3">
                    {!collapsed && (
                        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white p-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F47822] text-xs font-bold text-white">
                                {initials ||
                                    "IN"}
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-[#3A3A3A]">
                                    {firstName ||
                                        "Instructor"}{" "}
                                    {lastName}
                                </p>

                                <p className="text-[10px] text-[#3A3A3A]/45">
                                    Instructor
                                </p>
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleLogout}
                        title={
                            collapsed
                                ? "Logout"
                                : undefined
                        }
                        className={`
                            flex
                            h-10
                            w-full
                            items-center
                            gap-3
                            rounded-xl
                            px-3
                            text-xs
                            font-medium
                            text-[#3A3A3A]/50
                            transition
                            hover:bg-red-50
                            hover:text-red-600

                            ${
                                collapsed
                                    ? "justify-center px-0"
                                    : ""
                            }
                        `}
                    >
                        <LogOut className="h-4 w-4" />

                        {!collapsed && (
                            <span>
                                Logout
                            </span>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}
