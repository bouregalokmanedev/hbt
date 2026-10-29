<?php

namespace App\Domains\Taxonomy\Listeners;

use App\Domains\Taxonomy\Events\CategoryDetachedFromCourse;
use App\Services\Audit\AuditService;

final class RecordCategoryDetachedAudit
{
    public function __construct(
        private readonly AuditService $audit
    ) {}

    public function handle(
        CategoryDetachedFromCourse $event
    ): void {
        $this->audit->log(
            event: 'category.detached_from_course',
            model: $event->category,
            metadata: [
                'category_id' => $event->category->id,
                'course_id' => $event->course->id,
            ],
            actorId: $event->performedBy,
        );
    }
}
