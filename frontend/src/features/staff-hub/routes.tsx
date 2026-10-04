import type { RouteObject } from "react-router-dom";

import { MessagesPage, RoomPage } from "@/features/messages/pages/MessagesPage";
import { StaffHubOverviewPage } from "./pages/StaffHubOverviewPage";
import { StaffHubPage } from "./pages/StaffHubPage";

/**
 * The Staff Hub is mounted once per role area (`/admin/staff-hub`,
 * `/support-desk/staff-hub`, `/instructor/staff-hub`) so each one sits behind
 * its own RoleGuard and inside its own layout.
 */
export function staffHubRoutes(hubBase: string): RouteObject[] {
    return [
        {
            path: hubBase,
            element: <StaffHubPage hubBase={hubBase} />,
            children: [
                { index: true, element: <StaffHubOverviewPage hubBase={hubBase} /> },
                { path: "news", element: <MessagesPage mode="announcements" basePath={hubBase} embedded /> },
                { path: "room", element: <RoomPage basePath={hubBase} embedded /> },
            ],
        },
    ];
}
