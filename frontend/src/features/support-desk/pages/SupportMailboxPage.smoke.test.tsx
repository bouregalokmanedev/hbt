import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import { supportDeskApi, type MailListResponse, type MailThreadDetails } from "../api/supportDesk.api";
import { SupportMailboxPage } from "./SupportMailboxPage";

vi.mock("../api/supportDesk.api", () => ({
    supportDeskApi: {
        mail: vi.fn(),
        mailThread: vi.fn(),
        mailCompose: vi.fn(),
        mailReply: vi.fn(),
        mailRead: vi.fn(),
        mailArchive: vi.fn(),
        mailRecipients: vi.fn(),
    },
}));

const api = vi.mocked(supportDeskApi);

const threadRow: MailListResponse["data"][number] = {
    id: "m1",
    direction: "inbound",
    subject: "Cannot access my certificate",
    from_name: "Nadia Bensalem",
    from_email: "nadia@example.com",
    to_name: null,
    to_email: "support@hbtronics.dz",
    read: false,
    archived: false,
    message_count: 0,
    preview: "The download link returns a 404 error.",
    created_at: "2026-09-30T09:00:00.000Z",
};

const listResponse: MailListResponse = {
    data: [threadRow],
    meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
    summary: { inbox: 1, inbox_unread: 1, sent: 0, archive: 0 },
};

const threadDetails: MailThreadDetails = {
    ...threadRow,
    read: true,
    messages: [
        {
            id: "msg1",
            direction: "inbound",
            body: "The download link for my certificate returns a 404 error.",
            from_name: "Nadia Bensalem",
            from_email: "nadia@example.com",
            to_name: null,
            to_email: "support@hbtronics.dz",
            created_at: "2026-09-30T09:00:00.000Z",
        },
    ],
};

function renderPage() {
    return render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter initialEntries={["/support-desk/mail"]}>
                <SupportMailboxPage />
            </MemoryRouter>
        </I18nextProvider>,
    );
}

async function openThread() {
    fireEvent.click(await screen.findByText("Cannot access my certificate"));
    await waitFor(() => expect(api.mailThread).toHaveBeenCalledWith("m1"));
    return screen.getByRole("region", { name: "Conversation viewer" });
}

beforeEach(() => {
    vi.clearAllMocks();
    api.mail.mockResolvedValue(listResponse);
    api.mailThread.mockResolvedValue(threadDetails);
    api.mailRecipients.mockResolvedValue([
        { id: "u1", name: "Yacine Hamidi", email: "yacine@example.com" },
    ]);
    api.mailReply.mockResolvedValue({
        ...threadDetails,
        message_count: 1,
        messages: [
            ...threadDetails.messages,
            {
                id: "msg2",
                direction: "outbound",
                body: "Thanks Nadia — we regenerated the link for you.",
                from_name: "Sam Agent",
                from_email: "sam@hbt.test",
                to_name: "Nadia Bensalem",
                to_email: "nadia@example.com",
                created_at: "2026-09-30T09:30:00.000Z",
            },
        ],
    });
    api.mailRead.mockResolvedValue({ ...threadRow, read: false });
    api.mailArchive.mockResolvedValue({ ...threadRow, archived: true });
    api.mailCompose.mockResolvedValue({
        ...threadRow,
        id: "m2",
        direction: "outbound",
        subject: "Your subscription renews tomorrow",
        read: true,
        messages: [],
    });
});

describe("SupportMailboxPage", () => {
    it("loads the inbox and opens a conversation", async () => {
        renderPage();

        expect(api.mail).toHaveBeenCalledWith({ folder: "inbox", page: 1, per_page: 15 });
        expect(await screen.findByText("Cannot access my certificate")).toBeInTheDocument();

        const viewer = await openThread();
        expect(
            within(viewer).getByText(
                "The download link for my certificate returns a 404 error.",
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText("Write your reply…"),
        ).toBeInTheDocument();
    });

    it("replies to the open conversation", async () => {
        renderPage();
        await openThread();

        fireEvent.change(screen.getByPlaceholderText("Write your reply…"), {
            target: { value: "Thanks Nadia — we regenerated the link for you." },
        });
        fireEvent.click(screen.getByRole("button", { name: /send reply/i }));

        await waitFor(() =>
            expect(api.mailReply).toHaveBeenCalledWith("m1", {
                body: "Thanks Nadia — we regenerated the link for you.",
            }),
        );
        expect(await screen.findByText("Reply sent.")).toBeInTheDocument();
    });

    it("archives the conversation from the viewer", async () => {
        renderPage();
        const viewer = await openThread();

        fireEvent.click(within(viewer).getByRole("button", { name: "Archive" }));

        await waitFor(() => expect(api.mailArchive).toHaveBeenCalledWith("m1", true));
        expect(await screen.findByText("Conversation archived.")).toBeInTheDocument();
    });

    it("composes a new message to a student", async () => {
        renderPage();

        fireEvent.click(screen.getByRole("button", { name: /compose/i }));
        const dialog = await screen.findByRole("dialog", { name: "New message" });

        fireEvent.change(within(dialog).getByPlaceholderText("student@example.com"), {
            target: { value: "yacine@example.com" },
        });
        fireEvent.change(within(dialog).getByPlaceholderText("What is this about?"), {
            target: { value: "Your subscription renews tomorrow" },
        });
        fireEvent.change(within(dialog).getByPlaceholderText("Write your message…"), {
            target: { value: "This is a reminder that your monthly plan renews tomorrow." },
        });

        const send = within(dialog).getByRole("button", { name: /^send$/i });
        expect(send).toBeEnabled();
        fireEvent.click(send);

        await waitFor(() =>
            expect(api.mailCompose).toHaveBeenCalledWith(
                expect.objectContaining({
                    to_email: "yacine@example.com",
                    subject: "Your subscription renews tomorrow",
                }),
            ),
        );
        expect(await screen.findByText("Message sent.")).toBeInTheDocument();
    });

    it("keeps the send button disabled until the message is complete", async () => {
        renderPage();

        fireEvent.click(screen.getByRole("button", { name: /compose/i }));
        const dialog = await screen.findByRole("dialog", { name: "New message" });

        expect(within(dialog).getByRole("button", { name: /^send$/i })).toBeDisabled();
        expect(api.mailCompose).not.toHaveBeenCalled();
    });

    it("shows the empty state when a folder has nothing in it", async () => {
        api.mail.mockResolvedValue({
            ...listResponse,
            data: [],
            summary: { inbox: 0, inbox_unread: 0, sent: 0, archive: 0 },
        });

        renderPage();

        expect(await screen.findByText("This folder is empty")).toBeInTheDocument();
    });
});
