
import {
    CheckCircle2,
    ClipboardCheck,
    PlayCircle,
    XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import type {
    CourseSection,
    CourseLesson,
} from "@/features/courses/types/course.types";

import {
    LessonCurriculumItem,
} from "./LessonCurriculumItem";

interface LessonCurriculumSectionProps {
    courseId: string;
    section: CourseSection;
    currentLessonId: string;
    lockedLessonIds: Set<string>;
    onLessonSelect: (
        lesson: CourseLesson,
    ) => void;
}

export function LessonCurriculumSection({
    courseId,
    section,
    currentLessonId,
    lockedLessonIds,
    onLessonSelect,
}: LessonCurriculumSectionProps) {
    const navigate = useNavigate();
    const totalLessons =
        section.lessons.length;

    const completedLessons =
        section.lessons.filter(
            (lesson) =>
                lesson.progress?.is_completed === true ||
                lesson.progress?.completed_at != null,
        ).length;

    const sectionCompleted =
        totalLessons > 0 &&
        completedLessons === totalLessons;

    const progress =
        totalLessons > 0
            ? Math.round(
                  section.lessons.reduce(
                      (total, lesson) =>
                          total +
                          (lesson.progress?.is_completed ||
                          lesson.progress?.completed_at
                              ? 100
                              : lesson.progress?.progress_percentage ?? 0),
                      0,
                  ) / totalLessons,
              )
            : 0;

    return (
        <section>
            {/* Section header */}
            <div className="border-b border-border/60 bg-muted/20 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#F47822]">
                                Section {section.position}
                            </span>

                            {sectionCompleted && (
                                <CheckCircle2
                                    className="h-3.5 w-3.5 text-emerald-600"
                                    strokeWidth={2.2}
                                />
                            )}
                        </div>

                        <h3 className="mt-0.5 truncate text-[13px] font-semibold text-foreground">
                            {section.title}
                        </h3>
                    </div>

                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                        {completedLessons}/{totalLessons}
                    </span>
                </div>

                <p className="mt-1 text-[10px] font-medium text-muted-foreground">{sectionCompleted ? "Section completed" : progress > 0 ? "In progress" : "Not started"} · {progress}%</p>
            </div>

            {/* Lessons */}
            <div>
                {section.lessons.map(
                    (lesson) => (
                        <LessonCurriculumItem
                            key={lesson.id}
                            lesson={lesson}
                            active={
                                lesson.id ===
                                currentLessonId
                            }
                            locked={lockedLessonIds.has(lesson.id)}
                            onClick={() =>
                                onLessonSelect(
                                    lesson,
                                )
                            }
                        />
                    ),
                )}
                {(section.quizzes ?? []).map((quiz) => {
                    const passed = quiz.passed === true; const failed = quiz.attempt_status === "submitted" && !passed;
                    const label = passed ? "Passed" : failed ? "Failed" : "Not started";
                    return <button key={quiz.id} type="button" onClick={() => navigate(`/courses/${courseId}/quizzes/${quiz.id}`)} className="group flex w-full items-center gap-3 border-t border-dashed border-[#F47822]/20 bg-[#F47822]/[.035] px-3 py-3 text-left transition hover:bg-[#F47822]/[.08]"><span className={`flex h-7 w-7 items-center justify-center rounded-lg ${passed ? "bg-emerald-500/10 text-emerald-600" : failed ? "bg-red-500/10 text-red-600" : "bg-[#F47822]/10 text-[#F47822]"}`}>{passed ? <CheckCircle2 className="h-4 w-4"/> : failed ? <XCircle className="h-4 w-4"/> : <ClipboardCheck className="h-4 w-4"/>}</span><span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-semibold text-foreground">{quiz.title}</span><span className={`text-[10px] font-medium ${passed ? "text-emerald-600" : failed ? "text-red-600" : "text-[#F47822]"}`}>Quiz checkpoint · {label}</span></span><PlayCircle className="h-4 w-4 text-[#F47822] opacity-0 transition group-hover:opacity-100"/></button>;
                })}
            </div>
            
        </section>
    );
}
