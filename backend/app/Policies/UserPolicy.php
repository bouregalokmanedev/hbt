<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class UserPolicy
{
    public function viewAny(User $authUser): bool
    {
        return $authUser->hasAnyRole([
            UserRole::ADMIN->value,
            UserRole::SUPER_ADMIN->value,
        ]);
    }

    public function view(User $authUser, User $user): bool
    {
        return $this->viewAny($authUser);
    }

    public function create(User $authUser): bool
    {
        return $this->viewAny($authUser);
    }

    public function update(User $authUser, User $user): bool
    {
        if ($user->hasRole(UserRole::SUPER_ADMIN->value)
            && ! $authUser->hasRole(UserRole::SUPER_ADMIN->value)) {
            return false;
        }

        return $this->viewAny($authUser);
    }

    public function delete(User $authUser, User $user): bool
    {
        if ($authUser->id === $user->id) {
            return false;
        }

        if ($user->hasRole(UserRole::SUPER_ADMIN->value)
            && ! $authUser->hasRole(UserRole::SUPER_ADMIN->value)) {
            return false;
        }

        return $this->viewAny($authUser);
    }

    public function restore(User $authUser): bool
    {
        return $this->viewAny($authUser);
    }

    public function suspend(User $authUser, User $user): bool
    {
        return $this->delete($authUser, $user);
    }

    public function assignRole(User $authUser, User $user): bool
    {
        return $this->update($authUser, $user);
    }

    public function changePassword(User $authUser, User $user): bool
    {
        return $this->update($authUser, $user);
    }
}