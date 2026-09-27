import i18n from "i18next";

import { initReactI18next } from "react-i18next";

import { en } from "./locales/en";

export type SupportedLocale = "en" | "ar";

export const DEFAULT_LOCALE: SupportedLocale = "en";

export const RTL_LOCALES: SupportedLocale[] = ["ar"];

export const isRTL = (locale: string): boolean =>
  RTL_LOCALES.includes(locale as SupportedLocale);

const savedLanguage = localStorage.getItem("hbt-language");

const initialLanguage =
  savedLanguage === "ar" || savedLanguage === "en" ? savedLanguage : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
  },

  lng: initialLanguage,

  fallbackLng: "en",

  interpolation: {
    escapeValue: false,
  },

  returnNull: false,
});

// The Arabic dictionary is a separate chunk: it is only downloaded when the
// interface actually needs it (initial language or a live switch), so English
// visitors never pay for it.
let arBundle: Promise<void> | null = null;

function ensureArBundle(): Promise<void> {
  if (!arBundle) {
    arBundle = import("./locales/ar")
      .then((mod) => {
        i18n.addResourceBundle("ar", "translation", mod.ar, true, true);
      })
      .catch(() => {
        // Fall back to English rather than blocking the UI.
      });
  }
  return arBundle;
}

export const initialLocaleReady: Promise<void> =
  initialLanguage === "ar" ? ensureArBundle() : Promise.resolve();

export function changeLanguage(language: SupportedLocale) {
  localStorage.setItem("hbt-language", language);

  const apply = () => {
    void i18n.changeLanguage(language);

    document.documentElement.lang = language;

    document.documentElement.dir = isRTL(language) ? "rtl" : "ltr";

    document.body.dir = isRTL(language) ? "rtl" : "ltr";

    document.documentElement.classList.toggle("rtl", isRTL(language));
  };

  if (language === "ar") {
    void ensureArBundle().then(apply);
  } else {
    apply();
  }
}

// Keep direction and typography correct even when a component changes
// i18next directly instead of going through the switcher helper.
i18n.on("languageChanged", (language) => {
  const locale: SupportedLocale = language === "ar" ? "ar" : "en";
  document.documentElement.lang = locale;
  document.documentElement.dir = isRTL(locale) ? "rtl" : "ltr";
  document.body.dir = isRTL(locale) ? "rtl" : "ltr";
  document.documentElement.classList.toggle("rtl", isRTL(locale));
});

changeLanguage(initialLanguage);

export default i18n;
