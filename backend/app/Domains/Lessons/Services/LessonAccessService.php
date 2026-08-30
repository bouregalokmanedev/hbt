<?php

namespace App\Domains\Lessons\Services;

use App\Enums\Courses\CourseStatus;
use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
use App\Domains\Courses\Services\CourseAccessService;
use App\Models\Lesson;
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

        return $lesson->is_preview
            || $this->courseAccess->hasFullAccess($user, $course);
    }
}
