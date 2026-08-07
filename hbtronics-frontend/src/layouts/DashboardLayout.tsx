import { Outlet } from "react-router-dom";

export function DashboardLayout() {
    return (
        <div className="min-h-screen">
            <main>
                <Outlet />
            </main>
        </div>
    );
}