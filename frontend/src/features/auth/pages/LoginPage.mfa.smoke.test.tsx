import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GuestGuard } from "../components/GuestGuard";
import { LoginPage } from "./LoginPage";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import { AuthLanguageProvider } from "../i18n/auth-language";
import { ApiError } from "@/lib/api/errors";

vi.mock("../api/auth.api", async () => {
    const actual = await vi.importActual<typeof import("../api/auth.api")>(
        "../api/auth.api",
    );
    return {
        ...actual,
        authApi: {
            ...actual.authApi,
            login: vi.fn(),
            verifyTwoFactorLogin: vi.fn(),
            resendTwoFactorLogin: vi.fn(),
        },
    };
});

function renderLogin() {
    return render(
        <AuthLanguageProvider>
            <MemoryRouter initialEntries={["/login"]}>
                <Routes>
                    <Route element={<GuestGuard />}>
                        <Route path="/login" element={<LoginPage />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        </AuthLanguageProvider>,
    );
}

describe("LoginPage 2FA challenge", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        useAuthStore.setState({
            user: null,
            isLoading: false,
            isInitialized: true,
            isAuthenticated: false,
            isInitializing: false,
            error: null,
        });
    });

    it("shows the six-digit OTP field immediately after a 423 login challenge", async () => {
        vi.mocked(authApi.login).mockRejectedValue(
            new ApiError(
                "Two-factor verification is required. A six-digit code was sent to your email.",
                423,
                undefined,
                {
                    success: false,
                    message:
                        "Two-factor verification is required. A six-digit code was sent to your email.",
                    requires_two_factor: true,
                    challenge_token: "challenge-token-123",
                },
            ),
        );

        renderLogin();

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: "student@example.com" },
        });
        fireEvent.change(screen.getByLabelText(/^password$/i), {
            target: { value: "secret-pass" },
        });
        fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

        await waitFor(() => {
            expect(screen.getByText("Verify your sign-in")).toBeInTheDocument();
        });

        expect(
            screen.getByText(/student@example\.com/),
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText("Verification digit 1"),
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText("Verification digit 6"),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: /^sign in$/i }),
        ).not.toBeInTheDocument();
        expect(authApi.login).toHaveBeenCalledTimes(1);
        expect(sessionStorage.getItem("hbt:mfa-challenge")).toBe(
            "challenge-token-123",
        );
    });

    it("passes the password-backed challenge token to verification", async () => {
        const challengeToken = "a".repeat(64);

        vi.mocked(authApi.login).mockRejectedValue(
            new ApiError(
                "Two-factor verification is required.",
                423,
                undefined,
                {
                    success: false,
                    message: "Two-factor verification is required.",
                    requires_two_factor: true,
                    challenge_token: challengeToken,
                },
            ),
        );

        vi.mocked(authApi.verifyTwoFactorLogin).mockResolvedValue({
            token: "api-token",
            token_type: "Bearer",
            expires_at: null,
            user: {
                id: "user-1",
                first_name: "Sara",
                last_name: "Benali",
                username: "sara",
                email: "student@example.com",
                email_verified_at: null,
                phone: null,
                avatar: null,
                bio: null,
                country: null,
                language: null,
                timezone: null,
                status: "active",
                roles: ["Student"],
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-01T00:00:00Z",
            },
        });

        renderLogin();

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: "student@example.com" },
        });
        fireEvent.change(screen.getByLabelText(/^password$/i), {
            target: { value: "secret-pass" },
        });
        fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

        await waitFor(() => {
            expect(
                screen.getByLabelText("Verification digit 1"),
            ).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText("Verification digit 1"), {
            target: { value: "123456" },
        });
        fireEvent.click(
            screen.getByRole("button", { name: /verify and sign in/i }),
        );

        await waitFor(() => {
            expect(authApi.verifyTwoFactorLogin).toHaveBeenCalledWith(
                "student@example.com",
                "123456",
                challengeToken,
            );
        });
    });
});
