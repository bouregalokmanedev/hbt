<?php

namespace App\Domains\Simulator\Policies;

use App\Models\SimulatorDataPack;
use App\Models\User;

class SimulatorDataPackPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isInstructor($user) || $user->hasRole('Admin');
    }

    public function view(User $user, SimulatorDataPack $pack): bool
    {
        if ($user->hasRole('Admin')) return true;
        if ($pack->status === 'published') return $this->isInstructor($user);
        return $pack->created_by === $user->id;
    }

    public function create(User $user): bool
    {
        return $this->isInstructor($user) || $user->hasAnyRole(['Admin', 'Super Admin']);
    }

    public function update(User $user, SimulatorDataPack $pack): bool
    {
        if ($user->hasAnyRole(['Admin', 'Super Admin'])) return true;
        // Published packs stay editable — update keeps status published (republish in place).
        return $pack->created_by === $user->id && in_array($pack->status, ['draft', 'rejected', 'published'], true);
    }

    public function submit(User $user, SimulatorDataPack $pack): bool
    {
        if ($user->hasRole('Admin')) return true;
        return $pack->created_by === $user->id && in_array($pack->status, ['draft', 'rejected'], true);
    }

    public function review(User $user, SimulatorDataPack $pack): bool
    {
        if ($user->hasRole('Admin')) return $pack->status === 'submitted';
        // Instructors approve submitted packs, including their own.
        return $this->isInstructor($user) && $pack->status === 'submitted';
    }

    public function archive(User $user, SimulatorDataPack $pack): bool
    {
        if ($user->hasRole('Admin')) return $pack->status === 'published';
        return $pack->created_by === $user->id && $pack->status === 'published';
    }

    public function restore(User $user, SimulatorDataPack $pack): bool
    {
        if ($user->hasRole('Admin')) return $pack->status === 'archived';
        return $pack->created_by === $user->id && $pack->status === 'archived';
    }

    public function delete(User $user, SimulatorDataPack $pack): bool
    {
        // Safe delete: published history is never destroyed — archive instead.
        if (!in_array($pack->status, ['draft', 'rejected'], true)) return false;
        if ($user->hasRole('Admin')) return true;
        return $pack->created_by === $user->id;
    }

    private function isInstructor(User $user): bool
    {
        return $user->hasRole('Instructor');
    }
}
