<?php

namespace App\Domains\Instructor\Queries;

use App\Models\Course;

/**
 * Read model for the instructor curriculum editor.
 *
 * Unlike the student curriculum query, this deliberately includes drafts so
 * instructors can manage work before publishing it.
 */
final class InstructorCurriculumQuery
{
    public static function forCourse(Course $course): Course
    {
        return $course->load([
            'sections' => fn ($query) => $query->orderBy('position'),
            'sections.lessons' => fn ($query) => $query
                ->with('media')
                ->orderBy('position'),
            'sections.quizzes' => fn ($query) => $query->orderBy('position'),
        ]);
    }
}
