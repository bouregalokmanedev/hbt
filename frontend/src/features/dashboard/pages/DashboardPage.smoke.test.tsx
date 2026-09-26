import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { DashboardPage } from "./DashboardPage";
import { useDashboardUiStore } from "../stores/dashboard-ui.store";
import {
  getLayoutStorageKey,
  loadLayout,
  setLayoutOwner,
  DEFAULT_HIDDEN,
  RESIZABLE_CARDS,
} from "../layout/layout";
import type { DashboardData } from "../types/dashboard.types";

vi.mock("../hooks/useDashboard", () => ({
  useDashboard: vi.fn(),
}));

vi.mock("../components/LeaderboardCard", () => ({
  LeaderboardCard: () => <div data-testid="leaderboard-card" />,
}));

vi.mock("../components/CertificatesCard", () => ({
  CertificatesCard: () => <div data-testid="certificates-card" />,
}));

vi.mock("../components/NotificationsCard", () => ({
  NotificationsCard: () => <div data-testid="notifications-card" />,
}));

vi.mock("../components/FavoritesCard", () => ({
  FavoritesCard: () => <div data-testid="favorites-card" />,
}));

vi.mock("../components/BadgeUnlockedModal", () => ({
  BadgeUnlockedModal: () => null,
}));

import { useDashboard } from "../hooks/useDashboard";

