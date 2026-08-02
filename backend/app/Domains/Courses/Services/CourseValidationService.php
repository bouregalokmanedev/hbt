<?php

namespace App\Domains\Courses\Services;

use App\Domains\Courses\Exceptions\CourseCannotBePublishedException;
use App\Models\Course;

class CourseValidationService
{
    public function validateForPublishing(
        Course $course
    ): void {

        if (blank($course->title)) {

            throw CourseCannotBePublishedException::because(
                'Course title is required.'
            );

        }

        if (blank($course->description)) {

            throw CourseCannotBePublishedException::because(
                'Course description is required.'
            );

        }

        if ($course->duration_minutes <= 0) {

            throw CourseCannotBePublishedException::because(
                'Course duration is required.'
            );

        }

        if (!$course->thumbnail) {

            throw CourseCannotBePublishedException::because(
                'Thumbnail is required.'
            );

        }

    }
}