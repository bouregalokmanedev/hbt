<?php

namespace App\Domains\Taxonomy\Listeners;

use App\Domains\Taxonomy\Events\CategoryCreated;
use App\Services\Audit\AuditService;

final class RecordCategoryAudit
{
    public function __construct(
        private readonly AuditService $audit
    ) {}

    public function handle(
        CategoryCreated $event
    ): void {

        $this->audit->record(
            action: 'category.created',
            subject: $event->category,
            actorId: $event->performedBy,
            metadata: [
                'category_id' => $event->category->id,
            ],
        );
    }
}