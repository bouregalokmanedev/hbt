<?php

namespace App\Domains\StudentAssessments\Queries;

use App\Domains\Assessments\Models\Assessment;
use App\Models\User;

final class StudentAssessmentQuery
{
    public function findForStudent(string $assessmentId, User $user): Assessment
    {
        return Assessment::with(['course:id,title', 'questions.options'])->findOrFail($assessmentId);
    }
}
