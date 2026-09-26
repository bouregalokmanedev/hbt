import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { SupportSettingsPage } from "./SupportSettingsPage";
import { loadDeskPrefs } from "../deskPrefs";

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: "s1",
      first_name: "Sam",
      last_name: "Agent",
      username: "sam",
      email: "sam@hbt.test",
      phone: null,
      bio: null,
      country: null,
      roles: ["Support"],
    },
    logout: vi.fn(),
  }),
}));

vi.mock("@/features/auth/hooks/useUpdateProfile", () => ({
  useUpdateProfile: () => ({ updateProfile: vi.fn().mockResolvedValue(null), isUpdating: false }),
}));

vi.mock("@/features/settings/api/settings.api", () => ({
  settingsApi: {
    get: vi.fn().mockResolvedValue({
      account: {},
      appearance: { appearance: "system" },
      notifications: { email_enabled: true, push_enabled: false, in_app_enabled: true, security_alerts: true, marketing: false },
      privacy: {},
      learning: {},
      security: {},
      assessment: {},
    }),
    update: vi.fn().mockResolvedValue({}),
    changePassword: vi.fn().mockResolvedValue(null),
    security: vi.fn().mockResolvedValue({ two_factor_enabled: false, two_factor_method: null }),
    sessions: vi.fn().mockResolvedValue([]),
    loginActivity: vi.fn().mockResolvedValue([]),
    enableTwoFactor: vi.fn().mockResolvedValue({ verification_required: true, method: "email" }),
    verifyTwoFactor: vi.fn().mockResolvedValue({ two_factor_enabled: true }),
    disableTwoFactor: vi.fn().mockResolvedValue({ two_factor_enabled: false }),
    export: vi.fn().mockResolvedValue({ ok: true }),
    deleteAccount: vi.fn().mockResolvedValue(null),
  },
}));

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/support-desk/settings"]}>
        <SupportSettingsPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("SupportSettingsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders the personalised desk tabs with a support role card", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("support-settings-tab-profile")).toBeInTheDocument();
    });

    expect(screen.getByTestId("support-settings-tab-desk")).toBeInTheDocument();
    expect(screen.getByTestId("support-settings-tab-security")).toBeInTheDocument();
    expect(screen.getByText(/support agent/i)).toBeInTheDocument();
  });

  it("saves personalised desk queue defaults to this device", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId("support-settings-tab-desk")).toBeInTheDocument());

    fireEvent.click(screen.getByTestId("support-settings-tab-desk"));
    fireEvent.change(screen.getByTestId("desk-default-status"), { target: { value: "open" } });
    fireEvent.change(screen.getByTestId("desk-default-assigned"), { target: { value: "me" } });
    fireEvent.click(screen.getByTestId("desk-prefs-save"));

    expect(loadDeskPrefs()).toEqual({ defaultStatus: "open", defaultAssigned: "me" });
  });

  it("exposes two-factor auth on the security tab", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId("support-settings-tab-security")).toBeInTheDocument());

    fireEvent.click(screen.getByTestId("support-settings-tab-security"));

    await waitFor(() => {
      expect(screen.getByTestId("two-factor-card")).toBeInTheDocument();
    });
    expect(screen.getByTestId("two-factor-enable")).toBeInTheDocument();
    expect(screen.getByTestId("two-factor-status")).toHaveTextContent(/not enabled/i);
  });
});
