<?php

namespace App\Domains\Quizzes\Actions;

use App\Domains\Quizzes\Enums\QuizAttemptStatus;
use App\Domains\Quizzes\Enums\QuizStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use RuntimeException;

final class StartQuizAttemptAction
{
    public function execute(
        Quiz $quiz,
        User $user,
    ): QuizAttempt {
        if ($quiz->status !== QuizStatus::PUBLISHED) {
            throw ValidationException::withMessages([
                'quiz' => 'This quiz is not available for attempts.',
            ]);
        }

        /*
         * If the learner already has an active attempt,
         * return it instead of creating another one.
         */
        $existingAttempt = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->where('status', QuizAttemptStatus::IN_PROGRESS)
            ->first();

        if ($existingAttempt) {
            if ($existingAttempt->expires_at && $existingAttempt->expires_at->isPast()) {
                $existingAttempt->update(['status' => QuizAttemptStatus::EXPIRED, 'timed_out_at' => now()]);
            } else {
            return $existingAttempt;
            }
        }

        $cooldown = QuizAttempt::query()->where('quiz_id', $quiz->id)->where('user_id', $user->id)->where('status', QuizAttemptStatus::EXPIRED)->latest('timed_out_at')->first();
        if ($cooldown?->timed_out_at && now()->lt($cooldown->timed_out_at->copy()->addHour())) {
            throw ValidationException::withMessages(['attempt' => 'Time expired. You can retake this quiz one hour after the timeout.']);
        }

        /*
         * Count all attempts belonging to this user and quiz.
         *
         * A null max_attempts means unlimited attempts.
         */
        $attemptCount = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->count();

        if (
            $quiz->max_attempts !== null &&
            $attemptCount >= $quiz->max_attempts
        ) {
            throw ValidationException::withMessages([
                'attempt' => 'You have reached the maximum number of attempts for this quiz.',
            ]);
        }

        $attemptCount = QuizAttempt::query()
    ->where('quiz_id', $quiz->id)
    ->where('user_id', $user->id)
    ->count();

if (
    $quiz->max_attempts !== null &&
    $attemptCount >= $quiz->max_attempts
) {
    throw new RuntimeException(
        'Maximum quiz attempts reached.'
    );
}

$attemptNumber = $attemptCount + 1;

        return QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'attempt_number' => $attemptCount + 1,
            'status' => QuizAttemptStatus::IN_PROGRESS,
            'score' => 0,
            'total_points' => 0,
            'percentage' => 0,
            'passed' => false,
            'started_at' => now(),
            'expires_at' => now()->addMinutes(5),
        ]);
    }
}
