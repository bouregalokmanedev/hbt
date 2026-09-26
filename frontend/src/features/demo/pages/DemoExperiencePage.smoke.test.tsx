import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { DemoExperiencePage } from "./DemoExperiencePage";
import { AiMentorIntroPage } from "./AiMentorIntroPage";
import { setDemoStage, DEMO_SCENARIOS, isDemoLabUnlocked } from "../demo.state";

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@/features/simulator/components/labs/ScannerLabFull", () => ({
  ScannerLabFull: () => <div data-testid="scanner-lab" />,
}));

vi.mock("@/features/simulator/components/labs/SchematicLabFull", () => ({
  SchematicLabFull: () => <div data-testid="schematic-lab" />,
}));

function renderPage(ui: React.ReactElement) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/demo"]}>{ui}</MemoryRouter>
    </I18nextProvider>,
  );
}

describe("DemoExperiencePage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setDemoStage(0);
  });

  it("shows all 5 labs with only scanner free for guests", async () => {
    renderPage(<DemoExperiencePage />);

    await waitFor(() => {
      expect(screen.getByTestId("demo-page")).toBeInTheDocument();
    });

    for (const id of ["scanner", "multimeter", "oscilloscope", "location", "schematic"]) {
      expect(screen.getByTestId(`demo-lab-${id}`)).toBeInTheDocument();
    }

    expect(isDemoLabUnlocked("scanner")).toBe(true);
    expect(isDemoLabUnlocked("multimeter")).toBe(false);
    expect(isDemoLabUnlocked("schematic")).toBe(false);

    // Default active lab is scanner → embedded bench
    expect(screen.getByTestId("scanner-lab")).toBeInTheDocument();
  });

  it("opens the register modal when a guest clicks a locked lab", async () => {
    const { fireEvent } = await import("@testing-library/react");
    renderPage(<DemoExperiencePage />);

    fireEvent.click(screen.getByTestId("demo-lab-multimeter"));

    await waitFor(() => {
      expect(screen.getByTestId("demo-register-modal")).toBeInTheDocument();
    });
    expect(screen.getByTestId("demo-register-cta")).toHaveAttribute("href", "/register?next=%2Fdemo");
  });

  it("lists 4 diagnostic scenarios and opens the free workshop", async () => {
    const { fireEvent } = await import("@testing-library/react");
    renderPage(<DemoExperiencePage />);

    for (let i = 0; i < DEMO_SCENARIOS.length; i += 1) {
      expect(screen.getByTestId(`demo-scenario-${i}`)).toBeInTheDocument();
    }

    fireEvent.click(screen.getByTestId("demo-scenario-0"));
    await waitFor(() => {
      expect(screen.getByTestId("demo-scenario-workspace")).toBeInTheDocument();
    });
    expect(screen.getByTestId("demo-step-0")).toBeInTheDocument();
  });

  it("sends guests to the register modal when advancing past the free step", async () => {
    const { fireEvent } = await import("@testing-library/react");
    renderPage(<DemoExperiencePage />);

    fireEvent.click(screen.getByTestId("demo-scenario-0"));
    await waitFor(() => {
      expect(screen.getByTestId("demo-scenario-workspace")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("demo-next-step"));
    await waitFor(() => {
      expect(screen.getByTestId("demo-register-modal")).toBeInTheDocument();
    });
  });
});

describe("AiMentorIntroPage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("presents the mentor and gates guests behind register", async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={["/ai-mentor/intro"]}>
          <AiMentorIntroPage />
        </MemoryRouter>
      </I18nextProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("ai-mentor-intro")).toBeInTheDocument();
    });
    expect(screen.getByTestId("mentor-token-gate")).toBeInTheDocument();
    expect(screen.getByTestId("mentor-register")).toHaveAttribute(
      "href",
      "/register?next=%2Fai-mentor%2Fintro",
    );
    expect(screen.queryByTestId("mentor-open-app")).not.toBeInTheDocument();
  });

  it("shows the looping mentor showcase with kind badges", async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={["/ai-mentor/intro"]}>
          <AiMentorIntroPage />
        </MemoryRouter>
      </I18nextProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("mentor-showcase")).toBeInTheDocument();
    });

    expect(screen.getByTestId("mentor-showcase-chat")).toBeInTheDocument();
    expect(screen.getByTestId("mentor-showcase-question")).toBeInTheDocument();
    expect(
      screen.getByTestId("mentor-showcase-kind-hint"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("mentor-showcase-kind-quiz"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("mentor-showcase-kind-guide"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("mentor-showcase-kind-weakSpot"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("mentor-showcase-badge")).toBeInTheDocument();
  });
});
