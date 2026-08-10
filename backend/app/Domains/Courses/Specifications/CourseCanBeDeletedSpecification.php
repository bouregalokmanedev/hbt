<?php

namespace App\Domains\Courses\Specifications;

use App\Models\Course;

final class CourseCanBeDeletedSpecification
{
    public function isSatisfiedBy(
        Course $course
    ): bool {

        return true;

    }
}