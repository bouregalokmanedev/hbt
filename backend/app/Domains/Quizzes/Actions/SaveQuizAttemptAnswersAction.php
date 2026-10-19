<?php

namespace App\Domains\Quizzes\Actions;

use App\Domains\Quizzes\Enums\QuizAttemptStatus;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Domains\Quizzes\Models\QuizAttemptAnswer;
use App\Domains\Quizzes\Models\QuizAttemptAnswerOption;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Persist a single question's selection while an attempt is still running.
 *
 * Rows written here are drafts: `is_correct` / `points_earned` stay null
 * until SubmitQuizAttemptAction grades them (and wipes them first).
 */
final class SaveQuizAttemptAnswersAction
{
    /**
     * @param  array<int, string>  $optionIds
     */
    public function execute(
        QuizAttempt $attempt,
        string $questionId,
        array $optionIds,
    ): void {
        if ($attempt->status !== QuizAttemptStatus::IN_PROGRESS) {
            throw ValidationException::withMessages([
                'attempt' => 'This attempt is no longer accepting answers.',
            ]);
        }

        if ($attempt->expires_at && $attempt->expires_at->isPast()) {
            $attempt->update([
                'status' => QuizAttemptStatus::EXPIRED,
                'timed_out_at' => now(),
            ]);

            throw ValidationException::withMessages([
                'attempt' => 'Time expired. You can retake this quiz one hour after the timeout.',
            ]);
        }

        $attempt->loadMissing('quiz.questions.options');

        $question = $attempt->quiz->questions
            ->firstWhere('id', $questionId);

        abort_unless($question !== null, 404, 'Question not found for this quiz.');

        $optionIds = array_values(array_unique($optionIds));

        $questionOptionIds = $question->options
            ->pluck('id')
            ->map(fn ($id) => (string) $id)
            ->all();

        foreach ($optionIds as $optionId) {
            abort_unless(
                in_array((string) $optionId, $questionOptionIds, true),
                422,
                'Invalid option submitted for question.',
            );
        }

        DB::transaction(function () use ($attempt, $question, $optionIds): void {
            $answer = QuizAttemptAnswer::query()
                ->where('attempt_id', $attempt->id)
                ->where('question_id', $question->id)
                ->first();

            // Clearing the question removes the draft entirely.
            if ($optionIds === []) {
                $answer?->selectedOptions()->delete();
                $answer?->delete();

                return;
            }

            if ($answer === null) {
                $answer = QuizAttemptAnswer::create([
                    'attempt_id' => $attempt->id,
                    'question_id' => $question->id,
                    'is_correct' => null,
                    'points_earned' => null,
                ]);
            } else {
                $answer->selectedOptions()->delete();
            }

            foreach ($optionIds as $optionId) {
                QuizAttemptAnswerOption::create([
                    'answer_id' => $answer->id,
                    'option_id' => $optionId,
                ]);
            }
        });
    }
}
