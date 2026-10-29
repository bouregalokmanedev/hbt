import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import i18n from "@/i18n";

import { SimulatorMegaMenu } from "./SimulatorMegaMenu";

function renderMenu({
  simulatorHref = "/demo",
  mentorHref = "/ai-mentor/intro",
} = {}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <SimulatorMegaMenu
          navLinkClass={() => "nav-link"}
          simulatorHref={simulatorHref}
          mentorHref={mentorHref}
        />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

function openMenu() {
  const trigger = screen.getByRole("link", { name: /^simulator$/i });
  trigger.focus();
  fireEvent.focus(trigger);
  return trigger;
}

describe("SimulatorMegaMenu", () => {
  it("opens the split panel with the simulator lab and AI mentor", async () => {
    renderMenu();

    const trigger = screen.getByRole("link", { name: /^simulator$/i });

    expect(trigger).toHaveAttribute("href", "/demo");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls", "simulator-mega-menu");
    expect(
      screen.queryByTestId("simulator-mega-menu"),
    ).not.toBeInTheDocument();

    openMenu();

    expect(trigger).toHaveAttribute("aria-expanded", "true");

    const panel = await screen.findByTestId("simulator-mega-menu");

    expect(panel).toHaveAttribute("role", "region");
    expect(panel).toHaveAttribute("aria-label", "Simulator menu");

    const lab = screen.getByTestId("simulator-mega-card");
    const mentor = screen.getByTestId("simulator-mega-mentor");

    expect(lab).toHaveTextContent("Simulator lab");
    expect(lab).toHaveTextContent("Guided missions");
    expect(lab).toHaveTextContent("Interactive schematics");
    expect(lab).toHaveTextContent("Injected faults");

    expect(mentor).toHaveTextContent("AI mentor");
    expect(mentor).toHaveTextContent("Ask about any fault");
    expect(mentor).toHaveTextContent("Get the next diagnostic step");
    expect(mentor).toHaveTextContent("Review your reasoning");

    expect(
      screen.getByRole("link", { name: /open simulator lab/i }),
    ).toHaveAttribute("href", "/demo");

    expect(
      screen.getByRole("link", { name: /ask the ai mentor/i }),
    ).toHaveAttribute("href", "/ai-mentor/intro");
  });

  it("uses the authenticated destinations when provided", async () => {
    renderMenu({ simulatorHref: "/simulator", mentorHref: "/ai-mentor" });

    const trigger = screen.getByRole("link", { name: /^simulator$/i });

    expect(trigger).toHaveAttribute("href", "/simulator");

    openMenu();

    expect(
      await screen.findByRole("link", { name: /open simulator lab/i }),
    ).toHaveAttribute("href", "/simulator");

    expect(
      screen.getByRole("link", { name: /ask the ai mentor/i }),
    ).toHaveAttribute("href", "/ai-mentor");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    renderMenu();

    const trigger = openMenu();
    await screen.findByTestId("simulator-mega-menu");

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByTestId("simulator-mega-menu"),
      ).not.toBeInTheDocument();
    });

    expect(trigger).toHaveFocus();
  });
});
