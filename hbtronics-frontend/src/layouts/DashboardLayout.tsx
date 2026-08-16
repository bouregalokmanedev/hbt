import { useState } from "react";

import { Outlet } from "react-router-dom";

import { DashboardSidebar } from "../layouts/dashboard/DashboardSidebar";
import { DashboardNavbar } from "../layouts/dashboard/DashboardNavbar";

export function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] =
        useState(false);

    const [sidebarCollapsed, setSidebarCollapsed] =
        useState(false);

    return (
        <div className="min-h-screen bg-[#F3F3F3] text-[#3A3A3A]">
            <DashboardSidebar
                open={sidebarOpen}
                collapsed={sidebarCollapsed}
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
                        sidebarCollapsed
                            ? "lg:pl-[76px]"
                            : "lg:pl-[260px]"
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
        </div>
    );
}