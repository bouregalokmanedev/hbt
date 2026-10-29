import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import type { Course } from "@/features/courses/types/course.types";

vi.mock("@/features/courses/api/courses.api", () => ({
  coursesApi: {
    list: vi.fn(),
  },
}));

vi.mock("@/lib/api/client", () => ({
  api: vi.fn(),
}));

vi.mock("@/features/courses/components/CourseThumbnail", () => ({
  resolveCourseImage: (title: string, image?: string | null) =>
    image || `/fallback/${encodeURIComponent(title)}.jpg`,
}));

import { coursesApi } from "@/features/courses/api/courses.api";
import { api } from "@/lib/api/client";
import { CoursesMegaMenu } from "./CoursesMegaMenu";

const mockedList = vi.mocked(coursesApi.list);
const mockedApi = vi.mocked(api);

function makeCourse(overrides: Partial<Course>): Course {
  return {
    id: "course-1",
    title: "Course",
    slug: "course",
    short_description: "",
    description: "",
    language: "en",
    difficulty: "beginner",
    duration_minutes: 120,
    price: 0,
    discount_price: null,
    currency: "DZD",
    is_free: true,
    status: "published",
    visibility: "public",
    thumbnail: null,
    cover_image: null,
    preview_video: null,
    published_at: null,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function renderMenu() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <CoursesMegaMenu navLinkClass={() => "nav-link"} />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

function openMenu() {
  const trigger = screen.getByRole("link", { name: /^courses$/i });
  trigger.focus();
  fireEvent.focus(trigger);
  return trigger;
}

describe("CoursesMegaMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedList.mockResolvedValue({
      data: [
        makeCourse({
          id: "can-bus",
          title: "CAN Bus Diagnostics",
          difficulty: "intermediate",
          duration_minutes: 185,
          language: "ar",
        }),
        makeCourse({
          id: "ev-hybrid",
          title: "EV & Hybrid Systems",
          difficulty: "advanced",
          duration_minutes: 360,
          language: "fr",
        }),
        makeCourse({
          id: "electrical",
          title: "Electrical Foundations",
          difficulty: "beginner",
          duration_minutes: 45,
          language: "en",
        }),
      ],
      links: { first: null, last: null, prev: null, next: null },
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 12,
        to: 3,
        total: 3,
        path: "/v1/catalog/courses",
        links: [],
      },
    } as never);

    mockedApi.mockResolvedValue([
      { course_id: "ev-hybrid", badge_label: "Bestseller" },
    ] as never);
  });

  it("opens lazily and shows best sellers with duration, level, online availability and language", async () => {
    renderMenu();

    const trigger = screen.getByRole("link", { name: /^courses$/i });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("courses-mega-menu")).not.toBeInTheDocument();
    expect(mockedList).not.toHaveBeenCalled();

    openMenu();

    expect(trigger).toHaveAttribute("aria-expanded", "true");

    const panel = await screen.findByTestId("courses-mega-menu");

    expect(panel).toHaveAttribute("role", "region");
    expect(panel).toHaveAttribute("aria-label", "Courses menu");

    const cards = await screen.findAllByTestId("courses-mega-card");

    expect(cards).toHaveLength(3);

    // Featured courses lead the curated order.
    expect(cards[0]).toHaveTextContent("EV & Hybrid Systems");
    expect(cards[0]).toHaveTextContent("6 h");
    expect(cards[0]).toHaveTextContent("Advanced");
    expect(cards[0]).toHaveTextContent("Online");
    expect(cards[0]).toHaveTextContent("French");
    expect(cards[1]).toHaveTextContent("CAN Bus Diagnostics");
    expect(cards[1]).toHaveTextContent("3 h 5 min");
    expect(cards[1]).toHaveTextContent("Intermediate");
    expect(cards[1]).toHaveTextContent("Online");
    expect(cards[1]).toHaveTextContent("Arabic");
    expect(cards[2]).toHaveTextContent("45 min");
    expect(cards[2]).toHaveTextContent("Online");
    expect(cards[2]).toHaveTextContent("English");

    expect(
      screen.getByRole("heading", {
        name: "Verified at the source.",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /verify a certificate/i }),
    ).toHaveAttribute("href", "/verify-certificate");

    expect(mockedList).toHaveBeenCalledWith({ per_page: 24 });
    expect(mockedApi).toHaveBeenCalledWith("/v1/featured");
  });

  it("keeps the verification card available when the catalog fails", async () => {
    mockedList.mockRejectedValueOnce(new Error("offline"));

    renderMenu();
    openMenu();

    expect(
      await screen.findByText("Best sellers are unavailable"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /verify a certificate/i }),
    ).toHaveAttribute("href", "/verify-certificate");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    renderMenu();

    const trigger = openMenu();
    const panel = await screen.findByTestId("courses-mega-menu");

    expect(panel).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByTestId("courses-mega-menu")).not.toBeInTheDocument();
    });

    expect(trigger).toHaveFocus();
  });
});
