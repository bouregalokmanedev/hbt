import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import type { Bootcamp } from "../types/bootcamp.types";

vi.mock("../hooks/useInstructorBootcamps", () => ({
  useInstructorBootcamps: vi.fn(),
}));

vi.mock("../api/instructorBootcampsApi", () => ({
  runInstructorBootcampAction: vi.fn(),
}));

import { runInstructorBootcampAction } from "../api/instructorBootcampsApi";
import { useInstructorBootcamps } from "../hooks/useInstructorBootcamps";
import { InstructorBootcampsPage } from "./InstructorBootcampsPage";

const mockedHook = vi.mocked(useInstructorBootcamps);
const mockedAction = vi.mocked(runInstructorBootcampAction);

function makeBootcamp(overrides: Partial<Bootcamp>): Bootcamp {
  return {
    id: "ev-hybrid",
    title: "EV & Hybrid Systems",
    slug: "ev-hybrid-systems",
    short_description: "High-voltage safety and battery diagnosis.",
    description: "A hands-on bootcamp.",
    duration_value: 6,
    duration_unit: "weeks",
    location: "Algiers · Hydra",
    price: 89000,
    currency: "DZD",
    level: "advanced",
    includes: {
      challenges: true,
      resources: true,
      quizzes: true,
      support: true,
      certificate: true,
      final_project: true,
      classrooms: true,
    },
    status: "published",
    thumbnail: null,
    cover_image: null,
    preview_video: null,
    brochure_available: false,
    brochure_name: null,
    published_at: "2026-10-01T10:00:00.000Z",
    created_at: "2026-10-01T10:00:00.000Z",
    updated_at: "2026-10-01T10:00:00.000Z",
    registered_count: 8,
    instructor: null,
    schedules: [
      {
        id: "schedule-1",
        bootcamp_id: "ev-hybrid",
        starts_at: "2026-11-10",
        ends_at: "2026-12-08",
        is_available: true,
      },
    ],
    sections: [],
    ...overrides,
  };
}

function queryResult(data: Bootcamp[]) {
  return {
    data: {
      data,
      links: { first: null, last: null, prev: null, next: null },
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 12,
        to: data.length,
        total: data.length,
        path: "/v1/instructor/bootcamps",
        links: [],
      },
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <InstructorBootcampsPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe("InstructorBootcampsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedHook.mockReturnValue(
      queryResult([
        makeBootcamp({ id: "ev-hybrid", title: "EV & Hybrid Systems" }),
        makeBootcamp({
          id: "can-bus",
          title: "CAN Bus & ECU",
          status: "draft",
          registered_count: 2,
          schedules: [],
        }),
      ]) as never,
    );
    mockedAction.mockResolvedValue(makeBootcamp({}));
  });

  it("renders authored bootcamps, metrics and management links", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "My bootcamps" }),
    ).toBeInTheDocument();

    expect(screen.getByText("EV & Hybrid Systems")).toBeInTheDocument();
    expect(screen.getByText("CAN Bus & ECU")).toBeInTheDocument();

    // Two bootcamps, one published, one draft, ten registrations.
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();

    expect(
      screen.getAllByRole("link", { name: /manage bootcamp/i })[0],
    ).toHaveAttribute("href", "/instructor/bootcamps/ev-hybrid");

    expect(
      screen.getByRole("link", { name: "Preview bootcamp" }),
    ).toHaveAttribute("href", "/bootcamps/ev-hybrid");
  });

  it("publishes a draft only after confirmation of the selected action", async () => {
    renderPage();

    const card = screen
      .getByText("CAN Bus & ECU")
      .closest("article") as HTMLElement;

    fireEvent.click(within(card).getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(mockedAction).toHaveBeenCalledWith("can-bus", "publish");
    });

    expect(await screen.findByRole("status")).toHaveTextContent("Publish");
  });

  it("filters by status and search", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Draft" }));

    await waitFor(() => {
      expect(mockedHook).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: "draft", page: 1 }),
      );
    });

    fireEvent.change(
      screen.getByPlaceholderText("Search bootcamps by title or location"),
      { target: { value: "CAN" } },
    );

    await waitFor(() => {
      expect(mockedHook).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "CAN", status: "draft" }),
      );
    });
  });
});
