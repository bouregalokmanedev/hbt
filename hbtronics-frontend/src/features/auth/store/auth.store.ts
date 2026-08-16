import { create } from "zustand";

import { authStorage } from "@/lib/storage/auth-storage";

import {
    authApi,
    type LoginPayload,
    type RegisterPayload,
    type UpdateProfilePayload,
} from "../api/auth.api";

import type { User } from "../types/auth.types";



interface AuthState {
    user: User | null;

    isLoading: boolean;
    isInitialized: boolean;

    isAuthenticated: boolean;
    isInitializing: boolean;

    error: string | null;

    initialize: () => Promise<void>;

    login: (
        payload: LoginPayload,
    ) => Promise<void>;

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

export const useAuthStore =
    create<AuthState>((set) => ({
        user: null,

        isLoading: false,
        isInitialized: false,

        isAuthenticated: false,
        isInitializing: true,

        error: null,

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
                });

                return;
            }

            set({
                isLoading: true,
                isInitializing: true,
                error: null,
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
                });
            } catch (error) {
                authStorage.clearToken();

                set({
                    user: null,
                    isLoading: false,
                    isInitialized: true,
                    isAuthenticated: false,
                    isInitializing: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unable to verify your session.",
                });
            }
        },

        login: async (payload) => {
            set({
                isLoading: true,
                error: null,
            });

            try {
                const result =
                    await authApi.login(
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
                });
            } catch (error) {
                set({
                    isLoading: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Login failed.",
                });

                throw error;
            }
        },

        register: async (payload) => {
            set({
                isLoading: true,
                error: null,
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
                });
            } catch (error) {
                set({
                    isLoading: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Registration failed.",
                });

                throw error;
            }
        },

        logout: async () => {
            try {
                await authApi.logout();
            } finally {
                authStorage.clearToken();

                set({
                    user: null,
                    isLoading: false,
                    isInitialized: true,
                    isAuthenticated: false,
                    isInitializing: false,
                    error: null,
                });
            }
        },

        updateProfile: async (payload) => {
    set({
        isLoading: true,
        error: null,
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
        });
    } catch (error) {
        set({
            isLoading: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unable to update your profile.",
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
            });
        },
    }));