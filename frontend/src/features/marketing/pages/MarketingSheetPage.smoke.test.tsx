import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { MarketingSheetPage } from "./MarketingSheetPage";
import { marketingApi, type Lead } from "../api/marketing.api";

vi.mock("../api/marketing.api", () => ({
    marketingApi: {
        leads: vi.fn(),
        team: vi.fn(),
        updateLead: vi.fn(),
        exportLeadsCsv: vi.fn(),
        importLeads: vi.fn(),
        convertedUsers: vi.fn(),
    },
    LEAD_STATUSES: ["new", "contacted", "qualified", "proposal", "won", "lost"],
}));

const row: Lead = {
    id: 7,
    name: "Amine Berkane",
    email: "amine@example.com",
    phone: "+213555000111",
    inquiry: null,
    subject: "Pricing",
    message: "Hi",
    status: "qualified",
    score: 62,
    source: "contact_form",
    course_interest: "Embedded",
    owner: { id: "own-1", name: "HBT Sales", email: "sales@hbtronics.dz" },
    utm: { source: "google", medium: "cpc", campaign: "fall", term: null, content: null },
    next_follow_up_at: "2026-10-20T00:00:00.000Z",
    closed_at: null,
    lost_reason: null,
    overdue: false,
    converted: false,
    read: true,
    activities_count: 0,
    created_at: "2026-10-01T10:00:00.000Z",
};

describe("MarketingSheetPage", () => {
    beforeEach(() => {
        vi.mocked(marketingApi.leads).mockResolvedValue({
            data: [row],
            meta: { current_page: 1, last_page: 1, per_page: 200, total: 1 },
            summary: {
                total: 1,
                unread: 0,
                converted: 0,
                by_stage: { new: 0, contacted: 0, qualified: 1, proposal: 0, won: 0, lost: 0 },
                due_today: 0,
                overdue: 0,
                hot: 0,
                won_30d: 0,
                sources: [],
            },
        });
        vi.mocked(marketingApi.team).mockResolvedValue([{ id: "own-1", name: "HBT Sales", email: "sales@hbtronics.dz" }]);
        vi.mocked(marketingApi.updateLead).mockResolvedValue(row);
        vi.mocked(marketingApi.convertedUsers).mockResolvedValue({
            data: [
                {
                    id: "u1",
                    name: "Lokmane B",
                    email: "lok@example.com",
                    avatar: null,
                    country: "DZ",
                    joined_at: "2026-09-20T10:00:00.000Z",
                    source: "contact_form",
                    course_interest: "Embedded",
                    lead_status: "won",
                    enrollments: 2,
                    first_course: "Embedded Systems",
                    paid_total: 9800,
                },
            ],
            meta: { current_page: 1, last_page: 1, per_page: 50, total: 1 },
        });
    });

    it("renders the spreadsheet grid with editable stage cells", async () => {
        render(<MarketingSheetPage />);

        expect(await screen.findByText("Sales sheet")).toBeInTheDocument();
        expect(screen.getByText("1 rows loaded · 1 leads in the pipeline")).toBeInTheDocument();

        // Column headers.
        expect(screen.getByText("Stage")).toBeInTheDocument();
        expect(screen.getByText("Follow-up")).toBeInTheDocument();
        expect(screen.getByText("Interest")).toBeInTheDocument();

        // Inline stage select carries the current value.
        expect(screen.getByDisplayValue("Qualified")).toBeInTheDocument();
        expect(screen.getByDisplayValue("HBT Sales")).toBeInTheDocument();
    });

    it("saves a stage change through the API", async () => {
        render(<MarketingSheetPage />);

        const stageSelect = await screen.findByDisplayValue("Qualified");
        fireEvent.change(stageSelect, { target: { value: "proposal" } });

        expect(marketingApi.updateLead).toHaveBeenCalledWith(7, { status: "proposal" });
    });

    it("shows converted customers on the Customers tab", async () => {
        render(<MarketingSheetPage />);

        fireEvent.click(await screen.findByRole("button", { name: /Customers/ }));

        expect(await screen.findByText("Lokmane B")).toBeInTheDocument();
        expect(screen.getByText("Embedded Systems")).toBeInTheDocument();
        expect(screen.getByText("9800 DZD")).toBeInTheDocument();
    });
});
