import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import type { InstructorAssessment } from "../types/instructor";
import { InstructorAssessmentWorkspacePage } from "./InstructorAssessmentWorkspacePage";
import * as instructorApi from "../api/instructorApi";

vi.mock("../api/instructorApi", () => ({
    getInstructorCurriculum: vi.fn(),
    getInstructorAssessments: vi.fn(),
    createInstructorAssessment: vi.fn(),
    updateInstructorAssessment: vi.fn(),
    deleteInstructorAssessment: vi.fn(),
    runInstructorAssessmentAction: vi.fn(),
    getAvailableAssessmentQuestions: vi.fn(),
    getAvailableCompetencies: vi.fn(),
    syncInstructorAssessmentQuestions: vi.fn(),
    syncInstructorAssessmentCompetencies: vi.fn(),
    getPendingAssessmentReviews: vi.fn(),
    getFlaggedAssessmentAttempts: vi.fn(),
    regradeAssessmentAttempt: vi.fn(),
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

function assessment(overrides: Partial<InstructorAssessment> = {}): InstructorAssessment {
    return {
        id: "a1",
        title: "Final diagnostic",
        description: "End-of-course assessment.",
        status: "draft",
        minimum_score: 70,
        max_attempts: 3,
        assessment_mode: "summative",
        is_required: true,
        scope: "course",
        questions: [
            {
                question_id: "qq1",
                question: "What is voltage drop?",
                points: 10,
                competency_id: null,
            },
        ],
        competencies: [
            {
                id: "comp1",
                code: "ELEC-1",
                name: "Electrical safety",
                pivot: { weight: 1 },
            },
        ],
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
                path: "/instructor/courses/:courseId/assessments",
                element: <InstructorAssessmentWorkspacePage />,
            },
            {
                path: "/instructor/courses/:courseId/curriculum",
                element: <div>Curriculum route</div>,
            },
        ],
        { initialEntries: ["/instructor/courses/c1/assessments"] },
    );

    return render(
        <I18nextProvider i18n={i18n}>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </I18nextProvider>,
    );
}

async function openAssessment() {
    const editor = await screen.findByTestId("assessment-editor-a1");
    fireEvent.click(within(editor).getByRole("button", { name: /Final diagnostic/ }));
    return editor;
}

describe("InstructorAssessmentWorkspacePage authoring safety", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(instructorApi.getInstructorCurriculum).mockResolvedValue(curriculum as never);
        vi.mocked(instructorApi.getInstructorAssessments).mockResolvedValue([assessment()]);
        vi.mocked(instructorApi.updateInstructorAssessment).mockResolvedValue(assessment());
        vi.mocked(instructorApi.runInstructorAssessmentAction).mockResolvedValue(assessment());
        vi.mocked(instructorApi.syncInstructorAssessmentQuestions).mockResolvedValue();
        vi.mocked(instructorApi.syncInstructorAssessmentCompetencies).mockResolvedValue();
        vi.mocked(instructorApi.getPendingAssessmentReviews).mockResolvedValue([]);
        vi.mocked(instructorApi.getFlaggedAssessmentAttempts).mockResolvedValue([]);
    });

    it("blocks publishing until edited assessment settings are saved", async () => {
        renderPage();
        const editor = await openAssessment();

        const publish = within(editor).getByTestId("assessment-publish-a1");
        const save = within(editor).getByTestId("assessment-save-a1");
        expect(publish).toBeEnabled();
        expect(save).toBeDisabled();
        expect(within(editor).getByText("1. What is voltage drop?")).toBeInTheDocument();

        fireEvent.change(within(editor).getByLabelText("Title"), {
            target: { value: "Final electrical diagnostic" },
        });

        expect(screen.getByTestId("assessment-unsaved-indicator")).toBeInTheDocument();
        expect(save).toBeEnabled();
        expect(publish).toBeDisabled();
        expect(within(editor).getByTestId("assessment-publish-blocked-a1")).toHaveTextContent(
            "Save your assessment settings, questions, and competencies before publishing.",
        );

        fireEvent.click(save);

        await screen.findByText("Assessment settings saved.");
        expect(instructorApi.updateInstructorAssessment).toHaveBeenCalledWith(
            "c1",
            "a1",
            expect.objectContaining({ title: "Final electrical diagnostic" }),
        );
        await waitFor(() => {
            expect(screen.queryByTestId("assessment-unsaved-indicator")).not.toBeInTheDocument();
        });
        expect(publish).toBeEnabled();
    });

    it("blocks publishing until question points are saved", async () => {
        renderPage();
        const editor = await openAssessment();

        const saveQuestions = within(editor).getByTestId("assessment-questions-save-a1");
        expect(saveQuestions).toBeDisabled();

        fireEvent.change(within(editor).getByLabelText("Points"), {
            target: { value: "20" },
        });

        expect(screen.getByTestId("assessment-unsaved-indicator")).toBeInTheDocument();
        expect(saveQuestions).toBeEnabled();
        expect(within(editor).getByTestId("assessment-publish-a1")).toBeDisabled();
        expect(within(editor).getByTestId("assessment-publish-blocked-a1")).toHaveTextContent(
            "Save your assessment settings, questions, and competencies before publishing.",
        );

        fireEvent.click(saveQuestions);

        await waitFor(() => {
            expect(instructorApi.syncInstructorAssessmentQuestions).toHaveBeenCalledWith(
                "c1",
                "a1",
                [expect.objectContaining({ quiz_question_id: "qq1", points: 20 })],
            );
        });
        await waitFor(() => {
            expect(screen.queryByTestId("assessment-unsaved-indicator")).not.toBeInTheDocument();
        });
        expect(within(editor).getByTestId("assessment-publish-a1")).toBeEnabled();
    });

    it("blocks publishing an assessment with no questions", async () => {
        vi.mocked(instructorApi.getInstructorAssessments).mockResolvedValue([
            assessment({ questions: [] }),
        ]);

        renderPage();
        const editor = await openAssessment();

        expect(within(editor).getByTestId("assessment-publish-a1")).toBeDisabled();
        expect(within(editor).getByTestId("assessment-publish-blocked-a1")).toHaveTextContent(
            "Attach at least one question before publishing.",
        );
    });
});
