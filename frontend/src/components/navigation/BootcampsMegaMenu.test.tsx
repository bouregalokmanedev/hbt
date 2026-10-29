import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import type { Bootcamp } from "@/features/bootcamps/types/bootcamp.types";

vi.mock("@/features/bootcamps/api/bootcamps.api", () => ({
  bootcampsApi: {
    list: vi.fn(),
    get: vi.fn(),
    calendar: vi.fn(),
    register: vi.fn(),
    brochureUrl: vi.fn(),
  },
}));

import { bootcampsApi } from "@/features/bootcamps/api/bootcamps.api";
import { BootcampsMegaMenu } from "./BootcampsMegaMenu";

const mockedList = vi.mocked(bootcampsApi.list);

function makeBootcamp(overrides: Partial<Bootcamp>): Bootcamp {
  return {
    id: "bootcamp-1",
    title: "Bootcamp",
    slug: "bootcamp",
    short_description: "",
    description: "",
    duration_value: 4,
    duration_unit: "weeks",
    location: "Algiers · Hydra",
    price: 89000,
    currency: "DZD",
    level: "intermediate",
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
    schedules: [
      {
        id: "schedule-1",
        bootcamp_id: "bootcamp-1",
        starts_at: "2026-11-10",
        ends_at: "2026-12-08",
        is_available: true,
      },
    ],
    sections: [],
    ...overrides,
  };
}

function listResponse(data: Bootcamp[]) {
  return {
    data,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: 1,
      from: 1,
      last_page: 1,
      per_page: 3,
      to: data.length,
      total: data.length,
      path: "/v1/catalog/bootcamps",
      links: [],
    },
  };
}

function renderMenu() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <BootcampsMegaMenu navLinkClass={() => "nav-link"} />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

function openMenu() {
  const trigger = screen.getByRole("link", { name: /^bootcamps$/i });
  trigger.focus();
  fireEvent.focus(trigger);

  return trigger;
}

describe("BootcampsMegaMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedList.mockResolvedValue(
      listResponse([
        makeBootcamp({
          id: "ev-hybrid",
          title: "EV & Hybrid Systems",
          short_description: "High-voltage safety and battery diagnosis.",
          level: "advanced",
          duration_value: 6,
          thumbnail: "http://api.test/storage/bootcamps/ev-hybrid/thumbnail.jpg",
        }),
        makeBootcamp({
          id: "can-bus",
          title: "CAN Bus & ECU",
          short_description: "Network faults, modules and live data.",
          level: "intermediate",
          duration_value: 3,
        }),
        makeBootcamp({
          id: "diagnostics",
          title: "Automotive Diagnostics",
          short_description: "The core diagnostic method.",
          level: "beginner",
          duration_value: 8,
        }),
      ]),
    );
  });

  it("opens lazily and shows catalog cards plus the calendar CTA", async () => {
    renderMenu();

    const trigger = screen.getByRole("link", { name: /^bootcamps$/i });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("bootcamps-mega-menu")).not.toBeInTheDocument();
    expect(mockedList).not.toHaveBeenCalled();

    openMenu();

    expect(trigger).toHaveAttribute("aria-expanded", "true");

    const panel = await screen.findByTestId("bootcamps-mega-menu");

    expect(panel).toHaveAttribute("role", "region");
    expect(panel).toHaveAttribute("aria-label", "Bootcamps menu");

    const cards = await screen.findAllByTestId("bootcamp-mega-card");

    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveTextContent("EV & Hybrid Systems");
    expect(cards[0]).toHaveTextContent("6 weeks");
    expect(cards[0]).toHaveTextContent("Advanced");
    expect(cards[1]).toHaveTextContent("CAN Bus & ECU");
    expect(cards[1]).toHaveTextContent("3 weeks");
    expect(cards[2]).toHaveTextContent("Automotive Diagnostics");

    expect(cards[0]).toHaveAttribute("href", "/bootcamps/ev-hybrid");

    expect(
      within(cards[0]).getByTestId("bootcamp-mega-thumbnail"),
    ).toHaveAttribute(
      "src",
      "http://api.test/storage/bootcamps/ev-hybrid/thumbnail.jpg",
    );
    expect(
      within(cards[1]).queryByTestId("bootcamp-mega-thumbnail"),
    ).not.toBeInTheDocument();

    expect(
      screen.getAllByRole("link", { name: /view cohort calendar/i })[0],
    ).toHaveAttribute("href", "/bootcamps?view=calendar");

    expect(
      screen.getAllByRole("link", { name: /browse all bootcamps/i })[0],
    ).toHaveAttribute("href", "/bootcamps");

    // Bootcamps deliberately do not repeat the certificate verifier card.
    expect(
      screen.queryByRole("link", { name: /verify a certificate/i }),
    ).not.toBeInTheDocument();

    expect(mockedList).toHaveBeenCalledWith({ per_page: 3 });
  });

  it("shows a recoverable error state when the catalog fails", async () => {
    mockedList.mockRejectedValueOnce(new Error("offline"));

    renderMenu();
    openMenu();

    expect(
      await screen.findByText("Bootcamps are unavailable"),
    ).toBeInTheDocument();

    expect(
      screen.getAllByRole("link", { name: /browse all bootcamps/i })[0],
    ).toHaveAttribute("href", "/bootcamps");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    renderMenu();

    const trigger = openMenu();

    expect(await screen.findByTestId("bootcamps-mega-menu")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByTestId("bootcamps-mega-menu")).not.toBeInTheDocument();
    });

    expect(trigger).toHaveFocus();
  });
});
