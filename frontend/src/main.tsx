import "@fontsource/cairo/400.css";
import "@fontsource/cairo/500.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";
import "@fontsource/cairo/800.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { router } from "@/app/router";

import {
    AuthInitializer,
} from "@/features/auth/AuthInitializer";

import {
    AuthLanguageProvider,
} from "@/features/auth/i18n/auth-language";

import {
    QueryProvider,
} from "@/providers/QueryProvider";

import "@/styles/globals.css";

ReactDOM.createRoot(
    document.getElementById("root")!,
).render(
    <React.StrictMode>
        <AuthLanguageProvider>
            <AuthInitializer>
                <QueryProvider>
                    <RouterProvider router={router} />
                </QueryProvider>
            </AuthInitializer>
        </AuthLanguageProvider>
    </React.StrictMode>,
);