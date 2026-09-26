<?php

namespace App\Domains\Instructor\Actions\Assessments;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Enums\AssessmentStatus;
use App\Models\User;
use LogicException;

final class UnpublishAssessmentAction
{
    public function execute(Assessment $assessment, User $instructor): Assessment
    {
        if ($assessment->course->instructor_id !== $instructor->id) {
            throw new LogicException('You can only unpublish assessments for your own courses.');
        }

        if ($assessment->status !== AssessmentStatus::PUBLISHED) {
            throw new LogicException('Only published assessments can be unpublished.');
        }

        // Check if any attempts in progress
        $activeAttempts = $assessment->attempts()->where('status', 'in_progress')->count();
        if ($activeAttempts > 0) {
            throw new LogicException('Cannot unpublish assessment with active attempts.');
        }

        $assessment->update([
            'status' => AssessmentStatus::DRAFT,
            'published_at' => null,
        ]);

        return $assessment->fresh();
    }
}