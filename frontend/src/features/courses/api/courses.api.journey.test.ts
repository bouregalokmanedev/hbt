import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api/client";

import { getCourseJourney } from "./courses.api";
import type { CourseJourney } from "../types/journey.types";

vi.mock("@/lib/api/client", () => ({
  api: vi.fn(),
}));

const journey: CourseJourney = {
  passed: false,
  certificate_ready: false,
  certificate: null,
  requirements: [
    {
      key: "lessons",
      label: "Lessons",
      required: 3,
      completed: 1,
      passed: false,
    },
  ],
  lessons: {
    required: 3,
    completed: 1,
    passed: false,
    next: { id: "lesson-2", title: "Voltage drop", section_id: "section-1" },
  },
  sections: [],
  assessments: [],
  quizzes: [],
  practicals: [],
  final_assessment: null,
  next_step: {
    type: "lesson",
    id: "lesson-2",
    title: "Voltage drop",
    path: "/courses/c1/lessons/lesson-2",
  },
};

describe("getCourseJourney", () => {
  beforeEach(() => {
    vi.mocked(api).mockReset();
  });

  it("unwraps the pass payload returned by the journey endpoint", async () => {
    vi.mocked(api).mockResolvedValue({
      course: { id: "c1" },
      enrollment: { id: "e1" },
      progress: { progress_percentage: 12 },
      pass: journey,
    });

    await expect(getCourseJourney("c1")).resolves.toBe(journey);
    expect(api).toHaveBeenCalledWith("/v1/courses/c1/journey");
  });
});
