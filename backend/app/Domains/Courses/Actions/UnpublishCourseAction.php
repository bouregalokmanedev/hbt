<?php

namespace App\Domains\Courses\Actions;

use App\Domains\Courses\Services\CourseService;
use App\Models\Course;

final readonly class UnpublishCourseAction
{
    public function __construct(
        private CourseService $service,
    ) {
    }

    public function execute(Course $course): Course
    {
        return $this->service->unpublish($course);
    }
}
