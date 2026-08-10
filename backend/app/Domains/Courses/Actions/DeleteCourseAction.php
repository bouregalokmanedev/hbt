<?php

namespace App\Domains\Courses\Actions;

use App\Domains\Courses\Services\CourseService;
use App\Models\Course;

final readonly class DeleteCourseAction
{
    public function __construct(
        private CourseService $service,
    ) {}

    public function execute(
        Course $course
    ): void {
        $this->service->delete($course);
    }
}