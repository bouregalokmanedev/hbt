<?php

namespace App\Domains\Courses\Listeners;

use App\Domains\Courses\Events\CourseSubmittedForReview;
use App\Services\Audit\AuditService;

final class RecordCourseSubmittedForReviewAudit
{
    public function __construct(
        private readonly AuditService $audit
    ) {}

    public function handle(
        CourseSubmittedForReview $event
    ): void {
        $this->audit->log(
            event: 'course.submitted_for_review',
            model: $event->course,
            new: $event->course->toArray(),
        );
    }
}