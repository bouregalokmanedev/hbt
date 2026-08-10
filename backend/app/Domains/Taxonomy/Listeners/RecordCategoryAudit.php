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

        $this->audit->log(
    event: 'category.created',
    model: $event->category,
    metadata: [
        'category_id' => $event->category->id,
    ],
);
    }
}