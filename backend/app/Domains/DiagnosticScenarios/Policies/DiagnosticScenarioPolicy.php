<?php

namespace App\Domains\DiagnosticScenarios\Policies;

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Models\User;

final class DiagnosticScenarioPolicy
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

    public function view(User $user, DiagnosticScenario $scenario): bool
    {
        if ($user->hasAnyRole(['Admin', 'Super Admin'])) {
            return true;
        }

        // Instructors manage their own course content; students see published.
        if ($user->hasRole('Instructor')) {
            return true;
        }

        return $scenario->status->value === 'published';
    }

    public function manage(User $user, ?DiagnosticScenario $scenario = null): bool
    {
        return $user->hasAnyRole([
            'Instructor',
            'Admin',
            'Super Admin',
        ]);
    }
}
