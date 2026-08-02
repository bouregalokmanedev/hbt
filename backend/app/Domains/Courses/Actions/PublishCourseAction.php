<?php

namespace App\Domains\Courses\Actions;

use App\Domains\Courses\DTOs\PublishCourseData;
use App\Domains\Courses\Services\CourseService;

final readonly class PublishCourseAction
{
    public function __construct(
        private CourseService $service
    ) {}

    public function execute(
        PublishCourseData $dto
    )
    {
        return $this->service->publish($dto);
    }
}