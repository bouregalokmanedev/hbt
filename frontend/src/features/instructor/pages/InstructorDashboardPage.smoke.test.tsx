import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider, initReactI18next } from "react-i18next";
import i18n from "i18next";

import { InstructorDashboardPage } from "./InstructorDashboardPage";
import type { InstructorDashboard, InstructorProgression } from "../types/instructor";
import { useInstructorAttention } from "../hooks/useInstructorAttention";
import { useInstructorDashboard } from "../hooks/useInstructorDashboard";
import { useInstructorTrends } from "../hooks/useInstructorTrends";
import { useInstructorProgression } from "../hooks/useInstructorProgression";
import { useDashboardUiStore } from "../../dashboard/stores/dashboard-ui.store";

vi.mock("../hooks/useInstructorDashboard", () => ({
    useInstructorDashboard: vi.fn(),
}));

vi.mock("../hooks/useInstructorAttention", () => ({
    useInstructorAttention: vi.fn(),
}));

vi.mock("../hooks/useInstructorTrends", () => ({
    useInstructorTrends: vi.fn(),
}));

vi.mock("../hooks/useInstructorProgression", () => ({
    useInstructorProgression: vi.fn(),
}));

i18n.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    resources: {
        en: {
            translation: {
                instructor: {
                    dashboard: {
                        hero: { title: "Your teaching command center" },
                        topCourses: {
                            title: "Top courses by enrollment",
                            subtitle: "Where your learners actually are right now.",
                            manage: "All courses",
                            learners: "{{count}} learners",
                            noLearners: "No learners yet",
                        },
                        progression: {
                            title: "Teaching progression",
                            subtitle: "XP for publishing, grading and growing your audience.",
                            level: "Level {{level}}",
                            xp: "{{value}} XP",
                            toNext: "{{value}} XP to {{title}}",
                            maxed: "You have reached the top level.",
                            streak: "{{value}}-day teaching streak",
                            best: "Best: {{value}}-day run",
                            activity: "Last 7 days",
                            recent: "Recent XP",
                            empty: "Publish a lesson or grade an attempt to start earning XP.",
                            dayActive: "Active teaching day",
                            dayInactive: "No teaching that day",
                            events: {
                                coursePublished: "Course published",
                                lessonPublished: "Lesson published",
                                assessmentGraded: "Assessment graded",
                                studentEnrolled: "Student enrolled",
                                studentCompleted: "Student completed your course",
                                other: "Teaching XP",
                            },
                        },
                        attention: {
                            title: "Needs your attention",
                            subtitle: "Waiting on you across all of your courses.",
                            reviews: "Awaiting a grade",
                            flagged: "Flagged for integrity",
                            review: "Review",
                            unknownCourse: "Unassigned course",
                            questionFallback: "Untitled question",
                            studentFallback: "Unknown student",
                            assessmentFallback: "Untitled assessment",
                        },
                    },
                },
            },
        },
    },
});

function dashboard(top_courses: InstructorDashboard["top_courses"]): InstructorDashboard {
    return {
        statistics: { total: 3, draft: 1, review: 0, published: 2, archived: 0 },
        students: { total: 42, active: 30, new_this_month: 5, completed: 12, in_progress: 18 },
        progress: { average_percentage: 48, completed: 12, in_progress: 18 },
        learning: { total_time_seconds: 3600, total_time_hours: 1, average_quiz_score: 76 },
        overview: {
            total_courses: 3,
            total_students: 42,
            new_students_this_month: 5,
            average_progress: 48,
            completion_rate: 28,
            average_quiz_score: 76,
        },
        recent_activity: [],
        recent_courses: [],
        top_courses,
    };
}

/** Called last in a beforeEach so vi.clearAllMocks() cannot wipe it. */
function mockProgression(data?: InstructorProgression) {
    vi.mocked(useInstructorProgression).mockReturnValue({
        data,
        isLoading: data === undefined,
        isError: false,
    } as never);
}

function renderPage() {
    return render(
        <I18nextProvider i18n={i18n}>
            <MemoryRouter initialEntries={["/instructor"]}>
                <InstructorDashboardPage />
            </MemoryRouter>
        </I18nextProvider>,
    );
}

