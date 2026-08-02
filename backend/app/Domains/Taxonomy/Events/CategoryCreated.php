<?php

namespace App\Domains\Taxonomy\Events;

use App\Core\Domain\Events\DomainEvent;
use App\Models\Category;

final class CategoryCreated extends DomainEvent
{
    public function __construct(
        public readonly Category $category,
        public readonly ?int $performedBy = null,
    ) {}
}