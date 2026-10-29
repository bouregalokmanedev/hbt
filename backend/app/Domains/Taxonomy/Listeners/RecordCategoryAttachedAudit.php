<?php

namespace App\Domains\Taxonomy\Listeners;

use App\Domains\Taxonomy\Events\CategoryAttachedToCourse;
use App\Services\Audit\AuditService;

final class RecordCategoryAttachedAudit
{
    public function __construct(
        private readonly AuditService $audit
    ) {}

    public function handle(
        CategoryAttachedToCourse $event
    ): void {
        $this->audit->log(
            event: 'category.attached_to_course',
            model: $event->category,
            metadata: [
                'category_id' => $event->category->id,
                'course_id' => $event->course->id,
            ],
            actorId: $event->performedBy,
        );
    }
}
