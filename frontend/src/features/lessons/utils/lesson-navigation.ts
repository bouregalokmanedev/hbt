import type { CourseCurriculum } from "@/features/courses/types/course.types";

export type NextStep =
    | { kind: "lesson"; id: string; title: string }
    | { kind: "quiz"; id: string; title: string }
    | null;

/**
 * Where should the learner go after finishing a lesson?
 *
 * - Last lesson of a section with a pending (unpassed) quiz → that quiz.
 * - Otherwise → the next lesson in flat position order.
 * - Nothing left → null (course complete).
 */
export function resolveNextStep(
    curriculum: CourseCurriculum | null,
    lessonId: string,
): NextStep {
    if (!curriculum) return null;

    const sections = curriculum.sections
        .slice()
        .sort((a, b) => a.position - b.position);

    for (const section of sections) {
        const lessons = section.lessons
            .slice()
            .sort((a, b) => a.position - b.position);
        const index = lessons.findIndex((item) => item.id === lessonId);

        if (index === -1) continue;

        const isLastInSection = index === lessons.length - 1;
        const pendingQuiz = (section.quizzes ?? []).find(
            (quiz) => quiz.passed !== true,
        );

        if (isLastInSection && pendingQuiz) {
            return { kind: "quiz", id: pendingQuiz.id, title: pendingQuiz.title };
        }

        const nextInSection = lessons[index + 1];
        if (nextInSection) {
            return { kind: "lesson", id: nextInSection.id, title: nextInSection.title };
        }

        const sectionIndex = sections.indexOf(section);
        for (let i = sectionIndex + 1; i < sections.length; i += 1) {
            const following = sections[i].lessons
                .slice()
                .sort((a, b) => a.position - b.position)[0];
            if (following) {
                return { kind: "lesson", id: following.id, title: following.title };
            }
        }

        return null;
    }

    return null;
}

export function nextStepPath(courseId: string, step: Exclude<NextStep, null>): string {
    return step.kind === "quiz"
        ? `/courses/${courseId}/quizzes/${step.id}`
        : `/courses/${courseId}/lessons/${step.id}`;
}
