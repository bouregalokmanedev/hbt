<?php

namespace App\Domains\Enrollments\Listeners;

use App\Domains\Enrollments\Events\EnrollmentCancelled;
use App\Services\Audit\AuditService;

final class RecordEnrollmentCancelledAudit
{
    public function __construct(
        private readonly AuditService $audit
    ) {}

    public function handle(EnrollmentCancelled $event): void
    {
        $this->audit->log(
            event: 'enrollment.cancelled',
            model: $event->enrollment,
            new: $event->enrollment->toArray(),
        );
    }
}
