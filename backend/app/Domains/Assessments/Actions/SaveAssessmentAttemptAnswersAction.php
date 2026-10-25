<?php

namespace App\Domains\Assessments\Actions;

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentAttemptAnswer;
use App\Domains\Assessments\Models\AssessmentAttemptAnswerOption;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class SaveAssessmentAttemptAnswersAction
{
    /**
     * @param  array<int, string>  $optionIds
     */
    public function execute(
        AssessmentAttempt $attempt,
        string $questionId,
        array $optionIds,
    ): AssessmentAttemptAnswer {
        if ($attempt->status !== AssessmentAttemptStatus::IN_PROGRESS) {
            throw ValidationException::withMessages([
                'attempt' => 'This attempt is no longer accepting answers.',
            ]);
        }

        if ($attempt->expires_at !== null && $attempt->expires_at->isPast()) {
            $attempt->update([
                'status' => AssessmentAttemptStatus::EXPIRED,
                'timed_out_at' => now(),
            ]);

            throw ValidationException::withMessages([
                'attempt' => 'Time expired. You can retake this assessment twelve hours after the timeout.',
            ]);
        }

        $attempt->loadMissing('assessment.questions.options');

        $question = $attempt->assessment->questions
            ->firstWhere('id', $questionId);

        abort_unless($question !== null, 404, 'Question not found for this assessment.');

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

        return DB::transaction(function () use ($attempt, $question, $optionIds): AssessmentAttemptAnswer {
            $answer = AssessmentAttemptAnswer::query()->updateOrCreate(
                [
                    'assessment_attempt_id' => $attempt->id,
                    'question_id' => $question->id,
                ],
                [
                    'is_correct' => false,
                    'points_earned' => 0,
                    'answer' => ['selected_option_ids' => $optionIds],
                    'answered_at' => now(),
                    'status' => 'answered',
                    'response_type' => 'multiple_choice',
                    'evaluation_status' => 'pending',
                ],
            );

            $answer->selectedOptions()->delete();

            foreach ($optionIds as $optionId) {
                AssessmentAttemptAnswerOption::create([
                    'answer_id' => $answer->id,
                    'option_id' => $optionId,
                ]);
            }

            return $answer->fresh('selectedOptions');
        });
    }
}
