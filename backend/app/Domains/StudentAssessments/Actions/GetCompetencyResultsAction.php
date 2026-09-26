<?php

namespace App\Domains\StudentAssessments\Actions;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\StudentAssessments\Models\StudentCompetencyResult;
use App\Models\User;

final class GetCompetencyResultsAction
{
    public function execute(AssessmentAttempt $attempt, User $user)
    {
        if ($attempt->user_id !== $user->id) {
            abort(404);
        }

        return StudentCompetencyResult::where('attempt_id', $attempt->id)->get();
    }
}
