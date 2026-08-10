<?php

namespace App\Domains\Courses\Specifications;

use App\Models\Course;
use App\Enums\Courses\CourseStatus;

final class CourseCanBeSubmittedForReviewSpecification
{
    public function isSatisfiedBy(
        Course $course
    ): bool {

        return $course->status === CourseStatus::DRAFT;

    }
}