describe("InstructorDashboardPage · top courses", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useInstructorTrends).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as never);
        vi.mocked(useInstructorAttention).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
        } as never);
        vi.mocked(useInstructorDashboard).mockReturnValue({
            isLoading: false,
            isError: false,
            data: dashboard([
                {
                    id: "c-1",
                    title: "Engine Diagnostics",
                    slug: "engine-diagnostics",
                    status: "published",
                    difficulty: "intermediate",
                    thumbnail: null,
                    duration_minutes: 120,
                    students_count: 14,
                },
                {
                    id: "c-2",
                    title: "Wiring Fundamentals",
                    slug: "wiring-fundamentals",
                    status: "draft",
                    difficulty: "beginner",
                    thumbnail: null,
                    duration_minutes: 60,
                    students_count: 0,
                },
            ]),
            refetch: vi.fn(),
        } as never);
        mockProgression();
    });

    it("surfaces the enrollment ranking that the API already returns", () => {
        renderPage();

        expect(screen.getByText("Top courses by enrollment")).toBeInTheDocument();
        expect(screen.getByText("Engine Diagnostics")).toBeInTheDocument();
        expect(screen.getByText("Wiring Fundamentals")).toBeInTheDocument();
        expect(screen.getByText("14 learners")).toBeInTheDocument();
        expect(screen.getByText("No learners yet")).toBeInTheDocument();
    });

    it("deep-links every row to that course's analytics page", () => {
        renderPage();

        expect(screen.getByRole("link", { name: /Engine Diagnostics/ }))
            .toHaveAttribute("href", "/instructor/courses/c-1/analytics");
        expect(screen.getByRole("link", { name: /Wiring Fundamentals/ }))
            .toHaveAttribute("href", "/instructor/courses/c-2/analytics");
    });

    it("omits the section entirely when there is nothing to rank", () => {
        vi.mocked(useInstructorDashboard).mockReturnValue({
            isLoading: false,
            isError: false,
            data: dashboard([]),
            refetch: vi.fn(),
        } as never);

        renderPage();

        expect(screen.queryByText("Top courses by enrollment")).not.toBeInTheDocument();
        expect(screen.getByText("Your teaching command center")).toBeInTheDocument();
    });
});

describe("InstructorDashboardPage · attention queue", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useInstructorTrends).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as never);
        vi.mocked(useInstructorDashboard).mockReturnValue({
            isLoading: false,
            isError: false,
            data: dashboard([]),
            refetch: vi.fn(),
        } as never);
        vi.mocked(useInstructorAttention).mockReturnValue({
            isLoading: false,
            isError: false,
            data: {
                counts: { pending_reviews: 1, flagged_attempts: 1, total: 2 },
                pending_reviews: [
                    {
                        answer_id: "a-1",
                        attempt_id: "t-1",
                        question: "Explain the fault",
                        course_id: "c-1",
                        course_title: "Engine Diagnostics",
                    },
                ],
                flagged_attempts: [
                    {
                        attempt_id: "t-2",
                        student: { id: "s-1", name: "Ada Student" },
                        assessment: { id: "as-1", title: "Final check" },
                        risk_level: "high",
                        risk_score: 80,
                        issues: ["Tab switched"],
                        status: "blocked",
                        course_id: "c-2",
                        course_title: "Wiring Fundamentals",
                    },
                ],
            },
            refetch: vi.fn(),
        } as never);
        mockProgression();
    });

    it("lists cross-course work that needs a grade or a decision", () => {
        renderPage();

        expect(screen.getByText("Needs your attention")).toBeInTheDocument();
        expect(screen.getByText("Explain the fault")).toBeInTheDocument();
        expect(screen.getByText(/Ada Student/)).toBeInTheDocument();
        expect(screen.getByText("Engine Diagnostics")).toBeInTheDocument();
        expect(screen.getByText("Wiring Fundamentals")).toBeInTheDocument();
    });

    it("deep-links every row to that course's assessment workspace", () => {
        renderPage();

        expect(screen.getByRole("link", { name: /Explain the fault/ }))
            .toHaveAttribute("href", "/instructor/courses/c-1/assessments");
        expect(screen.getByRole("link", { name: /Ada Student/ }))
            .toHaveAttribute("href", "/instructor/courses/c-2/assessments");
    });

    it("stays out of the way when the queue is empty", () => {
        vi.mocked(useInstructorAttention).mockReturnValue({
            isLoading: false,
            isError: false,
            data: {
                counts: { pending_reviews: 0, flagged_attempts: 0, total: 0 },
                pending_reviews: [],
                flagged_attempts: [],
            },
            refetch: vi.fn(),
        } as never);

        renderPage();

        expect(screen.queryByText("Needs your attention")).not.toBeInTheDocument();
        expect(screen.getByText("Your teaching command center")).toBeInTheDocument();
    });

    it("never lets a failed queue take the dashboard down with it", () => {
        vi.mocked(useInstructorAttention).mockReturnValue({
            isLoading: false,
            isError: true,
            data: undefined,
            refetch: vi.fn(),
        } as never);

        renderPage();

        expect(screen.queryByText("Needs your attention")).not.toBeInTheDocument();
        expect(screen.getByText("Your teaching command center")).toBeInTheDocument();
    });
});

