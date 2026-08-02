<?php

namespace App\Domains\Taxonomy\DTOs;

use App\Core\Domain\DTOs\DataTransferObject;

final readonly class CreateCategoryData extends DataTransferObject
{
    public function __construct(
        public ?string $parentId,

        public string $name,

        public string $slug,

        public ?string $description,

        public ?string $icon,

        public ?string $color,

        public int $sortOrder,

        public bool $isActive,

        public array $metadata,
    ) {}
}