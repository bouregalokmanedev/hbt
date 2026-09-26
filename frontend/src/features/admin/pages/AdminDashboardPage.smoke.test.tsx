import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { AdminDashboardPage } from "./AdminDashboardPage";
import { adminApi } from "../api/adminApi";

vi.mock("../api/adminApi", () => ({
    adminApi: {
        dashboard: vi.fn(),
        systemHealth: vi.fn(),
        commerceOverview: vi.fn(),
        simulatorAnalytics: vi.fn(),
        diagnosticAnalytics: vi.fn(),
        riskDashboard: vi.fn(),
        securityOverview: vi.fn(),
        activity: vi.fn(),
        supportTickets: vi.fn(),
    },
}));

i18n.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    resources: {
        en: {
            translation: {
                admin: {
                    dashboard: {
                        hero: {
                            eyebrow: "Platform command center",
                            title: "A clearer view of your learning platform.",
                        },
                        health: { eyebrow: "Platform health", title: "Service status", unavailable: "Health checks are unavailable right now. Retry from the system page." },
                        commerce: { eyebrow: "Commerce", title: "Revenue snapshot" },
                        labs: { eyebrow: "Lab activity", title: "Simulators & diagnostics" },
                        security: { eyebrow: "Security posture", title: "Access & session safety" },
                        risk: { eyebrow: "Risk register", title: "Risk & compliance" },
                        support: { eyebrow: "Support queue", title: "Open tickets", total: "Open tickets", empty: "No open tickets right now." },
                        activityFeed: { eyebrow: "Audit trail", title: "Recent activity", empty: "No activity recorded yet." },
                        governance: { eyebrow: "Super Admin · Platform governance", title: "Full control, full visibility.", modules: "Connected modules" },
                        trust: { eyebrow: "Trust & control", title: "Admin workspace status" },
                    },
                },
            },
        },
    },
});

const baseDashboard = {
    administrator: { uuid: "u-1", name: "Sam Admin", email: "sam@example.com", roles: ["Admin"] },
    modules: ["dashboard", "users", "courses"],
    statistics: {
        users: { total: 120, students: 80, instructors: 6, administrators: 4, active: 95, new_this_month: 7 },
        courses: { total: 12, published: 5, review: 2, draft: 4, archived: 1 },
        enrollments: { total: 200, active: 120, completed: 60, cancelled: 20 },
        learning: { average_progress: 48, active_learners: 30, completed_learners: 25 },
    },
    meta: { phase: "statistics", api_version: "v1", generated_at: "2026-09-24T10:00:00.000Z" },
    governance: null,
};

function mockAll() {
    vi.mocked(adminApi.dashboard).mockResolvedValue(structuredClone(baseDashboard));
    vi.mocked(adminApi.systemHealth).mockResolvedValue({
        status: "operational",
        application: { environment: "testing", name: "HBT" },
        checks: { database: { status: "operational", driver: "sqlite" }, storage: { status: "operational" } },
        checked_at: "2026-09-24T10:00:00.000Z",
    });
    vi.mocked(adminApi.commerceOverview).mockResolvedValue({
        gross_revenue: 5000,
        currency: "DZD",
        net_revenue: 4800,
        refunded: 200,
        active_subscriptions: 9,
        purchases: 30,
        pending_transactions: 2,
        failed_transactions: 1,
        revenue_14d: [
            { date: "2026-09-23", total: 100 },
            { date: "2026-09-24", total: 300 },
        ],
        recent_transactions: [],
    });
    vi.mocked(adminApi.simulatorAnalytics).mockResolvedValue({
        totals: {
            sessions: 42, completed: 30, active: 12, results: 30, students: 11,
            average_score: 76, pass_rate: 71, average_hints: 1.2, average_duration_seconds: 95,
            total_duration_seconds: 4000,
        },
        by_tool: [],
        by_vehicle: [],
    });
    vi.mocked(adminApi.diagnosticAnalytics).mockResolvedValue({
        total_scenarios: 8,
        total_attempts: 130,
        avg_score: 82,
        pass_rate: 74,
    });
    vi.mocked(adminApi.riskDashboard).mockResolvedValue({
        by_level: { critical: 1, high: 3, medium: 5, low: 7 },
        by_status: { open: 4 },
        overdue_reviews: 2,
        failed_controls: 1,
    });
    vi.mocked(adminApi.securityOverview).mockResolvedValue({
        failed_logins_24h: 6,
        failed_logins_7d: 21,
        successful_logins_24h: 44,
        active_sessions: 18,
        total_sessions: 60,
        suspended_accounts: 2,
        potentially_locked_accounts: 1,
        admin_actions_24h: 12,
        password_changes_7d: 3,
        role_changes_7d: 1,
    });
    vi.mocked(adminApi.activity).mockResolvedValue({
        data: [
            {
                id: "act-1",
                event: "course.published",
                actor: { id: "a-1", name: "Sam Admin", email: "sam@example.com" },
                target: { type: "Course", id: "c-1" },
                changes: { old: null, new: null },
                metadata: null,
                ip_address: null,
                occurred_at: "2026-09-24T09:30:00.000Z",
            },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 6, total: 1 },
        links: { prev: null, next: null },
    });
    vi.mocked(adminApi.supportTickets).mockResolvedValue({
        data: [
            {
                id: "t-1",
                subject: "Cannot download certificate",
                category: "Certificates",
                user: "Learner One",
                priority: "high",
                status: "open",
                level: "support",
                assignee: null,
                overdue: true,
            },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 5, total: 1 },
        links: { prev: null, next: null },
    });
}

