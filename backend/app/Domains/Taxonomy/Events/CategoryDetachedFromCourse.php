<?php

namespace App\Domains\Taxonomy\Events;

use App\Core\Domain\Events\DomainEvent;
use App\Models\Category;
use App\Models\Course;

final class CategoryDetachedFromCourse extends DomainEvent
{
    public function __construct(
        public readonly Category $category,
        public readonly Course $course,
        public readonly ?int $performedBy = null,
    ) {}
}