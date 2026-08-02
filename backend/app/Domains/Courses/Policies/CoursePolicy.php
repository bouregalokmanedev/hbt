<?php

namespace App\Domains\Courses\Policies;

use App\Models\Course;
use App\Models\User;

class CoursePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Course $course): bool
    {
        return true;
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
        return $user->id === $course->instructor_id
            || $user->hasRole('Admin')
            || $user->hasRole('Super Admin');
    }

    public function delete(User $user, Course $course): bool
    {
        return $this->update($user, $course);
    }

    public function publish(
    User $user,
    Course $course
): bool {

    return $user->id === $course->instructor_id
        || $user->hasAnyRole([
            'Admin',
            'Super Admin',
        ]);

}
}