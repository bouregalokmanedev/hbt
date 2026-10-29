import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import type {
  InstructorAssignment,
  InstructorAssignmentSubmission,
} from "@/features/assignments/types/assignment.types";

import * as instructorApi from "../api/instructorApi";
import { InstructorAssignmentsPage } from "./InstructorAssignmentsPage";

vi.mock("../api/instructorApi", () => ({
  getInstructorCourse: vi.fn(),
  getInstructorAssignments: vi.fn(),
  getInstructorAssignmentSubmissions: vi.fn(),
  createInstructorAssignment: vi.fn(),
  updateInstructorAssignment: vi.fn(),
  deleteInstructorAssignment: vi.fn(),
  runInstructorAssignmentAction: vi.fn(),
  gradeInstructorAssignmentSubmission: vi.fn(),
}));

function assignment(
  overrides: Partial<InstructorAssignment> = {},
): InstructorAssignment {
  return {
    id: "a1",
    course_id: "c1",
    title: "Bench test a charging system",
    slug: "bench-test-a-charging-system",
    instructions: "Record voltage at idle and at 2,000 RPM.",
    max_points: 50,
    due_at: "2026-11-02T10:00:00Z",
    allow_late_submissions: true,
    status: "draft",
    published_at: null,
    submissions_count: 0,
    graded_count: 0,
    pending_count: 0,
    created_at: "2026-10-20T10:00:00Z",
    updated_at: "2026-10-20T10:00:00Z",
    ...overrides,
  };
}

function submission(
  overrides: Partial<InstructorAssignmentSubmission> = {},
): InstructorAssignmentSubmission {
  return {
    id: "s1",
    assignment_id: "a1",
    status: "submitted",
    content: "Measured 12.6 V at idle.",
    link_url: "https://example.com/evidence",
    grade: null,
    feedback: null,
    submitted_at: "2026-10-27T10:00:00Z",
    graded_at: null,
    is_late: false,
    student: {
      id: 7,
      first_name: "Nadia",
      last_name: "Brahim",
      email: "nadia@example.com",
      avatar: null,
    },
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
        path: "/instructor/courses/:courseId/assignments",
        element: <InstructorAssignmentsPage />,
      },
      {
        path: "/instructor/courses/:courseId",
        element: <div>Course editor route</div>,
      },
      {
        path: "/instructor/courses/:courseId/curriculum",
        element: <div>Curriculum route</div>,
      },
    ],
    { initialEntries: ["/instructor/courses/c1/assignments"] },
  );

  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe("InstructorAssignmentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(instructorApi.getInstructorCourse).mockResolvedValue({
      id: "c1",
      title: "Automotive Electrical Foundations",
    } as never);
    vi.mocked(instructorApi.getInstructorAssignments).mockResolvedValue([
      assignment(),
    ]);
    vi.mocked(instructorApi.getInstructorAssignmentSubmissions).mockResolvedValue(
      [],
    );
  });

  it("blocks publishing until unsaved edits are saved", async () => {
    const updated = assignment({
      title: "Bench test a charging system safely",
      updated_at: "2026-10-28T10:00:00Z",
    });
    vi.mocked(instructorApi.updateInstructorAssignment).mockResolvedValue(
      updated,
    );
    vi.mocked(instructorApi.runInstructorAssignmentAction).mockResolvedValue({
      ...updated,
      status: "published",
      published_at: "2026-10-28T10:05:00Z",
    });

    renderPage();

    fireEvent.click(
      await screen.findByTestId("assignment-list-item-a1"),
    );

    const title = await screen.findByTestId("assignment-title");
    fireEvent.change(title, {
      target: { value: "Bench test a charging system safely" },
    });

    expect(screen.getByTestId("assignment-unsaved")).toBeInTheDocument();
    expect(
      screen.getByTestId("assignment-publish-blocked"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("assignment-publish")).toBeDisabled();

    fireEvent.click(screen.getByTestId("assignment-save"));

    await waitFor(() => {
      expect(instructorApi.updateInstructorAssignment).toHaveBeenCalledWith(
        "a1",
        expect.objectContaining({
          title: "Bench test a charging system safely",
        }),
      );
    });

    await waitFor(() => {
      expect(screen.queryByTestId("assignment-unsaved")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("assignment-publish")).toBeEnabled();
    fireEvent.click(screen.getByTestId("assignment-publish"));

    await waitFor(() => {
      expect(
        instructorApi.runInstructorAssignmentAction,
      ).toHaveBeenCalledWith("a1", "publish");
    });

    expect(
      await screen.findByText(
        "Assignment published — learners can now submit.",
      ),
    ).toBeInTheDocument();
  });

  it("grades a learner submission with feedback", async () => {
    vi.mocked(instructorApi.getInstructorAssignments).mockResolvedValue([
      assignment({
        status: "published",
        published_at: "2026-10-21T10:00:00Z",
        submissions_count: 1,
        pending_count: 1,
      }),
    ]);
    vi.mocked(instructorApi.getInstructorAssignmentSubmissions).mockResolvedValue(
      [submission()],
    );
    vi.mocked(
      instructorApi.gradeInstructorAssignmentSubmission,
    ).mockResolvedValue(
      submission({
        status: "graded",
        grade: 46,
        feedback: "Accurate measurements.",
        graded_at: "2026-10-28T10:00:00Z",
      }),
    );

    renderPage();

    fireEvent.click(
      await screen.findByTestId("assignment-list-item-a1"),
    );

    const article = await screen.findByTestId("assignment-submission-s1");
    expect(within(article).getByText("Nadia Brahim")).toBeInTheDocument();

    fireEvent.change(within(article).getByRole("spinbutton"), {
      target: { value: "46" },
    });
    fireEvent.change(within(article).getByRole("textbox"), {
      target: { value: "Accurate measurements." },
    });
    fireEvent.click(
      within(article).getByRole("button", { name: /save grade/i }),
    );

    await waitFor(() => {
      expect(
        instructorApi.gradeInstructorAssignmentSubmission,
      ).toHaveBeenCalledWith("a1", "s1", {
        grade: 46,
        feedback: "Accurate measurements.",
      });
    });

    expect(await screen.findByText("Grade saved.")).toBeInTheDocument();
  });

  it("shows the leave guard when navigating away with unsaved edits", async () => {
    renderPage();

    fireEvent.click(
      await screen.findByTestId("assignment-list-item-a1"),
    );
    fireEvent.change(await screen.findByTestId("assignment-title"), {
      target: { value: "Changed but not saved" },
    });

    fireEvent.click(screen.getByRole("link", { name: /curriculum builder/i }));

    expect(
      await screen.findByRole("alertdialog", { name: /leave without saving/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /keep editing/i }));
    expect(screen.getByTestId("assignment-title")).toHaveValue(
      "Changed but not saved",
    );
  });
});
