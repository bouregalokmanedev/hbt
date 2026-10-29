import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import type { InstructorCurriculum } from "../types/instructor";
import { InstructorCurriculumPage } from "./InstructorCurriculumPage";
import * as instructorApi from "../api/instructorApi";

vi.mock("../api/instructorApi", () => ({
    getInstructorCurriculum: vi.fn(),
    createInstructorSection: vi.fn(),
    createInstructorLesson: vi.fn(),
    updateInstructorSection: vi.fn(),
    updateInstructorLesson: vi.fn(),
    deleteInstructorSection: vi.fn(),
    deleteInstructorLesson: vi.fn(),
    runInstructorSectionAction: vi.fn(),
    runInstructorLessonAction: vi.fn(),
    uploadInstructorLessonMedia: vi.fn(),
    deleteInstructorLessonMedia: vi.fn(),
}));

const curriculum: InstructorCurriculum = {
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
            description: "Start here",
            position: 1,
            status: "draft",
            quizzes: [],
            lessons: [
                {
                    id: "l1",
                    section_id: "s1",
                    title: "Voltage drop",
                    slug: "voltage-drop",
                    description: null,
                    content: "",
                    position: 1,
                    status: "draft",
                    duration_minutes: 10,
                    is_preview: false,
                    media: [],
                },
            ],
        },
    ],
};

function renderPage() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const router = createMemoryRouter(
        [
            {
                path: "/instructor/courses/:courseId/curriculum",
                element: <InstructorCurriculumPage />,
            },
            {
                path: "/instructor/courses/:courseId",
                element: <div>Course editor route</div>,
            },
        ],
        { initialEntries: ["/instructor/courses/c1/curriculum"] },
    );

    return render(
        <I18nextProvider i18n={i18n}>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </I18nextProvider>,
    );
}

async function openLessonEditor() {
    await screen.findByText("Electrical diagnostics");
    fireEvent.click(screen.getByText("Voltage drop"));
}

describe("InstructorCurriculumPage authoring", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(instructorApi.getInstructorCurriculum).mockResolvedValue(curriculum);
        vi.mocked(instructorApi.updateInstructorLesson).mockResolvedValue();
        vi.mocked(instructorApi.createInstructorLesson).mockResolvedValue();
        vi.mocked(instructorApi.updateInstructorSection).mockResolvedValue();
        vi.mocked(instructorApi.runInstructorLessonAction).mockResolvedValue();
        vi.mocked(instructorApi.runInstructorSectionAction).mockResolvedValue();
        vi.mocked(instructorApi.deleteInstructorLesson).mockResolvedValue();
        vi.mocked(instructorApi.deleteInstructorSection).mockResolvedValue();
    });

    it("keeps lesson edits when the section is collapsed", async () => {
        renderPage();
        await openLessonEditor();

        const textarea = screen.getByTestId("lesson-content-write") as HTMLTextAreaElement;
        fireEvent.change(textarea, {
            target: { value: "<p>Measure the voltage drop.</p>" },
        });

        fireEvent.click(screen.getByRole("button", { name: /Fundamentals/ }));
        fireEvent.click(screen.getByRole("button", { name: /Fundamentals/ }));

        expect(screen.getByTestId("lesson-content-write")).toHaveValue(
            "<p>Measure the voltage drop.</p>",
        );
    });

    it("previews content, saves the lesson, and enables publishing", async () => {
        renderPage();
        await openLessonEditor();

        const publish = screen.getByTestId("lesson-publish-l1");
        expect(publish).toBeDisabled();
        expect(screen.getByText("Add lesson content before publishing.")).toBeInTheDocument();

        fireEvent.change(screen.getByTestId("lesson-content-write"), {
            target: {
                value: "<h2>Voltage drop</h2><p>Measure the circuit under load.</p>",
            },
        });

        expect(screen.getByTestId("curriculum-unsaved-indicator")).toBeInTheDocument();

        fireEvent.click(screen.getByTestId("lesson-editor-tab-preview"));
        const preview = screen.getByTestId("lesson-content-preview");
        expect(preview).toHaveTextContent("Voltage drop");
        expect(preview).toHaveTextContent("Measure the circuit under load.");

        fireEvent.click(screen.getByTestId("lesson-save-l1"));

        await screen.findByText("Lesson saved.");
        expect(instructorApi.updateInstructorLesson).toHaveBeenCalledWith(
            "l1",
            expect.objectContaining({
                title: "Voltage drop",
                content: "<h2>Voltage drop</h2><p>Measure the circuit under load.</p>",
                duration_minutes: 10,
            }),
        );
        await waitFor(() => {
            expect(screen.getByTestId("lesson-publish-l1")).toBeEnabled();
        });
        expect(screen.queryByTestId("curriculum-unsaved-indicator")).not.toBeInTheDocument();
    });

    it("saves the lesson summary and free-preview setting", async () => {
        renderPage();
        await openLessonEditor();

        const previewToggle = screen.getByTestId("lesson-preview-toggle-l1");
        expect(previewToggle).toHaveAttribute("aria-checked", "false");

        fireEvent.change(screen.getByTestId("lesson-description-l1"), {
            target: { value: "Understand voltage drop under load." },
        });
        fireEvent.click(previewToggle);

        expect(previewToggle).toHaveAttribute("aria-checked", "true");
        expect(screen.getByTestId("curriculum-unsaved-indicator")).toBeInTheDocument();

        fireEvent.click(screen.getByTestId("lesson-save-l1"));

        await screen.findByText("Lesson saved.");
        expect(instructorApi.updateInstructorLesson).toHaveBeenCalledWith(
            "l1",
            expect.objectContaining({
                description: "Understand voltage drop under load.",
                is_preview: true,
            }),
        );
        await waitFor(() => {
            expect(screen.queryByTestId("curriculum-unsaved-indicator")).not.toBeInTheDocument();
        });
    });

    it("blocks navigation while curriculum edits are unsaved", async () => {
        renderPage();
        await openLessonEditor();

        fireEvent.change(screen.getByTestId("lesson-content-write"), {
            target: { value: "<p>Unsaved guidance</p>" },
        });

        fireEvent.click(screen.getByRole("link", { name: /Course editor/ }));

        await screen.findByTestId("curriculum-leave-dialog");
        fireEvent.click(screen.getByTestId("curriculum-leave-stay"));

        await waitFor(() => {
            expect(screen.queryByTestId("curriculum-leave-dialog")).not.toBeInTheDocument();
        });
        expect(screen.getByText("Electrical diagnostics")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("link", { name: /Course editor/ }));
        await screen.findByTestId("curriculum-leave-dialog");
        fireEvent.click(screen.getByTestId("curriculum-leave-discard"));

        await screen.findByText("Course editor route");
    });
});
