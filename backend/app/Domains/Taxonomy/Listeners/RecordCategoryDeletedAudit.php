<?php

namespace App\Domains\Taxonomy\Listeners;

use App\Domains\Taxonomy\Events\CategoryDeleted;
use App\Services\Audit\AuditService;

final class RecordCategoryDeletedAudit
{
    public function __construct(
        private readonly AuditService $audit
    ) {}

    public function handle(
        CategoryDeleted $event
    ): void {

        $this->audit->record(
            action: 'category.deleted',
            subject: $event->category,
            actorId: $event->performedBy,
            metadata: [
                'category_id' => $event->category->id,
            ],
        );
    }
}