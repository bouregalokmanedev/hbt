import {
    NavLink,
} from "react-router-dom";

import {
    LayoutDashboard,
    BookOpen,
    Award,
    Gauge,
    ClipboardCheck,
    Bot,
    Settings,
    HelpCircle,
    LogOut,
} from "lucide-react";

import {
    useAuth,
} from "@/features/auth";

import type {
    NavigationItem,
} from "@/config/navigation";

interface SidebarProps {
    items: NavigationItem[];
    open: boolean;
    onClose: () => void;
}

const navigation = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "My Learning",
        href: "/learning",
        icon: BookOpen,
    },
    {
        label: "Courses",
        href: "/courses",
        icon: BookOpen,
    },
    {
        label: "Certifications",
        href: "/certifications",
        icon: Award,
    },
    {
        label: "Simulator",
        href: "/simulator",
        icon: Gauge,
    },
    {
        label: "Assessments",
        href: "/assessments",
        icon: ClipboardCheck,
    },
    {
        label: "AI Assistant",
        href: "/ai",
        icon: Bot,
    },
];

const secondaryNavigation: NavigationItem[] = [
    {
        label: "Settings",
        href: "/settings",
        icon: Settings,
    },
    {
        label: "Help & Support",
        href: "/help",
        icon: HelpCircle,
    },
];

export function Sidebar({
    items,
    open,
    onClose,
}: SidebarProps) {
    const {
        logout,
    } = useAuth();

    return (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-card lg:flex lg:flex-col">
            <div className="flex h-16 items-center border-b border-border px-6">
                <div>
                    <div className="text-lg font-bold tracking-tight">
                        HBTronics
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                        Learning Platform
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                    {navigation.map(
                        ({
                            label,
                            href,
                            icon: Icon,
                        }) => (
                            <NavLink
                                key={href}
                                to={href}
                                className={({
                                    isActive,
                                }) =>
                                    [
                                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    ].join(" ")
                                }
                            >
                                <Icon
                                    size={18}
                                    strokeWidth={1.8}
                                />

                                <span>
                                    {label}
                                </span>
                            </NavLink>
                        ),
                    )}
                </div>

                <div className="my-6 h-px bg-border" />

                <div className="space-y-1">
                    {secondaryNavigation.map(
                        ({
                            label,
                            href,
                            icon: Icon,
                        }) => (
                            <NavLink
                                key={href}
                                to={href}
                                className={({
                                    isActive,
                                }) =>
                                    [
                                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                                        isActive
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    ].join(" ")
                                }
                            >
                                <Icon
                                    size={18}
                                    strokeWidth={1.8}
                                />

                                <span>
                                    {label}
                                </span>
                            </NavLink>
                        ),
                    )}
                </div>
            </nav>

            <div className="border-t border-border p-4">
                <button
                    type="button"
                    onClick={() =>
                        void logout()
                    }
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                    <LogOut
                        size={18}
                        strokeWidth={1.8}
                    />

                    Logout
                </button>
            </div>
        </aside>
    );
}