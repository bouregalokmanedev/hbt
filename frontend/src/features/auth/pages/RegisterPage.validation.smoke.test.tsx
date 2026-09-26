import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RegisterPage } from "./RegisterPage";
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
            register: vi.fn(),
        },
    };
});

function renderRegister() {
    return render(
        <AuthLanguageProvider>
            <MemoryRouter initialEntries={["/register"]}>
                <Routes>
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/dashboard" element={<div>Dashboard</div>} />
                </Routes>
            </MemoryRouter>
        </AuthLanguageProvider>,
    );
}

function fillValidForm(overrides: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmation: string;
}> = {}) {
    fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: overrides.firstName ?? "Lokmane" },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: overrides.lastName ?? "Bourega" },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: overrides.email ?? "student@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: overrides.password ?? "Password123!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: overrides.confirmation ?? "Password123!" },
    });
}

describe("RegisterPage validation UX", () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
        renderRegister();

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(
            screen.queryByText(/something went wrong/i),
        ).not.toBeInTheDocument();
    });

    it("rejects digits in first and last name", async () => {
        vi.mocked(authApi.register).mockRejectedValue(
            new ApiError("Validation failed.", 422, undefined, {
                success: false,
                message: "Validation failed.",
                code: "validation_failed",
            }),
        );

        renderRegister();
        fillValidForm({ firstName: "John123", lastName: "Doe456" });
        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
            expect(
                screen.getAllByText(/names can't contain numbers/i).length,
            ).toBeGreaterThan(0);
        });
        expect(authApi.register).not.toHaveBeenCalled();
    });

    it("rejects invalid email format before submit request", async () => {
        vi.mocked(authApi.register).mockRejectedValue(
            new ApiError("Validation failed.", 422),
        );

        renderRegister();
        fillValidForm({ email: "not-an-email" });
        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
            expect(
                screen.getByText("Please enter a valid email address."),
            ).toBeInTheDocument();
        });
        expect(authApi.register).not.toHaveBeenCalled();
    });

    it("maps duplicate email server errors onto the email field", async () => {
        vi.mocked(authApi.register).mockRejectedValue(
            new ApiError("Validation failed.", 422, {
                email: ["This email address is already registered."],
            }, {
                success: false,
                message: "Validation failed.",
                code: "validation_failed",
                errors: {
                    email: ["This email address is already registered."],
                },
            }),
        );

        renderRegister();
        fillValidForm({ email: "taken@example.com" });
        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
            expect(
                screen.getByText("This email address is already registered."),
            ).toBeInTheDocument();
        });
        expect(
            screen.getByText("Please correct the highlighted fields and try again."),
        ).toBeInTheDocument();
    });
});
