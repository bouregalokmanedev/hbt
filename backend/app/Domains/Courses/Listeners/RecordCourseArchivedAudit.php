<?php

namespace App\Domains\Courses\Listeners;

use App\Domains\Courses\Events\CourseArchived;
use App\Services\Audit\AuditService;

final class RecordCourseArchivedAudit
{
    public function __construct(
        private readonly AuditService $audit
    ) {}

    public function handle(
        CourseArchived $event
    ): void {
        $this->audit->log(
            event: 'course.archived',
            model: $event->course,
            new: $event->course->toArray(),
        );
    }
}