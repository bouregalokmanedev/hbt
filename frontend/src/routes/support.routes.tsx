import type { RouteObject } from "react-router-dom";

import { AuthGuard, RoleGuard } from "@/features/auth";
import { SupportLayout } from "@/layouts/support/SupportLayout";
import { AnnouncementsPage, MessagesPage } from "@/features/messages/pages/MessagesPage";
import { staffHubRoutes } from "@/features/staff-hub/routes";
import { SupportDeskTicketsPage } from "@/features/support-desk/pages/SupportDeskTicketsPage";

export const supportRoutes: RouteObject[] = [
    {
        element: <AuthGuard />,
        children: [
            {
                element: <RoleGuard roles={["Support"]} />,
                children: [
                    {
                        element: <SupportLayout />,
                        children: [
                            { path: "/support-desk", lazy: () => import("@/features/support-desk/pages/SupportDeskDashboardPage").then((m) => ({ Component: m.SupportDeskDashboardPage })) },
                            { path: "/support-desk/tickets", element: <SupportDeskTicketsPage /> },
                            { path: "/support-desk/my-tickets", element: <SupportDeskTicketsPage lockedAssigned="me" /> },
                            { path: "/support-desk/tickets/:ticketId", lazy: () => import("@/features/support-desk/pages/SupportDeskTicketPage").then((m) => ({ Component: m.SupportDeskTicketPage })) },
                            { path: "/support-desk/mail", lazy: () => import("@/features/support-desk/pages/SupportMailboxPage").then((m) => ({ Component: m.SupportMailboxPage })) },
                            { path: "/support-desk/messages", element: <MessagesPage basePath="/support-desk" /> },
                            { path: "/support-desk/announcements", element: <AnnouncementsPage basePath="/support-desk" /> },
                            ...staffHubRoutes("/support-desk/staff-hub"),
                            { path: "/support-desk/settings", lazy: () => import("@/features/support-desk/pages/SupportSettingsPage").then((m) => ({ Component: m.SupportSettingsPage })) },
                            { path: "/support-desk/profile", lazy: () => import("@/features/profile/pages/ProfilePage").then((m) => ({ Component: m.ProfilePage })) },
                        ],
                    },
                ],
            },
        ],
    },
];
