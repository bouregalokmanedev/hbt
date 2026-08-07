import type { RouteObject } from "react-router-dom";

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
        ],
    },
];