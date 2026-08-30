import { api } from "@/lib/api/client";

import type {
    AuthData,
    User,
} from "../types/auth.types";


export interface LoginPayload {
    email: string;
    password: string;
}


export interface RegisterPayload {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;

    phone?: string;
    country?: string;
    language?: string;
    timezone?: string;
}


export interface ForgotPasswordPayload {
    email: string;
}


export interface ResetPasswordPayload {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface UpdateProfilePayload {
    first_name: string;
    last_name: string;
    username: string;

    phone?: string | null;
    country?: string | null;
    bio?: string | null;
    avatar?: string | null;

    language?: string;
    timezone?: string;
}


export const authApi = {
    async login(
        payload: LoginPayload,
    ): Promise<AuthData> {
        return api<AuthData>(
            "/v1/auth/login",
            {
                method: "POST",
                body: payload,
            },
        );
    },

    async verifyTwoFactorLogin(email: string, code: string): Promise<AuthData> {
        return api<AuthData>("/v1/auth/two-factor/login/verify", { method: "POST", body: { email, code } });
    },


    async register(
        payload: RegisterPayload,
    ): Promise<AuthData> {
        return api<AuthData>(
            "/v1/auth/register",
            {
                method: "POST",
                body: payload,
            },
        );
    },

    async exchangeGoogleCode(code: string): Promise<AuthData> {
        return api<AuthData>(
            "/v1/auth/google/exchange",
            {
                method: "POST",
                body: { code },
            },
        );
    },


    async me(): Promise<User> {
        return api<User>(
            "/v1/auth/me",
        );
    },


    async logout(): Promise<void> {
        await api<null>(
            "/v1/auth/logout",
            {
                method: "POST",
            },
        );
    },


    async forgotPassword(
        payload: ForgotPasswordPayload,
    ): Promise<void> {
        await api<null>(
            "/v1/auth/forgot-password",
            {
                method: "POST",
                body: payload,
            },
        );
    },

    async resetPassword(
        payload: ResetPasswordPayload,
    ): Promise<void> {
        await api<null>(
            "/v1/auth/reset-password",
            {
                method: "POST",
                body: payload,
            },
        );
    },

    async updateProfile(
        payload: UpdateProfilePayload,
    ): Promise<User> {
        return api<User>(
            "/v1/auth/profile",
            {
                method: "PUT",
                body: payload,
            },
        );
    },
};
