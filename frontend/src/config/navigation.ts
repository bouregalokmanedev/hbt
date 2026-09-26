import type { LucideIcon } from "lucide-react";
import {
    BookOpen,
    Award,
    ChartNoAxesCombined,
    LayoutDashboard,
    Settings,
    ShieldCheck,
    Users,
} from "lucide-react";

export interface NavigationItem {
    label: string;
    href: string;
    icon: LucideIcon;
    roles?: string[];
}

export const studentNavigation: NavigationItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "My Courses",
        href: "/my-courses",
        icon: BookOpen,
    },
    {
        label: "Certificates",
        href: "/certificates",
        icon: Award,
    },
    {
        label: "Progress",
        href: "/achievements",
        icon: ChartNoAxesCombined,
    },
    {
        label: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

export const adminNavigation: NavigationItem[] = [
    {
        label: "Overview",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        label: "Users",
        href: "/admin/users",
        icon: Users,
    },
    {
        label: "Courses",
        href: "/admin/courses",
        icon: BookOpen,
    },
    {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
    },
    {
        label: "Security",
        href: "/admin/security",
        icon: ShieldCheck,
    },
];