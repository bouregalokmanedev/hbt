import type { User } from "../types/auth.types";

/**
 * Returns the one correct workspace entry point for an authenticated account.
 * Keep the priority explicit: privileged administrative access wins when a
 * user has more than one assigned role.
 */
export function dashboardRouteFor(user: Pick<User, "roles"> | null | undefined): string {
    const roles = user?.roles ?? [];

    if (roles.includes("Super Admin") || roles.includes("Admin")) {
        return "/admin";
    }

    if (roles.includes("Instructor")) {
        return "/instructor";
    }

    return "/dashboard";
}
