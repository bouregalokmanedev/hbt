<?php

namespace App\Domains\StudentAssessments\Actions;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\StudentAssessments\Services\AssessmentRecommendationService;
use App\Models\User;

final class GetRecommendationsAction
{
    public function __construct(private readonly AssessmentRecommendationService $service) {}

    public function execute(AssessmentAttempt $attempt, User $user)
    {
        return $this->service->forAttempt($attempt, $user);
    }
}
