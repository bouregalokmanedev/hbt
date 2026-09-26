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
    });
});
