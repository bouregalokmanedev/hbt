<?php

namespace App\Domains\Courses\Specifications;

use App\Models\Course;
use App\Enums\Courses\CourseStatus;

final class CourseCanBeRestoredSpecification
{
    public function isSatisfiedBy(
        Course $course
    ): bool {

        return $course->status === CourseStatus::ARCHIVED;

    }
}