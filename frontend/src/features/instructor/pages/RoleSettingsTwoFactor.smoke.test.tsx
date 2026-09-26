import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { InstructorSettingsPage } from "./InstructorSettingsPage";
import { AdminSettingsPage } from "@/features/admin/pages/AdminSettingsPage";

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: "u1",
      first_name: "U",
      last_name: "One",
      username: "uone",
      email: "u@hbt.test",
      phone: null,
      bio: null,
      country: null,
      roles: ["Instructor", "Admin"],
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
      notifications: { email_enabled: true, push_enabled: true },
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
    export: vi.fn().mockResolvedValue({}),
    deleteAccount: vi.fn().mockResolvedValue(null),
  },
}));

function renderInstructor() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/instructor/settings"]}>
        <InstructorSettingsPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

function renderAdmin() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/admin/settings"]}>
        <AdminSettingsPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("role settings 2FA", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows two-factor controls on the instructor security tab", async () => {
    renderInstructor();
    await waitFor(() => {
      expect(screen.getByText("Security")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Security"));
    await waitFor(() => {
      expect(screen.getByTestId("two-factor-card")).toBeInTheDocument();
    });
    expect(screen.getByTestId("two-factor-enable")).toBeInTheDocument();
  });

  it("shows two-factor controls on the admin security tab", async () => {
    renderAdmin();
    await waitFor(() => {
      expect(screen.getByText("Security")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Security"));
    await waitFor(() => {
      expect(screen.getByTestId("two-factor-card")).toBeInTheDocument();
    });
    expect(screen.getByTestId("two-factor-enable")).toBeInTheDocument();
  });
});
