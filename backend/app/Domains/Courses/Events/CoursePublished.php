<?php

namespace App\Domains\Courses\Events;

use App\Models\Course;

final class CoursePublished
{
    public function __construct(
        public readonly Course $course
    ) {}
}