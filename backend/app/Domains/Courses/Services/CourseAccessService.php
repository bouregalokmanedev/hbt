<?php

namespace App\Domains\Courses\Services;

use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Enums\EnrollmentStatus;
use App\Models\Course;
use App\Models\User;

/**
 * Learner-facing access rules for published course content.
 *
 * Public courses may expose their curriculum outline and explicitly marked
 * preview lessons. Full course content always requires an active or completed
 * enrollment, regardless of whether the course is free or paid.
 */
final class CourseAccessService
{
    public function canBrowse(?User $user, Course $course): bool
    {
        if ($course->status !== CourseStatus::PUBLISHED) {
            return false;
        }

        if ($course->visibility === Visibility::PUBLIC) {
            return true;
        }

        return $this->hasEnrollment($user, $course);
    }

    public function hasFullAccess(?User $user, Course $course): bool
    {
        return $this->hasEnrollment($user, $course);
    }

    private function hasEnrollment(?User $user, Course $course): bool
    {
        if (! $user) {
            return false;
        }

        return $course->enrollments()
            ->where('user_id', $user->id)
            ->whereIn('status', [
                EnrollmentStatus::ACTIVE,
                EnrollmentStatus::COMPLETED,
            ])
            ->exists();
    }
}
