<?php

namespace App\Domains\Enrollments\Listeners;

use App\Domains\Courses\Events\CourseCompleted;
use App\Domains\Enrollments\Actions\CompleteEnrollmentAction;
use App\Domains\Enrollments\Repositories\EnrollmentRepositoryInterface;

final class CompleteEnrollmentWhenCourseCompleted
{
    public function __construct(
        private readonly EnrollmentRepositoryInterface $enrollments,
        private readonly CompleteEnrollmentAction $completeEnrollment,
    ) {
    }

    public function handle(CourseCompleted $event): void
    {
        $courseProgress = $event->progress;

        $enrollment = $this->enrollments->findByUserAndCourse(
            $courseProgress->user_id,
            $courseProgress->course_id,
        );

        if ($enrollment === null) {
            return;
        }

        /*
         * Do not touch cancelled or already-completed enrollments.
         */
        if ($enrollment->status->value !== 'active') {
            return;
        }

        if ($enrollment->completed_at !== null) {
            return;
        }

        $this->completeEnrollment->execute(
            $enrollment
        );
    }
}