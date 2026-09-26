import type { RouteObject } from "react-router-dom";

import { AuthGuard, RoleGuard } from "@/features/auth";
import { SupportLayout } from "@/layouts/support/SupportLayout";
import { AnnouncementsPage, MessagesPage } from "@/features/messages/pages/MessagesPage";
import { ProfilePage } from "@/features/profile/pages/ProfilePage";
import { SupportDeskDashboardPage } from "@/features/support-desk/pages/SupportDeskDashboardPage";
import { SupportDeskTicketPage } from "@/features/support-desk/pages/SupportDeskTicketPage";
import { SupportDeskTicketsPage } from "@/features/support-desk/pages/SupportDeskTicketsPage";
import { SupportSettingsPage } from "@/features/support-desk/pages/SupportSettingsPage";

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
                            { path: "/support-desk", element: <SupportDeskDashboardPage /> },
                            { path: "/support-desk/tickets", element: <SupportDeskTicketsPage /> },
                            { path: "/support-desk/my-tickets", element: <SupportDeskTicketsPage lockedAssigned="me" /> },
                            { path: "/support-desk/tickets/:ticketId", element: <SupportDeskTicketPage /> },
                            { path: "/support-desk/messages", element: <MessagesPage basePath="/support-desk" /> },
                            { path: "/support-desk/announcements", element: <AnnouncementsPage basePath="/support-desk" /> },
                            { path: "/support-desk/settings", element: <SupportSettingsPage /> },
                            { path: "/support-desk/profile", element: <ProfilePage /> },
                        ],
                    },
                ],
            },
        ],
    },
];
