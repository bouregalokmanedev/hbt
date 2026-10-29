import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";

import * as assignmentsApi from "../api/assignments.api";
import type { LearnerAssignment } from "../types/assignment.types";
import { HomeworkCard } from "./HomeworkCard";

vi.mock("../api/assignments.api", () => ({
  getMyAssignments: vi.fn(),
}));

function assignment(
  overrides: Partial<LearnerAssignment> = {},
): LearnerAssignment {
  return {
    id: "a1",
    course_id: "c1",
    course_title: "Electrical diagnostics",
    title: "Measure a charging system",
    slug: "measure-a-charging-system",
    instructions: "Record voltage at idle and at 2,000 RPM.",
    max_points: 50,
    due_at: "2026-11-02T10:00:00Z",
    allow_late_submissions: true,
    is_overdue: false,
    is_late: false,
    submission: null,
    ...overrides,
  };
}

function renderCard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <HomeworkCard />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe("HomeworkCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("links to the next unsubmitted assignment and shows the pending count", async () => {
    vi.mocked(assignmentsApi.getMyAssignments).mockResolvedValue([
      assignment(),
      assignment({
        id: "a2",
        title: "Already handed in",
        submission: {
          id: "s2",
          assignment_id: "a2",
          status: "submitted",
          content: "Done",
          link_url: null,
          grade: null,
          feedback: null,
          submitted_at: "2026-10-28T10:00:00Z",
          graded_at: null,
          is_late: false,
        },
      }),
    ]);

    renderCard();

    const card = await screen.findByTestId("homework-card");
    await waitFor(() => {
      expect(screen.getByText("Measure a charging system")).toBeInTheDocument();
    });

    expect(card).toHaveAttribute("href", "/courses/c1/assignments/a1");
    expect(screen.getByText("1 to do")).toBeInTheDocument();
    expect(
      screen.getByText("Next up in Electrical diagnostics"),
    ).toBeInTheDocument();
  });

  it("shows an up-to-date state when every assignment is graded", async () => {
    vi.mocked(assignmentsApi.getMyAssignments).mockResolvedValue([
      assignment({
        submission: {
          id: "s1",
          assignment_id: "a1",
          status: "graded",
          content: "Measured 12.6 V",
          link_url: null,
          grade: 46,
          feedback: "Nice work.",
          submitted_at: "2026-10-27T10:00:00Z",
          graded_at: "2026-10-28T10:00:00Z",
          is_late: false,
        },
      }),
    ]);

    renderCard();

    await waitFor(() => {
      expect(screen.getByText("Up to date")).toBeInTheDocument();
    });

    expect(screen.getByText("All caught up")).toBeInTheDocument();
    expect(screen.getByTestId("homework-card")).toHaveAttribute(
      "href",
      "/courses/c1/assignments",
    );
    expect(screen.queryByText("1 to do")).not.toBeInTheDocument();
    expect(screen.queryByText("Next up in Electrical diagnostics")).not.toBeInTheDocument();
  });

  it("falls back to the course catalog when there is no homework", async () => {
    vi.mocked(assignmentsApi.getMyAssignments).mockResolvedValue([]);

    renderCard();

    const card = await screen.findByTestId("homework-card");
    await waitFor(() => {
      expect(screen.getByText("No homework yet")).toBeInTheDocument();
    });

    expect(card).toHaveAttribute("href", "/my-courses");
    expect(screen.getByText("Browse courses")).toBeInTheDocument();
  });
});
