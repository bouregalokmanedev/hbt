<?php

namespace App\Domains\Courses\DTOs;

final readonly class PublishCourseData
{
    public function __construct(
        public string $courseId,
        public int $publisherId,
    ) {}
}