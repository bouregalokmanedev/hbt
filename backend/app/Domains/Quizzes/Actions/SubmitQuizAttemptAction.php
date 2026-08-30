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
    public function execute(
        QuizAttempt $attempt,
        SubmitQuizAttemptData $data,
    ): QuizAttempt {
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

        // Check expiration before starting the transaction.
        if (
            $attempt->quiz->time_limit !== null &&
            $attempt->started_at !== null &&
            $attempt->started_at
                ->copy()
                ->addMinutes($attempt->quiz->time_limit)
                ->isPast()
        ) {
            $attempt->update([
                'status' => QuizAttemptStatus::EXPIRED,
            ]);

            throw new RuntimeException(
                'This quiz attempt has expired.'
            );
        }

        return DB::transaction(function () use ($attempt, $data) {
            $score = 0;
            $totalPoints = 0;

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

            if ($passed) app(StudentProgressionService::class)->award($attempt->user, 'quiz_passed', 20, 35, "quiz-attempt:{$attempt->id}", ['label' => 'Quiz passed']);

            return $attempt->fresh([
                'quiz.questions.options',
                'answers.selectedOptions',
            ]);
        });
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
