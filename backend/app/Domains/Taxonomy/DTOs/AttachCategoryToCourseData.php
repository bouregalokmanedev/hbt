<?php

namespace App\Domains\Taxonomy\DTOs;

use App\Core\Domain\DTOs\DataTransferObject;

final readonly class AttachCategoryToCourseData
extends DataTransferObject
{
    public function __construct(
        public string $courseId,
        public string $categoryId,
        public int $performedBy,
    ) {}
}