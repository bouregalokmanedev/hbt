<?php

namespace App\Domains\Courses\Events;

use App\Models\CourseProgress;

final class CourseCompleted
{
    public function __construct(
        public readonly CourseProgress $progress,
    ) {}
}