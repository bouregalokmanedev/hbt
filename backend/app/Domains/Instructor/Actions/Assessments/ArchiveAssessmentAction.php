<?php

namespace App\Domains\Instructor\Actions\Assessments;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Enums\AssessmentStatus;
use App\Models\User;
use LogicException;

final class ArchiveAssessmentAction
{
    public function execute(Assessment $assessment, User $instructor): Assessment
    {
        if ($assessment->course->instructor_id !== $instructor->id) {
            throw new LogicException('You can only archive assessments for your own courses.');
        }

        if ($assessment->status === AssessmentStatus::PUBLISHED) {
            throw new LogicException('Cannot archive published assessment. Unpublish first.');
        }

        $assessment->delete(); // Soft delete

        return $assessment->fresh();
    }
}