<?php

namespace App\Domains\StudentAssessments\Services;

use App\Domains\Assessments\Actions\StartAssessmentAttemptAction;
use App\Domains\Assessments\Actions\SubmitAssessmentAttemptAction;
use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\StudentAssessments\Events\StudentAssessmentResumed;
use App\Domains\StudentAssessments\Events\StudentAssessmentStarted;
use App\Domains\StudentAssessments\Events\StudentAssessmentSubmitted;
use App\Domains\StudentAssessments\Exceptions\AssessmentAccessDeniedException;
use App\Domains\StudentAssessments\Specifications\AssessmentAccessibleSpecification;
use App\Models\User;

final class AssessmentAttemptService
{
    public function __construct(
        private readonly StartAssessmentAttemptAction $startAction,
        private readonly SubmitAssessmentAttemptAction $submitAction,
        private readonly AssessmentScoringOrchestrator $scoringOrchestrator,
        private readonly AssessmentAccessibleSpecification $accessibleSpec,
    ) {}

    public function start(Assessment $assessment, User $user): AssessmentAttempt
    {
        if (! $this->accessibleSpec->isSatisfiedBy($assessment, $user)) {
            throw new AssessmentAccessDeniedException(
                $this->accessibleSpec->reason($assessment, $user) ?? 'Access to this assessment is denied.'
            );
        }

        $attempt = $this->startAction->execute($assessment, $user);
        StudentAssessmentStarted::dispatch($attempt);

        return $attempt;
    }

    public function resume(AssessmentAttempt $attempt, User $user): AssessmentAttempt
    {
        if ($attempt->user_id !== $user->id) {
            abort(404);
        }

        if ($attempt->status !== AssessmentAttemptStatus::IN_PROGRESS) {
            abort(409, 'Attempt is not in progress.');
        }

        if ($attempt->expires_at?->isPast()) {
            $attempt->update(['status' => AssessmentAttemptStatus::EXPIRED, 'timed_out_at' => now()]);
            abort(422, 'Time expired. You can retake this assessment twelve hours after the timeout.');
        }

        $attempt->update(['last_activity_at' => now()]);
        StudentAssessmentResumed::dispatch($attempt);

        return $attempt->fresh()->load(['assessment.questions.options', 'answers.selectedOptions']);
    }

    public function abandon(AssessmentAttempt $attempt, User $user): AssessmentAttempt
    {
        if ($attempt->user_id !== $user->id) {
            abort(404);
        }

        if ($attempt->status !== AssessmentAttemptStatus::IN_PROGRESS) {
            abort(409, 'Only in-progress attempts can be abandoned.');
        }

        $attempt->update([
            'status' => AssessmentAttemptStatus::EXPIRED,
            'timed_out_at' => now(),
        ]);

        return $attempt->fresh();
    }

    public function expire(AssessmentAttempt $attempt, User $user): AssessmentAttempt
    {
        if ($attempt->user_id !== $user->id) {
            abort(404);
        }

        if ($attempt->status === AssessmentAttemptStatus::IN_PROGRESS) {
            $attempt->update(['status' => AssessmentAttemptStatus::EXPIRED, 'timed_out_at' => now()]);
        }

        return $attempt->fresh();
    }
}
