<?php

namespace App\Domains\Courses\Specifications;

use App\Models\Course;
use App\Enums\LessonStatus;

final class CourseHasPublishedLessonsSpecification
{
    public function isSatisfiedBy(
        Course $course
    ): bool {

        return $course
            ->sections()
            ->whereHas(
                'lessons',
                fn ($query) => $query->where(
                    'status',
                    LessonStatus::PUBLISHED
                )
            )
            ->exists();

    }
}