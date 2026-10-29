import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";

import * as assignmentsApi from "../api/assignments.api";
import type { LearnerAssignment } from "../types/assignment.types";
import { CourseAssignmentsPanel } from "./CourseAssignmentsPanel";

vi.mock("../api/assignments.api", () => ({
  getCourseAssignments: vi.fn(),
}));

function assignment(
  overrides: Partial<LearnerAssignment> = {},
): LearnerAssignment {
  return {
    id: "a1",
    course_id: "c1",
    title: "Bench test a charging system",
    slug: "bench-test-a-charging-system",
    instructions: "Record voltage at idle and at 2,000 RPM.",
    max_points: 50,
    due_at: null,
    allow_late_submissions: true,
    is_overdue: false,
    is_late: false,
    submission: null,
    ...overrides,
  };
}

function renderPanel(enabled: boolean) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/courses/c1"]}>
          <CourseAssignmentsPanel courseId="c1" enabled={enabled} />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe("CourseAssignmentsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assignmentsApi.getCourseAssignments).mockResolvedValue([
      assignment(),
    ]);
  });

  it("lists published homework with a link to the full assignment", async () => {
    renderPanel(true);

    expect(
      await screen.findByText("Bench test a charging system"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("course-assignments-panel")).toBeInTheDocument();
    expect(screen.getByText("View all")).toHaveAttribute(
      "href",
      "/courses/c1/assignments",
    );
    expect(assignmentsApi.getCourseAssignments).toHaveBeenCalledWith("c1");
  });

  it("shows a locked state without querying the API for guests", async () => {
    renderPanel(false);

    expect(
      screen.getByText("Homework unlocks when you join this course."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Bench test a charging system")).not.toBeInTheDocument();
    expect(assignmentsApi.getCourseAssignments).not.toHaveBeenCalled();
  });
});
