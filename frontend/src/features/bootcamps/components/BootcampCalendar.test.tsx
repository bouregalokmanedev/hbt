import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import type { BootcampSchedule } from "../types/bootcamp.types";
import { BootcampCalendar } from "./BootcampCalendar";

function makeSchedule(overrides: Partial<BootcampSchedule>): BootcampSchedule {
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
    ...overrides,
  };
}

function renderCalendar(
  schedules: BootcampSchedule[],
  props: Partial<ComponentProps<typeof BootcampCalendar>> = {},
) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <BootcampCalendar schedules={schedules} {...props} />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("BootcampCalendar", () => {
  it("places sessions in their month and supports month navigation", () => {
    const november = makeSchedule({ id: "november" });
    const december = makeSchedule({
      id: "december",
      bootcamp_id: "can-bus",
      starts_at: "2026-12-15",
      ends_at: "2027-01-12",
      bootcamp: {
        id: "can-bus",
        title: "CAN Bus & ECU",
        slug: "can-bus-ecu",
        location: "Oran",
        price: 65000,
        currency: "DZD",
        level: "intermediate",
        duration_value: 3,
        duration_unit: "weeks",
      },
    });

    renderCalendar([november, december]);

    expect(screen.getByTestId("bootcamp-calendar")).toBeInTheDocument();
    expect(screen.getByText("November 2026")).toBeInTheDocument();
    expect(screen.getByText("1 sessions this month")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /EV & Hybrid Systems —/i }),
    ).toHaveAttribute("href", "/bootcamps/ev-hybrid");
    expect(screen.queryByText("CAN Bus & ECU")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Next month" }),
    );

    expect(screen.getByText("December 2026")).toBeInTheDocument();
    expect(screen.getAllByText("CAN Bus & ECU").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /CAN Bus & ECU —/i }),
    ).toHaveAttribute("href", "/bootcamps/can-bus");

    fireEvent.click(
      screen.getByRole("button", { name: "Previous month" }),
    );

    expect(screen.getByText("November 2026")).toBeInTheDocument();
    expect(
      screen.getAllByText("EV & Hybrid Systems").length,
    ).toBeGreaterThan(0);
  });

  it("shows the empty month state", () => {
    renderCalendar([]);

    expect(
      screen.getByText("No sessions in this month."),
    ).toBeInTheDocument();
  });

  it("shows a retry action when the calendar fails", () => {
    const onRetry = vi.fn();

    renderCalendar([], {
      error: "calendar offline",
      onRetry,
    });

    expect(screen.getByText("calendar offline")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows a loading state", () => {
    renderCalendar([], { isLoading: true });

    expect(screen.getByText("Loading bootcamps…")).toBeInTheDocument();
  });
});
