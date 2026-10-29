import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";

import {
    assessmentAttemptsApi,
    type AssessmentAttempt,
    type AssessmentQuestion,
} from "../api/assessments.api";
import { AssessmentExamPage } from "./AssessmentExamPage";

vi.mock("../api/assessments.api", () => ({
    assessmentAttemptsApi: {
        start: vi.fn(),
        saveAnswer: vi.fn(),
        submit: vi.fn(),
        expire: vi.fn(),
        tabSwitch: vi.fn(),
        result: vi.fn(),
    },
    getAssessments: vi.fn(),
}));

const questions: AssessmentQuestion[] = [
    {
        id: "q-single",
        question: "Which tool reads fault codes?",
        type: "single_choice",
        points: 10,
        required: true,
        options: [
            { id: "o-single-1", option: "OBD scanner" },
            { id: "o-single-2", option: "Torque wrench" },
        ],
        matching: null,
    },
    {
        id: "q-short",
        question: "Name the diagnostic standard.",
        type: "short_answer",
        points: 10,
        required: true,
        options: [],
        matching: null,
    },
    {
        id: "q-numeric",
        question: "What is the target voltage?",
        type: "numeric",
        points: 10,
        required: true,
        options: [],
        matching: null,
    },
    {
        id: "q-ordering",
        question: "Put the diagnostic steps in order.",
        type: "ordering",
        points: 10,
        required: true,
        options: [
            { id: "o-order-1", option: "Read the fault code" },
            { id: "o-order-2", option: "Verify the repair" },
        ],
        matching: null,
    },
    {
        id: "q-matching",
        question: "Match each component to its purpose.",
        type: "matching",
        points: 10,
        required: true,
        options: [],
        matching: {
            left: ["Battery", "Fuse"],
            right: ["12 V supply", "Overcurrent protection"],
        },
    },
];

function buildAttempt(): AssessmentAttempt {
    return {
        id: "attempt-1",
        assessment_id: "assessment-1",
        attempt_number: 1,
        status: "in_progress",
        expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
        answers: [],
        assessment: {
            id: "assessment-1",
            title: "Final diagnostic assessment",
            minimum_score: 70,
            time_limit_minutes: 30,
            questions,
        },
    };
}

function renderPage() {
    return render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter initialEntries={["/assessments/assessment-1/exam"]}>
                <Routes>
                    <Route
                        path="/assessments/:assessmentId/exam"
                        element={<AssessmentExamPage />}
                    />
                    <Route path="/assessments" element={<div>Assessment list</div>} />
                </Routes>
            </MemoryRouter>
        </I18nextProvider>,
    );
}

function submittedAnswer(questionId: string) {
    const call = vi.mocked(assessmentAttemptsApi.submit).mock.calls[0];
    const answers = call?.[2] ?? [];

    return answers.find((answer) => answer.question_id === questionId);
}

describe("AssessmentExamPage question types", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(assessmentAttemptsApi.start).mockResolvedValue(buildAttempt());
        vi.mocked(assessmentAttemptsApi.saveAnswer).mockResolvedValue({
            saved: true,
            question_id: "",
            answer: null,
        });
        vi.mocked(assessmentAttemptsApi.submit).mockResolvedValue({
            score: 90,
            passed: true,
            attempt_number: 1,
            completed_at: new Date().toISOString(),
        });
        vi.mocked(assessmentAttemptsApi.expire).mockResolvedValue({});
        vi.mocked(assessmentAttemptsApi.tabSwitch).mockResolvedValue({});
    });

    it("renders and submits choice, text, numeric, ordering and matching answers", async () => {
        renderPage();

        await screen.findByTestId("assessment-question-0");
        expect(screen.getByText("Which tool reads fault codes?")).toBeInTheDocument();
        expect(screen.getByText("Short answer")).toBeInTheDocument();
        expect(screen.getByText("Numeric answer")).toBeInTheDocument();
        expect(screen.getByText("Put in order")).toBeInTheDocument();
        expect(screen.getByText("Match the pairs")).toBeInTheDocument();

        fireEvent.click(screen.getByLabelText("OBD scanner"));

        fireEvent.change(screen.getByPlaceholderText("Type your answer…"), {
            target: { value: "OBD-II" },
        });

        fireEvent.change(screen.getByPlaceholderText("Enter a number"), {
            target: { value: "12.5" },
        });

        const orderingCard = screen.getByTestId("assessment-question-3");
        fireEvent.click(within(orderingCard).getAllByLabelText("Move down")[0]);

        fireEvent.change(screen.getByLabelText("Match for Battery"), {
            target: { value: "12 V supply" },
        });
        fireEvent.change(screen.getByLabelText("Match for Fuse"), {
            target: { value: "Overcurrent protection" },
        });

        const submitButton = screen.getByRole("button", {
            name: "Submit final assessment",
        });

        await waitFor(() => expect(submitButton).toBeEnabled());

        fireEvent.click(submitButton);
        fireEvent.click(
            await screen.findByRole("button", { name: "Submit now" }),
        );

        expect(await screen.findByTestId("assessment-result")).toBeInTheDocument();
        expect(screen.getByText("Assessment passed")).toBeInTheDocument();

        expect(submittedAnswer("q-single")).toEqual({
            question_id: "q-single",
            option_ids: ["o-single-1"],
        });
        expect(submittedAnswer("q-short")).toEqual({
            question_id: "q-short",
            value: "OBD-II",
        });
        expect(submittedAnswer("q-numeric")).toEqual({
            question_id: "q-numeric",
            value: 12.5,
        });
        expect(submittedAnswer("q-ordering")).toEqual({
            question_id: "q-ordering",
            ordered_ids: ["o-order-2", "o-order-1"],
        });
        expect(submittedAnswer("q-matching")).toEqual({
            question_id: "q-matching",
            matches: {
                Battery: "12 V supply",
                Fuse: "Overcurrent protection",
            },
        });
    });

    it("keeps submission blocked until every required question is answered", async () => {
        renderPage();

        await screen.findByTestId("assessment-question-0");

        const submitButton = screen.getByRole("button", {
            name: "Submit final assessment",
        });

        expect(submitButton).toBeDisabled();
        expect(
            screen.getByText("5 required questions still need an answer."),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByLabelText("OBD scanner"));

        await waitFor(() => expect(submitButton).toBeDisabled());
        expect(
            screen.getByText("4 required questions still need an answer."),
        ).toBeInTheDocument();
    });

    it("does not treat an untouched ordering question as answered after setting confidence", async () => {
        renderPage();

        await screen.findByTestId("assessment-question-0");

        const orderingCard = screen.getByTestId("assessment-question-3");
        const confidence = within(orderingCard).getByRole("combobox");

        fireEvent.change(confidence, { target: { value: "confident" } });

        expect(
            screen.getByText("5 required questions still need an answer."),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Submit final assessment" }),
        ).toBeDisabled();
        expect(assessmentAttemptsApi.saveAnswer).not.toHaveBeenCalled();
    });

    it("shows the blocked state when the attempt is locked", async () => {
        vi.mocked(assessmentAttemptsApi.start).mockResolvedValue({
            ...buildAttempt(),
            status: "blocked",
            blocked_at: new Date().toISOString(),
        });

        renderPage();

        expect(await screen.findByTestId("assessment-blocked")).toBeInTheDocument();
        expect(screen.getByText("This attempt is locked")).toBeInTheDocument();
    });
});
