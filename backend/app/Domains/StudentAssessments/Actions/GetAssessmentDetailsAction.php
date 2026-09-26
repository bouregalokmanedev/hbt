<?php

namespace App\Domains\StudentAssessments\Actions;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\StudentAssessments\Services\StudentAssessmentService;
use App\Models\User;

final class GetAssessmentDetailsAction
{
    public function __construct(private readonly StudentAssessmentService $service) {}

    public function execute(Assessment $assessment, User $user): array
    {
        return $this->service->getDetails($assessment, $user);
    }
}
