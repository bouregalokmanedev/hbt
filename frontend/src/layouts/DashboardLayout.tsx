import { useEffect, useState } from "react";

import { Outlet, useLocation } from "react-router-dom";

import { DashboardSidebar } from "../layouts/dashboard/DashboardSidebar";
import { DashboardNavbar } from "../layouts/dashboard/DashboardNavbar";
import { ScrollToTop } from "@/components/navigation";
import { AnnouncementPopup } from "@/features/messages/components/AnnouncementPopup";
import { settingsApi } from "@/features/settings/api/settings.api";
import { setTheme, useTheme, type ThemeChoice } from "@/lib/theme";

export function DashboardLayout() {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] =
        useState(false);

    // Student Appearance setting drives the whole dashboard theme.
    const [theme, setThemeChoice] = useState<ThemeChoice | undefined>(undefined);
    useTheme(theme);

    useEffect(() => {
        let cancelled = false;
        void settingsApi
            .get()
            .then((settings) => {
                if (cancelled) return;
                const raw = settings?.appearance?.appearance;
                const choice: ThemeChoice =
                    raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
                setThemeChoice(choice);
                setTheme(choice);
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, []);

    const [sidebarCollapsed, setSidebarCollapsed] =
        useState(false);

    // Simulator benches and diagnostic scenario workspaces need full width:
    // auto-minimise the sidebar and keep it locked while any /simulator or
    // /diagnostics route is active. The user's own preference
    // (sidebarCollapsed) is preserved and restored on exit.
    const path = location.pathname;
    const simLocked =
        path.startsWith("/simulator") ||
        path.startsWith("/diagnostics");

    return (
        <div className="dashboard-page-ar min-h-screen bg-background text-foreground">
            <ScrollToTop />
            <DashboardSidebar
                open={sidebarOpen}
                collapsed={simLocked ? true : sidebarCollapsed}
                locked={simLocked}
                onClose={() =>
                    setSidebarOpen(false)
                }
                onToggleCollapse={() =>
                    setSidebarCollapsed(
                        (value) => !value,
                    )
                }
            />

            <div
                className={`
                    min-h-screen
                    transition-[padding]
                    duration-300
                    ${
                        (simLocked ? true : sidebarCollapsed)
                            ? "lg:ps-[76px]"
                            : "lg:ps-[260px]"
                    }
                `}
            >
                <DashboardNavbar
    onMenuClick={() =>
        setSidebarOpen(true)
    }
/>

                <Outlet />
            </div>
            <AnnouncementPopup />
        </div>
    );
}
