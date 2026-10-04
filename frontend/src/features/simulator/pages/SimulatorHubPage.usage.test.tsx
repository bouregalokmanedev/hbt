import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import { api } from "@/lib/api/client";

import { simulatorApi } from "../api/simulator.api";
import { SimulatorHubPage } from "./SimulatorHubPage";

vi.mock("@/lib/api/client", () => ({
  api: vi.fn(),
  authedFetch: vi.fn(),
}));

vi.mock("@/lib/track", () => ({
  track: vi.fn(),
  trackOnce: vi.fn(),
}));

vi.mock("@/features/dashboard/hooks/useDashboard", () => ({
  useDashboard: () => ({ dashboard: null }),
}));

vi.mock("../api/simulator.api", () => ({
  simulatorApi: { results: vi.fn().mockResolvedValue([]) },
  SIMULATOR_RESULTS_EVENT: "hbt:simulator-results",
}));

vi.mock("../components/HubFeedback", () => ({
  HubFeedback: () => null,
}));

function renderHub() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/simulator"]}>
        <SimulatorHubPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("SimulatorHubPage badge session bonus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(simulatorApi.results).mockResolvedValue([] as never);
  });

  it("shows how many sessions the unlocked badges added", async () => {
    vi.mocked(api).mockResolvedValue({
      used: 4,
      limit: 13,
      base_limit: 10,
      bonus: 3,
      remaining: 9,
      unlimited: false,
    });

    renderHub();

    const bonus = await screen.findByTestId("simulator-usage-bonus");
    expect(bonus).toHaveTextContent("+3 from simulator badges");
    expect(screen.getByTestId("simulator-usage")).toHaveTextContent(
      "4 of 13 used",
    );
  });

  it("hides the bonus chip when no simulator badge is unlocked", async () => {
    vi.mocked(api).mockResolvedValue({
      used: 1,
      limit: 10,
      base_limit: 10,
      bonus: 0,
      remaining: 9,
      unlimited: false,
    });

    renderHub();

    await waitFor(() =>
      expect(screen.getByTestId("simulator-usage")).toHaveTextContent(
        "1 of 10 used",
      ),
    );
    expect(screen.queryByTestId("simulator-usage-bonus")).toBeNull();
  });

  it("hides the quota strip entirely for unlimited plans", async () => {
    vi.mocked(api).mockResolvedValue({
      used: 40,
      limit: null,
      remaining: null,
      unlimited: true,
      bonus: 0,
    });

    renderHub();

    await waitFor(() =>
      expect(screen.queryByTestId("simulator-usage")).toBeNull(),
    );
    expect(screen.queryByTestId("simulator-usage-bonus")).toBeNull();
  });
});
