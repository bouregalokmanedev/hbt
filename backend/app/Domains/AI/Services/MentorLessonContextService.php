<?php

namespace App\Domains\AI\Services;

use App\Domains\AI\DTOs\MentorLessonContext;
use App\Domains\Lessons\Services\LessonProgressService;
use App\Models\Lesson;
use App\Models\User;

final class MentorLessonContextService
{
    public function __construct(
        private readonly LessonProgressService $lessonProgressService,
    ) {
    }

    public function build(
        User $user,
        Lesson $lesson,
        ?string $courseId = null,
    ): ?MentorLessonContext {
        $section = $lesson->section;

        if ($section === null) {
            return null;
        }

        $lessonCourseId = (string) $section->course_id;

        if (
            $courseId !== null
            && $lessonCourseId !== (string) $courseId
        ) {
            return null;
        }

        $enrollment = $user->enrollments()
            ->where('course_id', $lessonCourseId)
            ->first();

        if ($enrollment === null) {
            return null;
        }

        $progress = $this->lessonProgressService->getProgress(
            $user,
            $lesson,
        );

        return new MentorLessonContext(
            lessonId: (string) $lesson->id,
            courseId: $lessonCourseId,
            sectionId: (string) $section->id,

            title: (string) $lesson->title,
            description: $lesson->description,
            content: $lesson->content,

            position: (int) $lesson->position,
            durationMinutes: (int) $lesson->duration_minutes,
            isPreview: (bool) $lesson->is_preview,
            status: $lesson->status->value,

            progressPercentage: (int) (
                $progress->progress_percentage ?? 0
            ),

            timeSpent: (int) (
                $progress->time_spent ?? 0
            ),

            completed: $progress->completed_at !== null,
        );
    }
}