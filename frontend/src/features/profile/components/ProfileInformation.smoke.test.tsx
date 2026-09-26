import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { authApi } from "@/features/auth/api/auth.api";
import type { User } from "@/features/auth/types/auth.types";
import { ProfileInformation } from "./ProfileInformation";
import type { ProfileFormData } from "../pages/ProfilePage";

vi.mock("@/features/auth/api/auth.api", () => ({
  authApi: {
    sendPhoneOtp: vi.fn(),
    verifyPhoneOtp: vi.fn(),
  },
}));

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "1",
    first_name: "Amina",
    last_name: "Belkacem",
    username: "amina",
    email: "amina@example.com",
    email_verified_at: null,
    phone: "+213555000111",
    phone_verified_at: null,
    avatar: null,
    bio: null,
    country: null,
    language: "en",
    timezone: "UTC",
    status: "active",
    roles: ["Student"],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function buildForm(user: User): ProfileFormData {
  return {
    avatar: user.avatar,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username ?? "",
    phone: "555000111",
    phone_country_code: "+213",
    country: user.country ?? "",
    bio: user.bio ?? "",
    language: user.language ?? "en",
    timezone: user.timezone ?? "UTC",
  };
}

function renderInfo(user: User) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ProfileInformation
        user={user}
        form={buildForm(user)}
        isEditing={false}
        isSaving={false}
        onEdit={() => {}}
        onCancel={() => {}}
        onSave={() => {}}
        onFieldChange={() => {}}
      />
    </I18nextProvider>,
  );
}

describe("ProfileInformation verification badges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks an unverified email as not verified", () => {
    renderInfo(buildUser({ email_verified_at: null, phone: null }));

    expect(screen.getByText("Not verified")).toBeInTheDocument();
    expect(screen.queryByText("Verified")).not.toBeInTheDocument();
  });

  it("marks a verified email as verified", () => {
    renderInfo(
      buildUser({ email_verified_at: "2026-01-01T00:00:00Z", phone: null }),
    );

    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.queryByText("Not verified")).not.toBeInTheDocument();
  });

  it("shows the phone badge as not verified until the code is confirmed", async () => {
    vi.mocked(authApi.sendPhoneOtp).mockResolvedValue({ delivery: "email" });
    vi.mocked(authApi.verifyPhoneOtp).mockResolvedValue({
      phone_verified_at: "2026-09-25T10:00:00.000Z",
    });

    renderInfo(buildUser({ email_verified_at: "2026-01-01T00:00:00Z" }));

    expect(screen.getByText("Not verified")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^verify$/i }));

    await waitFor(() => {
      expect(authApi.sendPhoneOtp).toHaveBeenCalledTimes(1);
    });

    expect(
      await screen.findByText(/sent a 6-digit code to your email/i),
    ).toBeInTheDocument();

    const codeInput = screen.getByRole("textbox");
    fireEvent.change(codeInput, { target: { value: "12-34-56" } });
    expect(codeInput).toHaveValue("123456");

    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => {
      expect(authApi.verifyPhoneOtp).toHaveBeenCalledWith("123456");
    });

    expect(await screen.findByText("Phone number verified.")).toBeInTheDocument();
  });

  it("surfaces failures when the code cannot be sent", async () => {
    vi.mocked(authApi.sendPhoneOtp).mockRejectedValue(
      new Error("Too many attempts."),
    );

    renderInfo(buildUser({ email_verified_at: "2026-01-01T00:00:00Z" }));

    fireEvent.click(screen.getByRole("button", { name: /^verify$/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Too many attempts.");
  });
});
