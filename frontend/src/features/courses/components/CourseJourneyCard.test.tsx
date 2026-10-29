import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import i18n from "@/i18n";

import type { CourseJourney } from "../types/journey.types";
import { CourseJourneyCard } from "./CourseJourneyCard";

function journey(overrides: Partial<CourseJourney> = {}): CourseJourney {
    return {
        passed: false,
        certificate_ready: false,
        certificate: null,
        requirements: [
            { key: "lessons", label: "Lessons", required: 5, completed: 2, passed: false },
            { key: "assessments", label: "Assessments", required: 1, completed: 0, passed: false },
            { key: "optional", label: "Optional", required: 0, completed: 0, passed: true },
        ],
        lessons: {
            required: 5,
            completed: 2,
            passed: false,
            next: { id: "lesson-3", title: "Read live sensor data", section_id: "section-1" },
        },
        sections: [
            { id: "section-1", title: "Fundamentals", position: 1, progress_percentage: 40, completed: false },
        ],
        assessments: [],
        quizzes: [],
        practicals: [],
        final_assessment: {
            id: "assessment-1",
            title: "Final diagnostic assessment",
            minimum_score: 70,
            passed: false,
        },
        next_step: {
            type: "lesson",
            id: "lesson-3",
            title: "Read live sensor data",
            path: "/courses/course-1/lessons/lesson-3",
        },
        ...overrides,
    };
}

function renderCard(value: CourseJourney) {
    return render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter>
                <CourseJourneyCard journey={value} courseId="course-1" />
            </MemoryRouter>
        </I18nextProvider>,
    );
}

describe("CourseJourneyCard", () => {
    it("renders the next step and only active requirements", () => {
        renderCard(journey());

        expect(screen.getByText("Continue learning")).toBeInTheDocument();
        expect(screen.getAllByText("Read live sensor data").length).toBeGreaterThan(0);

        const cta = screen.getByRole("link", { name: /start next lesson/i });
        expect(cta).toHaveAttribute("href", "/courses/course-1/lessons/lesson-3");

        expect(screen.getByText("Course requirements")).toBeInTheDocument();
        expect(screen.getByText("Lessons")).toBeInTheDocument();
        expect(screen.getByText("2/5")).toBeInTheDocument();
        expect(screen.getByText("Assessments")).toBeInTheDocument();
        expect(screen.getByText("0/1")).toBeInTheDocument();
        expect(screen.queryByText("Optional")).not.toBeInTheDocument();
    });

    it("celebrates an issued certificate and links to it", () => {
        renderCard(
            journey({
                passed: true,
                certificate_ready: true,
                certificate: {
                    id: "certificate-1",
                    certificate_number: "HBT-2026-0001",
                    issued_at: "2026-10-20T10:00:00Z",
                },
                next_step: {
                    type: "certificate",
                    id: "certificate-1",
                    title: "Your certificate is ready",
                    path: "/certificates",
                },
            }),
        );

        expect(screen.getByText("Certificate ready")).toBeInTheDocument();
        expect(screen.getByText("Your certificate is ready")).toBeInTheDocument();
        expect(screen.getByText("HBT-2026-0001")).toBeInTheDocument();

        const cta = screen.getByRole("link", { name: /view certificate/i });
        expect(cta).toHaveAttribute("href", "/certificates");
    });

    it("falls back to a completed state when there is no next step", () => {
        renderCard(
            journey({
                passed: true,
                certificate_ready: true,
                next_step: null,
            }),
        );

        expect(screen.getByText("Course completed")).toBeInTheDocument();
        expect(screen.getByText("You've completed this course")).toBeInTheDocument();

        const cta = screen.getByRole("link", { name: /review course/i });
        expect(cta).toHaveAttribute("href", "/courses/course-1");
    });
});
