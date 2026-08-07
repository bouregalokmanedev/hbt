import { Outlet } from "react-router-dom";

import { Navbar } from "@/components/navigation";

export function PublicLayout() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Navbar />

            <main>
                <Outlet />
            </main>
        </div>
    );
}