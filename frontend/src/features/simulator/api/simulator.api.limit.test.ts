import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import { api } from "@/lib/api/client";
import { trackOnce } from "@/lib/track";
import { SIMULATOR_LIMIT_EVENT, simulatorApi } from "./simulator.api";

vi.mock("@/lib/api/client", () => ({
  api: vi.fn(),
}));

vi.mock("@/lib/track", () => ({
  trackOnce: vi.fn(),
}));

describe("simulatorApi.start at the monthly cap", () => {
  beforeEach(() => {
    vi.mocked(api).mockReset();
    vi.mocked(trackOnce).mockReset();
  });

  it("reports the limit once and tells the UI to show the upsell", async () => {
    vi.mocked(api).mockRejectedValue(
      new ApiError("You have used all 5 simulator sessions for this month.", 422, {
        sessions: ["You have used all 5 simulator sessions for this month."],
      }),
    );

    const onLimit = vi.fn();
    window.addEventListener(SIMULATOR_LIMIT_EVENT, onLimit);

    await expect(
      simulatorApi.start({ vehicle_key: "corolla-1zr-fe", tool: "scanner" }),
    ).rejects.toBeInstanceOf(ApiError);

    expect(trackOnce).toHaveBeenCalledWith("simulator_limit_reached", {
      source: "simulator_start",
    });
    expect(onLimit).toHaveBeenCalledTimes(1);

    window.removeEventListener(SIMULATOR_LIMIT_EVENT, onLimit);
  });

  it("leaves unrelated failures out of the funnel", async () => {
    vi.mocked(api).mockRejectedValue(new ApiError("Server error.", 500));

    const onLimit = vi.fn();
    window.addEventListener(SIMULATOR_LIMIT_EVENT, onLimit);

    await expect(
      simulatorApi.start({ vehicle_key: "corolla-1zr-fe", tool: "scanner" }),
    ).rejects.toBeInstanceOf(ApiError);

    expect(trackOnce).not.toHaveBeenCalled();
    expect(onLimit).not.toHaveBeenCalled();

    window.removeEventListener(SIMULATOR_LIMIT_EVENT, onLimit);
  });
});
