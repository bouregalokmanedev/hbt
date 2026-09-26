import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { SettingsPage } from "./SettingsPage";
import { settingsApi } from "../api/settings.api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useUpdateProfile } from "@/features/auth/hooks/useUpdateProfile";

vi.mock("../api/settings.api", () => ({
  settingsApi: {
    get: vi.fn(),
    update: vi.fn(),
    changePassword: vi.fn(),
    security: vi.fn(),
    sessions: vi.fn(),
    revokeSession: vi.fn(),
    revokeOtherSessions: vi.fn(),
    loginActivity: vi.fn(),
    enableTwoFactor: vi.fn(),
    verifyTwoFactor: vi.fn(),
    disableTwoFactor: vi.fn(),
    achievements: vi.fn(),
    export: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/features/auth/hooks/useUpdateProfile", () => ({
  useUpdateProfile: vi.fn(),
}));

vi.mock("@/lib/theme", () => ({
  setTheme: vi.fn(),
}));

const baseSettings = {
  account: { language: "en", timezone: "Africa/Algiers" },
  appearance: { appearance: "system", theme: "default", compact_mode: false, reduced_motion: false },
  notifications: {
    email_enabled: true,
    push_enabled: true,
    in_app_enabled: true,
    course_updates: true,
    lesson_reminders: true,
    quiz_reminders: true,
    assessment_results: true,
    certificate_issued: true,
    achievement_unlocked: true,
    course_completion: true,
    security_alerts: true,
    marketing: false,
  },
  privacy: {},
  learning: {},
  security: {},
  assessment: {
    show_timer: true,
    confirm_before_submit: true,
    show_result_breakdown: true,
    email_result_notifications: false,
  },
};

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

async function openNotificationsTab() {
  renderPage();
  await waitFor(() => expect(vi.mocked(settingsApi.get)).toHaveBeenCalled());
  fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
  await waitFor(() => {
    expect(screen.getByTestId("notification-toggles")).toBeInTheDocument();
  });
}

describe("SettingsPage notification toggles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { first_name: "Test", last_name: "Student", username: "test", email: "t@x.com", phone: null, country: null, bio: null },
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(useUpdateProfile).mockReturnValue({
      updateProfile: vi.fn(),
      isUpdating: false,
    } as unknown as ReturnType<typeof useUpdateProfile>);
    vi.mocked(settingsApi.get).mockResolvedValue(baseSettings);
    vi.mocked(settingsApi.update).mockResolvedValue({ email_enabled: false });
  });

  it("loads notification toggles with current server values", async () => {
    await openNotificationsTab();

    expect(screen.getByTestId("notification-toggles-email_enabled")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /email notifications/i }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /marketing/i }),
    ).not.toBeChecked();
  });

  it("auto-saves a single toggle when flipped", async () => {
    await openNotificationsTab();

    const emailToggle = screen.getByRole("checkbox", { name: /email notifications/i });
    expect(emailToggle).toBeChecked();

    fireEvent.click(emailToggle);

    await waitFor(() => {
      expect(settingsApi.update).toHaveBeenCalledWith("notifications", {
        email_enabled: false,
      });
    });
  });

  it("persists a per-type toggle flip", async () => {
    await openNotificationsTab();

    const certToggle = screen.getByRole("checkbox", { name: /certificate issued/i });
    fireEvent.click(certToggle);

    await waitFor(() => {
      expect(settingsApi.update).toHaveBeenCalledWith("notifications", {
        certificate_issued: false,
      });
    });
  });

  it("rolls the draft back when the save request fails", async () => {
    vi.mocked(settingsApi.update).mockRejectedValueOnce(new Error("Network down"));

    await openNotificationsTab();

    const emailToggle = screen.getByRole("checkbox", { name: /email notifications/i });
    fireEvent.click(emailToggle);

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: /email notifications/i })).toBeChecked();
    });
    expect(screen.getByText(/network down/i)).toBeInTheDocument();
  });
});
