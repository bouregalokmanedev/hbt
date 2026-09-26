<?php

namespace App\Domains\DiagnosticScenarios\Policies;

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Models\User;

final class DiagnosticAttemptPolicy
{
    public function view(User $user, DiagnosticScenarioAttempt $attempt): bool
    {
        if ($user->hasAnyRole(['Admin', 'Super Admin', 'Instructor'])) {
            return true;
        }

        return $attempt->user_id === $user->id;
    }

    public function submit(User $user, DiagnosticScenarioAttempt $attempt): bool
    {
        return $attempt->user_id === $user->id;
    }

    public function useHint(User $user, DiagnosticScenarioAttempt $attempt): bool
    {
        return $attempt->user_id === $user->id;
    }
}
