<?php

namespace App\Domains\Courses\Specifications;

use App\Enums\Courses\CourseStatus;
use App\Models\Course;

final class CourseCanBePublishedSpecification
{
    public function isSatisfiedBy(
        Course $course
    ): bool {

        return $course->status !== CourseStatus::ARCHIVED
            && $course->status !== CourseStatus::PUBLISHED;

    }
}