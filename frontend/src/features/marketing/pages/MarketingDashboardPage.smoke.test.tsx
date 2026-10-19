import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { MarketingDashboardPage } from "./MarketingDashboardPage";
import { marketingApi } from "../api/marketing.api";
import { overviewFixture } from "./overview.fixture";

vi.mock("../api/marketing.api", () => ({
    marketingApi: {
        overview: vi.fn(),
        performance: vi.fn(),
        setQuota: vi.fn(),
    },
}));

const fixture = overviewFixture;

describe("MarketingDashboardPage", () => {
    beforeEach(() => {
        vi.mocked(marketingApi.overview).mockResolvedValue(fixture);
        vi.mocked(marketingApi.performance).mockResolvedValue({
            month: "2026-10",
            reps: [
                {
                    id: "rep-1",
                    name: "HBT Sales",
                    email: "sales@hbtronics.dz",
                    open: 2,
                    won_month: 3,
                    lost_month: 1,
                    due_today: 1,
                    overdue: 0,
                    quota_target: 5,
                    quota_progress: 60,
                },
            ],
        });
    });

    it("renders the KPIs, funnel, attention queue and activity feed", async () => {
        render(
            <MemoryRouter>
                <MarketingDashboardPage />
            </MemoryRouter>,
        );

        expect(await screen.findByText("Sales dashboard")).toBeInTheDocument();

        // KPI row with formatted money and period deltas (scoped per card so
        // funnel percentages elsewhere on the page never collide).
        expect(screen.getByText("2,500 DZD")).toBeInTheDocument();
        expect(within(screen.getByText("Revenue · 7d").closest("section") as HTMLElement).getByText("25%")).toBeInTheDocument();
        expect(within(screen.getByText("Signups · 7d").closest("section") as HTMLElement).getByText("100%")).toBeInTheDocument();
        expect(within(screen.getByText("Visitors · 7d").closest("section") as HTMLElement).getByText("20%")).toBeInTheDocument();

        // Journey funnel steps.
        expect(screen.getByText("Journey · last 7 days")).toBeInTheDocument();
        expect(screen.getByText("Course views")).toBeInTheDocument();
        expect(screen.getByText("Paid orders")).toBeInTheDocument();

        // Action queue driven by real counts.
        expect(screen.getByText("Needs attention")).toBeInTheDocument();
        expect(screen.getByText("1 unread lead")).toBeInTheDocument();
        expect(screen.getByText("44 abandoned checkouts")).toBeInTheDocument();

        // Team leaderboard with quota progress.
        expect(await screen.findByRole("heading", { name: /Team leaderboard/ })).toBeInTheDocument();
        expect(await screen.findByText("3/5")).toBeInTheDocument();

        // Pipeline strip: stage counts + follow-up load + 30-day win rate.
        expect(screen.getByText("Pipeline")).toBeInTheDocument();
        expect(screen.getByText("1 follow-up due today")).toBeInTheDocument();
        expect(screen.getByText("1 hot lead")).toBeInTheDocument();
        expect(screen.getByText("50% win rate (30d)")).toBeInTheDocument();

        // Activity feed + geography.
        expect(screen.getByText("Latest activity")).toBeInTheDocument();
        expect(screen.getByText("Amine Test")).toBeInTheDocument();
        expect(screen.getByText("DZ")).toBeInTheDocument();
    });

    it("shows the error state with a retry action when the request fails", async () => {
        vi.mocked(marketingApi.overview).mockRejectedValueOnce(new Error("boom"));

        render(
            <MemoryRouter>
                <MarketingDashboardPage />
            </MemoryRouter>,
        );

        expect(await screen.findByRole("alert")).toHaveTextContent("boom");
        expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });
});
