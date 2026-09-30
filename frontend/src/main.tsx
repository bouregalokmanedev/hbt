import "@fontsource/tajawal/400.css";
import "@fontsource/tajawal/500.css";
import "@fontsource/tajawal/700.css";
import "@fontsource/tajawal/800.css";
import "@fontsource/noto-sans-arabic/400.css";
import "@fontsource/noto-sans-arabic/500.css";
import "@fontsource/noto-sans-arabic/600.css";
import "@fontsource/noto-sans-arabic/700.css";
import "@fontsource/noto-sans-arabic/800.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { RouterProvider } from "react-router-dom";

import { router } from "@/app/router";

import { AuthInitializer } from "@/features/auth/AuthInitializer";

import { AuthLanguageProvider } from "@/features/auth/i18n/auth-language";

import { CookieConsentBanner } from "@/features/cookies/CookieConsentBanner";

import { QueryProvider } from "@/providers/QueryProvider";

import "@/styles/globals.css";
import i18n, { initialLocaleReady } from "@/i18n";
import { initTheme } from "@/lib/theme";

initTheme();

const root = ReactDOM.createRoot(document.getElementById("root")!);

// Resolves on the next microtask for English, after the (lazy) Arabic chunk
// for Arabic, so the first paint never shows fallback strings.
void initialLocaleReady.then(() => {
  root.render(
    <React.StrictMode>
      <I18nextProvider i18n={i18n}>
        <AuthLanguageProvider>
          <AuthInitializer>
            <QueryProvider>
              <RouterProvider router={router} />
              <CookieConsentBanner />
            </QueryProvider>
          </AuthInitializer>
        </AuthLanguageProvider>
      </I18nextProvider>
    </React.StrictMode>,
  );
});
