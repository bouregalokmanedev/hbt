import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { MessagesCard } from "./MessagesCard";
import { messagesApi } from "@/features/messages/api/messages.api";

vi.mock("@/features/messages/api/messages.api", () => ({
  messagesApi: {
    list: vi.fn(),
  },
}));

function renderCard() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <MessagesCard />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("MessagesCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading then empty state when there are no conversations", async () => {
    vi.mocked(messagesApi.list).mockResolvedValue([]);

    renderCard();

    expect(screen.getByText(/loading messages/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/no new messages/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId("profile-messages-view-all")).toBeInTheDocument();
  });

  it("loads real unread counts and recent conversations", async () => {
    vi.mocked(messagesApi.list).mockResolvedValue([
      {
        id: "c1",
        type: "direct",
        subject: null,
        status: "active",
        replies_enabled: true,
        quick_replies: [],
        last_message_at: "2026-09-20T10:00:00Z",
        participant: { id: "p1", name: "Omar Coach", email: "o@x.com", role: "Instructor" },
        unread_count: 2,
        member_count: 2,
      },
      {
        id: "c2",
        type: "group",
        subject: "Class announcements",
        status: "active",
        replies_enabled: true,
        quick_replies: [],
        last_message_at: "2026-09-19T10:00:00Z",
        participant: null,
        unread_count: 0,
        member_count: 12,
      },
    ]);

    renderCard();

    await waitFor(() => {
      expect(screen.getByTestId("profile-messages-unread")).toHaveTextContent("2");
    });

    expect(screen.getByText("Omar Coach")).toBeInTheDocument();
    expect(screen.getByText("Class announcements")).toBeInTheDocument();
    expect(screen.getByTestId("profile-messages-view-all")).toBeInTheDocument();
  });

  it("always links to the messages page", async () => {
    vi.mocked(messagesApi.list).mockResolvedValue([]);

    renderCard();

    await waitFor(() => {
      expect(screen.getByTestId("profile-messages-view-all")).toHaveAttribute("href", "/messages");
    });
  });

  it("survives API failures with the empty state", async () => {
    vi.mocked(messagesApi.list).mockRejectedValue(new Error("network"));

    renderCard();

    await waitFor(() => {
      expect(screen.getByText(/no new messages/i)).toBeInTheDocument();
    });
  });
});
