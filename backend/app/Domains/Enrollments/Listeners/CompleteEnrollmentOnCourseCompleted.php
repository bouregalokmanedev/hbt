<?php

namespace App\Domains\Enrollments\Listeners;

use App\Domains\Courses\Events\CourseCompleted;
use App\Domains\Enrollments\Actions\CompleteEnrollmentAction;
use App\Domains\Enrollments\Repositories\EnrollmentRepositoryInterface;
use App\Enums\EnrollmentStatus;

final class CompleteEnrollmentOnCourseCompleted
{
    public function __construct(
        private readonly EnrollmentRepositoryInterface $enrollments,
        private readonly CompleteEnrollmentAction $completeEnrollment,
    ) {
    }

    public function handle(
        CourseCompleted $event
    ): void {
        $progress = $event->progress;

        $enrollment = $this->enrollments->findByUserAndCourse(
            $progress->user_id,
            $progress->course_id,
        );

        /*
        |--------------------------------------------------------------------------
        | No enrollment
        |--------------------------------------------------------------------------
        |
        | Course progress should normally only exist for enrolled students,
        | but we don't want a missing enrollment to break course progress.
        |
        */
        if ($enrollment === null) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Already completed
        |--------------------------------------------------------------------------
        |
        | Keep this operation idempotent.
        |
        */
        if (
            $enrollment->status === EnrollmentStatus::COMPLETED
            || $enrollment->completed_at !== null
        ) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Only active enrollments can be completed
        |--------------------------------------------------------------------------
        */
        if (
            $enrollment->status !== EnrollmentStatus::ACTIVE
        ) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Complete enrollment
        |--------------------------------------------------------------------------
        |
        | CompleteEnrollmentAction is responsible for:
        | - validation
        | - status update
        | - completed_at
        | - EnrollmentCompleted event
        |
        */
        $this->completeEnrollment->execute(
            $enrollment
        );
    }
}