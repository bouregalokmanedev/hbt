<?php

namespace App\Domains\Lessons\Services;

use App\Enums\Courses\CourseStatus;
use App\Enums\EnrollmentStatus;
use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;

final class LessonAccessService
{
    public function canAccess(
        User $user,
        Lesson $lesson
    ): bool {
        $section = $lesson->section;
        $course = $section->course;

        /*
         * The lesson itself must be published.
         */
        if ($lesson->status !== LessonStatus::PUBLISHED) {
            return false;
        }

        /*
         * The section must be published.
         */
        if ($section->status !== SectionStatus::PUBLISHED) {
            return false;
        }

        /*
         * The course must be published.
         */
        if ($course->status !== CourseStatus::PUBLISHED) {
            return false;
        }

        /*
         * Preview lessons are accessible
         * without enrollment.
         */
        if ($lesson->is_preview) {
            return true;
        }

        /*
         * Normal lessons require an active enrollment.
         */
        return Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', EnrollmentStatus::ACTIVE)
            ->exists();
    }
}