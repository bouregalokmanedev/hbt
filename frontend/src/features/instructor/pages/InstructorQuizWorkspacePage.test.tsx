import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import type { InstructorQuiz } from "../types/instructor";
import { InstructorQuizWorkspacePage } from "./InstructorQuizWorkspacePage";
import * as instructorApi from "../api/instructorApi";

vi.mock("../api/instructorApi", () => ({
    getInstructorCurriculum: vi.fn(),
    getInstructorQuizzes: vi.fn(),
    createInstructorQuiz: vi.fn(),
    updateInstructorQuiz: vi.fn(),
    deleteInstructorQuiz: vi.fn(),
    runInstructorQuizAction: vi.fn(),
    createInstructorQuizQuestion: vi.fn(),
    updateInstructorQuizQuestion: vi.fn(),
    deleteInstructorQuizQuestion: vi.fn(),
    createInstructorQuizOption: vi.fn(),
    updateInstructorQuizOption: vi.fn(),
    deleteInstructorQuizOption: vi.fn(),
}));

const curriculum = {
    course: {
        id: "c1",
        title: "Electrical diagnostics",
        slug: "electrical-diagnostics",
        status: "draft",
    },
    sections: [
        {
            id: "s1",
            title: "Fundamentals",
            slug: "fundamentals",
            description: "",
            position: 1,
            status: "draft",
            quizzes: [],
            lessons: [],
        },
    ],
};

const validQuestion = {
    id: "qq1",
    quiz_id: "q1",
    question: "Which CAN voltage is dominant?",
    type: "single_choice",
    position: 1,
    points: 1,
    required: true,
    options: [
        {
            id: "o1",
            question_id: "qq1",
            option: "2.5 V",
            is_correct: false,
            position: 1,
        },
        {
            id: "o2",
            question_id: "qq1",
            option: "0 V",
            is_correct: true,
            position: 2,
        },
    ],
};

function quiz(overrides: Partial<InstructorQuiz> = {}): InstructorQuiz {
    return {
        id: "q1",
        section_id: "s1",
        title: "CAN checkpoint",
        slug: "can-checkpoint",
        description: "Check the basics.",
        position: 1,
        status: "draft",
        pass_percentage: 70,
        max_attempts: 3,
        time_limit: 10,
        questions: [validQuestion],
        ...overrides,
    };
}

function renderPage() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const router = createMemoryRouter(
        [
            {
                path: "/instructor/courses/:courseId/quizzes",
                element: <InstructorQuizWorkspacePage />,
            },
            {
                path: "/instructor/courses/:courseId/curriculum",
                element: <div>Curriculum route</div>,
            },
        ],
        { initialEntries: ["/instructor/courses/c1/quizzes"] },
    );

    return render(
        <I18nextProvider i18n={i18n}>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </I18nextProvider>,
    );
}

describe("InstructorQuizWorkspacePage authoring safety", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(instructorApi.getInstructorCurriculum).mockResolvedValue(curriculum as never);
        vi.mocked(instructorApi.getInstructorQuizzes).mockResolvedValue([quiz()]);
        vi.mocked(instructorApi.updateInstructorQuiz).mockResolvedValue();
        vi.mocked(instructorApi.runInstructorQuizAction).mockResolvedValue();
    });

    it("blocks publishing until edited quiz settings are saved", async () => {
        renderPage();

        const editor = await screen.findByTestId("quiz-editor-q1");
        const publish = within(editor).getByTestId("quiz-publish-q1");
        const save = within(editor).getByTestId("quiz-save-q1");
        expect(publish).toBeEnabled();
        expect(save).toBeDisabled();

        fireEvent.change(within(editor).getByLabelText("Quiz title"), {
            target: { value: "CAN network checkpoint" },
        });

        expect(screen.getByTestId("quiz-unsaved-indicator")).toBeInTheDocument();
        expect(save).toBeEnabled();
        expect(publish).toBeDisabled();
        expect(within(editor).getByTestId("quiz-publish-blocked-q1")).toHaveTextContent(
            "Save your quiz settings and question edits before publishing.",
        );

        fireEvent.click(save);

        await screen.findByText("Quiz settings saved.");
        expect(instructorApi.updateInstructorQuiz).toHaveBeenCalledWith(
            "q1",
            expect.objectContaining({ title: "CAN network checkpoint" }),
        );
        await waitFor(() => {
            expect(screen.queryByTestId("quiz-unsaved-indicator")).not.toBeInTheDocument();
        });
        expect(publish).toBeEnabled();
    });

    it("blocks publishing until question edits are saved", async () => {
        vi.mocked(instructorApi.updateInstructorQuizQuestion).mockResolvedValue();

        renderPage();

        const editor = await screen.findByTestId("quiz-editor-q1");
        const questionText = within(editor).getByLabelText("Add a question");
        const saveQuestion = within(editor).getByTestId("quiz-question-save-qq1");
        expect(saveQuestion).toBeDisabled();

        fireEvent.change(questionText, {
            target: { value: "Which CAN level is dominant?" },
        });

        expect(screen.getByTestId("quiz-unsaved-indicator")).toBeInTheDocument();
        expect(saveQuestion).toBeEnabled();
        expect(within(editor).getByTestId("quiz-publish-q1")).toBeDisabled();
        expect(within(editor).getByTestId("quiz-publish-blocked-q1")).toHaveTextContent(
            "Save your quiz settings and question edits before publishing.",
        );

        fireEvent.click(saveQuestion);

        await waitFor(() => {
            expect(instructorApi.updateInstructorQuizQuestion).toHaveBeenCalledWith(
                "qq1",
                expect.objectContaining({ question: "Which CAN level is dominant?" }),
            );
        });
        await waitFor(() => {
            expect(screen.queryByTestId("quiz-unsaved-indicator")).not.toBeInTheDocument();
        });
        expect(within(editor).getByTestId("quiz-publish-q1")).toBeEnabled();
    });

    it("blocks publishing a quiz with no questions", async () => {
        vi.mocked(instructorApi.getInstructorQuizzes).mockResolvedValue([
            quiz({ questions: [] }),
        ]);

        renderPage();

        const editor = await screen.findByTestId("quiz-editor-q1");
        expect(within(editor).getByTestId("quiz-publish-q1")).toBeDisabled();
        expect(within(editor).getByTestId("quiz-publish-blocked-q1")).toHaveTextContent(
            "Add at least one question before publishing.",
        );
    });

    it("blocks publishing when a question has no correct option", async () => {
        vi.mocked(instructorApi.getInstructorQuizzes).mockResolvedValue([
            quiz({
                questions: [
                    {
                        ...validQuestion,
                        options: validQuestion.options.map((option) => ({
                            ...option,
                            is_correct: false,
                        })),
                    },
                ],
            }),
        ]);

        renderPage();

        const editor = await screen.findByTestId("quiz-editor-q1");
        expect(within(editor).getByTestId("quiz-publish-q1")).toBeDisabled();
        expect(within(editor).getByTestId("quiz-publish-blocked-q1")).toHaveTextContent(
            "Every question needs at least one answer option and a correct answer.",
        );
    });
});
