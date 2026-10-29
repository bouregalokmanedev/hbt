import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { AdminAnalyticsPage } from "./AdminAnalyticsPage";
import { adminApi } from "../api/adminApi";
import type { AnalyticsResponse } from "../types/admin";
import { en } from "@/i18n/locales/en";

vi.mock("../api/adminApi", () => ({
    adminApi: {
        analytics: vi.fn(),
        systemHealth: vi.fn(),
        simulatorAnalytics: vi.fn(),
        diagnosticAnalytics: vi.fn(),
    },
}));

i18n.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    resources: { en: { translation: en } },
});

const overview: AnalyticsResponse = {
    period: { from: "2026-10-01", to: "2026-10-30" },
    previous_period: { from: "2026-09-01", to: "2026-09-30" },
    summary: {
        students: 84,
        published_courses: 12,
        enrollments: 190,
        completions: 64,
        active_learners: 37,
        assignments_published: 9,
        simulator_sessions: 120,
        diagnostic_attempts: 48,
    },
    comparison: {
        new_users: { current: 12, previous: 10, change: 2, change_percent: 20 },
        new_enrollments: {
            current: 30,
            previous: 40,
            change: -10,
            change_percent: -25,
        },
        completions_in_period: {
            current: 9,
            previous: 6,
            change: 3,
            change_percent: 50,
        },
        submissions_in_period: {
            current: 7,
            previous: 7,
            change: 0,
            change_percent: 0,
        },
    },
    growth_series: [
        { date: "2026-10-01", new_users: 1, new_enrollments: 2, completions: 0 },
        { date: "2026-10-02", new_users: 3, new_enrollments: 4, completions: 1 },
    ],
    top_courses: [
        {
            course_id: "course-1",
            course_title: "Automotive Electrical Foundations",
            learners_count: 42,
            average_progress: 68,
            completions_count: 18,
            completion_rate: 43,
            time_spent_seconds: 5400,
        },
    ],
    operations: {
        courses_in_review: 2,
        assignments_pending_grading: 3,
        assignments_overdue: 1,
        simulator_sessions_active: 4,
    },
    generated_at: "2026-10-30T10:00:00.000Z",
};

const assignments: AnalyticsResponse = {
    period: overview.period,
    previous_period: overview.previous_period,
    summary: {
        total: 11,
        published: 9,
        draft: 2,
        submissions: 14,
        pending_grading: 3,
        graded: 11,
        overdue: 1,
        average_grade: 82.4,
        submissions_in_period: 7,
        graded_in_period: 6,
    },
    comparison: {
        submissions_in_period: {
            current: 7,
            previous: 5,
            change: 2,
            change_percent: 40,
        },
        graded_in_period: {
            current: 6,
            previous: 4,
            change: 2,
            change_percent: 50,
        },
    },
    submission_series: [
        { date: "2026-10-01", submissions: 2 },
        { date: "2026-10-02", submissions: 5 },
    ],
    grading_series: [
        { date: "2026-10-01", graded: 1 },
        { date: "2026-10-02", graded: 5 },
    ],
    assignment_by_course: [
        {
            course_id: "course-1",
            course_title: "Automotive Electrical Foundations",
            assignments_count: 4,
            published_count: 3,
            submissions_count: 9,
            pending_grading: 2,
            graded_count: 7,
            overdue_count: 1,
            average_grade: 84.5,
        },
    ],
};

const learning: AnalyticsResponse = {
    period: overview.period,
    previous_period: overview.previous_period,
    summary: {
        average_progress: 62,
        completion_rate: 71,
        active_learners: 37,
        completed_learners: 24,
        time_spent_seconds: 7200,
        completions_in_period: 9,
    },
    comparison: {
        active_learners: {
            current: 37,
            previous: 34,
            change: 3,
            change_percent: 8.8,
        },
        completions_in_period: {
            current: 9,
            previous: 6,
            change: 3,
            change_percent: 50,
        },
    },
    engagement_series: [
        { date: "2026-10-01", active_learners: 12 },
        { date: "2026-10-02", active_learners: 19 },
    ],
    by_course: overview.top_courses,
};

const enrollments: AnalyticsResponse = {
    period: overview.period,
    previous_period: overview.previous_period,
    summary: {
        total: 190,
        active: 110,
        completed: 64,
        cancelled: 16,
        completion_rate: 34,
        new_in_period: 30,
        completed_in_period: 9,
    },
    comparison: {
        new_in_period: {
            current: 30,
            previous: 40,
            change: -10,
            change_percent: -25,
        },
        completed_in_period: {
            current: 9,
            previous: 6,
            change: 3,
            change_percent: 50,
        },
    },
    enrollment_series: [
        { date: "2026-10-01", enrollments: 3 },
        { date: "2026-10-02", enrollments: 2 },
    ],
    completion_series: [
        { date: "2026-10-01", completions: 1 },
        { date: "2026-10-02", completions: 2 },
    ],
};