function buildDashboard(userId = "u1"): DashboardData {
  return {
    user: {
      id: userId,
      first_name: "Sara",
      last_name: "K",
      username: null,
      email: "sara@example.com",
      email_verified_at: null,
      phone: null,
      avatar: null,
      bio: null,
      country: null,
      language: null,
      timezone: null,
      status: "active",
      roles: ["Student"],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    stats: {
      active_courses: 2,
      completed_courses: 1,
      learning_hours: 12,
      certificates: 0,
      current_progress: 40,
    },
    current_learning: [
      { id: "c1", title: "Engine diagnostics", progress: 30 },
    ],
    upcoming_assessments: [
      { id: "a1", title: "Quiz 1", date: new Date().toISOString() },
    ],
    recent_activity: [
      { id: "r1", description: "Finished lesson", created_at: new Date().toISOString() },
    ],
    weekly_activity: [],
    achievements: [],
    progression: {
      total_xp: 100,
      level: 2,
      title: "Apprentice",
      next_level_xp: 200,
      next_level_title: "Technician",
      progress_percent: 50,
      current_streak: 3,
      longest_streak: 5,
      last_activity_date: null,
      learning_days: [],
      recent_awards: [],
    },
    ai_mentor: {
      description: "Helpful mentor",
      title: "Ask anything",
      available: true,
      message: "hi",
      recommendation: null,
      queries_remaining: 5,
    },
    skill_gaps: [],
    cohort_overview: null,
  };
}

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <DashboardPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

const U1_KEY = getLayoutStorageKey("u1");
const U2_KEY = getLayoutStorageKey("u2");

function startCustomizing() {
  useDashboardUiStore.getState().setCustomizing(true);
}

describe("DashboardPage personalization", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setLayoutOwner(null);
    vi.clearAllMocks();
    useDashboardUiStore.getState().setCustomizing(false);
    vi.mocked(useDashboard).mockReturnValue({
      dashboard: buildDashboard("u1"),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("renders fixed header and fixed challenges/homework cards", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-header")).toBeInTheDocument();
    });

    expect(screen.getByTestId("fixed-card-daily-challenges")).toBeInTheDocument();
    expect(screen.getByTestId("fixed-card-homework")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-fixed-footer")).toBeInTheDocument();
  });

  it("shows homework as disabled coming soon", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("homework-card")).toBeInTheDocument();
    });

    const card = screen.getByTestId("homework-card");
    expect(card).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByTestId("homework-coming-soon")).toBeInTheDocument();
    expect(card.querySelector("a")).toBeNull();
    expect(card.querySelector("button")).toBeNull();
  });

  it("keeps always-visible cards and hides optional new cards by default", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("current-learning-card")).toBeInTheDocument();
    });

    expect(screen.getByTestId("upcoming-assessments-card")).toBeInTheDocument();
    expect(screen.getByTestId("ai-mentor-card")).toBeInTheDocument();

    // New cards start hidden
    expect(screen.queryByTestId("certificates-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("notifications-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("favorites-card")).not.toBeInTheDocument();

    expect(DEFAULT_HIDDEN).toEqual(["certificates", "notifications", "favorites"]);
  });

  it("enters edit mode without a side panel, hides stats via section bar, and keeps locked sections", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-header")).toBeInTheDocument();
    });

    startCustomizing();

    await waitFor(() => {
      expect(screen.getByTestId("customize-toolbar")).toBeInTheDocument();
    });

    // No side panel — inline section controls only
    expect(screen.queryByTestId("customize-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("section-bar-stats")).toBeInTheDocument();
    expect(screen.getByTestId("hide-card-stats")).toBeInTheDocument();
    expect(screen.getByTestId("lock-card-learningRow")).toBeInTheDocument();
    expect(screen.getByTestId("lock-card-aiMentor")).toBeInTheDocument();
    expect(screen.queryByTestId("hide-card-learningRow")).not.toBeInTheDocument();

    // Sections wiggle while editing
    expect(
      screen.getByTestId("dashboard-section-stats").className,
    ).toContain("hbt-wiggle");

    // Hide stats via its section bar
    fireEvent.click(screen.getByTestId("hide-card-stats"));
    await waitFor(() => {
      expect(screen.queryByTestId("dashboard-card-stats")).not.toBeInTheDocument();
    });

    // Hidden section appears as a ghost with a restore button
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-ghost-stats")).toBeInTheDocument();
    });

    // Done exits edit mode; layout persists; fixed cards stay
    fireEvent.click(screen.getByTestId("customize-done"));
    await waitFor(() => {
      expect(screen.queryByTestId("customize-toolbar")).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("fixed-card-daily-challenges")).toBeInTheDocument();
    expect(screen.getByTestId("current-learning-card")).toBeInTheDocument();

    const layout = loadLayout("u1");
    expect(layout.hidden).toContain("stats");
  });

  it("can restore the three new optional cards from ghost placeholders", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-header")).toBeInTheDocument();
    });

    startCustomizing();

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-ghost-certificates")).toBeInTheDocument();
      expect(screen.getByTestId("dashboard-ghost-notifications")).toBeInTheDocument();
      expect(screen.getByTestId("dashboard-ghost-favorites")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("show-section-certificates"));
    fireEvent.click(screen.getByTestId("show-section-notifications"));
    fireEvent.click(screen.getByTestId("show-section-favorites"));

    await waitFor(() => {
      expect(screen.getByTestId("certificates-card")).toBeInTheDocument();
      expect(screen.getByTestId("notifications-card")).toBeInTheDocument();
      expect(screen.getByTestId("favorites-card")).toBeInTheDocument();
    });

    const layout = loadLayout("u1");
    expect(layout.hidden).toHaveLength(0);
  });

  it("persists layout under a per-student key", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-header")).toBeInTheDocument();
    });

    startCustomizing();

    fireEvent.click(await screen.findByTestId("hide-card-recentActivity"));

    await waitFor(() => {
      const raw = localStorage.getItem(U1_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw ?? "{}");
      expect(parsed.hidden).toContain("recentActivity");
    });

    // Shared/guest key is not written for an authenticated student
    expect(localStorage.getItem("hbt:dashboard-layout")).toBeNull();
  });

  it("keeps each student's customize style independent", async () => {
    const { unmount } = renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-header")).toBeInTheDocument();
    });

    startCustomizing();
    fireEvent.click(await screen.findByTestId("hide-card-stats"));
    fireEvent.click(await screen.findByTestId("width-card-recentActivity"));
    await waitFor(() => {
      expect(localStorage.getItem(U1_KEY)).toBeTruthy();
    });

    unmount();
    setLayoutOwner(null);
    useDashboardUiStore.getState().setCustomizing(false);

    vi.mocked(useDashboard).mockReturnValue({
      dashboard: buildDashboard("u2"),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-header")).toBeInTheDocument();
    });

    // u2 gets defaults — not u1's hidden stats / half width
    expect(screen.getByTestId("dashboard-card-stats")).toBeInTheDocument();
    expect(loadLayout("u2").hidden).toEqual([...DEFAULT_HIDDEN]);
    expect(loadLayout("u2").widths?.recentActivity).toBeUndefined();

    // u1's saved style is untouched
    const u1 = loadLayout("u1");
    expect(u1.hidden).toContain("stats");
    expect(u1.widths?.recentActivity).toBe("half");
    expect(U1_KEY).not.toBe(U2_KEY);
  });

  it("reset restores default hidden cards", async () => {
    // Pre-hide something that is visible by default
    localStorage.setItem(
      U1_KEY,
      JSON.stringify({
        order: [
          "stats",
          "learningRow",
          "recentActivity",
          "activityRow",
          "skillGap",
          "cohortOverview",
          "leaderboard",
          "aiMentor",
          "certificates",
          "notifications",
          "favorites",
        ],
        hidden: ["stats"],
      }),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-header")).toBeInTheDocument();
    });

    // aiMentor is always visible — normalize should force it back on load
    expect(screen.getByTestId("ai-mentor-card")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-card-stats")).not.toBeInTheDocument();

    startCustomizing();
    fireEvent.click(await screen.findByTestId("customize-reset"));

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-card-stats")).toBeInTheDocument();
    });

    const layout = loadLayout("u1");
    expect(layout.hidden).toEqual([...DEFAULT_HIDDEN]);
    expect(screen.queryByTestId("certificates-card")).not.toBeInTheDocument();
    expect(layout.widths ?? {}).toEqual({});
  });

  it("offers width controls only on resizable cards and toggles half layout", async () => {
    expect(RESIZABLE_CARDS).toEqual([
      "aiMentor",
      "recentActivity",
      "leaderboard",
      "certificates",
      "favorites",
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-header")).toBeInTheDocument();
    });

    startCustomizing();

    await waitFor(() => {
      expect(screen.getByTestId("customize-toolbar")).toBeInTheDocument();
    });

    // Resizable single-card sections get a width toggle
    expect(screen.getByTestId("width-card-recentActivity")).toBeInTheDocument();
    expect(screen.getByTestId("width-card-leaderboard")).toBeInTheDocument();
    expect(screen.getByTestId("width-card-aiMentor")).toBeInTheDocument();

    // Non-resizable sections do not
    expect(screen.queryByTestId("width-card-stats")).not.toBeInTheDocument();
    expect(screen.queryByTestId("width-card-learningRow")).not.toBeInTheDocument();
    expect(screen.queryByTestId("width-card-activityRow")).not.toBeInTheDocument();

    // Default width is full
    expect(screen.getByTestId("dashboard-section-recentActivity")).toHaveAttribute(
      "data-width",
      "full",
    );
    expect(screen.getByTestId("dashboard-section-recentActivity").className).toContain(
      "col-span-full",
    );
    expect(screen.getByTestId("dashboard-section-recentActivity").className).not.toContain(
      "lg:col-span-1",
    );

    // Toggle recentActivity → half
    fireEvent.click(screen.getByTestId("width-card-recentActivity"));

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-section-recentActivity")).toHaveAttribute(
        "data-width",
        "half",
      );
    });

    const section = screen.getByTestId("dashboard-section-recentActivity");
    expect(section.className).toContain("lg:col-span-1");

    // Toggle leaderboard → half so two half cards can share a row
    fireEvent.click(screen.getByTestId("width-card-leaderboard"));
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-section-leaderboard")).toHaveAttribute(
        "data-width",
        "half",
      );
    });

    const stored = loadLayout("u1");
    expect(stored.widths?.recentActivity).toBe("half");
    expect(stored.widths?.leaderboard).toBe("half");

    // Toggle back to full
    fireEvent.click(screen.getByTestId("width-card-recentActivity"));
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-section-recentActivity")).toHaveAttribute(
        "data-width",
        "full",
      );
    });
    expect(loadLayout("u1").widths?.recentActivity).toBeUndefined();
  });

  it("persists half widths under the student's key", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-header")).toBeInTheDocument();
    });

    startCustomizing();
    fireEvent.click(await screen.findByTestId("width-card-aiMentor"));

    await waitFor(() => {
      const raw = localStorage.getItem(U1_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw ?? "{}");
      expect(parsed.widths?.aiMentor).toBe("half");
    });
  });

  it("toolbar has redesigned reset and done actions only", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-header")).toBeInTheDocument();
    });

    startCustomizing();
    await waitFor(() => {
      expect(screen.getByTestId("customize-toolbar")).toBeInTheDocument();
    });

    expect(screen.getByTestId("customize-reset")).toBeInTheDocument();
    expect(screen.getByTestId("customize-done")).toBeInTheDocument();
    expect(screen.queryByText(/columns button/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/two cards on one row/i)).not.toBeInTheDocument();
  });
});
