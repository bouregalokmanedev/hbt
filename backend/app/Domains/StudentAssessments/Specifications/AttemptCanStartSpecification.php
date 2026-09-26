<?php

namespace App\Domains\StudentAssessments\Specifications;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Services\AssessmentEligibilityService;
use App\Models\User;

final class AttemptCanStartSpecification
{
    public function __construct(
        private readonly AssessmentEligibilityService $eligibilityService,
        private readonly AssessmentAvailableSpecification $availableSpec,
        private readonly AssessmentAccessibleSpecification $accessibleSpec,
    ) {}

    /**
     * @return array{eligible: bool, reason: ?string, evidence: array, failure: ?string}
     */
    public function evaluate(Assessment $assessment, User $user): array
    {
        if (! $this->availableSpec->isSatisfiedBy($assessment)) {
            return [
                'eligible' => false,
                'reason' => $this->availableSpec->reason($assessment),
                'evidence' => [],
                'failure' => 'unavailable',
            ];
        }

        if (! $this->accessibleSpec->isSatisfiedBy($assessment, $user)) {
            return [
                'eligible' => false,
                'reason' => $this->accessibleSpec->reason($assessment, $user),
                'evidence' => [],
                'failure' => 'access',
            ];
        }

        $evaluation = $this->eligibilityService->evaluate($assessment, $user);

        // Check max attempts
        $attemptCount = $assessment->attempts()->where('user_id', $user->id)->count();
        if ($assessment->max_attempts !== null && $attemptCount >= $assessment->max_attempts) {
            return [
                'eligible' => false,
                'reason' => 'Attempt limit exceeded.',
                'evidence' => $evaluation,
                'failure' => 'limit',
            ];
        }

        // Check active in-progress attempt
        $active = $assessment->attempts()
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->first();
        if ($active && $active->expires_at && $active->expires_at->isPast()) {
            // Expired should be handled by caller — not a block to start after cooldown
        }

        return [
            'eligible' => $evaluation['eligible'],
            'reason' => $evaluation['eligible'] ? null : 'Eligibility requirements not met.',
            'evidence' => $evaluation,
            'failure' => $evaluation['eligible'] ? null : 'eligibility',
        ];
    }

    public function isSatisfiedBy(Assessment $assessment, User $user): bool
    {
        return $this->evaluate($assessment, $user)['eligible'];
    }
}
