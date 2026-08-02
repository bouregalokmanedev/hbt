<?php

namespace App\Domains\Taxonomy\DTOs;

use App\Core\Domain\DTOs\DataTransferObject;

final readonly class UpdateCategoryData extends DataTransferObject
{
    public function __construct(
        public string $categoryId,

        public ?string $parentId = null,

        public ?string $name = null,

        public ?string $slug = null,

        public ?string $description = null,

        public ?string $icon = null,

        public ?string $color = null,

        public ?int $sortOrder = null,

        public ?bool $isActive = null,

        public ?array $metadata = null,
    ) {}
}