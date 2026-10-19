import type { RouteObject } from "react-router-dom";

import { AuthGuard, RoleGuard } from "@/features/auth";
import { staffHubRoutes } from "@/features/staff-hub/routes";
import { MarketingLayout } from "@/layouts/marketing/MarketingLayout";

export const marketingRoutes: RouteObject[] = [
    {
        element: <AuthGuard />,
        children: [
            {
                element: <RoleGuard roles={["Sales"]} />,
                children: [
                    {
                        element: <MarketingLayout />,
                        children: [
                            { path: "/marketing", lazy: () => import("@/features/marketing/pages/MarketingDashboardPage").then((m) => ({ Component: m.MarketingDashboardPage })) },
                            { path: "/marketing/analytics", lazy: () => import("@/features/marketing/pages/MarketingAnalyticsPage").then((m) => ({ Component: m.MarketingAnalyticsPage })) },
                            { path: "/marketing/campaigns", lazy: () => import("@/features/marketing/pages/MarketingCampaignsPage").then((m) => ({ Component: m.MarketingCampaignsPage })) },
                            { path: "/marketing/featured", lazy: () => import("@/features/marketing/pages/MarketingFeaturedPage").then((m) => ({ Component: m.MarketingFeaturedPage })) },
                            { path: "/marketing/referrals", lazy: () => import("@/features/marketing/pages/MarketingReferralsPage").then((m) => ({ Component: m.MarketingReferralsPage })) },
                            { path: "/marketing/broadcasts", lazy: () => import("@/features/marketing/pages/MarketingBroadcastsPage").then((m) => ({ Component: m.MarketingBroadcastsPage })) },
                            { path: "/marketing/leads", lazy: () => import("@/features/marketing/pages/MarketingLeadsPage").then((m) => ({ Component: m.MarketingLeadsPage })) },
                            { path: "/marketing/sheet", lazy: () => import("@/features/marketing/pages/MarketingSheetPage").then((m) => ({ Component: m.MarketingSheetPage })) },
                            ...staffHubRoutes("/marketing/staff-hub"),
                            { path: "/marketing/guide", lazy: () => import("@/features/guide/pages").then((m) => ({ Component: m.MarketingGuidePage })) },
                            { path: "/marketing/profile", lazy: () => import("@/features/profile/pages/ProfilePage").then((m) => ({ Component: m.ProfilePage })) },
                        ],
                    },
                ],
            },
        ],
    },
];
