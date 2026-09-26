import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { ChallengesPage } from "./ChallengesPage";
import { challengesApi } from "../api/challenges.api";

vi.mock("../api/challenges.api", async () => {
    const actual = await vi.importActual<typeof import("../api/challenges.api")>("../api/challenges.api");
    return {
        ...actual,
        challengesApi: {
            today: vi.fn(),
            review: vi.fn(),
            leaderboard: vi.fn(),
            activity: vi.fn(),
            peers: vi.fn(),
            rivals: vi.fn(),
            challenge: vi.fn(),
            accept: vi.fn(),
            share: vi.fn(),
            claim: vi.fn(),
        },
    };
});

function renderPage() {
    return render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter initialEntries={["/challenges"]}>
                <ChallengesPage />
            </MemoryRouter>
        </I18nextProvider>,
    );
}

describe("ChallengesPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(challengesApi.today).mockResolvedValue({
            date: "2026-09-23",
            challenges: [
                {
                    id: "1",
                    key: "lesson-complete",
                    title: "Complete a lesson",
                    description: "Finish any lesson today.",
                    action: "lesson_complete",
                    route: "/my-courses",
                    xp: 20,
                    status: "completed",
                    progress: 1,
                    target: 1,
                    completed_at: "2026-09-23T10:00:00Z",
                    detail: null,
                },
            ],
            summary: { total: 1, done: 1, xp_available: 20, xp_claimed: 0 },
        });

        vi.mocked(challengesApi.review).mockResolvedValue({
            date: "2026-09-22",
            challenges: [],
            summary: { total: 0, done: 0, xp_claimed: 0 },
        });

        vi.mocked(challengesApi.leaderboard).mockResolvedValue({
            date: "2026-09-23",
            top: [],
            me: null,
        });

        vi.mocked(challengesApi.activity).mockResolvedValue([]);
        vi.mocked(challengesApi.peers).mockResolvedValue([]);
        vi.mocked(challengesApi.rivals).mockResolvedValue([]);
    });

    it("renders the board, back link, leaderboard and feed", async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByTestId("challenges-page")).toBeInTheDocument();
        });

        expect(await screen.findByText("Daily Challenges")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /back to dashboard/i })).toHaveAttribute("href", "/dashboard");
        expect(await screen.findByText("Complete a lesson")).toBeInTheDocument();
        expect(await screen.findByRole("heading", { name: /who finishes first/i })).toBeInTheDocument();
        expect(await screen.findByRole("heading", { name: /just completed/i })).toBeInTheDocument();
        expect(await screen.findByRole("heading", { name: /challenge a classmate/i })).toBeInTheDocument();
        expect(await screen.findByRole("button", { name: /^claim$/i })).toBeInTheDocument();
    });
});
