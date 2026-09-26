<?php

namespace App\Domains\StudentAssessments\Specifications;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Enums\AssessmentStatus;

final class AssessmentAvailableSpecification
{
    public function isSatisfiedBy(Assessment $assessment): bool
    {
        return $assessment->status === AssessmentStatus::PUBLISHED;
    }

    public function reason(Assessment $assessment): ?string
    {
        return $this->isSatisfiedBy($assessment) ? null : 'Assessment is not published.';
    }
}
