<?php

namespace App\Domains\Courses\Listeners;

use App\Domains\Courses\Events\CourseRestored;
use App\Services\Audit\AuditService;

final class RecordCourseRestoredAudit
{
    public function __construct(
        private readonly AuditService $audit
    ) {}

    public function handle(
        CourseRestored $event
    ): void {
        $this->audit->log(
            event: 'course.restored',
            model: $event->course,
            new: $event->course->toArray(),
        );
    }
}