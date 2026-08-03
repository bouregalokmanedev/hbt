<?php

namespace App\Domains\Lessons\Policies;

use App\Models\Lesson;
use App\Models\Section;
use App\Models\User;

final class LessonPolicy
{
    public function view(
        User $user,
        Lesson $lesson
    ): bool {
        return $lesson->section
            ->course
            ->instructor_id === $user->id;
    }

    public function create(
        User $user,
        Section $section
    ): bool {
        return $section
            ->course
            ->instructor_id === $user->id;
    }

    public function update(
        User $user,
        Lesson $lesson
    ): bool {
        return $lesson->section
            ->course
            ->instructor_id === $user->id;
    }

    public function delete(
        User $user,
        Lesson $lesson
    ): bool {
        return $lesson->section
            ->course
            ->instructor_id === $user->id;
    }

    public function reorder(
        User $user,
        Lesson $lesson
    ): bool {
        return $lesson->section
            ->course
            ->instructor_id === $user->id;
    }

    public function publish(
        User $user,
        Lesson $lesson
    ): bool {
        return $lesson->section
            ->course
            ->instructor_id === $user->id;
    }
    public function unpublish(
    User $user,
    Lesson $lesson
): bool {
    return $lesson->section
        ->course
        ->instructor_id === $user->id;
}
}