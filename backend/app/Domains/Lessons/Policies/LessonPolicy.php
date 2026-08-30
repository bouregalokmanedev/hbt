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
        return $this->canManage($user, $lesson);
    }

    public function create(
        User $user,
        Section $section
    ): bool {
        return $user->can('update', $section->course);
    }

    public function update(
        User $user,
        Lesson $lesson
    ): bool {
        return $this->canManage($user, $lesson);
    }

    public function delete(
        User $user,
        Lesson $lesson
    ): bool {
        return $this->canManage($user, $lesson);
    }

    public function reorder(
        User $user,
        Lesson $lesson
    ): bool {
        return $this->canManage($user, $lesson);
    }

    public function publish(
        User $user,
        Lesson $lesson
    ): bool {
        return $this->canManage($user, $lesson);
    }

    public function unpublish(
        User $user,
        Lesson $lesson
    ): bool {
        return $this->canManage($user, $lesson);
    }

    private function canManage(
        User $user,
        Lesson $lesson
    ): bool {
        return $user->can(
            'update',
            $lesson->section->course
        );
    }
}
