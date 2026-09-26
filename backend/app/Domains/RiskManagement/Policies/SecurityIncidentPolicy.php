<?php

namespace App\Domains\RiskManagement\Policies;

use App\Models\User;

class SecurityIncidentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Admin', 'Super Admin']);
    }

    public function view(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Admin', 'Super Admin']);
    }

    public function update(User $user): bool
    {
        return $this->viewAny($user);
    }
}
