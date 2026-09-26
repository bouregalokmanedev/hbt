<?php

namespace App\Domains\StudentAssessments\Services;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\StudentAssessments\Models\StudentAssessmentResult;
use App\Models\User;

final class AssessmentResultService
{
    public function findForAttempt(AssessmentAttempt $attempt, User $user): ?StudentAssessmentResult
    {
        if ($attempt->user_id !== $user->id) {
            abort(404);
        }

        return StudentAssessmentResult::where('attempt_id', $attempt->id)->first()
            ?? StudentAssessmentResult::where('assessment_id', $attempt->assessment_id)
                ->where('student_id', $user->id)
                ->latest('generated_at')
                ->first();
    }

    public function history(User $user, int $perPage = 15)
    {
        return StudentAssessmentResult::where('student_id', $user->id)
            ->with(['assessment:id,title', 'attempt'])
            ->latest('generated_at')
            ->paginate($perPage);
    }
}
