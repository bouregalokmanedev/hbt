import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

import {
    authTranslations,
    type AuthLanguage,
} from "./auth.translations";

interface AuthLanguageContextValue {
    language: AuthLanguage;
    direction: "ltr" | "rtl";
    setLanguage: (
        language: AuthLanguage,
    ) => void;
    t: typeof authTranslations.en;
}

const AuthLanguageContext =
    createContext<AuthLanguageContextValue | null>(
        null,
    );

const LANGUAGE_STORAGE_KEY =
    "hbt-language";

function getInitialLanguage(): AuthLanguage {
    if (typeof window === "undefined") {
        return "en";
    }

    const stored =
        localStorage.getItem(
            LANGUAGE_STORAGE_KEY,
        );

    if (
        stored === "ar" ||
        stored === "en"
    ) {
        return stored;
    }

    return navigator.language
        .toLowerCase()
        .startsWith("ar")
        ? "ar"
        : "en";
}

export function AuthLanguageProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [
        language,
        setLanguageState,
    ] = useState<AuthLanguage>(
        getInitialLanguage,
    );

    const direction: "ltr" | "rtl" =
    language === "ar"
        ? "rtl"
        : "ltr";

const setLanguage = (
    nextLanguage: AuthLanguage,
) => {
    setLanguageState(nextLanguage);

    localStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        nextLanguage,
    );
};

useEffect(() => {
    document.documentElement.dir =
        language === "ar"
            ? "rtl"
            : "ltr";

    document.documentElement.lang =
        language === "ar"
            ? "ar"
            : "en";
}, [language]);

    const value: AuthLanguageContextValue =
        {
            language,
            direction,
            setLanguage,
t: authTranslations[language] as AuthLanguageContextValue["t"],        };

    return (
        <AuthLanguageContext.Provider
            value={value}
        >
            {children}
        </AuthLanguageContext.Provider>
    );
}

export function useAuthLanguage() {
    const context =
        useContext(
            AuthLanguageContext,
        );

    if (!context) {
        throw new Error(
            "useAuthLanguage must be used inside AuthLanguageProvider",
        );
    }

    return context;
}