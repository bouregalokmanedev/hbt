<?php

namespace App\Domains\Courses\Listeners;

use App\Domains\Courses\Services\CourseProgressService;
use App\Domains\DiagnosticScenarios\Events\DiagnosticPassed;

/**
 * Practical assessments are part of course pass; re-evaluate the course
 * when one is cleared.
 */
final class SyncCourseProgressAfterPractical
{
    public function __construct(
        private readonly CourseProgressService $courseProgress,
    ) {
    }

    public function handle(DiagnosticPassed $event): void
    {
        $result = $event->result->loadMissing('scenario.course', 'user');

        if (! $result->passed || $result->scenario?->course === null) {
            return;
        }

        $this->courseProgress->sync(
            $result->user,
            $result->scenario->course,
        );
    }
}