describe("InstructorDashboardPage · personalization", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        useDashboardUiStore.setState({ customizing: false });
        vi.mocked(useInstructorTrends).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as never);
        vi.mocked(useInstructorAttention).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
        } as never);
        vi.mocked(useInstructorDashboard).mockReturnValue({
            isLoading: false,
            isError: false,
            data: dashboard([]),
            refetch: vi.fn(),
        } as never);
        mockProgression();
    });

    it("mounts every section inside a reorderable slot", async () => {
        renderPage();

        for (const id of [
            "instructorStats",
            "simulatorLab",
            "pipelineRow",
            "instructorActivityRow",
        ]) {
            expect(await screen.findByTestId(`dashboard-section-${id}`)).toBeInTheDocument();
        }
        // Gated sections stay out until they have something to show.
        expect(screen.queryByTestId("dashboard-section-topCourses")).not.toBeInTheDocument();
        expect(screen.queryByTestId("dashboard-section-attention")).not.toBeInTheDocument();
    });

    it("hides a section and restores it from its ghost placeholder", async () => {
        renderPage();

        fireEvent.click(await screen.findByTestId("customize-enter"));
        await screen.findByTestId("customize-toolbar");

        fireEvent.click(screen.getByTestId("hide-card-simulatorLab"));
        expect(screen.queryByTestId("dashboard-section-simulatorLab")).not.toBeInTheDocument();
        expect(await screen.findByTestId("dashboard-ghost-simulatorLab")).toBeInTheDocument();

        fireEvent.click(screen.getByTestId("show-section-simulatorLab"));
        expect(screen.getByTestId("dashboard-section-simulatorLab")).toBeInTheDocument();
        expect(screen.queryByTestId("dashboard-ghost-simulatorLab")).not.toBeInTheDocument();
    });

    it("never hides the instructor stats overview", async () => {
        renderPage();

        fireEvent.click(await screen.findByTestId("customize-enter"));
        await screen.findByTestId("section-bar-instructorStats");

        expect(screen.getByTestId("lock-card-instructorStats")).toBeInTheDocument();
        expect(screen.queryByTestId("hide-card-instructorStats")).not.toBeInTheDocument();
    });

    it("persists under the instructor slot and leaves the student slot alone", async () => {
        renderPage();

        fireEvent.click(await screen.findByTestId("customize-enter"));
        fireEvent.click(await screen.findByTestId("hide-card-simulatorLab"));

        const saved = localStorage.getItem("hbt:dashboard-layout:instructor");
        expect(saved).toBeTruthy();
        expect(JSON.parse(saved as string).hidden).toContain("simulatorLab");
        expect(localStorage.getItem("hbt:dashboard-layout")).toBeNull();
    });

    it("keeps a half-width resize on the sections that offer one", async () => {
        vi.mocked(useInstructorDashboard).mockReturnValue({
            isLoading: false,
            isError: false,
            data: dashboard([
                {
                    id: "c-1",
                    title: "Engine Diagnostics",
                    slug: "engine-diagnostics",
                    status: "published",
                    difficulty: "intermediate",
                    thumbnail: null,
                    duration_minutes: 120,
                    students_count: 14,
                },
            ]),
            refetch: vi.fn(),
        } as never);

        renderPage();

        fireEvent.click(await screen.findByTestId("customize-enter"));
        const slot = await screen.findByTestId("dashboard-section-topCourses");
        expect(slot).toHaveAttribute("data-width", "full");

        fireEvent.click(screen.getByTestId("width-card-topCourses"));
        expect(screen.getByTestId("dashboard-section-topCourses")).toHaveAttribute(
            "data-width",
            "half",
        );
    });
});

