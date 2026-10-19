import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { MarketingAnalyticsPage } from "./MarketingAnalyticsPage";
import { marketingApi, type VisitorAnalytics } from "../api/marketing.api";

vi.mock("../api/marketing.api", () => ({
    marketingApi: {
        analytics: vi.fn(),
    },
}));

const fixture: VisitorAnalytics = {
    days: 7,
    visitors: 140,
    top_pages: [
        { page: "/", views: 300, visitors: 90 },
        { page: "/pricing", views: 120, visitors: 55 },
    ],
    top_clicks: [{ page: "/pricing", clicks: 40, visitors: 30 }],
    avg_seconds_on_page: 42,
    countries: [
        { country: "DZ", events: 200, visitors: 80 },
        { country: "FR", events: 60, visitors: 30 },
    ],
    regions: [
        { region: "North Africa", visitors: 90, countries: 2 },
        { region: "Western Europe", visitors: 30, countries: 1 },
    ],
    languages: [
        { language: "ar", events: 150, visitors: 70 },
        { language: "fr", events: 50, visitors: 30 },
    ],
    funnel_stages: [
        { key: "landing", phase: "discovery", label: "Landing page views", value: 140 },
        { key: "company", phase: "discovery", label: "Company page views", value: 56 },
        { key: "simulator", phase: "discovery", label: "Simulator views", value: 42 },
        { key: "contact", phase: "discovery", label: "Contact page views", value: 28 },
        { key: "pricing", phase: "conversion", label: "Pricing views", value: 21 },
        { key: "plan_cta", phase: "conversion", label: "Plan CTA clicks", value: 14 },
        { key: "signups", phase: "conversion", label: "Signups", value: 7 },
        { key: "enrollments", phase: "conversion", label: "Enrollments", value: 3 },
    ],
};

describe("MarketingAnalyticsPage", () => {
    beforeEach(() => {
        vi.mocked(marketingApi.analytics).mockResolvedValue(fixture);
    });

    it("renders the two-phase funnel with continuation rates and the geo trio", async () => {
        render(<MarketingAnalyticsPage />);

        expect(await screen.findByText("Visitor analytics")).toBeInTheDocument();

        // Funnel stages (both phases) with % of entry.
        expect(screen.getByText("Landing page views")).toBeInTheDocument();
        expect(screen.getByText("Plan CTA clicks")).toBeInTheDocument();
        expect(screen.getAllByText(/% of entry/)).toHaveLength(8);
        expect(screen.getByText("40% continued")).toBeInTheDocument();
        expect(screen.getByText("60% dropped from previous step")).toBeInTheDocument();

        // Range pills now span a day to a year.
        expect(screen.getByRole("button", { name: "1d" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "2w" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "6m" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "1y" })).toBeInTheDocument();

        // Headline stats — enrolments come straight from the funnel stages.
        const enrollmentCard = screen.getByText("Enrollments", { selector: "p" }).closest("section") as HTMLElement;
        expect(enrollmentCard).not.toBeNull();
        expect(within(enrollmentCard).getByText("3")).toBeInTheDocument();
        expect(within(enrollmentCard).getByText("Enrollments")).toBeInTheDocument();
        const signupCard = screen.getByText("Signups", { selector: "p" }).closest("section") as HTMLElement;
        expect(within(signupCard).getByText("7")).toBeInTheDocument();
        expect(screen.getByText("42s")).toBeInTheDocument();

        // Geo & language cards.
        expect(screen.getByText("Country analytics")).toBeInTheDocument();
        expect(screen.getByText("Region analytics")).toBeInTheDocument();
        expect(screen.getByText("Language analysis")).toBeInTheDocument();
        expect(screen.getByText("North Africa")).toBeInTheDocument();
        expect(screen.getByText("العربية")).toBeInTheDocument();
        expect(screen.getByText("Français")).toBeInTheDocument();
    });

    it("shows an alert when analytics fail to load", async () => {
        vi.mocked(marketingApi.analytics).mockRejectedValueOnce(new Error("boom"));

        render(<MarketingAnalyticsPage />);

        expect(await screen.findByRole("alert")).toHaveTextContent("boom");
    });
});
