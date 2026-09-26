import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { AchievementsPage } from "./AchievementsPage";
import type { DashboardData } from "../types/dashboard.types";

vi.mock("../hooks/useDashboard", () => ({
  useDashboard: vi.fn(),
}));

vi.mock("../components/LeaderboardCard", () => ({
  LeaderboardCard: () => null,
}));

vi.mock("@/lib/api/client", () => ({
  api: vi.fn().mockResolvedValue({ top: [], me: null }),
}));

import { useDashboard } from "../hooks/useDashboard";

function buildDashboard(): DashboardData {
  const today = new Date();
  const day = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };

  return {
    user: {
      id: "u1",
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
      active_courses: 1,
      completed_courses: 0,
      learning_hours: 4,
      certificates: 0,
      current_progress: 20,
    },
    current_learning: [
      { id: "c1", title: "Engine diagnostics", progress: 30 },
    ],
    upcoming_assessments: [],
    recent_activity: [],
    weekly_activity: [],
    achievements: [],
    progression: {
      total_xp: 320,
      level: 3,
      title: "Apprentice",
      next_level_xp: 500,
      next_level_title: "Technician",
      progress_percent: 55,
      current_streak: 4,
      longest_streak: 9,
      last_activity_date: day(0),
      learning_days: [
        { date: day(-6), active: false },
        { date: day(-5), active: true },
        { date: day(-4), active: true },
        { date: day(-3), active: false },
        { date: day(-2), active: true },
        { date: day(-1), active: true },
        { date: day(0), active: true },
      ],
      recent_awards: [],
    },
    ai_mentor: {
      description: "",
      title: "",
      available: true,
      message: "",
      recommendation: null,
      queries_remaining: 3,
    },
    skill_gaps: [],
    cohort_overview: null,
  } as unknown as DashboardData;
}

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/achievements"]}>
        <AchievementsPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("AchievementsPage learning streak", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDashboard).mockReturnValue({
      dashboard: buildDashboard(),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it("renders redesigned streak section with counters and 7-day strip", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("learning-streak-section")).toBeInTheDocument();
    });

    expect(screen.getByTestId("current-streak")).toHaveTextContent("4");
    expect(screen.getByTestId("longest-streak")).toHaveTextContent("9");
    expect(screen.getByTestId("learning-days").children).toHaveLength(7);
    expect(screen.getByTestId("active-days-count")).toHaveTextContent("5/7");
  });

  it("lists diagnostics and simulator lab as activities that count", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("streak-activities")).toBeInTheDocument();
    });

    expect(screen.getByTestId("streak-activity-diagnostic")).toBeInTheDocument();
    expect(screen.getByTestId("streak-activity-simulator")).toBeInTheDocument();
    expect(screen.getByTestId("streak-activity-lesson")).toBeInTheDocument();
    expect(screen.getByTestId("streak-activity-quiz")).toBeInTheDocument();
    expect(screen.getByTestId("streak-activity-assessment")).toBeInTheDocument();
    expect(screen.getByTestId("streak-activity-challenge")).toBeInTheDocument();
  });

  it("marks active learning days and shows keep-streak CTA", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("learning-days")).toBeInTheDocument();
    });

    const active = screen
      .queryAllByTestId(/^learning-day-/)
      .filter((el) => el.getAttribute("data-active") === "true");
    expect(active).toHaveLength(5);

    expect(screen.getByTestId("keep-streak-cta")).toHaveAttribute(
      "href",
      "/courses/c1",
    );
  });
});
