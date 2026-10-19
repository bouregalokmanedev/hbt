import { Outlet } from "react-router-dom";
import { VisitorTracker } from "@/features/marketing/tracking";

import { Navbar, ScrollToTop } from "@/components/navigation";
import { HelpWidget } from "@/components/help/HelpWidget";

export function PublicLayout() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <ScrollToTop />
            <Navbar />

            <main className="min-h-screen pt-20">
                <><VisitorTracker /><Outlet /></>
            </main>

            <HelpWidget />
        </div>
    );
}