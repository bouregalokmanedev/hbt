import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { MyCoursesPage } from "./MyCoursesPage";
import type { Enrollment } from "../types/enrollment.types";

vi.mock("../hooks/useMyEnrollments", () => ({
  useMyEnrollments: vi.fn(),
}));

import { useMyEnrollments } from "../hooks/useMyEnrollments";

function buildEnrollment(overrides: Partial<Enrollment> = {}): Enrollment {
  return {
    id: "e1",
    user_id: "u1",
    course_id: "c1",
    status: "active",
    enrolled_at: "2026-01-01T00:00:00Z",
    completed_at: null,
    cancelled_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    course: {
      id: "c1",
      title: "CAN Bus diagnostics",
      thumbnail: null,
    },
    progress: {
      progress_percentage: 40,
      time_spent: 1800,
      completed_at: null,
    },
    completed_lessons: 2,
    total_lessons: 5,
    ...overrides,
  };
}

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/my-courses"]}>
        <MyCoursesPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

function mockHook(
  partial: Partial<ReturnType<typeof useMyEnrollments>>,
) {
  vi.mocked(useMyEnrollments).mockReturnValue({
    enrollments: [],
    isLoading: false,
    error: null,
    reload: vi.fn().mockResolvedValue(undefined),
    ...partial,
  });
}

describe("MyCoursesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders hero stats, filter tabs, and enrollment cards", async () => {
    mockHook({
      enrollments: [
        buildEnrollment(),
        buildEnrollment({
          id: "e2",
          course_id: "c2",
          status: "completed",
          course: { id: "c2", title: "Sensor fundamentals", thumbnail: null },
          progress: {
            progress_percentage: 100,
            time_spent: 7200,
            completed_at: "2026-02-01T00:00:00Z",
          },
          completed_lessons: 8,
          total_lessons: 8,
        }),
        buildEnrollment({
          id: "e3",
          status: "cancelled",
        }),
      ],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("my-courses-page")).toBeInTheDocument();
    });

    expect(screen.getByTestId("my-courses-hero")).toBeInTheDocument();
    expect(screen.getByTestId("stat-in-progress")).toHaveTextContent("1");
    expect(screen.getByTestId("stat-completed")).toHaveTextContent("1");
    expect(screen.getByTestId("stat-total")).toHaveTextContent("2");
    expect(screen.getByTestId("stat-avg")).toHaveTextContent("70%");

    expect(screen.getByTestId("my-courses-filter-all")).toBeInTheDocument();
    expect(screen.getByTestId("my-courses-filter-active")).toBeInTheDocument();
    expect(screen.getByTestId("my-courses-filter-completed")).toBeInTheDocument();

    const cards = screen.getAllByTestId("my-courses-card");
    expect(cards).toHaveLength(2);
    expect(screen.getAllByTestId("my-courses-card-title")[0]).toHaveTextContent(
      "CAN Bus diagnostics",
    );
    expect(screen.getByText("2 of 5 lessons")).toBeInTheDocument();
    expect(screen.getByText("30 min learned")).toBeInTheDocument();
  });

  it("filters to completed only", async () => {
    mockHook({
      enrollments: [
        buildEnrollment(),
        buildEnrollment({
          id: "e2",
          course_id: "c2",
          status: "completed",
          course: { id: "c2", title: "Done course", thumbnail: null },
        }),
      ],
    });

    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("my-courses-page")).toBeInTheDocument();
    });

    screen.getByTestId("my-courses-filter-completed").click();

    await waitFor(() => {
      expect(screen.getAllByTestId("my-courses-card")).toHaveLength(1);
    });
    expect(screen.getByTestId("my-courses-card-title")).toHaveTextContent(
      "Done course",
    );
  });

  it("shows empty state when there are no enrollments", async () => {
    mockHook({ enrollments: [] });
    renderPage();
    expect(screen.getByTestId("my-courses-empty")).toBeInTheDocument();
  });

  it("shows error state with retry", async () => {
    mockHook({ error: "network down" });
    renderPage();
    expect(screen.getByTestId("my-courses-error")).toBeInTheDocument();
    expect(screen.getByText("network down")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("shows skeleton while loading", async () => {
    mockHook({ isLoading: true });
    renderPage();
    expect(screen.getByTestId("my-courses-loading")).toBeInTheDocument();
  });
});
