<?php

namespace App\Domains\Courses\Listeners;

use App\Domains\Courses\Events\CourseDeleted;
use App\Services\Audit\AuditService;

final class RecordCourseDeletedAudit
{
    public function __construct(
        private readonly AuditService $audit
    ) {}

    public function handle(
        CourseDeleted $event
    ): void {
        $this->audit->log(
            event: 'course.deleted',
            model: $event->course,
            new: $event->course->toArray(),
        );
    }
}