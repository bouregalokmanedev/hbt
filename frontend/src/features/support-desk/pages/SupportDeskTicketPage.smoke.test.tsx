import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import { supportDeskApi, type DeskTicketDetails } from "../api/supportDesk.api";
import { SupportDeskTicketPage } from "./SupportDeskTicketPage";

vi.mock("../api/supportDesk.api", () => ({
    supportDeskApi: {
        get: vi.fn(),
        reply: vi.fn(),
        assign: vi.fn(),
        resolve: vi.fn(),
        close: vi.fn(),
        escalate: vi.fn(),
    },
}));

vi.mock("@/features/auth/hooks/useAuth", () => ({
    useAuth: () => ({
        user: {
            id: "agent-uuid",
            first_name: "Sam",
            last_name: "Agent",
            email: "sam@hbt.test",
            roles: ["Support"],
        },
        logout: vi.fn(),
    }),
}));

const api = vi.mocked(supportDeskApi);

const ticket: DeskTicketDetails = {
    id: "t1",
    subject: "Cannot download my certificate",
    category: "certification",
    status: "open",
    priority: "high",
    level: "support",
    user: "Nadia Bensalem",
    email: "nadia@example.com",
    assignee: null,
    due_at: null,
    overdue: false,
    created_at: "2026-09-30T09:00:00.000Z",
    replies: [
        {
            id: "r1",
            author: "Nadia Bensalem",
            body: "The download link returns a 404 error.",
            internal: false,
            created_at: "2026-09-30T09:05:00.000Z",
        },
    ],
};

function renderPage() {
    return render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter initialEntries={["/support-desk/tickets/t1"]}>
                <Routes>
                    <Route path="/support-desk/tickets/:ticketId" element={<SupportDeskTicketPage />} />
                </Routes>
            </MemoryRouter>
        </I18nextProvider>,
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue(ticket);
    api.assign.mockResolvedValue(ticket);
    api.resolve.mockResolvedValue(ticket);
    api.close.mockResolvedValue(ticket);
    api.escalate.mockResolvedValue(ticket);
    api.reply.mockResolvedValue(ticket);
});

describe("SupportDeskTicketPage", () => {
    it("renders the ticket with its conversation", async () => {
        renderPage();

        expect(await screen.findByText("Cannot download my certificate")).toBeInTheDocument();
        expect(
            screen.getByText("The download link returns a 404 error."),
        ).toBeInTheDocument();
    });

    it("does not crash when an action response omits replies", async () => {
        // assign/resolve/close/escalate used to return a payload without
        // `replies`, which made `ticket.replies.length` throw during render.
        const { replies: _replies, ...withoutReplies } = ticket;
        api.resolve.mockResolvedValue({
            ...withoutReplies,
            status: "resolved",
        } as unknown as DeskTicketDetails);

        renderPage();
        expect(await screen.findByText("Cannot download my certificate")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Resolve" }));

        await waitFor(() => expect(api.resolve).toHaveBeenCalledWith("t1"));
        expect(await screen.findByRole("button", { name: "Assign to me" })).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(
            screen.getByText("The download link returns a 404 error."),
        ).toBeInTheDocument();
    });

    it("escalates admin-level tickets to super admin", async () => {
        api.get.mockResolvedValue({ ...ticket, level: "admin" });

        renderPage();
        expect(await screen.findByText("Cannot download my certificate")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Escalate to Super Admin" }));

        await waitFor(() =>
            expect(api.escalate).toHaveBeenCalledWith("t1", { level: "super_admin" }),
        );
    });

    it("hides the escalate button once the ticket is at super admin level", async () => {
        api.get.mockResolvedValue({ ...ticket, level: "super_admin" });

        renderPage();
        expect(await screen.findByText("Cannot download my certificate")).toBeInTheDocument();

        expect(
            screen.queryByRole("button", { name: /escalate/i }),
        ).not.toBeInTheDocument();
    });

    it("labels the assign button correctly when the ticket is already mine", async () => {
        api.get.mockResolvedValue({ ...ticket, assignee: "Sam Agent" });

        renderPage();

        expect(
            await screen.findByRole("button", { name: "Re-assign to me" }),
        ).toBeInTheDocument();
    });
});
