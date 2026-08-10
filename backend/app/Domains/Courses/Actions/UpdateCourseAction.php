<?php

namespace App\Domains\Courses\Actions;

use App\Domains\Courses\DTOs\UpdateCourseData;
use App\Domains\Courses\Services\CourseService;
use App\Models\Course;

final readonly class UpdateCourseAction
{
    public function __construct(
        private CourseService $service
    ) {}

    public function execute(
        UpdateCourseData $dto
    ): Course {
        return $this->service->update($dto);
    }
}