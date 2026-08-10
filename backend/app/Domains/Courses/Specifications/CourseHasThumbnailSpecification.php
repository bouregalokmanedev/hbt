<?php

namespace App\Domains\Courses\Specifications;

use App\Models\Course;

final class CourseHasThumbnailSpecification
{
    public function isSatisfiedBy(
        Course $course
    ): bool {

        return filled(
            $course->thumbnail
        );

    }
}