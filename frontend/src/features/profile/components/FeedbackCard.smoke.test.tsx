import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { FeedbackCard } from "./FeedbackCard";
import { submitPlatformFeedback } from "../api/platform-feedback.api";

vi.mock("../api/platform-feedback.api", () => ({
  submitPlatformFeedback: vi.fn(),
}));

function renderCard() {
  return render(
    <I18nextProvider i18n={i18n}>
      <FeedbackCard />
    </I18nextProvider>,
  );
}

describe("FeedbackCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(submitPlatformFeedback).mockResolvedValue({} as never);
  });

  it("asks about platform navigation, not courses", () => {
    renderCard();

    expect(screen.getByTestId("profile-feedback-card")).toBeInTheDocument();
    expect(screen.getByText(/navigating the platform/i)).toBeInTheDocument();
    expect(screen.getByTestId("profile-feedback-quick-easy")).toBeInTheDocument();
    expect(screen.getByTestId("profile-feedback-quick-okay")).toBeInTheDocument();
    expect(screen.getByTestId("profile-feedback-quick-confusing")).toBeInTheDocument();
    expect(screen.getByTestId("profile-feedback-quick-issue")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText(/enroll in a course/i)).not.toBeInTheDocument();
  });

  it("keeps send disabled until a quick rating is chosen", () => {
    renderCard();

    expect(screen.getByTestId("profile-feedback-send")).toBeDisabled();

    fireEvent.click(screen.getByTestId("profile-feedback-quick-easy"));
    expect(screen.getByTestId("profile-feedback-send")).toBeEnabled();
  });

  it("submits platform feedback with rating, area, and note", async () => {
    renderCard();

    fireEvent.click(screen.getByTestId("profile-feedback-quick-easy"));

    const note = screen.getByTestId("profile-feedback-note");
    fireEvent.change(note, { target: { value: "Menus are clear." } });

    fireEvent.click(screen.getByTestId("profile-feedback-send"));

    await waitFor(() => {
      expect(submitPlatformFeedback).toHaveBeenCalledWith({
        rating: 5,
        comment: "Menus are clear.",
        area: "navigation",
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("profile-feedback-sent")).toBeInTheDocument();
    });
  });

  it("shows an error message when the API fails", async () => {
    vi.mocked(submitPlatformFeedback).mockRejectedValue(new Error("boom"));

    renderCard();
    fireEvent.click(screen.getByTestId("profile-feedback-quick-okay"));
    fireEvent.click(screen.getByTestId("profile-feedback-send"));

    await waitFor(() => {
      expect(screen.getByTestId("profile-feedback-error")).toBeInTheDocument();
    });
  });
});
