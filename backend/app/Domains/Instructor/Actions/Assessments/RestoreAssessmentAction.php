<?php

namespace App\Domains\Instructor\Actions\Assessments;

use App\Domains\Assessments\Models\Assessment;
use App\Models\User;
use LogicException;

final class RestoreAssessmentAction
{
    public function execute(Assessment $assessment, User $instructor): Assessment
    {
        if ($assessment->course->instructor_id !== $instructor->id) {
            throw new LogicException('You can only restore assessments for your own courses.');
        }

        if (! $assessment->trashed()) {
            throw new LogicException('Assessment is not archived.');
        }

        $assessment->restore();

        return $assessment->fresh();
    }
}