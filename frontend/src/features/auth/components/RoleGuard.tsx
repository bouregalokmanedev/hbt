import {
    Navigate,
    Outlet,
} from "react-router-dom";

import {
    useAuthStore,
} from "../store/auth.store";
import {
    dashboardRouteFor,
} from "../utils/dashboard-route";

interface RoleGuardProps {
    roles: string[];
}

export function RoleGuard({
    roles,
}: RoleGuardProps) {
    const user =
        useAuthStore(
            (state) => state.user,
        );

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    const hasRole =
        user.roles.some((role) =>
            roles.includes(role),
        );

    if (!hasRole) {
        return (
            <Navigate
                to={dashboardRouteFor(user)}
                replace
            />
        );
    }

    return <Outlet />;
}
