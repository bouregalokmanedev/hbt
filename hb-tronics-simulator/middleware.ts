import createMiddleware from "next-intl/middleware";
import { routableLocales, defaultLocale } from "./lib/i18n/config";

/** Locale negotiation: URL → cookie (NEXT_LOCALE) → Accept-Language → en (14 §2). */
export default createMiddleware({
  locales: [...routableLocales],
  defaultLocale,
  localeDetection: true,
});

export const config = {
  // Match all paths except Next internals, API and files with an extension.
  matcher: ["/((?!api|_next|_vercel|assets|.*\\..*).*)"],
};
