<?php

namespace App\Domains\Bootcamps\Policies;

use App\Enums\Bootcamps\BootcampStatus;
use App\Models\Bootcamp;
use App\Models\User;

final class BootcampPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            'Instructor',
            'Admin',
            'Super Admin',
        ]);
    }

    public function view(User $user, Bootcamp $bootcamp): bool
    {
        return $this->canManage($user, $bootcamp)
            || $bootcamp->status === BootcampStatus::PUBLISHED;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            'Instructor',
            'Admin',
            'Super Admin',
        ]);
    }

    public function update(User $user, Bootcamp $bootcamp): bool
    {
        return $this->canManage($user, $bootcamp);
    }

    public function delete(User $user, Bootcamp $bootcamp): bool
    {
        return $this->canManage($user, $bootcamp);
    }

    public function publish(User $user, Bootcamp $bootcamp): bool
    {
        return $this->canManage($user, $bootcamp);
    }

    public function manageRegistrations(User $user, Bootcamp $bootcamp): bool
    {
        return $this->canManage($user, $bootcamp);
    }

    private function canManage(User $user, Bootcamp $bootcamp): bool
    {
        return $bootcamp->instructor_id === $user->id
            || $user->hasAnyRole([
                'Admin',
                'Super Admin',
            ]);
    }
}
