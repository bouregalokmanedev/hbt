<?php

namespace App\Domains\Courses\Actions;

use App\Domains\Courses\DTOs\CreateCourseData;
use App\Domains\Courses\Services\CourseService;
use App\Models\Course;

final readonly class CreateCourseAction
{
    public function __construct(
        private CourseService $service,
    ) {}

    public function execute(
        CreateCourseData $dto
    ): Course {

        return $this->service
            ->create($dto);

    }
}