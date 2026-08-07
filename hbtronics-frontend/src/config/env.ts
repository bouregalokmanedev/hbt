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

export const env = {
    appName: getEnv("VITE_APP_NAME"),
    apiUrl: getEnv("VITE_API_URL"),
    storageUrl: getEnv("VITE_STORAGE_URL"),
    defaultLanguage: getEnv("VITE_DEFAULT_LANGUAGE", "en"),
} as const;