import { useState } from "react";
import { Outlet } from "react-router-dom";

import { AdminNavbar } from "./admin/AdminNavbar";
import { AdminSidebar } from "./admin/AdminSidebar";
import { ScrollToTop } from "@/components/navigation";


export function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-[#3A3A3A]">
            <ScrollToTop />
            <AdminSidebar open={sidebarOpen} collapsed={sidebarCollapsed} onClose={() => setSidebarOpen(false)} onToggle={() => setSidebarCollapsed((value) => !value)} />
            <div className={`min-h-screen transition-[padding] duration-300 ${sidebarCollapsed ? "lg:ps-[78px]" : "lg:ps-[272px]"}`}>
                <AdminNavbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><Outlet /></main>
            </div>
        </div>
    );
}
