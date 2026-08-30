<?php

namespace App\Domains\Courses\Policies;

use App\Models\Section;
use App\Models\User;

final class SectionPolicy
{
    public function view(
        User $user,
        Section $section
    ): bool {
        return $this->canManage($user, $section);
    }

    public function update(
        User $user,
        Section $section
    ): bool {
        return $this->canManage($user, $section);
    }

    public function delete(
        User $user,
        Section $section
    ): bool {
        return $this->canManage($user, $section);
    }

    public function reorder(
        User $user,
        Section $section
    ): bool {
        return $this->canManage($user, $section);
    }

    public function publish(
        User $user,
        Section $section
    ): bool {
        return $this->canManage($user, $section);
    }

    public function unpublish(
        User $user,
        Section $section
    ): bool {
        return $this->canManage($user, $section);
    }

    public function createLesson(
        User $user,
        Section $section
    ): bool {
        return $this->canManage($user, $section);
    }

    private function canManage(
        User $user,
        Section $section
    ): bool {
        return $user->can(
            'update',
            $section->course
        );
    }
}
