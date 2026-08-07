import type { RouteObject } from "react-router-dom";

import { UiShowcasePage } from "@/features/dev";
import { PublicLayout } from "@/layouts/PublicLayout";

function HomePage() {
    return <div>HBTronics</div>;
}

export const publicRoutes: RouteObject[] = [
    {
        element: <PublicLayout />,
        children: [
            {
                path: "/",
                element: <HomePage />,
            },
            {
                path: "/dev/ui",
                element: <UiShowcasePage />,
            },
        ],
    },
];