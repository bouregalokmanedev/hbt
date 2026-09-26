import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import type { ReviewDueItem, SkillGap } from "../types/dashboard.types";
import { SkillGapCard } from "./SkillGapCard";

vi.mock("@/features/ai-mentor/api/mentor-api", () => ({
  mentorApi: { practiceQuiz: vi.fn() },
}));

const missed: ReviewDueItem = {
  id: "quiz-1",
  title: "Cooling system basics",
  course_title: "Thermal Systems",
  wrong_count: 3,
  action_url: "/courses/c1/quizzes/quiz-1",
};

const belowPass: SkillGap = {
  type: "quiz",
  title: "Cooling system basics",
  course_title: "Thermal Systems",
  score: 40,
  required: 70,
  action_url: "/courses/c1/quizzes/quiz-1",
};

const lessonGap: SkillGap = {
  type: "lesson",
  title: "Refrigerant charging",
  course_title: "Thermal Systems",
  score: 55,
  required: 70,
  action_url: "/courses/c1/lessons/lesson-9",
};

function renderCard(gaps: SkillGap[], reviewDue: ReviewDueItem[]) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <SkillGapCard gaps={gaps} reviewDue={reviewDue} />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("SkillGapCard (merged with Review due)", () => {
  it("shows missed quizzes and weak areas in a single list", () => {
    renderCard([lessonGap], [missed]);

    expect(screen.getByTestId("sharpen-card")).toBeInTheDocument();

    const missedRow = screen.getByTestId("sharpen-item-missed");
    expect(missedRow).toHaveTextContent("Cooling system basics");
    expect(missedRow).toHaveTextContent("3 missed");

    expect(screen.getByTestId("sharpen-item-lesson")).toHaveTextContent(
      "Refrigerant charging",
    );
  });

  it("de-duplicates the same quiz across both sources, keeping the missed count", () => {
    renderCard([belowPass], [missed]);

    expect(screen.getAllByText("Cooling system basics")).toHaveLength(1);
    expect(screen.getByTestId("sharpen-item-missed")).toBeInTheDocument();
    expect(screen.queryByTestId("sharpen-item-quiz")).not.toBeInTheDocument();
    expect(screen.getByText(/3 missed/)).toBeInTheDocument();
  });

  it("renders the positive state when there is nothing to fix", () => {
    renderCard([], []);

    expect(screen.getByTestId("skill-gap-clear")).toBeInTheDocument();
    expect(screen.queryByTestId("sharpen-card")).not.toBeInTheDocument();
  });
});
