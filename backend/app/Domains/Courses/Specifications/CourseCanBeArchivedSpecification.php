<?php

namespace App\Domains\Courses\Specifications;

use App\Enums\Courses\CourseStatus;
use App\Models\Course;

final class CourseCanBeArchivedSpecification
{
    public function isSatisfiedBy(
        Course $course
    ): bool {
        return $course->status === CourseStatus::PUBLISHED;
    }
}
