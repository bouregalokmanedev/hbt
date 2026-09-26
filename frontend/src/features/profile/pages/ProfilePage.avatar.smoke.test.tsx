import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { authApi } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/features/auth";
import type { User } from "@/features/auth/types/auth.types";
import { dashboardApi } from "@/features/dashboard/api/dashboard.api";
import { ProfilePage } from "./ProfilePage";

vi.mock("@/features/dashboard/api/dashboard.api", () => ({
  dashboardApi: { getDashboard: vi.fn() },
}));

vi.mock("@/features/auth/api/auth.api", () => ({
  authApi: { updateProfile: vi.fn() },
}));

vi.mock("../components/LearningOverview", () => ({
  LearningOverview: () => <div data-testid="learning-overview" />,
}));

vi.mock("../components/MessagesCard", () => ({
  MessagesCard: () => <div data-testid="messages-card" />,
}));

vi.mock("../components/FeedbackCard", () => ({
  FeedbackCard: () => <div data-testid="feedback-card" />,
}));

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "1",
    first_name: "Amina",
    last_name: "Belkacem",
    username: "amina",
    email: "amina@example.com",
    email_verified_at: "2026-01-01T00:00:00Z",
    phone: "+213555000111",
    avatar: "data:image/png;base64,AAAA",
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

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("ProfilePage avatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dashboardApi.getDashboard).mockResolvedValue({
      achievements: [],
    } as never);
  });

  it("persists a removed avatar right away without entering edit mode", async () => {
    const user = buildUser();

    useAuthStore.setState({ user });

    vi.mocked(authApi.updateProfile).mockResolvedValue({
      ...user,
      avatar: null,
    } as never);

    renderPage();

    fireEvent.click(await screen.findByTitle("Profile picture"));
    fireEvent.click(
      await screen.findByRole("button", { name: /remove photo/i }),
    );

    await waitFor(() => {
      expect(authApi.updateProfile).toHaveBeenCalledTimes(1);
    });

    expect(vi.mocked(authApi.updateProfile).mock.calls[0][0].avatar).toBeNull();

    await waitFor(() => {
      expect(useAuthStore.getState().user?.avatar).toBeNull();
    });

    expect(screen.queryByText("Discard changes")).not.toBeInTheDocument();
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  it("applies a generated sketch avatar right away", async () => {
    const user = buildUser({ avatar: null });

    useAuthStore.setState({ user });

    vi.mocked(authApi.updateProfile).mockResolvedValue({
      ...user,
      avatar: "data:image/svg+xml;charset=utf-8,%3Csvg%3E",
    } as never);

    renderPage();

    fireEvent.click(await screen.findByTitle("Profile picture"));
    fireEvent.click(
      await screen.findByRole("button", { name: /generate avatar/i }),
    );

    expect(await screen.findByText("Preview")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^cap$/i }));
    fireEvent.click(
      screen.getByRole("button", { name: "Background color #2563EB" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^hoodie$/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /use this avatar/i }),
    );

    await waitFor(() => {
      expect(authApi.updateProfile).toHaveBeenCalledTimes(1);
    });

    const avatar = vi.mocked(authApi.updateProfile).mock.calls[0][0]
      .avatar as string;

    expect(avatar.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(
      true,
    );

    const markup = decodeURIComponent(avatar.slice(avatar.indexOf(",") + 1));

    expect(markup).toContain('fill="#2563EB"');
    expect(markup).toContain("M114 214v34M142 214v34");
    expect(markup).toContain("M74 100a54 54 0 0 1 108 0");

    await waitFor(() => {
      expect(useAuthStore.getState().user?.avatar).toBe(
        "data:image/svg+xml;charset=utf-8,%3Csvg%3E",
      );
    });
  });

  it("keeps showing the saved avatar after navigating away and back", async () => {
    const user = buildUser({ avatar: "data:image/png;base64,BBBB" });

    useAuthStore.setState({ user });

    const first = renderPage();

    const img = await waitFor(() => {
      const el = first.container.querySelector("img");

      expect(el).toHaveAttribute("src", "data:image/png;base64,BBBB");

      return el as HTMLImageElement;
    });

    expect(img.className).toContain("h-24");
    expect(img.className).toContain("w-24");
    expect(img.className).toContain("aspect-square");
    expect(img.className).toContain("rounded-[16.667%]");

    first.unmount();

    const second = renderPage();

    await waitFor(() => {
      expect(second.container.querySelector("img")).toHaveAttribute(
        "src",
        "data:image/png;base64,BBBB",
      );
    });

    expect(vi.mocked(authApi.updateProfile)).not.toHaveBeenCalled();
  });
});
