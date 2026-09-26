import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";

import { InviteFriendsCard } from "./InviteFriendsCard";
import { inviteUrlFor } from "../utils/referral";
import { api } from "@/lib/api/client";
import { track } from "@/lib/track";

vi.mock("@/lib/api/client", () => ({
  api: vi.fn(),
}));

vi.mock("@/lib/track", () => ({
  track: vi.fn(),
  trackOnce: vi.fn(),
}));

const summary = {
  code: "NB7Q2K9X",
  invites: 2,
  xp_earned: 50,
  reward_xp: 25,
};

function renderCard() {
  return render(
    <I18nextProvider i18n={i18n}>
      <InviteFriendsCard />
    </I18nextProvider>,
  );
}

describe("InviteFriendsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api).mockResolvedValue(summary);
  });

  it("renders the invite link with the referral code and funnel stats", async () => {
    renderCard();

    await waitFor(() => {
      expect(screen.getByTestId("invite-friends-link")).toBeInTheDocument();
    });

    expect(screen.getByTestId("invite-friends-link")).toHaveValue(
      inviteUrlFor("NB7Q2K9X"),
    );
    expect(inviteUrlFor("NB7Q2K9X")).toContain("/register?ref=NB7Q2K9X");
    expect(screen.getByTestId("invite-friends-count")).toHaveTextContent("2");
    expect(screen.getByTestId("invite-friends-xp")).toHaveTextContent("50");
    expect(api).toHaveBeenCalledWith("/v1/referrals", { method: "POST" });
  });

  it("copies the invite link and flips the button to a copied state", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    renderCard();

    await waitFor(() => {
      expect(screen.getByTestId("invite-friends-copy")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("invite-friends-copy"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(inviteUrlFor("NB7Q2K9X"));
      expect(screen.getByTestId("invite-friends-copy")).toHaveTextContent(
        "Copied",
      );
    });

    expect(track).toHaveBeenCalledWith("referral_invite_shared", {
      source: "dashboard_copy",
    });
  });

  it("surfaces an error when the invite link cannot be created", async () => {
    vi.mocked(api).mockRejectedValue(new Error("offline"));

    renderCard();

    await waitFor(() => {
      expect(screen.getByTestId("invite-friends-error")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("invite-friends-link")).not.toBeInTheDocument();
  });
});
