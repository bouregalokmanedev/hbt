import { api } from "@/lib/api/client";

import type {
    AuthData,
    User,
} from "../types/auth.types";


export interface LoginPayload {
    email: string;
    password: string;
    remember?: boolean;
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
    /** Invite code from the /register?ref= signup link. */
    ref?: string;
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

    async resendTwoFactorLogin(email: string): Promise<{ resent: boolean }> {
        return api<{ resent: boolean }>("/v1/auth/two-factor/login/resend", { method: "POST", body: { email } });
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


    async resendVerification(): Promise<void> {
        await api<null>(
            "/v1/auth/email/resend",
            {
                method: "POST",
            },
        );
    },


    async resendVerificationEmail(email: string): Promise<void> {
        await api<null>(
            "/v1/auth/email/resend-unverified",
            {
                method: "POST",
                body: { email },
            },
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

    async sendPhoneOtp(): Promise<{
        delivery: string | null;
        phone_verified_at?: string;
    }> {
        return api("/v1/auth/phone/otp/send", {
            method: "POST",
        });
    },

    async verifyPhoneOtp(
        code: string,
    ): Promise<{ phone_verified_at: string }> {
        return api("/v1/auth/phone/otp/verify", {
            method: "POST",
            body: { code },
        });
    },
};
