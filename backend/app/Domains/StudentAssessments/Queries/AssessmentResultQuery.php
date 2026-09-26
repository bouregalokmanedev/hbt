<?php

namespace App\Domains\StudentAssessments\Queries;

use App\Domains\StudentAssessments\Models\StudentAssessmentResult;
use App\Models\User;

final class AssessmentResultQuery
{
    public function forStudent(User $user, int $perPage = 15)
    {
        return StudentAssessmentResult::where('student_id', $user->id)
            ->with(['assessment:id,title', 'attempt'])
            ->latest('generated_at')
            ->paginate($perPage);
    }
}