function renderPage() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={["/admin"]}>
                <I18nextProvider i18n={i18n}>
                    <AdminDashboardPage />
                </I18nextProvider>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe("AdminDashboardPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAll();
    });

    it("renders hero, KPI cards, and every enriched panel", async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByTestId("admin-dashboard-health")).toBeInTheDocument();
        });
        expect(screen.getByText("Platform command center")).toBeInTheDocument();
        expect(screen.getByText("A clearer view of your learning platform.")).toBeInTheDocument();
        expect(screen.getAllByText("Service status").length).toBeGreaterThan(0);
        await waitFor(() => {
            expect(screen.getByTestId("admin-dashboard-commerce")).toBeInTheDocument();
            expect(screen.getByTestId("admin-dashboard-labs")).toBeInTheDocument();
            expect(screen.getByTestId("admin-dashboard-security")).toBeInTheDocument();
            expect(screen.getByTestId("admin-dashboard-risk")).toBeInTheDocument();
            expect(screen.getByTestId("admin-dashboard-support")).toBeInTheDocument();
            expect(screen.getByTestId("admin-dashboard-activity")).toBeInTheDocument();
        });
        expect(screen.getByText("Cannot download certificate")).toBeInTheDocument();
        expect(screen.getByText("course.published")).toBeInTheDocument();
        expect(screen.getAllByText("42").length).toBeGreaterThan(0);
        expect(screen.getByText("Admin workspace status")).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows governance for super admins instead of the trust card", async () => {
        vi.mocked(adminApi.dashboard).mockResolvedValue({
            ...structuredClone(baseDashboard),
            administrator: { ...baseDashboard.administrator, roles: ["Super Admin"] },
            governance: {
                staff: { super_admins: 1, admins: 3, support: 2, instructors: 6 },
                escalations: 2,
                failed_webhooks: 1,
                recent_privileged_actions: [{ event: "role.assigned", subject: "User", at: null }],
            },
        });
        renderPage();
        await waitFor(() => {
            expect(screen.getByText("Full control, full visibility.")).toBeInTheDocument();
        });
        expect(screen.getByText("Connected modules")).toBeInTheDocument();
        expect(screen.getByText("role.assigned")).toBeInTheDocument();
        expect(screen.queryByText("Admin workspace status")).not.toBeInTheDocument();
    });

    it("keeps the base dashboard when optional queries fail", async () => {
        vi.mocked(adminApi.systemHealth).mockRejectedValue(new Error("boom"));
        vi.mocked(adminApi.commerceOverview).mockRejectedValue(new Error("boom"));
        vi.mocked(adminApi.simulatorAnalytics).mockRejectedValue(new Error("boom"));
        vi.mocked(adminApi.diagnosticAnalytics).mockRejectedValue(new Error("boom"));
        vi.mocked(adminApi.riskDashboard).mockRejectedValue(new Error("boom"));
        vi.mocked(adminApi.securityOverview).mockRejectedValue(new Error("boom"));
        vi.mocked(adminApi.activity).mockRejectedValue(new Error("boom"));
        vi.mocked(adminApi.supportTickets).mockRejectedValue(new Error("boom"));
        renderPage();
        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent("Health checks are unavailable right now.");
        });
        expect(screen.getByTestId("admin-dashboard")).toBeInTheDocument();
        expect(screen.getByText("Platform command center")).toBeInTheDocument();
        expect(screen.queryByTestId("admin-dashboard-commerce")).not.toBeInTheDocument();
        expect(screen.queryByTestId("admin-dashboard-risk")).not.toBeInTheDocument();
    });
});
