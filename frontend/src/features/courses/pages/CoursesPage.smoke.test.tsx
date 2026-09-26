import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { CoursesPage } from "./CoursesPage";
import type { Course } from "../types/course.types";
import type { Enrollment } from "@/features/enrollments/types/enrollment.types";

vi.mock("../hooks/useCourses", () => ({
  useCourses: vi.fn(),
}));

vi.mock("@/features/enrollments/hooks/useMyEnrollments", () => ({
  useMyEnrollments: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  api: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/favorites/components/FavoriteButton", () => ({
  FavoriteButton: () => null,
}));

import { useCourses } from "../hooks/useCourses";
import { useMyEnrollments } from "@/features/enrollments/hooks/useMyEnrollments";

function buildCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: "c1",
    title: "CAN Bus diagnostics",
    slug: "can-bus",
    short_description: "Learn CAN bus fault finding step by step.",
    description: "Long description",
    language: "en",
    difficulty: "beginner",
    duration_minutes: 95,
    price: 0,
    discount_price: null,
    currency: "USD",
    is_free: true,
    status: "published",
    visibility: "public",
    thumbnail: null,
    cover_image: null,
    preview_video: null,
    published_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    enrollment: null,
    ...overrides,
  };
}

function buildEnrollment(overrides: Partial<Enrollment> = {}): Enrollment {
  return {
    id: "e1",
    user_id: "u1",
    course_id: "c2",
    status: "active",
    enrolled_at: "2026-01-02T00:00:00Z",
    completed_at: null,
    cancelled_at: null,
    created_at: "2026-01-02T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
    progress: {
      progress_percentage: 40,
      time_spent: 600,
      completed_at: null,
    },
    ...overrides,
  };
}

function buildPagination(total = 2) {
  return {
    current_page: 1,
    from: 1,
    last_page: 1,
    per_page: 12,
    to: total,
    total,
    path: "/v1/catalog/courses",
    links: [],
  };
}

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/catalog"]}>
        <CoursesPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("CoursesPage catalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMyEnrollments).mockReturnValue({
      enrollments: [],
      isLoading: false,
      error: null,
      reload: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("renders hero, results, and course cards with enrollment progress", async () => {
    const courses = [
      buildCourse({ id: "c1", is_free: true }),
      buildCourse({
        id: "c2",
        title: "Sensor fundamentals",
        is_free: false,
        price: 49,
        discount_price: 29,
        difficulty: "intermediate",
        duration_minutes: 45,
        short_description: "Sensors, signals and scopes.",
      }),
    ];

    vi.mocked(useCourses).mockReturnValue({
      courses,
      pagination: buildPagination(2),
      isLoading: false,
      error: null,
      reload: vi.fn(),
    } as ReturnType<typeof useCourses>);

    vi.mocked(useMyEnrollments).mockReturnValue({
      enrollments: [buildEnrollment({ course_id: "c2" })],
      isLoading: false,
      error: null,
      reload: vi.fn().mockResolvedValue(undefined),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("course-grid")).toBeInTheDocument();
    });

    expect(screen.getByTestId("course-search")).toBeInTheDocument();
    expect(screen.getByTestId("course-filters")).toBeInTheDocument();

    const cards = screen.getAllByTestId("course-card");
    expect(cards).toHaveLength(2);

    expect(screen.getAllByTestId("course-card-title")[0]).toHaveTextContent(
      "CAN Bus diagnostics",
    );
    expect(screen.getByTestId("course-card-free")).toBeInTheDocument();

    // Enrolled free badge should not appear on enrolled card; progress should.
    expect(screen.getByTestId("course-card-progress")).toBeInTheDocument();
    expect(screen.getByTestId("course-card-status")).toHaveTextContent("Enrolled");

    expect(screen.getByText("1h 35m")).toBeInTheDocument();
    expect(screen.getByText("45m")).toBeInTheDocument();
  });

  it("shows skeleton while loading and empty state when no courses", async () => {
    vi.mocked(useCourses).mockReturnValue({
      courses: [],
      pagination: null,
      isLoading: true,
      error: null,
      reload: vi.fn(),
    } as ReturnType<typeof useCourses>);

    const { rerender } = renderPage();
    expect(screen.getByTestId("course-grid-skeleton")).toBeInTheDocument();

    vi.mocked(useCourses).mockReturnValue({
      courses: [],
      pagination: buildPagination(0),
      isLoading: false,
      error: null,
      reload: vi.fn(),
    } as ReturnType<typeof useCourses>);

    rerender(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={["/catalog"]}>
          <CoursesPage />
        </MemoryRouter>
      </I18nextProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("course-empty")).toBeInTheDocument();
    });
  });

  it("shows error state with retry", async () => {
    vi.mocked(useCourses).mockReturnValue({
      courses: [],
      pagination: null,
      isLoading: false,
      error: "boom",
      reload: vi.fn(),
    } as ReturnType<typeof useCourses>);

    renderPage();

    expect(screen.getByTestId("course-error")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
  });
});
