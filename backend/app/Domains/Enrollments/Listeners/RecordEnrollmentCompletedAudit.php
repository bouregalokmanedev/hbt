<?php

namespace App\Domains\Enrollments\Listeners;

use App\Domains\Enrollments\Events\EnrollmentCompleted;
use App\Services\Audit\AuditService;

final class RecordEnrollmentCompletedAudit
{
    public function __construct(
        private readonly AuditService $audit
    ) {}

    public function handle(EnrollmentCompleted $event): void
    {
        $this->audit->log(
            event: 'enrollment.completed',
            model: $event->enrollment,
            new: $event->enrollment->toArray(),
        );
    }
}
