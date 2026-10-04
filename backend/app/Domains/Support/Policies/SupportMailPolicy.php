<?php

namespace App\Domains\Support\Policies;

use App\Domains\Support\Models\SupportMail;
use App\Enums\UserRole;
use App\Models\User;

final class SupportMailPolicy
{
    private function isStaff(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::SUPPORT->value,
            UserRole::ADMIN->value,
            UserRole::SUPER_ADMIN->value,
        ]);
    }

    public function viewAny(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function view(User $user, SupportMail $mail): bool
    {
        return $this->isStaff($user);
    }

    public function compose(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function manage(User $user): bool
    {
        return $this->isStaff($user);
    }
}
