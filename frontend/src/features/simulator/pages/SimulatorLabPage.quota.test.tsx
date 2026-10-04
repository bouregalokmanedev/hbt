import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import { api } from "@/lib/api/client";

import { SimulatorLabPage } from "./SimulatorLabPage";
import { simulatorApi } from "../api/simulator.api";

vi.mock("@/lib/api/client", () => ({
  api: vi.fn(),
  authedFetch: vi.fn(),
}));

vi.mock("../api/simulator.api", () => ({
  simulatorApi: { start: vi.fn() },
  SIMULATOR_LIMIT_EVENT: "hbt:simulator:limit",
}));

vi.mock("../components/labs/ScannerLabFull", () => ({
  ScannerLabFull: () => <div data-testid="lab" />,
}));
vi.mock("../components/labs/MultimeterLabFull", () => ({
  MultimeterLabFull: () => <div data-testid="lab" />,
}));
vi.mock("../oscilloscope/components/OscilloscopeLabFull", () => ({
  OscilloscopeLabFull: () => <div data-testid="lab" />,
}));
vi.mock("../components/labs/LocationLabFull", () => ({
  LocationLabFull: () => <div data-testid="lab" />,
}));
vi.mock("../components/labs/SchematicLabFull", () => ({
  SchematicLabFull: () => <div data-testid="lab" />,
}));

function renderLab(tool = "multimeter") {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[`/simulator/${tool}`]}>
        <Routes>
          <Route path="/simulator/:tool" element={<SimulatorLabPage />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("SimulatorLabPage monthly quota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(simulatorApi.start).mockResolvedValue({ id: "ses-1" } as never);
    window.localStorage.setItem("hbt:lab-intro-dismissed:multimeter", "1");
    // Session start waits for the gate's vehicle choice (scanner-style selection).
    window.localStorage.setItem("hbt:meter-vehicle", "corolla");
  });

  it("locks the lab once the free monthly allowance is exhausted", async () => {
    vi.mocked(api).mockResolvedValue({
      used: 10,
      limit: 10,
      remaining: 0,
      unlimited: false,
    });

    renderLab();

    const block = await screen.findByTestId("simulator-limit-block");
    expect(block).toHaveTextContent("Monthly limit reached");
    expect(screen.getByRole("link", { name: /See plans/i })).toHaveAttribute(
      "href",
      "/pricing",
    );
    expect(screen.queryByTestId("lab")).toBeNull();
    await waitFor(() => expect(simulatorApi.start).not.toHaveBeenCalled());
  });

  it("starts the bench normally while quota remains", async () => {
    vi.mocked(api).mockResolvedValue({
      used: 8,
      limit: 10,
      remaining: 2,
      unlimited: false,
    });

    renderLab();

    await waitFor(() => expect(simulatorApi.start).toHaveBeenCalled());
    expect(screen.queryByTestId("simulator-limit-block")).toBeNull();
  });

  it("never blocks learners on an unlimited plan", async () => {
    vi.mocked(api).mockResolvedValue({
      used: 40,
      limit: null,
      remaining: null,
      unlimited: true,
    });

    renderLab();

    await waitFor(() => expect(simulatorApi.start).toHaveBeenCalled());
    expect(screen.queryByTestId("simulator-limit-block")).toBeNull();
  });

  it("starts exactly one session no matter how often the page re-renders", async () => {
    vi.mocked(api).mockResolvedValue({
      used: 8,
      limit: 10,
      remaining: 2,
      unlimited: false,
    });

    const view = renderLab();
    await waitFor(() => expect(simulatorApi.start).toHaveBeenCalledTimes(1));

    // Re-render the page several times: the session effect must not re-fire
    // (regression: an unstable `lab` dep used to drain the whole monthly quota
    // in a single page open).
    for (let i = 0; i < 5; i += 1) view.rerender(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={["/simulator/multimeter"]}>
          <Routes>
            <Route path="/simulator/:tool" element={<SimulatorLabPage />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(simulatorApi.start).toHaveBeenCalledTimes(1);
  });
});
