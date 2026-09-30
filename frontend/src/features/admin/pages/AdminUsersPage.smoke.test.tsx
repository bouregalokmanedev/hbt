import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider, initReactI18next } from "react-i18next";
import i18n from "i18next";

import { AdminUsersPage } from "./AdminUsersPage";
import { adminApi } from "../api/adminApi";
import type { AdminUser, Paginated } from "../types/admin";

vi.mock("../api/adminApi", () => ({
    adminApi: {
        users: vi.fn(),
        verifyUser: vi.fn(),
        unverifyUser: vi.fn(),
        setUserStatus: vi.fn(),
        setRole: vi.fn(),
        suspendUser: vi.fn(),
        activateUser: vi.fn(),
    },
}));

i18n.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    resources: {
        en: {
            translation: {
                admin: {
                    common: {
                        total: "{{count}} total",
                        loading: "Loading…",
                        pageOf: "Page {{page}} of {{last}}",
                        prev: "Previous",
                        next: "Next",
                    },
                    users: {
                        eyebrow: "Identity & access",
                        title: "People across your platform",
                        description: "Manage account health and platform roles.",
                        metrics: {
                            total: "Total accounts",
                            verified: "Verified results",
                            roleProtection: "Role protection",
                            enabled: "Enabled",
                        },
                        searchPh: "Search name, username, or email",
                        clearFilters: "Clear filters",
                        empty: "No users match these filters.",
                        refresh: "Refresh",
                        confirmSuspend: "Suspend this account?",
                        confirmStatus: "Change this user's status to {{status}}?",
                        confirmUnverify: "Remove verification from this user?",
                        changeStatus: "Change status",
                        updateFailed: "Unable to update this user.",
                        filters: {
                            allRoles: "All roles",
                            allStatuses: "All statuses",
                            active: "Active",
                            inactive: "Inactive",
                            suspended: "Suspended",
                            pending: "Pending",
                        },
                        headers: {
                            person: "Person",
                            role: "Role",
                            verification: "Verification",
                            status: "Status",
                            joined: "Joined",
                            actions: "Actions",
                        },
                        row: {
                            verified: "Verified",
                            notVerified: "Not verified",
                            verify: "Verify",
                            undoVerify: "Undo",
                            activate: "Activate",
                            suspend: "Suspend",
                            roles: {
                                student: "Student",
                                instructor: "Instructor",
                                admin: "Admin",
                                superAdmin: "Super Admin",
                                support: "Support",
                            },
                        },
                    },
                },
            },
        },
    },
});

const verifiedUser: AdminUser = {
    id: "u-1",
    first_name: "Amina",
    last_name: "Bensalem",
    username: "amina",
    email: "amina@example.test",
    email_verified_at: "2026-01-01T00:00:00Z",
    status: "active",
    roles: ["Student"],
    created_at: "2026-01-01T00:00:00Z",
};

const unverifiedUser: AdminUser = {
    id: "u-2",
    first_name: "Milo",
    last_name: "Cardoso",
    username: "milo",
    email: "milo@example.test",
    email_verified_at: null,
    status: "pending",
    roles: ["Instructor"],
    created_at: "2026-02-01T00:00:00Z",
};

function usersPage(users: AdminUser[]): Paginated<AdminUser> {
    return {
        data: users,
        meta: { current_page: 1, last_page: 1, per_page: 12, total: users.length },
        links: { prev: null, next: null },
    };
}

function renderPage(entry = "/admin/users") {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={[entry]}>
                <I18nextProvider i18n={i18n}>
                    <AdminUsersPage />
                </I18nextProvider>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe("AdminUsersPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(window, "confirm").mockReturnValue(true);
        vi.mocked(adminApi.users).mockResolvedValue(usersPage([verifiedUser, unverifiedUser]));
        vi.mocked(adminApi.verifyUser).mockResolvedValue(unverifiedUser);
    });

    it("renders the heading, metrics, and every row control", async () => {
        renderPage();

        expect(await screen.findByText("Amina Bensalem")).toBeInTheDocument();
        expect(screen.getByText("amina@example.test")).toBeInTheDocument();
        expect(screen.getByText("Milo Cardoso")).toBeInTheDocument();
        expect(screen.getByText("2 total")).toBeInTheDocument();

        // verified row offers Undo, unverified row offers Verify
        expect(screen.getAllByText("Verify")).toHaveLength(1);
        expect(screen.getAllByText("Undo")).toHaveLength(1);

        // role + status controls are present for each row
        expect(screen.getAllByLabelText("Role")).toHaveLength(2);
        expect(screen.getAllByLabelText("Change status")).toHaveLength(2);

        expect(screen.getAllByText("Suspend")).toHaveLength(2);
        expect(screen.queryByText("Activate")).not.toBeInTheDocument();
    });

    it("honours filters coming from the URL", async () => {
        renderPage("/admin/users?search=amina&status=active");

        await waitFor(() => {
            expect(adminApi.users).toHaveBeenCalledWith(
                expect.objectContaining({ search: "amina", status: "active" }),
            );
        });
        expect(await screen.findByPlaceholderText("Search name, username, or email")).toHaveValue("amina");
    });

    it("calls the verify endpoint when an admin verifies a user", async () => {
        renderPage();

        fireEvent.click(await screen.findByText("Verify"));

        await waitFor(() => {
            expect(adminApi.verifyUser).toHaveBeenCalledWith("u-2");
        });
    });

    it("confirms before changing a status, then calls the status endpoint", async () => {
        renderPage();

        const selects = await screen.findAllByLabelText("Change status");
        fireEvent.change(selects[0], { target: { value: "inactive" } });

        expect(window.confirm).toHaveBeenCalledWith("Change this user's status to Inactive?");
        await waitFor(() => {
            expect(adminApi.setUserStatus).toHaveBeenCalledWith("u-1", "inactive");
        });
    });

    it("shows an empty state when nothing matches the filters", async () => {
        vi.mocked(adminApi.users).mockResolvedValue(usersPage([]));
        renderPage("/admin/users?search=nobody");

        expect(await screen.findByText("No users match these filters.")).toBeInTheDocument();
        expect(screen.getByText("0 total")).toBeInTheDocument();
    });

    it("surfaces a failed action as an alert", async () => {
        vi.mocked(adminApi.verifyUser).mockRejectedValue(new Error("Not permitted."));

        renderPage();
        fireEvent.click(await screen.findByText("Verify"));

        expect(await screen.findByRole("alert")).toHaveTextContent("Not permitted.");
    });
});
