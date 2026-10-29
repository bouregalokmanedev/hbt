import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import type { Course } from "@/features/courses/types/course.types";

import {
  createInstructorCourse,
  deleteInstructorCourse,
  getInstructorAssessments,
  getInstructorCourse,
  getInstructorCurriculum,
  getInstructorQuizzes,
  runInstructorCourseAction,
  updateInstructorCourse,
} from "../api/instructorApi";
import { InstructorCourseEditorPage } from "./InstructorCourseEditorPage";

vi.mock("../api/instructorApi", () => ({
  createInstructorCourse: vi.fn(),
  deleteInstructorCourse: vi.fn(),
  getInstructorAssessments: vi.fn(),
  getInstructorCourse: vi.fn(),
  getInstructorCurriculum: vi.fn(),
  getInstructorQuizzes: vi.fn(),
  runInstructorCourseAction: vi.fn(),
  updateInstructorCourse: vi.fn(),
  uploadInstructorCourseMedia: vi.fn(),
}));

const mockedGetCourse = vi.mocked(getInstructorCourse);
const mockedGetCurriculum = vi.mocked(getInstructorCurriculum);
const mockedGetQuizzes = vi.mocked(getInstructorQuizzes);
const mockedGetAssessments = vi.mocked(getInstructorAssessments);
const mockedCreate = vi.mocked(createInstructorCourse);
const mockedUpdate = vi.mocked(updateInstructorCourse);
const mockedLifecycle = vi.mocked(runInstructorCourseAction);
const mockedDelete = vi.mocked(deleteInstructorCourse);

const baseCourse: Course = {
  id: "course-1",
  title: "Electrical fundamentals",
  slug: "electrical-fundamentals",
  short_description: "Learn the basics of electrical measurement.",
  description: "A practical introduction to electrical measurement.",
  language: "en",
  difficulty: "beginner",
  duration_minutes: 60,
  price: 0,
  discount_price: null,
  currency: "USD",
  is_free: true,
  status: "draft",
  visibility: "public",
  thumbnail: null,
  cover_image: null,
  preview_video: null,
  metadata: {},
  published_at: null,
  created_at: "2026-01-01T00:00:00.000000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

function renderEditor(path = "/instructor/courses/course-1") {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const router = createMemoryRouter(
    [
      {
        path: "/instructor/courses/:courseId",
        element: <InstructorCourseEditorPage />,
      },
      {
        path: "/instructor/courses",
        element: <div>Courses list</div>,
      },
      {
        path: "/instructor/courses/course-created",
        element: <div>Created course editor</div>,
      },
    ],
    { initialEntries: [path] },
  );

  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetCourse.mockResolvedValue({ ...baseCourse });
  mockedGetCurriculum.mockResolvedValue({ sections: [] } as never);
  mockedGetQuizzes.mockResolvedValue([]);
  mockedGetAssessments.mockResolvedValue([]);
  mockedCreate.mockResolvedValue({ ...baseCourse, id: "course-created" });
  mockedUpdate.mockImplementation(async (_courseId, payload) => ({
    ...baseCourse,
    ...payload,
    thumbnail: payload.thumbnail ?? null,
    cover_image: payload.cover_image ?? null,
    preview_video: payload.preview_video ?? null,
  }));
  mockedLifecycle.mockResolvedValue({ ...baseCourse, status: "review" });
  mockedDelete.mockResolvedValue();
});

describe("InstructorCourseEditorPage authoring safety", () => {
  it("blocks lifecycle actions while course edits are unsaved", async () => {
    renderEditor();

    const submitReview = await screen.findByTestId("course-lifecycle-submit-review");

    expect(submitReview).toBeEnabled();
    expect(screen.queryByTestId("course-lifecycle-blocked")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Course title"), {
      target: { value: "Updated course title" },
    });

    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(submitReview).toBeDisabled();
    expect(screen.getByTestId("course-lifecycle-blocked")).toHaveTextContent(
      "Save your changes before changing the publish status.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(submitReview).toBeEnabled();
    });
    expect(mockedUpdate).toHaveBeenCalledWith(
      "course-1",
      expect.objectContaining({ title: "Updated course title" }),
    );
    expect(screen.queryByTestId("course-lifecycle-blocked")).not.toBeInTheDocument();
  });

  it("warns before leaving with unsaved changes", async () => {
    renderEditor();

    await screen.findByTestId("course-lifecycle-submit-review");

    fireEvent.change(screen.getByLabelText("Course title"), {
      target: { value: "Unsaved course title" },
    });
    fireEvent.click(screen.getByRole("link", { name: "Cancel" }));

    const dialog = await screen.findByRole("alertdialog", {
      name: "Leave without saving?",
    });

    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText("Course title")).toHaveValue("Unsaved course title");
  });

  it("creates a draft without showing the leave guard", async () => {
    renderEditor("/instructor/courses/new");

    await screen.findByText("Course basics");

    fireEvent.change(screen.getByLabelText("Course title"), {
      target: { value: "New course" },
    });
    fireEvent.change(screen.getByLabelText(/Course URL slug/), {
      target: { value: "new-course" },
    });
    fireEvent.change(screen.getByLabelText("Short description"), {
      target: { value: "A short description." },
    });
    fireEvent.change(screen.getByLabelText("Full description"), {
      target: { value: "A full description." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create draft" }));

    await waitFor(() => {
      expect(screen.getByText("Created course editor")).toBeInTheDocument();
    });
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({ title: "New course" }),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("deletes the course without tripping its own leave guard", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    renderEditor();

    await screen.findByTestId("course-lifecycle-submit-review");

    fireEvent.change(screen.getByLabelText("Course title"), {
      target: { value: "Unsaved course title" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Delete course" }));

    await waitFor(() => {
      expect(screen.getByText("Courses list")).toBeInTheDocument();
    });
    expect(mockedDelete).toHaveBeenCalledWith("course-1");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    confirmSpy.mockRestore();
  });
});
