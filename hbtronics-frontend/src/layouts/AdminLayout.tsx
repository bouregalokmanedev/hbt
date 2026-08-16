import { useState } from "react";
import { Outlet } from "react-router-dom";

import {
    adminNavigation,
} from "@/config/navigation";

import {
    Breadcrumb,
    Sidebar,
    Topbar,
} from "@/components/navigation";


export function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] =
        useState(false);

    return (
        <div className="flex min-h-screen bg-[var(--background)]">
            <Sidebar
                items={adminNavigation}
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <Topbar
                    onMenuClick={() =>
                        setSidebarOpen(true)
                    }
                />

                <div className="border-b border-[var(--border)] px-4 py-3 sm:px-6 lg:px-8">
                    <Breadcrumb
                        items={[
                            {
                                label: "Administration",
                            },
                        ]}
                    />
                </div>

                <main className="min-w-0 flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}