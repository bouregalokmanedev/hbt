import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { QuizPlayerPage } from "./QuizPlayerPage";

vi.mock("@/lib/api/client", () => ({ api: vi.fn() }));

import { api } from "@/lib/api/client";

const apiMock = vi.mocked(api);

type Option = { id: string; option: string; is_correct?: boolean | null };
type Question = { id: string; question: string; type: string; points: number; required: boolean; explanation?: string | null; options: Option[] };

const requiredQuestion: Question = {
    id: "q-required",
    question: "Which signal carries CAN high?",
    type: "single_choice",
    points: 5,
    required: true,
    explanation: "The dominant high bus signal.",
    options: [
        { id: "opt-correct", option: "Dominant high bus signal", is_correct: null },
        { id: "opt-wrong", option: "The ground reference", is_correct: null },
    ],
};

const optionalQuestion: Question = {
    id: "q-optional",
    question: "Pick a shield colour.",
    type: "single_choice",
    points: 2,
    required: false,
    explanation: null,
    options: [
        { id: "opt-shield", option: "Green", is_correct: null },
    ],
};

const inProgressAttempt = {
    id: "attempt-1",
    quiz_id: "quiz-1",
    attempt_number: 1,
    status: "in_progress",
    percentage: null,
    passed: null,
    expires_at: null,
    answers: [],
    quiz: { title: "CAN Bus checkpoint", pass_percentage: 70, questions: [requiredQuestion, optionalQuestion] },
};

const submittedAttempt = {
    ...inProgressAttempt,
    status: "submitted",
    percentage: 100,
    passed: true,
    answers: [
        {
            question_id: "q-required",
            is_correct: true,
            points_earned: 5,
            selected_options: [{ id: "row-1", option_id: "opt-correct" }],
        },
        {
            question_id: "q-optional",
            is_correct: false,
            points_earned: 0,
            selected_options: [{ id: "row-2", option_id: "opt-shield" }],
        },
    ],
    quiz: {
        title: "CAN Bus checkpoint",
        pass_percentage: 70,
        questions: [
            { ...requiredQuestion, options: requiredQuestion.options.map((option) => ({ ...option, is_correct: option.id === "opt-correct" })) },
            { ...optionalQuestion, options: optionalQuestion.options.map((option) => ({ ...option, is_correct: false })) },
        ],
    },
};

type LearningPrefs = { show_quiz_explanations?: boolean; confirm_before_quiz_submit?: boolean };

function mockApi({ attempt = inProgressAttempt as unknown, learning = {} as LearningPrefs }: { attempt?: unknown; learning?: LearningPrefs } = {}) {
    apiMock.mockImplementation((endpoint: string, options: { method?: string; body?: unknown } = {}) => {
        if (endpoint === "/v1/student/settings") {
            return Promise.resolve({ learning }) as never;
        }
        if (options.method === "PUT") {
            return Promise.resolve(null) as never;
        }
        if (endpoint.endsWith("/submit")) {
            return Promise.resolve(submittedAttempt) as never;
        }
        if (endpoint === "/v1/quizzes/quiz-1/attempts") {
            return Promise.resolve(attempt) as never;
        }
        return Promise.resolve(null) as never;
    });
}

function renderPage() {
    return render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter initialEntries={["/courses/course-1/quizzes/quiz-1"]}>
                <Routes>
                    <Route path="/courses/:courseId/quizzes/:quizId" element={<QuizPlayerPage />} />
                </Routes>
            </MemoryRouter>
        </I18nextProvider>,
    );
}

describe("QuizPlayerPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockApi();
    });

    it("reports progress and autosaves an answered question", async () => {
        renderPage();

        await screen.findByTestId("quiz-question-0");
        expect(screen.getByTestId("quiz-progress")).toHaveTextContent("0/2 answered");

        fireEvent.click(screen.getAllByRole("radio")[0]);

        expect(screen.getByTestId("quiz-progress")).toHaveTextContent("1/2 answered");

        await waitFor(
            () => {
                expect(apiMock).toHaveBeenCalledWith(
                    "/v1/quizzes/quiz-1/attempts/attempt-1/answers/q-required",
                    expect.objectContaining({ method: "PUT", body: { option_ids: ["opt-correct"] } }),
                );
            },
            { timeout: 3000 },
        );

        await waitFor(() => expect(screen.getByTestId("quiz-save-status")).toHaveTextContent("Saved"));
    });

    it("confirms before submitting when the preference is on, then submits", async () => {
        mockApi({ learning: { confirm_before_quiz_submit: true, show_quiz_explanations: true } });
        renderPage();

        await screen.findByTestId("quiz-question-0");
        // Only the required question is answered — optional gaps must not block submit.
        fireEvent.click(screen.getAllByRole("radio")[0]);
        fireEvent.click(screen.getByTestId("quiz-submit"));

        await screen.findByTestId("quiz-confirm-submit");
        expect(apiMock).not.toHaveBeenCalledWith(
            "/v1/quizzes/quiz-1/attempts/attempt-1/submit",
            expect.objectContaining({ method: "POST" }),
        );

        fireEvent.click(screen.getByTestId("quiz-confirm-accept"));

        await waitFor(() => {
            expect(apiMock).toHaveBeenCalledWith(
                "/v1/quizzes/quiz-1/attempts/attempt-1/submit",
                expect.objectContaining({ method: "POST", body: { answers: { "q-required": ["opt-correct"] } } }),
            );
        });

        expect(await screen.findByTestId("quiz-result")).toBeInTheDocument();
    });

    it("submits straight away when confirmation is turned off", async () => {
        mockApi({ learning: { confirm_before_quiz_submit: false } });
        renderPage();

        await screen.findByTestId("quiz-question-0");
        fireEvent.click(screen.getAllByRole("radio")[0]);
        fireEvent.click(screen.getByTestId("quiz-submit"));

        await waitFor(() => {
            expect(apiMock).toHaveBeenCalledWith(
                "/v1/quizzes/quiz-1/attempts/attempt-1/submit",
                expect.objectContaining({ method: "POST" }),
            );
        });
        expect(screen.queryByTestId("quiz-confirm-submit")).toBeNull();
    });

    it("reviews answers with the explanation when explanations are enabled", async () => {
        mockApi({ attempt: submittedAttempt, learning: { show_quiz_explanations: true } });
        renderPage();

        await screen.findByTestId("quiz-result");

        expect(screen.getByTestId("quiz-review-0")).toHaveTextContent("Correct");
        expect(screen.getByTestId("quiz-review-0")).toHaveTextContent("5/5 pts");
        expect(screen.getByTestId("quiz-explanation-0")).toHaveTextContent("The dominant high bus signal.");
        expect(screen.getByTestId("quiz-review-1")).toHaveTextContent("Incorrect");
    });

    it("hides explanations when the learner disabled them", async () => {
        mockApi({ attempt: submittedAttempt, learning: { show_quiz_explanations: false } });
        renderPage();

        await screen.findByTestId("quiz-result");

        expect(screen.getByTestId("quiz-review-0")).toBeInTheDocument();
        expect(screen.queryByTestId("quiz-explanation-0")).toBeNull();
    });
});
