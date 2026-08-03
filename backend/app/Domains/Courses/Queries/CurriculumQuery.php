<?php

namespace App\Domains\Courses\Queries;

use App\Models\Course;

final class CurriculumQuery
{
    public function getForCourse(
        Course $course
    ): Course {
        return $course->load([
            'sections' => function ($query) {
                $query->orderBy('position');
            },
            'sections.lessons' => function ($query) {
                $query->orderBy('position');
            },
        ]);
    }
}