<?php

namespace App\Domains\Taxonomy\Events;

use App\Core\Domain\Events\DomainEvent;
use App\Models\Category;
use App\Models\Course;

final class CategoryAttachedToCourse extends DomainEvent
{
    public function __construct(
        public readonly Course $course,
        public readonly Category $category,
        public readonly int $performedBy,
    ) {}
}