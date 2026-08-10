<?php

namespace App\Domains\Courses\Specifications;

use App\Models\Course;

final class CourseHasDurationSpecification
{
    public function isSatisfiedBy(
        Course $course
    ): bool {

        return $course->duration_minutes > 0;

    }
}