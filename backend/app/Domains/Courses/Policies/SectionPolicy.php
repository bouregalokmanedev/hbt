<?php

namespace App\Domains\Courses\Policies;

use App\Models\Section;
use App\Models\User;

class SectionPolicy
{
    public function update(
        User $user,
        Section $section
    ): bool {
        return $user->can('update', $section->course);
    }

    public function delete(
        User $user,
        Section $section
    ): bool {
        return $user->can('delete', $section->course);
    }

    public function reorder(
        User $user,
        Section $section
    ): bool {
        return $user->can('update', $section->course);
    }

    public function publish(
        User $user,
        Section $section
    ): bool {
        return $user->can('publish', $section->course);
    }

    public function unpublish(
        User $user,
        Section $section
    ): bool {
        return $user->can('publish', $section->course);
    }
    private function manageCourse(
    User $user,
    Section $section
): bool {
    return $user->can(
        'update',
        $section->course
    );
}
public function createLesson(
    User $user,
    Section $section
): bool {
    return $user->can(
        'update',
        $section->course
    );
}
}