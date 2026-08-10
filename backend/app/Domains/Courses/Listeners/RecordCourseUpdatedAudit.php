<?php

namespace App\Domains\Courses\Listeners;

use App\Domains\Courses\Events\CourseUpdated;
use App\Services\Audit\AuditService;

final class RecordCourseUpdatedAudit
{
    public function __construct(
        private readonly AuditService $audit
    ) {}

    public function handle(
        CourseUpdated $event
    ): void {
        $this->audit->log(
            event: 'course.updated',
            model: $event->course,
            old: $event->old,
            new: $event->new,
        );
    }
}
