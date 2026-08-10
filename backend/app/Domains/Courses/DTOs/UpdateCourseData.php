<?php

namespace App\Domains\Courses\DTOs;

use App\Enums\Courses\Difficulty;
use App\Enums\Courses\Visibility;

final readonly class UpdateCourseData
{
    public function __construct(
        public string $courseId,
        public string $title,
        public string $slug,
        public string $shortDescription,
        public string $description,
        public string $language,
        public Difficulty $difficulty,
        public int $durationMinutes,
        public int $price,
        public ?int $discountPrice,
        public string $currency,
        public bool $isFree,
        public Visibility $visibility,
        public ?string $thumbnail,
        public ?string $coverImage,
        public ?string $previewVideo,
        public ?string $metaTitle,
        public ?string $metaDescription,
        public array $metadata,
    ) {}
}