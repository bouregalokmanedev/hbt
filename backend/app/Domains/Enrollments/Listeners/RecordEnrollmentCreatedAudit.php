<?php

namespace App\Domains\Enrollments\Listeners;

use App\Domains\Enrollments\Events\EnrollmentCreated;
use App\Services\Audit\AuditService;

final class RecordEnrollmentCreatedAudit
{
    public function __construct(
        private readonly AuditService $audit
    ) {}

    public function handle(EnrollmentCreated $event): void
    {
        $this->audit->log(
            event: 'enrollment.created',
            model: $event->enrollment,
            new: $event->enrollment->toArray(),
        );
    }
}
