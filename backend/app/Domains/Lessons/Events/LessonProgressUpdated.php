<?php

namespace App\Domains\Lessons\Events;

use App\Models\LessonProgress;

final class LessonProgressUpdated
{
    public function __construct(
        public readonly LessonProgress $progress
    ) {
    }
}