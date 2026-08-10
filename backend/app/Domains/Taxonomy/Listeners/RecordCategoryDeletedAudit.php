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

        $this->audit->log(
    event: 'category.deleted',
    model: $event->category,
    metadata: [
        'category_id' => $event->category->id,
    ],
);
    }
}