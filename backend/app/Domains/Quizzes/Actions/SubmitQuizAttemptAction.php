<?php

namespace App\Domains\Quizzes\Actions;

use App\Domains\Quizzes\DTOs\SubmitQuizAttemptData;
use App\Domains\Quizzes\Enums\QuizAttemptStatus;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Domains\Quizzes\Models\QuizAttemptAnswer;
use App\Domains\Quizzes\Models\QuizAttemptAnswerOption;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use App\Domains\Progression\Services\StudentProgressionService;

final class SubmitQuizAttemptAction
{
    /**
     * Grace window for the client's auto-submit at timer zero.
     */
    private const int SUBMIT_GRACE_SECONDS = 15;

    public function execute(
        QuizAttempt $attempt,
        SubmitQuizAttemptData $data,
    ): QuizAttempt {
        $attempt = $attempt->fresh() ?? $attempt;

        $attempt->load([
            'quiz.questions.options',
        ]);

        if ($attempt->status === QuizAttemptStatus::SUBMITTED) {
            throw new RuntimeException(
                'This quiz attempt has already been submitted.'
            );
        }

        if ($attempt->status === QuizAttemptStatus::EXPIRED) {
            throw new RuntimeException(
                'This quiz attempt has expired.'
            );
        }

        if ($attempt->status !== QuizAttemptStatus::IN_PROGRESS) {
            throw new RuntimeException(
                'This quiz attempt cannot be submitted.'
            );
        }

        /*
         * The client auto-submits the moment the timer hits zero, so allow a
         * short grace window — otherwise the network round-trip loses the
         * student's work to a race with our own expiry check.
         */
        $deadline = $attempt->expires_at;

        if (
            $deadline === null &&
            $attempt->quiz->time_limit !== null &&
            $attempt->started_at !== null
        ) {
            $deadline = $attempt->started_at
                ->copy()
                ->addMinutes($attempt->quiz->time_limit);
        }

        if (
            $deadline !== null &&
            now()->greaterThan(
                $deadline->copy()->addSeconds(self::SUBMIT_GRACE_SECONDS)
            )
        ) {
            $attempt->update([
                'status' => QuizAttemptStatus::EXPIRED,
            ]);

            throw new RuntimeException(
                'This quiz attempt has expired.'
            );
        }

        $result = DB::transaction(function () use ($attempt, $data) {
            /*
             * A double-click sends two requests that both passed the checks
             * above before either committed. Claim the attempt row and
             * re-check under the lock so only the first request grades it and
             * awards XP; the second fails without creating duplicate answers.
             */
            $attempt = QuizAttempt::query()
                ->whereKey($attempt->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if ($attempt->status === QuizAttemptStatus::SUBMITTED) {
                throw new RuntimeException(
                    'This quiz attempt has already been submitted.'
                );
            }

            if ($attempt->status === QuizAttemptStatus::EXPIRED) {
                throw new RuntimeException(
                    'This quiz attempt has expired.'
                );
            }

            if ($attempt->status !== QuizAttemptStatus::IN_PROGRESS) {
                throw new RuntimeException(
                    'This quiz attempt cannot be submitted.'
                );
            }

            $attempt->load([
                'quiz.questions.options',
            ]);

            $score = 0;
            $totalPoints = 0;

            /*
             * Autosaved drafts are replaced by the graded rows we build below,
             * otherwise they collide with the (attempt_id, question_id) key.
             */
            $this->discardDraftAnswers($attempt);

            foreach ($attempt->quiz->questions as $question) {
                $totalPoints += $question->points;

                $submittedOptionIds = $data->answers[$question->id] ?? [];

                if (
    count($submittedOptionIds) !==
    count(array_unique($submittedOptionIds))
) {
    throw new RuntimeException(
        'Duplicate options are not allowed.'
    );
}

$questionOptionIds = $question->options
    ->pluck('id')
    ->map(fn ($id) => (string) $id)
    ->all();

foreach ($submittedOptionIds as $optionId) {
    if (! in_array((string) $optionId, $questionOptionIds, true)) {
        throw new RuntimeException(
            'Invalid option submitted for question.'
        );
    }
}

                if ($question->required && empty($submittedOptionIds)) {
                    throw new RuntimeException(
                        "Question {$question->id} is required."
                    );
                }

                // Optional unanswered questions do not create an answer row.
                if (empty($submittedOptionIds)) {
                    continue;
                }

                $isCorrect = $this->questionIsCorrect(
                    $question,
                    $submittedOptionIds
                );

                $pointsEarned = $isCorrect
                    ? $question->points
                    : 0;

                if ($isCorrect) {
                    $score += $pointsEarned;
                }

                /*
                 * Persist the answer for this question.
                 */
                $answer = QuizAttemptAnswer::create([
                    'attempt_id' => $attempt->id,
                    'question_id' => $question->id,
                    'is_correct' => $isCorrect,
                    'points_earned' => $pointsEarned,
                ]);

                /*
                 * Persist every selected option.
                 */
                foreach ($submittedOptionIds as $optionId) {
                    QuizAttemptAnswerOption::create([
                        'answer_id' => $answer->id,
                        'option_id' => $optionId,
                    ]);
                }
            }

            $percentage = $totalPoints > 0
                ? (int) round(($score / $totalPoints) * 100)
                : 0;

            $passed = $percentage >= $attempt->quiz->pass_percentage;

            $attempt->update([
                'status' => QuizAttemptStatus::SUBMITTED,
                'score' => $score,
                'total_points' => $totalPoints,
                'percentage' => $percentage,
                'passed' => $passed,
                'submitted_at' => now(),
            ]);

            if ($passed) {
                /*
                 * Award XP for the first pass only. Replaying a passed quiz
                 * must not become an XP farm.
                 */
                $alreadyPassed = QuizAttempt::query()
                    ->where('quiz_id', $attempt->quiz_id)
                    ->where('user_id', $attempt->user_id)
                    ->where('id', '!=', $attempt->id)
                    ->where('status', QuizAttemptStatus::SUBMITTED->value)
                    ->where('passed', true)
                    ->exists();

                if (! $alreadyPassed) {
                    app(StudentProgressionService::class)->award($attempt->user, 'quiz_passed', 20, 35, "quiz-passed:{$attempt->quiz_id}:{$attempt->user_id}", ['label' => 'Quiz passed']);
                    app(\App\Domains\Challenges\Services\DailyChallengeService::class)->trackAction($attempt->user, 'quiz_complete', ['title' => $attempt->quiz->title ?? 'Quiz', 'score' => $percentage]);
                }
            }

            return $attempt->fresh([
                'quiz.questions.options',
                'answers.selectedOptions',
            ]);
        });

        /*
         * A required quiz can be the last outstanding course requirement.
         * Re-evaluate the course now so completion/certificates do not wait
         * for an unrelated lesson event.
         */
        $course = $attempt->quiz?->section?->course;

        if ($result->passed && $course !== null) {
            app(\App\Domains\Courses\Services\CourseProgressService::class)
                ->sync($attempt->user, $course);
        }

        return $result;
    }

    /**
     * Drop autosaved (ungraded) answers so grading starts from a clean slate.
     */
    private function discardDraftAnswers(QuizAttempt $attempt): void
    {
        $answerIds = QuizAttemptAnswer::query()
            ->where('attempt_id', $attempt->id)
            ->pluck('id');

        if ($answerIds->isEmpty()) {
            return;
        }

        QuizAttemptAnswerOption::query()
            ->whereIn('answer_id', $answerIds)
            ->delete();

        QuizAttemptAnswer::query()
            ->whereIn('id', $answerIds)
            ->delete();
    }

    private function questionIsCorrect(
        $question,
        array $submittedOptionIds,
    ): bool {
        $correctOptionIds = $question->options
            ->where('is_correct', true)
            ->pluck('id')
            ->map(fn ($id) => (string) $id)
            ->sort()
            ->values()
            ->all();

        $submittedOptionIds = collect($submittedOptionIds)
            ->map(fn ($id) => (string) $id)
            ->sort()
            ->values()
            ->all();

        return $correctOptionIds === $submittedOptionIds;
    }
}
