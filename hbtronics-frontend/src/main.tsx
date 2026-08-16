import "@fontsource/cairo/400.css";
import "@fontsource/cairo/500.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";
import "@fontsource/cairo/800.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import {
    ThemeProvider,
} from "../src/providers/ThemeProvider";

import { router } from "@/app/router";

import {
    AuthInitializer,
} from "@/features/auth/AuthInitializer";
import { AuthLanguageProvider } from "@/features/auth/i18n/auth-language";
import "@/styles/globals.css";

ReactDOM.createRoot(
    document.getElementById("root")!,
).render(
    <React.StrictMode>
        <ThemeProvider>
        <AuthLanguageProvider>
        <AuthInitializer>
            <RouterProvider
                router={router}
            />
        </AuthInitializer>
        </AuthLanguageProvider>
        </ThemeProvider>
    </React.StrictMode>,
);