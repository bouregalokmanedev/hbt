<?php

namespace App\Domains\Instructor\Actions\Assessments;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Enums\AssessmentStatus;
use App\Models\User;
use LogicException;

final class PublishAssessmentAction
{
    public function execute(Assessment $assessment, User $instructor): Assessment
    {
        if ($assessment->course->instructor_id !== $instructor->id) {
            throw new LogicException('You can only publish assessments for your own courses.');
        }

        if ($assessment->status === AssessmentStatus::PUBLISHED) {
            throw new LogicException('Assessment is already published.');
        }

        // Validate required fields for publishing
        if (! $assessment->title) {
            throw new LogicException('Assessment must have a title.');
        }
        if ($assessment->questions()->count() === 0) {
            throw new LogicException('Assessment must have at least one question before publishing.');
        }

        // CAT needs a calibrated bank to select from: at least two
        // calibrated questions, otherwise adaptivity is meaningless.
        if ($assessment->isAdaptive()) {
            $calibrated = $assessment->questions()->where('is_calibrated', true)->count();

            if ($calibrated < 2) {
                throw new LogicException('Adaptive assessments need at least two calibrated questions before publishing.');
            }
        }

        $assessment->update([
            'status' => AssessmentStatus::PUBLISHED,
            'published_at' => now(),
        ]);

        return $assessment->fresh();
    }
}