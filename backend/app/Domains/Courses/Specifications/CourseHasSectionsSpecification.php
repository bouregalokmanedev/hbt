<?php

namespace App\Domains\Courses\Specifications;

use App\Models\Course;

final class CourseHasSectionsSpecification
{
    public function isSatisfiedBy(
        Course $course
    ): bool {

        return $course
            ->sections()
            ->exists();

    }
}