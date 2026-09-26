import { Outlet } from "react-router-dom";

import { Navbar, ScrollToTop } from "@/components/navigation";

export function PublicLayout() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <ScrollToTop />
            <Navbar />

            <main className="min-h-screen pt-20">
                <Outlet />
            </main>
        </div>
    );
}