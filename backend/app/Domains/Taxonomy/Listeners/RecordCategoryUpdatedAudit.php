<?php

namespace App\Domains\Taxonomy\Listeners;

use App\Domains\Taxonomy\Events\CategoryUpdated;
use App\Services\Audit\AuditService;

final class RecordCategoryUpdatedAudit
{
    public function __construct(
        private readonly AuditService $audit
    ) {}

    public function handle(
        CategoryUpdated $event
    ): void {

        $this->audit->record(
            action: 'category.updated',
            subject: $event->category,
            actorId: $event->performedBy,
            metadata: [
                'changes' => $event->changes,
            ],
        );
    }
}