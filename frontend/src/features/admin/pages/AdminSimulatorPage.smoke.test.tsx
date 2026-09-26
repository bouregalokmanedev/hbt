import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { AdminSimulatorPage } from "./AdminSimulatorPage";
import { adminApi } from "../api/adminApi";

vi.mock("../api/adminApi", () => ({
    adminApi: {
        simulatorAnalytics: vi.fn(),
        simulatorSessions: vi.fn(),
    },
}));

i18n.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    resources: {
        en: {
            translation: {
                admin: {
                    heading: { edit: "Edit" },
                    simulator: {
                        eyebrow: "Simulator labs",
                        title: "Simulator lab activity",
                        description: "Platform-wide simulator sessions.",
                        sectionTitle: "Student activity",
                        sectionNote: "Every simulator session across the platform.",
                        metrics: {
                            sessions: "Sessions",
                            completed: "Completed",
                            students: "Students",
                            avgScore: "Avg score",
                            passRate: "Pass rate",
                            avgDuration: "Avg duration",
                        },
                        byTool: "By tool",
                        byVehicle: "Vehicles",
                        toolStats: "{{completed}} completed · {{score}}% avg · {{pass}}% pass",
                        searchPh: "Search student, tool, or vehicle…",
                        clearSearch: "Clear search",
                        clearFilters: "Clear filters",
                        removeFilter: "Remove filter",
                        results: "{{n}} matching sessions",
                        showing: "Showing {{from}}–{{to}} of {{total}}",
                        sessionsTitle: "Sessions",
                        analyticsError: "Couldn't load analytics.",
                        retry: "Retry",
                        filters: {
                            title: "Filters",
                            search: "Search",
                            tool: "Tool",
                            status: "Status",
                            vehicle: "Vehicle",
                            allTools: "All tools",
                            allVehicles: "All vehicles",
                            allStatuses: "All statuses",
                            active: "Active",
                            completed: "Completed",
                            dateFrom: "From",
                            dateTo: "To",
                            dateRange: "Date range",
                        },
                        presets: {
                            d7: "Last 7 days",
                            d30: "Last 30 days",
                            all: "All time",
                        },
                        tools: {
                            scanner: "Scanner",
                            multimeter: "Multimeter",
                            oscilloscope: "Oscilloscope",
                            location: "Location",
                            schematic: "Schematic",
                        },
                        headers: {
                            student: "Student",
                            tool: "Tool",
                            vehicle: "Vehicle",
                            score: "Score",
                            outcome: "Outcome",
                            attempts: "Attempts",
                            hints: "Hints",
                            duration: "Duration",
                            started: "Started",
                            status: "Status",
                            performance: "Performance",
                        },
                        status: { active: "Active", completed: "Completed" },
                        outcome: { pass: "Pass", fail: "Fail", fault: "Fault" },
                        perf: { tries: "{{n}} tries", hints: "{{n}} hints" },
                        empty: "No simulator sessions yet.",
                        noMatch: "No sessions match your search.",
                        unknownStudent: "Unknown student",
                        pageMeta: "Page {{page}} of {{last}} · {{total}} sessions",
                        prev: "Previous",
                        next: "Next",
                    },
                },
            },
        },
    },
});

function renderPage() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={client}>
            <I18nextProvider i18n={i18n}>
                <AdminSimulatorPage />
            </I18nextProvider>
        </QueryClientProvider>,
    );
}

describe("AdminSimulatorPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(adminApi.simulatorAnalytics).mockResolvedValue({
            totals: {
                sessions: 3,
                completed: 2,
                active: 1,
                results: 2,
                students: 1,
                average_score: 80,
                pass_rate: 50,
                average_hints: 1.5,
                average_duration_seconds: 125,
                total_duration_seconds: 250,
            },
            by_tool: [
                {
                    tool: "scanner",
                    sessions: 3,
                    completed: 2,
                    results: 2,
                    average_score: 80,
                    pass_rate: 50,
                    average_hints: 1.5,
                    average_duration_seconds: 125,
                },
            ],
            by_vehicle: [{ vehicle_key: "toyota-camry-2020", sessions: 3 }],
        });
        vi.mocked(adminApi.simulatorSessions).mockResolvedValue({
            data: [
                {
                    id: "sess-1",
                    student: { id: 1, name: "Sara Student", email: "sara@example.com", avatar: null },
                    tool: "scanner",
                    vehicle_key: "toyota-camry-2020",
                    scenario_key: null,
                    status: "completed",
                    score: 80,
                    duration_seconds: 125,
                    started_at: "2026-09-24T10:00:00.000Z",
                    ended_at: "2026-09-24T10:02:05.000Z",
                    result: {
                        outcome: "pass",
                        verdict: "ok",
                        score: 80,
                        attempts: 2,
                        hints_used: 1,
                        duration_seconds: 125,
                        created_at: "2026-09-24T10:02:05.000Z",
                    },
                },
            ],
            meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
        });
    });

    it("renders metrics and session rows", async () => {
        renderPage();
        expect(screen.getByTestId("admin-simulator")).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText("Sara Student")).toBeInTheDocument();
        });
        expect(screen.getAllByText("Scanner").length).toBeGreaterThan(0);
        expect(screen.getAllByText("toyota-camry-2020").length).toBeGreaterThan(0);
        expect(screen.getByText("Pass")).toBeInTheDocument();
        expect(screen.getAllByText("2m 5s").length).toBeGreaterThan(0);
        expect(screen.getAllByText("80%").length).toBeGreaterThan(0);
        expect(screen.getAllByText("50%").length).toBeGreaterThan(0);
        expect(screen.getByTestId("admin-simulator-total")).toHaveTextContent(
            "matching sessions",
        );
    });

    it("calls sessions api with page and per_page", async () => {
        renderPage();
        await waitFor(() => {
            expect(adminApi.simulatorSessions).toHaveBeenCalledWith({
                page: 1,
                per_page: 20,
            });
        });
    });

    it("filters sessions by vehicle", async () => {
        renderPage();
        await waitFor(() => {
            expect(
                screen.getByRole("option", { name: "toyota-camry-2020 (3)" }),
            ).toBeInTheDocument();
        });
        fireEvent.change(screen.getByTestId("admin-simulator-vehicle"), {
            target: { value: "toyota-camry-2020" },
        });
        await waitFor(() => {
            expect(adminApi.simulatorSessions).toHaveBeenCalledWith(
                expect.objectContaining({ vehicle: "toyota-camry-2020" }),
            );
        });
    });
});