function mockApi() {
    vi.mocked(adminApi.analytics).mockImplementation(async (kind) => {
        if (kind === "assignments") return structuredClone(assignments);
        if (kind === "learning") return structuredClone(learning);
        if (kind === "enrollments") return structuredClone(enrollments);
        return structuredClone(overview);
    });
    vi.mocked(adminApi.systemHealth).mockResolvedValue({
        status: "operational",
        application: { environment: "testing", name: "HBT" },
        checks: { database: { status: "operational", driver: "sqlite" } },
        checked_at: "2026-10-30T10:00:00.000Z",
    });
    vi.mocked(adminApi.simulatorAnalytics).mockResolvedValue({
        totals: {
            sessions: 120,
            completed: 90,
            active: 4,
            results: 90,
            students: 38,
            average_score: 76,
            pass_rate: 71,
            average_hints: 1.2,
            average_duration_seconds: 95,
            total_duration_seconds: 4000,
        },
        by_tool: [],
    });
    vi.mocked(adminApi.diagnosticAnalytics).mockResolvedValue({
        total_scenarios: 8,
        total_attempts: 48,
        avg_score: 82,
        pass_rate: 74,
    });
}

function renderPage() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    return render(
        <QueryClientProvider client={client}>
            <I18nextProvider i18n={i18n}>
                <MemoryRouter>
                    <AdminAnalyticsPage />
                </MemoryRouter>
            </I18nextProvider>
        </QueryClientProvider>,
    );
}

describe("AdminAnalyticsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockApi();
    });

    it("renders the cross-domain overview with comparisons and operations", async () => {
        renderPage();

        expect(
            await screen.findByTestId("analytics-kpi-new_users"),
        ).toHaveTextContent("12");
        expect(screen.getByTestId("analytics-kpi-new_users")).toHaveTextContent(
            "20%",
        );
        expect(
            screen.getByTestId("analytics-kpi-new_enrollments"),
        ).toHaveTextContent("25%");
        expect(screen.getByText("Operations queue")).toBeInTheDocument();
        expect(screen.getByText("Assignments awaiting grading")).toBeInTheDocument();
        expect(screen.getByText("Top courses by engagement")).toBeInTheDocument();
        expect(
            screen.getByText("Automotive Electrical Foundations"),
        ).toBeInTheDocument();
        expect(screen.getByTestId("analytics-platform-activity")).toHaveTextContent(
            "Simulator lab",
        );
        expect(screen.getByTestId("analytics-trend")).toBeInTheDocument();

        expect(adminApi.analytics).toHaveBeenCalledWith(
            "overview",
            expect.objectContaining({
                date_from: expect.any(String),
                date_to: expect.any(String),
            }),
        );
    });

    it("switches to assignment operations and renders the grading table", async () => {
        renderPage();
        await screen.findByTestId("analytics-kpi-new_users");

        fireEvent.click(screen.getByTestId("analytics-tab-assignments"));

        expect(
            await screen.findByTestId("analytics-kpi-pending_grading"),
        ).toHaveTextContent("3");
        expect(screen.getByTestId("analytics-assignment-table")).toHaveTextContent(
            "84.5%",
        );
        expect(screen.getByTestId("analytics-grading-health")).toHaveTextContent(
            "Pending grading",
        );
        expect(adminApi.analytics).toHaveBeenCalledWith(
            "assignments",
            expect.any(Object),
        );
    });

    it("switches to learning and enrollment views with their tables and funnels", async () => {
        renderPage();
        await screen.findByTestId("analytics-kpi-new_users");

        fireEvent.click(screen.getByTestId("analytics-tab-learning"));

        expect(
            await screen.findByTestId("analytics-kpi-average_progress"),
        ).toHaveTextContent("62%");
        expect(screen.getByTestId("analytics-course-table")).toHaveTextContent(
            "Automotive Electrical Foundations",
        );

        fireEvent.click(screen.getByTestId("analytics-tab-enrollments"));

        expect(
            await screen.findByTestId("analytics-kpi-completion_rate"),
        ).toHaveTextContent("34%");
        expect(
            screen.getByTestId("analytics-enrollment-funnel"),
        ).toHaveTextContent("16");
        expect(
            screen.getByTestId("analytics-enrollment-funnel"),
        ).toHaveTextContent("Active enrollments");
        expect(
            screen.getByTestId("analytics-enrollment-funnel"),
        ).not.toHaveTextContent("Active accounts");
    });

    it("changes the reporting period and exports the current view", async () => {
        Object.defineProperty(URL, "createObjectURL", {
            configurable: true,
            value: vi.fn(() => "blob:analytics"),
        });
        Object.defineProperty(URL, "revokeObjectURL", {
            configurable: true,
            value: vi.fn(),
        });
        const click = vi
            .spyOn(HTMLAnchorElement.prototype, "click")
            .mockImplementation(() => {});

        renderPage();
        await screen.findByTestId("analytics-kpi-new_users");

        fireEvent.change(screen.getByLabelText("Reporting period"), {
            target: { value: "7" },
        });

        await waitFor(() => {
            const calls = vi.mocked(adminApi.analytics).mock.calls;
            const last = calls[calls.length - 1];
            expect(last?.[0]).toBe("overview");
            const from = new Date(`${last?.[1]?.date_from}T12:00:00`);
            const to = new Date(`${last?.[1]?.date_to}T12:00:00`);
            expect(
                Math.round((to.getTime() - from.getTime()) / 86_400_000),
            ).toBe(6);
        });

        await screen.findByTestId("analytics-export");
        fireEvent.click(screen.getByTestId("analytics-export"));

        expect(URL.createObjectURL).toHaveBeenCalled();
        expect(click).toHaveBeenCalled();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:analytics");

        click.mockRestore();
    });
});
