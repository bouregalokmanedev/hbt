import "../globals.css";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routableLocales, dir, isRoutableLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { fontVariables } from "@/styles/fonts";
import { StoreProvider } from "@/providers/StoreProvider";
import { ServiceWorker } from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "HB TRONICS SaaS Simulator",
  description: "Five specialised tools. One diagnostic bench.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0E1114",
};

export function generateStaticParams() {
  return routableLocales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isRoutableLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  // The pseudo QA locale is English-based; the store treats it as `en`.
  const storeLang: Locale = isLocale(locale) ? locale : "en";

  return (
    <html lang={locale} dir={dir(locale)} className={fontVariables}>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <StoreProvider language={storeLang}>{children}</StoreProvider>
        </NextIntlClientProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
