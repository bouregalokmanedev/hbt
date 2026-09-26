import { create } from "zustand";

import { authStorage } from "@/lib/storage/auth-storage";

import {
    authApi,
    type LoginPayload,
    type RegisterPayload,
    type UpdateProfilePayload,
} from "../api/auth.api";

import type { User } from "../types/auth.types";
import { ApiError } from "@/lib/api/errors";



interface AuthState {
    user: User | null;

    isLoading: boolean;
    isInitialized: boolean;

    isAuthenticated: boolean;
    isInitializing: boolean;

    error: string | null;
    errorCode: string | null;
    fieldErrors: Record<string, string[]> | null;

    initialize: () => Promise<void>;

    login: (
        payload: LoginPayload,
    ) => Promise<void>;
    verifyTwoFactorLogin: (email: string, code: string) => Promise<void>;

    register: (
        payload: RegisterPayload,
    ) => Promise<void>;

    logout: () => Promise<void>;

    updateUser: (user: User) => void;

    updateProfile: (
    payload: UpdateProfilePayload,
) => Promise<void>;

    clearError: () => void;
}

function readAuthFailure(error: unknown, fallback: string): {
    error: string;
    errorCode: string | null;
    fieldErrors: Record<string, string[]> | null;
} {
    if (error instanceof ApiError) {
        return {
            error: error.message || fallback,
            errorCode: error.code ?? (error.isValidationError ? "validation_failed" : null),
            fieldErrors: error.errors ?? null,
        };
    }

    // Duck-type when duplicate ApiError module instances break `instanceof`.
    if (error && typeof error === "object") {
        const candidate = error as {
            message?: unknown;
            status?: unknown;
            errors?: unknown;
            data?: unknown;
        };
        const data =
            candidate.data && typeof candidate.data === "object"
                ? (candidate.data as { code?: unknown })
                : null;
        const code =
            data && typeof data.code === "string" && data.code.length > 0
                ? data.code
                : null;
        const fieldErrors =
            candidate.errors && typeof candidate.errors === "object"
                ? (candidate.errors as Record<string, string[]>)
                : null;

        return {
            error:
                typeof candidate.message === "string" && candidate.message
                    ? candidate.message
                    : fallback,
            errorCode: code ?? (candidate.status === 422 ? "validation_failed" : null),
            fieldErrors,
        };
    }

    return { error: fallback, errorCode: null, fieldErrors: null };
}

export const useAuthStore =
    create<AuthState>((set) => ({
        user: null,

        isLoading: false,
        isInitialized: false,

        isAuthenticated: false,
        isInitializing: true,

        error: null,
        errorCode: null,
        fieldErrors: null,

        initialize: async () => {
            const token =
                authStorage.getToken();

            if (!token) {
            set({
                user: null,
                isLoading: false,
                isInitialized: true,
                isAuthenticated: false,
                isInitializing: false,
                error: null,
                errorCode: null,
                fieldErrors: null,
            });

                return;
            }

            set({
                isLoading: true,
                isInitializing: true,
                error: null,
                errorCode: null,
                fieldErrors: null,
            });

            try {
                const user =
                    await authApi.me();

                set({
                    user,
                    isLoading: false,
                    isInitialized: true,
                    isAuthenticated: true,
                    isInitializing: false,
                    error: null,
                    errorCode: null,
                    fieldErrors: null,
                });
            } catch (error) {
                authStorage.clearToken();

                const failure = readAuthFailure(error, "Unable to verify your session.");

                set({
                    user: null,
                    isLoading: false,
                    isInitialized: true,
                    isAuthenticated: false,
                    isInitializing: false,
                    error: failure.error,
                    errorCode: failure.errorCode,
                    fieldErrors: failure.fieldErrors,
                });
            }
        },

        login: async (payload) => {
            set({
                isLoading: true,
                error: null,
                errorCode: null,
                fieldErrors: null,
            });

            try {
                const result =
                    await authApi.login(
                        payload,
                    );

                authStorage.setToken(
                    result.token,
                    payload.remember ?? false,
                );

                set({
                    user: result.user,
                    isLoading: false,
                    isInitialized: true,
                    isAuthenticated: true,
                    isInitializing: false,
                    error: null,
                    errorCode: null,
                    fieldErrors: null,
                });
            } catch (error) {
                const failure = readAuthFailure(error, "Login failed.");

                set({
                    isLoading: false,
                    error: failure.error,
                    errorCode: failure.errorCode,
                    fieldErrors: failure.fieldErrors,
                });

                throw error;
            }
        },

        verifyTwoFactorLogin: async (email, code) => {
            set({ isLoading: true, error: null, errorCode: null, fieldErrors: null });
            try {
                const result = await authApi.verifyTwoFactorLogin(email, code);
                authStorage.setToken(result.token);
                set({ user: result.user, isLoading: false, isInitialized: true, isAuthenticated: true, isInitializing: false, error: null, errorCode: null, fieldErrors: null });
            } catch (error) {
                const failure = readAuthFailure(error, "Unable to verify your code.");
                set({ isLoading: false, error: failure.error, errorCode: failure.errorCode, fieldErrors: failure.fieldErrors });
                throw error;
            }
        },

        register: async (payload) => {
            set({
                isLoading: true,
                error: null,
                errorCode: null,
                fieldErrors: null,
            });

            try {
                const result =
                    await authApi.register(
                        payload,
                    );

                authStorage.setToken(
                    result.token,
                );

                set({
                    user: result.user,
                    isLoading: false,
                    isInitialized: true,
                    isAuthenticated: true,
                    isInitializing: false,
                    error: null,
                    errorCode: null,
                    fieldErrors: null,
                });
            } catch (error) {
                const failure = readAuthFailure(error, "Registration failed.");

                set({
                    isLoading: false,
                    error: failure.error,
                    errorCode: failure.errorCode,
                    fieldErrors: failure.fieldErrors,
                });

                throw error;
            }
        },

        logout: async () => {
            try {
                await authApi.logout();
            } finally {
                authStorage.clearToken();
                // Wipe this browser's simulator result mirrors (user-scoped + legacy shared key)
                // so the next signed-in student never sees the previous account's history.
                try {
                    const stale: string[] = [];
                    for (let i = 0; i < window.localStorage.length; i += 1) {
                        const key = window.localStorage.key(i);
                        if (key && key.startsWith("hbt:simulator-local-results")) stale.push(key);
                    }
                    stale.forEach((key) => window.localStorage.removeItem(key));
                } catch {
                    // Storage unavailable.
                }

                set({
                    user: null,
                    isLoading: false,
                    isInitialized: true,
                    isAuthenticated: false,
                    isInitializing: false,
                    error: null,
                    errorCode: null,
                    fieldErrors: null,
                });
            }
        },

        updateProfile: async (payload) => {
    set({
        isLoading: true,
        error: null,
        errorCode: null,
        fieldErrors: null,
    });

    try {
        const user =
            await authApi.updateProfile(
                payload,
            );

        set({
            user,
            isLoading: false,
            isAuthenticated: true,
            error: null,
            errorCode: null,
            fieldErrors: null,
        });
    } catch (error) {
        const failure = readAuthFailure(error, "Unable to update your profile.");

        set({
            isLoading: false,
            error: failure.error,
            errorCode: failure.errorCode,
            fieldErrors: failure.fieldErrors,
        });

        throw error;
    }
},

        updateUser: (user) => {
    set({
        user,
    });
},

        clearError: () => {
            set({
                error: null,
                errorCode: null,
                fieldErrors: null,
            });
        },
    }));
