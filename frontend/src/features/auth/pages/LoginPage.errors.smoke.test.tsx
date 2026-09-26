import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
            resendVerificationEmail: vi.fn(),
        },
    };
});

function renderLogin() {
    return render(
        <AuthLanguageProvider>
            <MemoryRouter initialEntries={["/login"]}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<div>Forgot password</div>} />
                </Routes>
            </MemoryRouter>
        </AuthLanguageProvider>,
    );
}

async function submitLogin(email = "student@example.com", password = "Password123!") {
    fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: email },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: password },
    });
    fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
}

describe("LoginPage error UX", () => {
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
            errorCode: null,
            fieldErrors: null,
        });
    });

    it("shows no banner before any attempt fails", () => {
        renderLogin();

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(
            screen.queryByText(/something went wrong/i),
        ).not.toBeInTheDocument();
    });

    it("shows a localized actionable message for invalid credentials", async () => {
        vi.mocked(authApi.login).mockRejectedValue(
            new ApiError("Email or password is incorrect.", 401, undefined, {
                success: false,
                message: "Email or password is incorrect.",
                code: "invalid_credentials",
                errors: [],
            }),
        );

        renderLogin();
        await submitLogin();

        await waitFor(() => {
            expect(
                screen.getByText(/email or password is incorrect/i),
            ).toBeInTheDocument();
        });

        expect(
            screen.getAllByRole("link", { name: /forgot password/i }).length,
        ).toBeGreaterThan(0);
    });

    it("shows resend verification for unverified accounts", async () => {
        vi.mocked(authApi.login).mockRejectedValue(
            new ApiError("Please verify your email address.", 401, undefined, {
                success: false,
                message: "Please verify your email address.",
                code: "email_not_verified",
                errors: [],
            }),
        );
        vi.mocked(authApi.resendVerificationEmail).mockResolvedValue(undefined);

        renderLogin();
        await submitLogin("pending@example.com");

        await waitFor(() => {
            expect(
                screen.getByText(/verify your email address before signing in/i),
            ).toBeInTheDocument();
        });

        fireEvent.click(
            screen.getByRole("button", { name: /resend verification email/i }),
        );

        await waitFor(() => {
            expect(authApi.resendVerificationEmail).toHaveBeenCalledWith(
                "pending@example.com",
            );
            expect(
                screen.getByText(/new link has been sent/i),
            ).toBeInTheDocument();
        });
    });

    it("maps server field errors onto the form inputs", async () => {
        vi.mocked(authApi.login).mockRejectedValue(
            new ApiError("Validation failed.", 422, {
                email: ["Please enter a valid email address."],
            }, {
                success: false,
                message: "Validation failed.",
                code: "validation_failed",
                errors: {
                    email: ["Please enter a valid email address."],
                },
            }),
        );

        renderLogin();
        // Valid format so client-side rules pass; the server still returns 422.
        await submitLogin("student@example.com");

        await waitFor(() => {
            expect(
                screen.getByText("Please correct the highlighted fields and try again."),
            ).toBeInTheDocument();
        });
    });
});
