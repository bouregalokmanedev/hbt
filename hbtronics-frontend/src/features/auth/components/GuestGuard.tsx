import {
    Navigate,
    Outlet,
} from "react-router-dom";

import {
    useAuth,
} from "../hooks/useAuth";

export function GuestGuard() {
    const {
        user,
        isLoading,
        isInitialized,
    } = useAuth();

    if (
        !isInitialized ||
        isLoading
    ) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />

                    <p className="mt-4 text-sm text-muted-foreground">
                        Checking your session...
                    </p>
                </div>
            </div>
        );
    }

    if (user) {
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }

    return <Outlet />;
}