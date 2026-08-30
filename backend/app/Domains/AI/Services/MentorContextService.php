<?php

namespace App\Domains\AI\Services;

use App\Domains\AI\DTOs\MentorContext;
use App\Domains\AI\RAG\Contracts\MentorContentRetriever;
use App\Models\CourseProgress;
use App\Models\User;
use App\Models\Lesson;

final class MentorContextService
{
   public function __construct(
    private readonly MentorStudentProfileService $studentProfileService,
    private readonly MentorAdaptationService $adaptationService,
    private readonly MentorLessonContextService $lessonContextService,
    private readonly MentorQuizContextService $quizContextService,
    private readonly MentorContentRetriever $contentRetriever,
) {
}

   public function build(
    User $user,
    ?string $courseId = null,
    ?string $lessonId = null,
    ?string $query = null,
): MentorContext {
    $course = null;
    $retrievedChunks = [];

    if ($courseId !== null) {
        $enrollment = $user->enrollments()
            ->with('course')
            ->where('course_id', $courseId)
            ->first();

        $course = $enrollment?->course;

        // A student with course progress already has course-specific
        // learning context, even if an enrollment record is not present.
        if ($course === null) {
            $course = CourseProgress::query()
                ->where('user_id', $user->id)
                ->where('course_id', $courseId)
                ->with('course')
                ->first()?->course;
        }
    }

    $studentProfile = $this->studentProfileService->build(
    $user,
    $courseId,
);

$adaptation = $this->adaptationService->build(
    $studentProfile,
);

$lessonContext = null;

if ($lessonId !== null && $course !== null) {
    $lesson = Lesson::query()
        ->with('section')
        ->whereHas(
            'section',
            fn ($sectionQuery) => $sectionQuery->where('course_id', $course->id),
        )
        ->find($lessonId);

    if ($lesson !== null) {
        $lessonContext = $this->lessonContextService->build(
            $user,
            $lesson,
            $courseId,
        );
    }
}

if (
    $query !== null
    && trim($query) !== ''
    && $course !== null
) {
    $retrievedChunks = $this->contentRetriever->retrieve(
        query: $query,
        courseId: (string) $course->id,
        lessonId: $lessonId,
        limit: 5,
    );
}

$quizContext = $this->quizContextService->build(
    $user,
    $courseId,
);

    return new MentorContext(
    userId: (string) $user->id,
    courseId: $course?->id,
    lessonId: $lessonId,

    course: $course
        ? [
            'id' => $course->id,
            'title' => $course->title,
        ]
        : [],

    progress: [],

    assessments: [],

    quizzes: $quizContext,

    diagnosticScenarios: [],
    
    memories: [],

    retrievedChunks: $retrievedChunks,
    
    studentProfile: $studentProfile,

    adaptation: $adaptation,

    lessonContext: $lessonContext,

);
}

}
