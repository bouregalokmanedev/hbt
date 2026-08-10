<?php

namespace App\Domains\Courses\Listeners;

use App\Domains\Courses\Events\CourseCreated;
use App\Services\Audit\AuditService;

final class RecordCourseCreatedAudit
{
    public function __construct(
        private readonly AuditService $audit
    ) {}

    public function handle(CourseCreated $event): void
    {
        $this->audit->log(
            event: 'course.created',
            model: $event->course,
            new: $event->course->toArray(),
        );
    }
}