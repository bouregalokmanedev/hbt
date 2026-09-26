import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { TwoFactorCard } from "./TwoFactorCard";
import { settingsApi } from "../api/settings.api";

vi.mock("../api/settings.api", () => ({
  settingsApi: {
    security: vi.fn(),
    enableTwoFactor: vi.fn(),
    verifyTwoFactor: vi.fn(),
    disableTwoFactor: vi.fn(),
  },
}));

function renderCard() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <TwoFactorCard />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("TwoFactorCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(settingsApi.security).mockResolvedValue({
      two_factor_enabled: false,
      two_factor_method: null,
    });
  });

  it("loads status and starts in the not-enabled method picker", async () => {
    renderCard();

    await waitFor(() => {
      expect(screen.getByTestId("two-factor-status")).toBeInTheDocument();
    });

    expect(screen.getByTestId("two-factor-status")).toHaveTextContent(/not enabled/i);
    expect(screen.getByTestId("two-factor-method-email")).toBeInTheDocument();
    expect(screen.getByTestId("two-factor-method-phone")).toBeInTheDocument();
    expect(screen.getByTestId("two-factor-enable")).toBeInTheDocument();
  });

  it("sends a code then shows the six-digit verify field", async () => {
    vi.mocked(settingsApi.enableTwoFactor).mockResolvedValue({
      verification_required: true,
      method: "email",
    });
    vi.mocked(settingsApi.verifyTwoFactor).mockResolvedValue({
      two_factor_enabled: true,
      two_factor_method: "email",
    });

    renderCard();
    await waitFor(() => expect(screen.getByTestId("two-factor-enable")).toBeInTheDocument());

    fireEvent.click(screen.getByTestId("two-factor-enable"));
    await waitFor(() => {
      expect(screen.getByTestId("two-factor-code")).toBeInTheDocument();
    });
    expect(settingsApi.enableTwoFactor).toHaveBeenCalledWith("email");
    expect(screen.getByTestId("two-factor-code-input")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("two-factor-code-input"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByTestId("two-factor-verify"));
    await waitFor(() => {
      expect(screen.getByTestId("two-factor-disable")).toBeInTheDocument();
    });
    expect(settingsApi.verifyTwoFactor).toHaveBeenCalledWith("123456", "email");
    expect(screen.getByTestId("two-factor-status")).toHaveTextContent(/enabled/i);
  });

  it("requires account password before disabling", async () => {
    vi.mocked(settingsApi.security).mockResolvedValue({
      two_factor_enabled: true,
      two_factor_method: "email",
    });
    vi.mocked(settingsApi.disableTwoFactor).mockResolvedValue({
      two_factor_enabled: false,
      two_factor_method: null,
    });

    renderCard();
    await waitFor(() => {
      expect(screen.getByTestId("two-factor-disable")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("two-factor-disable"));
    await waitFor(() => {
      expect(screen.getByTestId("two-factor-disable-confirm")).toBeInTheDocument();
    });
    expect(settingsApi.disableTwoFactor).not.toHaveBeenCalled();

    fireEvent.change(screen.getByTestId("two-factor-disable-password"), {
      target: { value: "secret-password" },
    });
    fireEvent.click(screen.getByTestId("two-factor-disable-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("two-factor-enable")).toBeInTheDocument();
    });
    expect(settingsApi.disableTwoFactor).toHaveBeenCalledWith("secret-password");
    expect(screen.getByTestId("two-factor-status")).toHaveTextContent(/not enabled/i);
  });

  it("can cancel the disable confirmation without calling the API", async () => {
    vi.mocked(settingsApi.security).mockResolvedValue({
      two_factor_enabled: true,
      two_factor_method: "email",
    });

    renderCard();
    await waitFor(() => {
      expect(screen.getByTestId("two-factor-disable")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("two-factor-disable"));
    await waitFor(() => {
      expect(screen.getByTestId("two-factor-disable-confirm")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("two-factor-disable-cancel"));
    expect(screen.queryByTestId("two-factor-disable-confirm")).not.toBeInTheDocument();
    expect(settingsApi.disableTwoFactor).not.toHaveBeenCalled();
  });
});
