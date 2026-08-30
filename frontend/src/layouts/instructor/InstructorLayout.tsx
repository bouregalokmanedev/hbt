import {
    useState,
} from "react";

import {
    Outlet,
} from "react-router-dom";

import {
    InstructorNavbar,
} from "./InstructorNavbar";

import {
    InstructorSidebar,
} from "./InstructorSidebar";

export function InstructorLayout() {
    const [
        sidebarOpen,
        setSidebarOpen,
    ] = useState(false);

    const [
        sidebarCollapsed,
        setSidebarCollapsed,
    ] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <InstructorSidebar
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
                <InstructorNavbar
                    onMenuClick={() =>
                        setSidebarOpen(true)
                    }
                />

                <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}