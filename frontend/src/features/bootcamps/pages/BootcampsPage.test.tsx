import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import type {
  Bootcamp,
  BootcampSchedule,
} from "@/features/bootcamps/types/bootcamp.types";

vi.mock("../api/bootcamps.api", () => ({
  bootcampsApi: {
    list: vi.fn(),
    get: vi.fn(),
    calendar: vi.fn(),
    register: vi.fn(),
    brochureUrl: vi.fn(),
  },
}));

import { bootcampsApi } from "../api/bootcamps.api";
import { BootcampsPage } from "./BootcampsPage";

const mockedList = vi.mocked(bootcampsApi.list);
const mockedCalendar = vi.mocked(bootcampsApi.calendar);

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
      quizzes: false,
      support: true,
      certificate: true,
      final_project: true,
      classrooms: true,
    },
    status: "published",
    thumbnail: "http://api.test/storage/bootcamps/ev-hybrid/thumbnail.jpg",
    cover_image: null,
    preview_video: null,
    brochure_available: false,
    brochure_name: null,
    published_at: "2026-10-01T10:00:00.000Z",
    created_at: "2026-10-01T10:00:00.000Z",
    updated_at: "2026-10-01T10:00:00.000Z",
    registered_count: 8,
    instructor: {
      id: "instructor-1",
      first_name: "Amine",
      last_name: "Bensalem",
      username: "amine",
      avatar: null,
      bio: "Diagnostics instructor.",
    },
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

function listResponse(data: Bootcamp[], overrides: Record<string, unknown> = {}) {
  return {
    data,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: 1,
      from: 1,
      last_page: 1,
      per_page: 9,
      to: data.length,
      total: data.length,
      path: "/v1/catalog/bootcamps",
      links: [],
      ...overrides,
    },
  };
}

function makeSchedule(): BootcampSchedule {
  return {
    id: "schedule-1",
    bootcamp_id: "ev-hybrid",
    starts_at: "2026-11-10",
    ends_at: "2026-12-08",
    is_available: true,
    bootcamp: {
      id: "ev-hybrid",
      title: "EV & Hybrid Systems",
      slug: "ev-hybrid-systems",
      location: "Algiers · Hydra",
      price: 89000,
      currency: "DZD",
      level: "advanced",
      duration_value: 6,
      duration_unit: "weeks",
    },
  };
}

function renderPage(initialEntry = "/bootcamps") {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <BootcampsPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("BootcampsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCalendar.mockResolvedValue([]);
    mockedList.mockResolvedValue(
      listResponse([
        makeBootcamp({ id: "ev-hybrid", title: "EV & Hybrid Systems" }),
        makeBootcamp({
          id: "can-bus",
          title: "CAN Bus & ECU",
          slug: "can-bus-ecu",
          level: "intermediate",
          duration_value: 3,
          duration_unit: "weeks",
          location: "Oran",
        }),
      ]),
    );
  });

  it("renders the API catalog with authored bootcamp data", async () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: /hands-on bootcamps/i }),
    ).toBeInTheDocument();

    const cards = await screen.findAllByTestId("bootcamp-card");

    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent("EV & Hybrid Systems");
    expect(cards[0]).toHaveTextContent("6 weeks");
    expect(cards[0]).toHaveTextContent("Algiers · Hydra");
    expect(cards[0]).toHaveTextContent("Advanced");
    expect(cards[0]).toHaveTextContent("89,000");
    expect(cards[0]).toHaveTextContent("8");
    expect(cards[0].querySelector("img")).toHaveAttribute(
      "src",
      "http://api.test/storage/bootcamps/ev-hybrid/thumbnail.jpg",
    );
    expect(screen.getByText("2 bootcamps available")).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /EV & Hybrid Systems/i }),
    ).toHaveAttribute("href", "/bootcamps/ev-hybrid");
    expect(
      screen.getByRole("link", { name: /CAN Bus & ECU/i }),
    ).toHaveAttribute("href", "/bootcamps/can-bus");

    expect(mockedList).toHaveBeenCalledWith({
      search: undefined,
      level: undefined,
      page: 1,
      per_page: 9,
    });
  });

  it("passes the search term and level filter to the API", async () => {
    renderPage();

    await screen.findAllByTestId("bootcamp-card");

    fireEvent.change(
      screen.getByPlaceholderText("Search bootcamps, locations or skills"),
      { target: { value: "CAN" } },
    );

    await waitFor(() => {
      expect(mockedList).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "CAN", page: 1 }),
      );
    });

    fireEvent.change(screen.getByLabelText("Level"), {
      target: { value: "intermediate" },
    });

    await waitFor(() => {
      expect(mockedList).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "CAN", level: "intermediate" }),
      );
    });
  });

  it("switches between catalog and calendar with the view toggle", async () => {
    mockedCalendar.mockResolvedValue([makeSchedule()]);

    renderPage();

    await screen.findAllByTestId("bootcamp-card");

    const toggle = screen.getByRole("switch", { name: "Calendar" });

    expect(toggle).toHaveAttribute("aria-checked", "false");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(await screen.findByTestId("bootcamp-calendar")).toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(await screen.findAllByTestId("bootcamp-card")).toHaveLength(2);
  });

  it("renders the cohort calendar from the calendar endpoint", async () => {
    mockedCalendar.mockResolvedValue([makeSchedule()]);

    renderPage("/bootcamps?view=calendar");

    const calendar = await screen.findByTestId("bootcamp-calendar");

    expect(
      within(calendar).getByRole("heading", { name: "Upcoming sessions" }),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole("link", {
        name: /EV & Hybrid Systems —/i,
      }),
    ).toHaveAttribute("href", "/bootcamps/ev-hybrid");

    expect(screen.getByText("Algiers · Hydra")).toBeInTheDocument();
    expect(mockedCalendar).toHaveBeenCalled();
  });

  it("offers a retry when the catalog cannot load", async () => {
    mockedList.mockRejectedValueOnce(new Error("catalog offline"));

    renderPage();

    expect(
      await screen.findByText("Bootcamps could not load"),
    ).toBeInTheDocument();
    expect(screen.getByText("catalog offline")).toBeInTheDocument();
    expect(screen.queryByTestId("bootcamp-card")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findAllByTestId("bootcamp-card")).toHaveLength(2);
  });

  it("shows the empty state when no bootcamps match", async () => {
    mockedList.mockResolvedValue(listResponse([]));

    renderPage();

    expect(
      await screen.findByText("No bootcamps match your filters"),
    ).toBeInTheDocument();
  });
});
