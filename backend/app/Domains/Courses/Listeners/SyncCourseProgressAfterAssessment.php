<?php

namespace App\Domains\Courses\Listeners;

use App\Domains\Assessments\Events\AssessmentPassed;
use App\Domains\Courses\Services\CourseProgressService;

/**
 * Re-evaluate course pass after a high-stakes assessment is passed.
 *
 * Lesson completion alone can no longer complete a course, so the final
 * assessment must be able to trigger the same progress/enrollment sync.
 */
final class SyncCourseProgressAfterAssessment
{
    public function __construct(
        private readonly CourseProgressService $courseProgress,
    ) {
    }

    public function handle(AssessmentPassed $event): void
    {
        $result = $event->result->loadMissing('assessment.course', 'user');

        if (! $result->passed || $result->assessment->course === null) {
            return;
        }

        $this->courseProgress->sync(
            $result->user,
            $result->assessment->course,
        );
    }
}
