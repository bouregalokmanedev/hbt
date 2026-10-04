import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { I18nextProvider, initReactI18next } from "react-i18next";
import i18n from "i18next";

import { StaffHubOverviewPage } from "./StaffHubOverviewPage";
import { StaffHubPage } from "./StaffHubPage";
import { staffHubApi } from "../api/staffHub.api";

vi.mock("../api/staffHub.api", () => ({
    staffHubApi: {
        getRoom: vi.fn(),
        publishNews: vi.fn(),
    },
}));

i18n.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    resources: {
        en: {
            translation: {
                staffHub: {
                    eyebrow: "Platform staff",
                    title: "Staff Hub",
                    description: "One place for Admin, Super Admin, Support and Instructors.",
                    tabOverview: "Overview",
                    tabNews: "News",
                    tabRoom: "Room",
                    news: {
                        tag: "Post news",
                        title: "Reach the whole staff",
                        hint: "Everyone on staff receives this.",
                        titleLabel: "Title",
                        titlePh: "e.g. Desk maintenance window",
                        messageLabel: "Message",
                        messagePh: "Write a concise update…",
                        actionLabel: "Optional action path",
                        sendError: "The news could not be posted.",
                        sentOk: "Posted to {{count}} staff members.",
                        sending: "Posting…",
                        send: "Post to staff",
                    },
                    roster: {
                        tag: "Who is here",
                        title: "Everyone on staff",
                        count: "{{count}} people",
                        loading: "Loading the roster…",
                        error: "Unable to load the roster.",
                        you: "You",
                    },
                    links: {
                        room: "Staff room",
                        roomDesc: "One shared thread.",
                        news: "News feed",
                        newsDesc: "Read every staff announcement.",
                        open: "Open",
                    },
                },
            },
        },
    },
});

const HUB = "/admin/staff-hub";

const room = {
    id: "conv-1",
    type: "staff_room",
    subject: "Staff Room",
    status: "active",
    broadcast_id: null,
    replies_enabled: true,
    quick_replies: [],
    last_message_at: null,
    participant: null,
    unread_count: 0,
    member_count: 4,
    participants: [
        { id: "u-1", name: "Sam Super", role: "Super Admin" },
        { id: "u-2", name: "Ada Admin", role: "Admin" },
        { id: "u-3", name: "Stella Support", role: "Support" },
        { id: "u-4", name: "Ivan Instructor", role: "Instructor" },
    ],
};

function renderHub() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <I18nextProvider i18n={i18n}>
            <QueryClientProvider client={client}>
                <MemoryRouter initialEntries={[HUB]}>
                    <Routes>
                        <Route path={HUB} element={<StaffHubPage hubBase={HUB} />}>
                            <Route index element={<StaffHubOverviewPage hubBase={HUB} />} />
                        </Route>
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>
        </I18nextProvider>,
    );
}

describe("StaffHubPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(staffHubApi.getRoom).mockResolvedValue(room as never);
    });

    it("renders the hub shell with deep links to news and the room", async () => {
        renderHub();

        expect(screen.getByRole("heading", { name: "Staff Hub" })).toBeInTheDocument();
        // Exact names: the overview cards link to the same targets with longer labels.
        const news = await screen.findByRole("link", { name: "News" });
        expect(news).toHaveAttribute("href", `${HUB}/news`);
        expect(screen.getByRole("link", { name: "Room" })).toHaveAttribute("href", `${HUB}/room`);
        expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("href", HUB);
    });

    it("groups the roster by role once the room loads", async () => {
        renderHub();

        expect(await screen.findByText("Stella Support")).toBeInTheDocument();
        expect(screen.getByText("Ivan Instructor")).toBeInTheDocument();
        expect(screen.getByText("Everyone on staff")).toBeInTheDocument();
        expect(screen.getByText("4 people")).toBeInTheDocument();
        expect(screen.getByText("Super Admin")).toBeInTheDocument();
        expect(screen.getByText("Support")).toBeInTheDocument();
    });

    it("posts news without letting the client choose an audience", async () => {
        vi.mocked(staffHubApi.publishNews).mockResolvedValue({
            id: "b-1",
            audience: "staff",
            type: "announcement",
            title: "Desk maintenance",
            message: "The desk reopens at 09:00.",
            action_url: null,
            delivery: { recipients: 4, delivered: 4, failed: 0, read: 0 },
            administrator: null,
            delivered_at: null,
            created_at: "2026-09-30T10:00:00Z",
        } as never);

        renderHub();
        fireEvent.change(await screen.findByPlaceholderText("e.g. Desk maintenance window"), {
            target: { value: "Desk maintenance" },
        });
        fireEvent.change(screen.getByPlaceholderText("Write a concise update…"), {
            target: { value: "The desk reopens at 09:00." },
        });
        fireEvent.click(screen.getByRole("button", { name: /Post to staff/ }));

        await waitFor(() => expect(staffHubApi.publishNews).toHaveBeenCalledTimes(1));

        const payload = vi.mocked(staffHubApi.publishNews).mock.calls[0][0];
        expect(payload).toEqual({
            title: "Desk maintenance",
            message: "The desk reopens at 09:00.",
            action_url: undefined,
        });
        expect(payload).not.toHaveProperty("audience");

        // The delivery total must survive a payload without a full shape.
        expect(await screen.findByText("Posted to 4 staff members.")).toBeInTheDocument();
    });
});
