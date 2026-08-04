<?php

namespace App\Domains\Courses\Actions;

use App\Domains\Courses\DTOs\PublishCourseData;
use App\Domains\Courses\Services\CourseService;
use App\Models\Course;

final readonly class PublishCourseAction
{
    public function __construct(
        private CourseService $service
    ) {}

    public function execute(
        PublishCourseData $dto
    ): Course {
        return $this->service->publish($dto);
    }
}