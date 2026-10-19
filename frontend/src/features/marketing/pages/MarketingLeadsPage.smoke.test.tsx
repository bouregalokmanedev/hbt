import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { MarketingLeadsPage } from "./MarketingLeadsPage";
import { marketingApi, type Lead, type LeadDetail } from "../api/marketing.api";

vi.mock("../api/marketing.api", () => ({
    marketingApi: {
        leads: vi.fn(),
        team: vi.fn(),
        lead: vi.fn(),
        readLead: vi.fn(),
        updateLead: vi.fn(),
        deleteLead: vi.fn(),
        addLeadActivity: vi.fn(),
        createLead: vi.fn(),
        exportLeadsCsv: vi.fn(),
        importLeads: vi.fn(),
        convertedUsers: vi.fn(),
    },
    LEAD_STATUSES: ["new", "contacted", "qualified", "proposal", "won", "lost"],
}));

const baseLead: Partial<Lead> = {
    name: "Amine Berkane",
    email: "amine@example.com",
    phone: "+213555000111",
    subject: "Course pricing",
    message: "How much for the embedded course?",
    status: "new",
    score: 15,
    source: "contact_form",
    course_interest: "Embedded",
    owner: null,
    utm: { source: null, medium: null, campaign: null, term: null, content: null },
    next_follow_up_at: null,
    closed_at: null,
    lost_reason: null,
    overdue: false,
    converted: false,
    read: true,
    activities_count: 0,
    created_at: new Date().toISOString(),
};

const leadOne: Lead = { ...(baseLead as Lead), id: 1 };
const leadTwo: Lead = {
    ...(baseLead as Lead),
    id: 2,
    name: "Sara Kim",
    email: "sara@example.com",
    status: "qualified",
    score: 80,
    owner: { id: "own-1", name: "HBT Sales", email: "sales@hbtronics.dz" },
    next_follow_up_at: new Date(Date.now() - 86400000).toISOString(),
    overdue: true,
    read: true,
};

const detailFixture: LeadDetail = {
    ...(baseLead as Lead),
    id: 1,
    status: "contacted",
    score: 45,
    activities: [
        { id: "a1", type: "call", body: "Interested in weekend batch.", by: "HBT Sales", at: new Date().toISOString() },
    ],
    journey: [
        { event: "pricing_viewed", page: "/pricing", country: "DZ", properties: null, at: new Date().toISOString() },
        { event: "page_view", page: "/", country: "DZ", properties: null, at: new Date().toISOString() },
    ],
    account: null,
};

const listFixture = {
    data: [leadOne, leadTwo],
    meta: { current_page: 1, last_page: 1, per_page: 15, total: 2 },
    summary: {
        total: 2,
        unread: 0,
        converted: 0,
        by_stage: { new: 1, contacted: 0, qualified: 1, proposal: 0, won: 0, lost: 0 },
        due_today: 1,
        overdue: 1,
        hot: 1,
        won_30d: 0,
        sources: [{ source: "contact_form", total: 2 }],
    },
};

describe("MarketingLeadsPage", () => {
    beforeEach(() => {
        vi.mocked(marketingApi.leads).mockResolvedValue(listFixture);
        vi.mocked(marketingApi.team).mockResolvedValue([
            { id: "own-1", name: "HBT Sales", email: "sales@hbtronics.dz" },
        ]);
        vi.mocked(marketingApi.lead).mockResolvedValue(detailFixture);
        vi.mocked(marketingApi.readLead).mockResolvedValue(leadOne);
        vi.mocked(marketingApi.updateLead).mockResolvedValue(leadOne);
        vi.mocked(marketingApi.addLeadActivity).mockResolvedValue({
            id: "a2",
            type: "note",
            body: "note",
            by: "HBT Sales",
            at: new Date().toISOString(),
        });
    });

    it("renders the pipeline summary, filter chips and lead table", async () => {
        render(<MarketingLeadsPage />);

        expect(await screen.findByText("2 leads · 0 unread · 2 follow-ups · 1 hot")).toBeInTheDocument();

        // Table columns + rows.
        expect(screen.getByText("Amine Berkane")).toBeInTheDocument();
        expect(screen.getByText("Sara Kim")).toBeInTheDocument();
        expect(screen.getByText("HBT Sales")).toBeInTheDocument();

        // Stage filter chips carry live counts.
        expect(screen.getByRole("button", { name: /New\s*1/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Qualified\s*1/ })).toBeInTheDocument();
    });

    it("switches to the board view with one column per stage", async () => {
        render(<MarketingLeadsPage />);

        await screen.findByText("Amine Berkane");
        fireEvent.click(screen.getByRole("button", { name: /Board/ }));

        // Stage chips appear both as filters and as board columns.
        expect(screen.getAllByText("Proposal").length).toBeGreaterThan(1);
        expect(screen.getAllByText("Lost").length).toBeGreaterThan(1);
        expect(screen.getAllByText("Drop leads here").length).toBeGreaterThan(0);
    });

    it("opens the detail drawer with the activity log and journey", async () => {
        render(<MarketingLeadsPage />);

        fireEvent.click(await screen.findByText("Amine Berkane"));

        expect(await screen.findByText("Interested in weekend batch.")).toBeInTheDocument();
        expect(screen.getByText("Viewed page")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Log activity" })).toBeInTheDocument();
        expect(screen.getByDisplayValue("Contacted")).toBeInTheDocument();
    });
});
