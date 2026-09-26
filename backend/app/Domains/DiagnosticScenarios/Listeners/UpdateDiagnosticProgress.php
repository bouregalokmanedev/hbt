<?php

namespace App\Domains\DiagnosticScenarios\Listeners;

use App\Domains\Courses\Services\CourseProgressService;
use App\Domains\DiagnosticScenarios\Events\DiagnosticFailed;
use App\Domains\DiagnosticScenarios\Events\DiagnosticPassed;
use App\Domains\DiagnosticScenarios\Services\DiagnosticProgressService;

/**
 * Learning-domain consumer of Diagnostic-domain events.
 *
 * The Diagnostic domain reports completion via DiagnosticPassed /
 * DiagnosticFailed. This listener decides how that affects course
 * progress — the Diagnostic domain never writes course state itself.
 */
final class UpdateDiagnosticProgress
{
    public function __construct(
        private readonly DiagnosticProgressService $progress,
        private readonly CourseProgressService $courseProgress,
    ) {}

    public function handlePassed(DiagnosticPassed $event): void
    {
        $progresses = $this->progress->syncForResult($event->result);

        foreach ($progresses as $courseProgress) {
            $this->courseProgress->sync(
                $courseProgress->user,
                $courseProgress->course,
            );
        }
    }

    public function handleFailed(DiagnosticFailed $event): void
    {
        $progresses = $this->progress->syncForResult($event->result);

        foreach ($progresses as $courseProgress) {
            $this->courseProgress->sync(
                $courseProgress->user,
                $courseProgress->course,
            );
        }
    }
}
