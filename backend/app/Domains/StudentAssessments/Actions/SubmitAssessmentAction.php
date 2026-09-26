<?php

namespace App\Domains\StudentAssessments\Actions;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\StudentAssessments\Services\AssessmentEvaluationService;
use App\Models\User;

final class SubmitAssessmentAction
{
    public function __construct(private readonly AssessmentEvaluationService $evaluationService) {}

    public function execute(AssessmentAttempt $attempt, User $user, ?array $submittedAnswers = null): array
    {
        return $this->evaluationService->evaluate($attempt, $user, $submittedAnswers);
    }
}
