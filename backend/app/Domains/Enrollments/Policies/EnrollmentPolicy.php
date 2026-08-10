<?php

namespace App\Domains\Enrollments\Policies;

use App\Models\Enrollment;
use App\Models\User;

final class EnrollmentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(
        User $user,
        Enrollment $enrollment
    ): bool {
        return $user->id === $enrollment->user_id
            || $user->hasAnyRole([
                'Admin',
                'Super Admin',
            ]);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function cancel(
        User $user,
        Enrollment $enrollment
    ): bool {
        return $user->id === $enrollment->user_id
            || $user->hasAnyRole([
                'Admin',
                'Super Admin',
            ]);
    }

    public function complete(
        User $user,
        Enrollment $enrollment
    ): bool {
        return $user->hasAnyRole([
            'Admin',
            'Super Admin',
        ]);
    }
    public function delete(User $user, Enrollment $enrollment): bool
    {
        return $user->id === $enrollment->user_id;
    }
}
