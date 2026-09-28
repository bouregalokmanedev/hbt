import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginPage } from "./LoginPage";
import { useAuthStore } from "../store/auth.store";
import { AuthLanguageProvider } from "../i18n/auth-language";

function renderLoginAt(entry: string) {
    return render(
        <AuthLanguageProvider>
            <MemoryRouter initialEntries={[entry]}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                </Routes>
            </MemoryRouter>
        </AuthLanguageProvider>,
    );
}

describe("LoginPage verification notes", () => {
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

    it("shows the success note after clicking the email link", () => {
        renderLoginAt("/login?verified=1");

        expect(screen.getByRole("status")).toHaveTextContent(
            /email verified/i,
        );
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows the expired-link note when the signature is invalid", () => {
        renderLoginAt("/login?verify=error");

        expect(screen.getByRole("alert")).toHaveTextContent(
            /invalid or has expired/i,
        );
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("shows no note on a plain visit", () => {
        renderLoginAt("/login");

        expect(screen.queryByRole("status")).not.toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
});
