<?php

namespace App\Domains\StudentAssessments\Actions;

use App\Domains\StudentAssessments\Services\AssessmentResultService;
use App\Models\User;

final class GetAssessmentHistoryAction
{
    public function __construct(private readonly AssessmentResultService $resultService) {}

    public function execute(User $user, int $perPage = 15)
    {
        return $this->resultService->history($user, $perPage);
    }
}
