<?php

namespace App\Domains\Taxonomy\DTOs;

use App\Core\Domain\DTOs\DataTransferObject;

final readonly class DetachCategoryFromCourseData
extends DataTransferObject
{
    public function __construct(
        public string $courseId,
        public string $categoryId,
        public int $performedBy,
    ) {}
}