import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import { ApiError } from "@/lib/api/errors";

import * as assignmentsApi from "../api/assignments.api";
import type { LearnerAssignment } from "../types/assignment.types";
import { AssignmentDetailPage } from "./AssignmentDetailPage";

vi.mock("../api/assignments.api", () => ({
  getCourseAssignment: vi.fn(),
  submitAssignment: vi.fn(),
}));

function assignment(
  overrides: Partial<LearnerAssignment> = {},
): LearnerAssignment {
  return {
    id: "a1",
    course_id: "c1",
    title: "Bench test a charging system",
    slug: "bench-test-a-charging-system",
    instructions: "Record the battery voltage at idle and at 2,000 RPM.",
    max_points: 50,
    due_at: "2026-11-02T10:00:00Z",
    allow_late_submissions: true,
    is_overdue: false,
    is_late: false,
    submission: null,
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
        path: "/courses/:courseId/assignments/:assignmentId",
        element: <AssignmentDetailPage />,
      },
      {
        path: "/courses/:courseId/assignments",
        element: <div>Assignments route</div>,
      },
    ],
    { initialEntries: ["/courses/c1/assignments/a1"] },
  );

  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe("AssignmentDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assignmentsApi.getCourseAssignment).mockResolvedValue(
      assignment(),
    );
  });

  it("submits written work and an evidence link", async () => {
    vi.mocked(assignmentsApi.submitAssignment).mockResolvedValue({
      id: "s1",
      assignment_id: "a1",
      status: "submitted",
      content: "Measured 12.6 V at idle.",
      link_url: "https://example.com/evidence",
      grade: null,
      feedback: null,
      submitted_at: "2026-10-28T10:00:00Z",
      graded_at: null,
      is_late: false,
    });

    renderPage();

    expect(
      await screen.findByText("Bench test a charging system"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Record the battery voltage at idle and at 2,000 RPM."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("assignment-content"), {
      target: { value: "  Measured 12.6 V at idle.  " },
    });
    fireEvent.change(screen.getByTestId("assignment-link"), {
      target: { value: " https://example.com/evidence " },
    });
    fireEvent.click(screen.getByTestId("assignment-submit"));

    await waitFor(() => {
      expect(assignmentsApi.submitAssignment).toHaveBeenCalledWith(
        "c1",
        "a1",
        {
          content: "Measured 12.6 V at idle.",
          link_url: "https://example.com/evidence",
        },
      );
    });

    expect(
      await screen.findByText("Your submission was saved."),
    ).toBeInTheDocument();
  });

  it("locks the form and shows the grade and feedback after grading", async () => {
    vi.mocked(assignmentsApi.getCourseAssignment).mockResolvedValue(
      assignment({
        submission: {
          id: "s1",
          assignment_id: "a1",
          status: "graded",
          content: "Measured 12.6 V at idle.",
          link_url: null,
          grade: 46,
          feedback: "Accurate measurements and a clear conclusion.",
          submitted_at: "2026-10-27T10:00:00Z",
          graded_at: "2026-10-28T10:00:00Z",
          is_late: false,
        },
      }),
    );

    renderPage();

    expect(await screen.findByTestId("assignment-grade")).toHaveTextContent(
      "46",
    );
    expect(screen.getByTestId("assignment-feedback")).toHaveTextContent(
      "Accurate measurements and a clear conclusion.",
    );
    expect(screen.queryByTestId("assignment-form")).not.toBeInTheDocument();
    expect(screen.getByText("Grading complete")).toBeInTheDocument();
  });

  it("surfaces a validation message from the API", async () => {
    vi.mocked(assignmentsApi.submitAssignment).mockRejectedValue(
      new ApiError("The given data was invalid.", 422, {
        content: ["Add a written response or a link before submitting."],
      }),
    );

    renderPage();

    await screen.findByText("Bench test a charging system");
    fireEvent.click(screen.getByTestId("assignment-submit"));

    expect(
      await screen.findByText(
        "Add a written response or a link before submitting.",
      ),
    ).toBeInTheDocument();
  });
});
