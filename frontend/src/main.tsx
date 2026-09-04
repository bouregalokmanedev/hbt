import "@fontsource/cairo/400.css";
import "@fontsource/cairo/500.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";
import "@fontsource/cairo/800.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { RouterProvider } from "react-router-dom";

import { router } from "@/app/router";

import { AuthInitializer } from "@/features/auth/AuthInitializer";

import { AuthLanguageProvider } from "@/features/auth/i18n/auth-language";

import { QueryProvider } from "@/providers/QueryProvider";

import "@/styles/globals.css";
import "@/i18n";
import i18n from "@/i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <AuthLanguageProvider>
        <AuthInitializer>
          <QueryProvider>
            <RouterProvider router={router} />
          </QueryProvider>
        </AuthInitializer>
      </AuthLanguageProvider>
    </I18nextProvider>
  </React.StrictMode>,
);
