import { fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n";
import type { Achievement } from "../types/dashboard.types";
import { BadgeUnlockedModal } from "./BadgeUnlockedModal";

function buildBadge(overrides: Partial<Achievement> = {}): Achievement {
  return {
    id: "learner",
    title: "Learner",
    description: "Complete your first course.",
    icon: "▣",
    progress: 1,
    target: 1,
    completed: true,
    ...overrides,
  };
}

function renderModal(achievements: Achievement[], userId = "u-test") {
  return render(
    <I18nextProvider i18n={i18n}>
      <BadgeUnlockedModal userId={userId} achievements={achievements} />
    </I18nextProvider>,
  );
}

describe("BadgeUnlockedModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders nothing while no badge is queued", () => {
    renderModal([]);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens for a newly earned badge and closes after dismissal", async () => {
    localStorage.setItem("hbt-seen-badges-u-test", JSON.stringify([]));

    renderModal([buildBadge()]);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Complete your first course.")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: i18n.t("dashboard.badgeModal.close") }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("stays closed when every earned badge was already seen", () => {
    localStorage.setItem(
      "hbt-seen-badges-u-test",
      JSON.stringify(["learner"]),
    );

    renderModal([buildBadge()]);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
