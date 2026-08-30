<?php

namespace App\Domains\Assessments\Actions;

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Exceptions\AssessmentMaxAttemptsExceededException;
use App\Domains\Assessments\Exceptions\AssessmentNotEligibleException;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Services\AssessmentEligibilityService;
use App\Models\User;

final class StartAssessmentAttemptAction
{
    public function __construct(
        private readonly AssessmentEligibilityService $eligibilityService,
    ) {
    }

    public function execute(
        Assessment $assessment,
        User $user,
    ): AssessmentAttempt {
        $evaluation = $this->eligibilityService->evaluate(
            $assessment,
            $user,
        );

        if (! $evaluation['eligible']) {
            throw new AssessmentNotEligibleException(
                $evaluation
            );
        }

        $activeAttempt = $assessment->attempts()->where('user_id', $user->id)->where('status', AssessmentAttemptStatus::IN_PROGRESS)->first();
        if ($activeAttempt) {
            if ($activeAttempt->expires_at && $activeAttempt->expires_at->isPast()) {
                $activeAttempt->update(['status' => AssessmentAttemptStatus::EXPIRED, 'timed_out_at' => now()]);
            } else {
                return $activeAttempt;
            }
        }

        $cooldown = $assessment->attempts()->where('user_id', $user->id)->where('status', AssessmentAttemptStatus::EXPIRED)->latest('timed_out_at')->first();
        if ($cooldown?->timed_out_at && now()->lt($cooldown->timed_out_at->copy()->addHours(12))) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'attempt' => 'Time expired. You can retake this assessment twelve hours after the timeout.',
            ]);
        }

        $attemptCount = $assessment->attempts()
            ->where('user_id', $user->id)
            ->count();

        if (
            $assessment->max_attempts !== null
            && $attemptCount >= $assessment->max_attempts
        ) {
            throw new AssessmentMaxAttemptsExceededException();
        }

        $attemptNumber = $attemptCount + 1;

        return $assessment->attempts()->create([
            'user_id' => $user->id,
            'attempt_number' => $attemptNumber,
            'status' => AssessmentAttemptStatus::IN_PROGRESS,
            'score' => 0,
            'passed' => false,
            'started_at' => now(),
            'submitted_at' => null,
            'completed_at' => null,
            'expires_at' => now()->addMinutes(30),
        ]);
    }
}
