<?php

namespace App\Domains\Courses\Events;

use App\Models\Course;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class CourseRestored
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly Course $course,
    ) {
    }
}