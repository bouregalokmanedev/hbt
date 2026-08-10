<?php

namespace App\Domains\Courses\Listeners;

use App\Domains\Courses\Events\CoursePublished;
use App\Services\Audit\AuditService;

final class RecordCoursePublishedAudit
{
    public function __construct(
        private readonly AuditService $audit
    ) {}

    public function handle(
        CoursePublished $event
    ): void {
        $this->audit->log(
            event: 'course.published',
            model: $event->course,
            new: $event->course->toArray(),
        );
    }
}