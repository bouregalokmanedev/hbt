/// <reference types="vite/client" />
const getEnv = (key: string, fallback?: string): string => {
    const value = import.meta.env[key];

    if (value) {
        return value;
    }

    if (fallback !== undefined) {
        return fallback;
    }

    throw new Error(`Missing environment variable: ${key}`);
};

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
    throw new Error(
        "VITE_API_URL is not configured.",
    );
}

export const env = {
    
    appName: getEnv("VITE_APP_NAME"),
    apiUrl,
    storageUrl: getEnv("VITE_STORAGE_URL"),
    defaultLanguage: getEnv("VITE_DEFAULT_LANGUAGE", "en"),
} as const;

