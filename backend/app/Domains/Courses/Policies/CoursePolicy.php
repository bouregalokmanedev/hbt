<?php

namespace App\Domains\Courses\Policies;

use App\Models\Course;
use App\Models\User;

final class CoursePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            'Instructor',
            'Student',
            'Admin',
            'Super Admin',
        ]);
    }

    public function view(User $user, Course $course): bool
    {
        return $this->canManage($user, $course);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            'Instructor',
            'Admin',
            'Super Admin',
        ]);
    }

    public function update(User $user, Course $course): bool
    {
        return $this->canManage($user, $course);
    }

    public function delete(User $user, Course $course): bool
    {
        return $this->canManage($user, $course);
    }

    public function publish(User $user, Course $course): bool
    {
        return $this->canManage($user, $course);
    }

    public function submitForReview(
        User $user,
        Course $course
    ): bool {
        return $this->canManage($user, $course);
    }

    public function archive(
        User $user,
        Course $course
    ): bool {
        return $this->canManage($user, $course);
    }

    public function restore(
        User $user,
        Course $course
    ): bool {
        return $this->canManage($user, $course);
    }

    public function unpublish(
        User $user,
        Course $course
    ): bool {
        return $this->canManage($user, $course);
    }

    private function canManage(
        User $user,
        Course $course
    ): bool {
        return $course->instructor_id === $user->id
            || $user->hasAnyRole([
                'Admin',
                'Super Admin',
            ]);
    }
}