function progressionPayload(overrides: Partial<InstructorProgression> = {}): InstructorProgression {
    return {
        total_xp: 250,
        level: 3,
        title: "Mentor",
        next_level_xp: 800,
        next_level_title: "Lead Instructor",
        progress_percent: 42,
        current_streak: 4,
        longest_streak: 9,
        last_activity_date: "2026-10-01",
        teaching_days: [
            { date: "2026-09-25", active: false },
            { date: "2026-09-26", active: true },
            { date: "2026-09-27", active: true },
            { date: "2026-09-28", active: false },
            { date: "2026-09-29", active: true },
            { date: "2026-09-30", active: false },
            { date: "2026-10-01", active: true },
        ],
        recent_awards: [
            {
                id: "tx-1",
                event: "course_published",
                xp: 120,
                metadata: { label: "Course published" },
                created_at: "2026-10-01T09:00:00Z",
            },
            {
                id: "tx-2",
                event: "lesson_published",
                xp: 30,
                metadata: { label: "Lesson published" },
                created_at: "2026-09-30T09:00:00Z",
            },
        ],
        ...overrides,
    };
}

describe("InstructorDashboardPage · teaching progression", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        useDashboardUiStore.setState({ customizing: false });
        vi.mocked(useInstructorTrends).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        } as never);
        vi.mocked(useInstructorAttention).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
        } as never);
        vi.mocked(useInstructorDashboard).mockReturnValue({
            isLoading: false,
            isError: false,
            data: dashboard([]),
            refetch: vi.fn(),
        } as never);
    });

    it("shows the instructor level, XP and next target", async () => {
        mockProgression(progressionPayload());

        renderPage();

        expect(await screen.findByTestId("instructor-progression")).toBeInTheDocument();
        expect(screen.getByText("Teaching progression")).toBeInTheDocument();
        expect(screen.getByText("Level 3")).toBeInTheDocument();
        expect(screen.getByText("Mentor")).toBeInTheDocument();
        expect(screen.getByText("250 XP")).toBeInTheDocument();
        expect(screen.getByText("550 XP to Lead Instructor")).toBeInTheDocument();
        expect(screen.getByText("4-day teaching streak")).toBeInTheDocument();
    });

    it("labels each award by the teaching action that earned it", async () => {
        mockProgression(progressionPayload());

        renderPage();

        await screen.findByTestId("instructor-progression");
        expect(screen.getByText("Course published")).toBeInTheDocument();
        expect(screen.getByText("Lesson published")).toBeInTheDocument();
        expect(screen.getByText("+120")).toBeInTheDocument();
        expect(screen.getByText("Recent XP")).toBeInTheDocument();
    });

    it("stays out of the way until progression has loaded", () => {
        mockProgression();

        renderPage();

        expect(screen.queryByTestId("instructor-progression")).not.toBeInTheDocument();
        expect(screen.queryByTestId("dashboard-section-progression")).not.toBeInTheDocument();
        expect(screen.getByText("Your teaching command center")).toBeInTheDocument();
    });

    it("reports the top level without a remaining target", async () => {
        mockProgression(
            progressionPayload({
                total_xp: 3200,
                level: 7,
                title: "Academy Legend",
                next_level_xp: 3200,
                next_level_title: "Maximum level",
                progress_percent: 100,
            }),
        );

        renderPage();

        await screen.findByTestId("instructor-progression");
        expect(screen.getByText("You have reached the top level.")).toBeInTheDocument();
        expect(screen.queryByText(/XP to /)).not.toBeInTheDocument();
    });
});
