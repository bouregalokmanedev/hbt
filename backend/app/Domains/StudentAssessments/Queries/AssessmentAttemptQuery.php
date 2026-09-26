<?php

namespace App\Domains\StudentAssessments\Queries;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class AssessmentAttemptQuery
{
    public function forAssessment(string $assessmentId, User $user, int $perPage = 15): LengthAwarePaginator
    {
        return AssessmentAttempt::where('assessment_id', $assessmentId)
            ->where('user_id', $user->id)
            ->latest('attempt_number')
            ->paginate($perPage);
    }

    public function history(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return AssessmentAttempt::where('user_id', $user->id)
            ->with('assessment:id,title,course_id')
            ->latest('started_at')
            ->paginate($perPage);
    }
}
