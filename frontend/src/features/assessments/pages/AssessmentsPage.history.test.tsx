import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";

import {
    getAssessments,
    type Assessment,
    type AssessmentAttemptHistory,
} from "../api/assessments.api";
import { AssessmentsPage } from "./AssessmentsPage";

vi.mock("../api/assessments.api", () => ({
    getAssessments: vi.fn(),
    assessmentAttemptsApi: {},
}));

function history(
    overrides: Partial<AssessmentAttemptHistory> = {},
): AssessmentAttemptHistory {
    return {
        attempts_count: 2,
        best_score: 82,
        passed: false,
        remaining_attempts: 1,
        in_progress_attempt_id: null,
        cooldown_until: null,
        can_start: true,
        latest: {
            id: "attempt-2",
            attempt_number: 2,
            status: "failed",
            score: 60,
            passed: false,
            started_at: "2026-10-01T10:00:00Z",
            completed_at: "2026-10-01T10:30:00Z",
        },
        ...overrides,
    };
}

function assessment(overrides: Partial<Assessment> = {}): Assessment {
    return {
        id: "assessment-1",
        title: "Final diagnostic assessment",
        description: "Prove your diagnostic skills.",
        course_title: "CAN Bus diagnostics",
        minimum_score: 70,
        max_attempts: 3,
        time_limit_minutes: 30,
        questions_count: 10,
        eligibility: {
            eligible: true,
            lessons: { required: 5, completed: 5 },
            quizzes: { required: 2, completed: 2, required_score: 70 },
            scenarios: { required: 1, completed: 1 },
        },
        attempt_history: history(),
        ...overrides,
    };
}

function renderPage() {
    return render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter initialEntries={["/assessments"]}>
                <AssessmentsPage />
            </MemoryRouter>
        </I18nextProvider>,
    );
}

describe("AssessmentsPage attempt history", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows best score, attempts used and remaining attempts", async () => {
        vi.mocked(getAssessments).mockResolvedValue([assessment()]);

        renderPage();

        expect(await screen.findByText("82%")).toBeInTheDocument();
        expect(screen.getByText("2 / 3")).toBeInTheDocument();
        expect(screen.getByText("Remaining").closest("div")).toHaveTextContent("1");
        expect(
            screen.getByRole("button", { name: "Try again" }),
        ).toBeEnabled();
    });

    it("locks the start button while a timeout cooldown is active", async () => {
        vi.mocked(getAssessments).mockResolvedValue([
            assessment({
                attempt_history: history({
                    can_start: false,
                    cooldown_until: new Date(Date.now() + 60 * 60_000).toISOString(),
                }),
            }),
        ]);

        renderPage();

        const button = await screen.findByRole("button", {
            name: "Available after cooldown",
        });

        expect(button).toBeDisabled();
        expect(
            screen.getByText(/This assessment is on a timeout cooldown/),
        ).toBeInTheDocument();
    });

    it("surfaces a passed assessment and its certificate link", async () => {
        vi.mocked(getAssessments).mockResolvedValue([
            assessment({
                attempt_history: history({
                    best_score: 91,
                    passed: true,
                    latest: {
                        id: "attempt-2",
                        attempt_number: 2,
                        status: "passed",
                        score: 91,
                        passed: true,
                        started_at: "2026-10-01T10:00:00Z",
                        completed_at: "2026-10-01T10:30:00Z",
                    },
                }),
            }),
        ]);

        renderPage();

        expect(await screen.findByText("Passed")).toBeInTheDocument();
        expect(screen.getByText("91%")).toBeInTheDocument();

        const certificateLinks = screen.getAllByRole("link", {
            name: /view my certificates/i,
        });
        expect(certificateLinks[0]).toHaveAttribute("href", "/certificates");

        expect(
            screen.getByRole("button", { name: "Retake assessment" }),
        ).toBeEnabled();
    });

    it("offers to resume an in-progress attempt instead of starting over", async () => {
        vi.mocked(getAssessments).mockResolvedValue([
            assessment({
                attempt_history: history({
                    attempts_count: 1,
                    best_score: null,
                    remaining_attempts: 2,
                    in_progress_attempt_id: "attempt-live",
                    latest: {
                        id: "attempt-live",
                        attempt_number: 1,
                        status: "in_progress",
                        score: null,
                        passed: false,
                        started_at: "2026-10-01T10:00:00Z",
                        completed_at: null,
                    },
                }),
            }),
        ]);

        renderPage();

        expect(
            await screen.findByRole("button", { name: "Resume attempt" }),
        ).toBeEnabled();
    });

    it("shows the no-attempts-remaining state", async () => {
        vi.mocked(getAssessments).mockResolvedValue([
            assessment({
                attempt_history: history({
                    attempts_count: 3,
                    remaining_attempts: 0,
                }),
            }),
        ]);

        renderPage();

        expect(
            await screen.findByRole("button", { name: "No attempts remaining" }),
        ).toBeDisabled();
    });
});
