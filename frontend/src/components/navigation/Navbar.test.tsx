import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, logout: vi.fn() }),
}));

import { Navbar } from "./Navbar";

function renderNavbar() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("Navbar", () => {
  it("renders the Courses, Bootcamps and Simulator mega-menu triggers", () => {
    renderNavbar();

    const courses = screen.getByRole("link", { name: /^courses$/i });

    expect(courses).toHaveAttribute("href", "/catalog");
    expect(courses).toHaveAttribute("aria-expanded", "false");
    expect(courses).toHaveAttribute("aria-controls", "courses-mega-menu");

    const bootcamps = screen.getByRole("link", { name: /^bootcamps$/i });

    expect(bootcamps).toHaveAttribute("href", "/bootcamps");
    expect(bootcamps).toHaveAttribute("aria-expanded", "false");
    expect(bootcamps).toHaveAttribute("aria-controls", "bootcamps-mega-menu");

    const simulator = screen.getByRole("link", { name: /^simulator$/i });

    expect(simulator).toHaveAttribute("href", "/demo");
    expect(simulator).toHaveAttribute("aria-expanded", "false");
    expect(simulator).toHaveAttribute(
      "aria-controls",
      "simulator-mega-menu",
    );
  });
});
