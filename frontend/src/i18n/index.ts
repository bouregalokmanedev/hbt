import i18n from "i18next";

import {
    initReactI18next,
} from "react-i18next";

import {
    en,
} from "./locales/en";

import {
    ar,
} from "./locales/ar";

const savedLanguage =
    localStorage.getItem(
        "hbt-language",
    );

const initialLanguage =
    savedLanguage === "ar" ||
    savedLanguage === "en"
        ? savedLanguage
        : "en";

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: en,
            },

            ar: {
                translation: ar,
            },
        },

        lng: initialLanguage,

        fallbackLng: "en",

        interpolation: {
            escapeValue: false,
        },

        returnNull: false,
    });

export function changeLanguage(
    language: "en" | "ar",
) {
    localStorage.setItem(
        "hbt-language",
        language,
    );

    void i18n.changeLanguage(
        language,
    );

    document.documentElement.lang =
        language;

    document.documentElement.dir =
        language === "ar"
            ? "rtl"
            : "ltr";

    document.body.dir =
        language === "ar"
            ? "rtl"
            : "ltr";

    document.documentElement.classList.toggle(
        "rtl",
        language === "ar",
    );
}

changeLanguage(
    initialLanguage,
);

export default i18n;