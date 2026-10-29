<?php

namespace App\Domains\Lessons\Services;

use App\Domains\Courses\Services\CourseAccessService;
use App\Enums\Courses\CourseStatus;
use App\Enums\EnrollmentStatus;
use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;

final class LessonAccessService
{
    public function __construct(
        private readonly CourseAccessService $courseAccess,
    ) {
    }

    public function canAccess(
        ?User $user,
        Lesson $lesson
    ): bool {
        $lesson->loadMissing('section.course');
        $section = $lesson->section;
        $course = $section->course;

    if ($lesson->status !== LessonStatus::PUBLISHED) {
        return false;
    }

    if ($section->status !== SectionStatus::PUBLISHED) {
        return false;
    }

        if (! $this->courseAccess->canBrowse($user, $course)) {
            return false;
        }

        if ($lesson->is_preview) {
            return true;
        }

        if (! $this->courseAccess->hasFullAccess($user, $course)) {
            return false;
        }

        /*
         * Sequencing is an unlock gate, not a review gate. A learner who has
         * already completed the course keeps access to every lesson — even
         * for legacy enrollments whose lesson evidence predates the current
         * pass rule.
         */
        if ($this->hasCompletedEnrollment($user, $course)) {
            return true;
        }

        return $this->previousLessonsCompleted($user, $lesson);
    }

    private function hasCompletedEnrollment(User $user, Course $course): bool
    {
        return $course->enrollments()
            ->where('user_id', $user->id)
            ->where('status', EnrollmentStatus::COMPLETED->value)
            ->exists();
    }

    /**
     * A lesson unlocks only after every earlier published lesson in the
     * course has been completed. This mirrors the learning path shown in
     * the curriculum sidebar — and no longer lives only in React.
     */
    private function previousLessonsCompleted(User $user, Lesson $lesson): bool
    {
        $sections = \App\Models\Section::query()
            ->where('course_id', $lesson->section->course_id)
            ->where('status', SectionStatus::PUBLISHED->value)
            ->orderBy('position')
            ->get(['id', 'position']);

        $orderedLessonIds = [];

        foreach ($sections as $section) {
            $ids = Lesson::query()
                ->where('section_id', $section->id)
                ->where('status', LessonStatus::PUBLISHED->value)
                ->orderBy('position')
                ->pluck('id')
                ->all();

            array_push($orderedLessonIds, ...$ids);
        }

        $index = array_search($lesson->id, $orderedLessonIds, true);

        if ($index === false || $index === 0) {
            return true;
        }

        $previousLessonIds = array_slice($orderedLessonIds, 0, $index);

        $completed = LessonProgress::query()
            ->where('user_id', $user->id)
            ->whereIn('lesson_id', $previousLessonIds)
            ->whereNotNull('completed_at')
            ->count();

        return $completed >= count($previousLessonIds);
    }
}
