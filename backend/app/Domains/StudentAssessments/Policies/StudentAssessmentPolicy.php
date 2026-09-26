<?php

namespace App\Domains\StudentAssessments\Policies;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\StudentAssessments\Specifications\AssessmentAvailableSpecification;
use App\Domains\StudentAssessments\Specifications\AttemptCanStartSpecification;
use App\Models\User;

final class StudentAssessmentPolicy
{
    public function __construct(
        private readonly AssessmentAvailableSpecification $availableSpec,
        private readonly AttemptCanStartSpecification $canStartSpec,
    ) {}

    public function view(User $user, Assessment $assessment): bool
    {
        return $user !== null;
    }

    public function canStart(User $user, Assessment $assessment): bool
    {
        return $this->canStartSpec->isSatisfiedBy($assessment, $user);
    }

    public function canViewDetails(User $user, Assessment $assessment): bool
    {
        return $this->availableSpec->isSatisfiedBy($assessment) && $user !== null;
    }
}
