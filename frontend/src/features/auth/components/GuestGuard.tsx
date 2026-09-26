import {
    Navigate,
    Outlet,
} from "react-router-dom";

import {
    useAuth,
} from "../hooks/useAuth";
import {
    dashboardRouteFor,
} from "../utils/dashboard-route";

export function GuestGuard() {
    const {
        user,
        isLoading,
        isInitialized,
    } = useAuth();

    /*
     * Only gate the initial session check. Toggling the spinner on
     * `isLoading` unmounts LoginPage mid-submit, so the 423 MFA catch
     * ran against a dead instance — sessionStorage was written (refresh
     * recovered) but the live page never re-read it.
     */
    if (!isInitialized) {
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
                to={dashboardRouteFor(user)}
                replace
            />
        );
    }

    return <Outlet />;
}
