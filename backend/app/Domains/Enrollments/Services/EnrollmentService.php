<?php

namespace App\Domains\Enrollments\Services;

use App\Domains\Enrollments\Exceptions\AlreadyEnrolledException;
use App\Domains\Enrollments\Exceptions\CourseNotAvailableForEnrollment;
use App\Domains\Enrollments\Exceptions\EnrollmentCannotBeCancelledException;
use App\Domains\Enrollments\Exceptions\EnrollmentCannotBeCompletedException;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Enums\EnrollmentStatus;
use App\Models\Course;
use App\Models\Enrollment;

final class EnrollmentService
{
    public function validateCourse(
        Course $course
    ): void {
        if (
            $course->status !== CourseStatus::PUBLISHED
            || $course->visibility !== Visibility::PUBLIC
        ) {
            throw new CourseNotAvailableForEnrollment();
        }
    }

    public function validateNotAlreadyEnrolled(
        ?Enrollment $enrollment
    ): void {
        if (
            $enrollment !== null
            && $enrollment->status === EnrollmentStatus::ACTIVE
        ) {
            throw new AlreadyEnrolledException();
        }
    }

    public function validateCanComplete(
        Enrollment $enrollment
    ): void {
        if (
            $enrollment->status !== EnrollmentStatus::ACTIVE
        ) {
            throw new EnrollmentCannotBeCompletedException();
        }
    }

    public function validateCanCancel(
        Enrollment $enrollment
    ): void {
        if (
            $enrollment->status !== EnrollmentStatus::ACTIVE
        ) {
            throw new EnrollmentCannotBeCancelledException();
        }
    }
}
