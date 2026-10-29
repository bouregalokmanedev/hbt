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
     * Persist one autosaved answer.
     *
     * The payload is the same shape the submit endpoint accepts, so a saved
     * answer can be replayed without translation:
     * - choice questions: option_ids / selected_option_ids
     * - text questions: value (or text / answer)
     * - ordering questions: ordered_ids (a full permutation of the options)
     * - matching questions: matches (left => right map or [{left, right}])
     *
     * @param  array<string, mixed>  $payload
     */
    public function execute(
        AssessmentAttempt $attempt,
        string $questionId,
        array $payload,
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

        $type = $question->type?->value ?? (string) $question->type;
        $confidence = $this->confidenceLevel($payload['confidence_level'] ?? null);

        [$normalized, $optionIds] = $this->normalize($question, $type, $payload);

        return DB::transaction(function () use (
            $attempt,
            $question,
            $type,
            $normalized,
            $optionIds,
            $confidence,
        ): AssessmentAttemptAnswer {
            $answer = AssessmentAttemptAnswer::query()->updateOrCreate(
                [
                    'assessment_attempt_id' => $attempt->id,
                    'question_id' => $question->id,
                ],
                [
                    'is_correct' => false,
                    'points_earned' => 0,
                    'answer' => $normalized,
                    'answered_at' => now(),
                    'status' => 'answered',
                    'response_type' => $type,
                    'confidence_level' => $confidence,
                    'evaluation_status' => $type === 'long_answer' ? 'pending_review' : 'pending',
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

    /**
     * @param  array<string, mixed>  $payload
     * @return array{0: array<string, mixed>, 1: array<int, string>}
     */
    private function normalize(mixed $question, string $type, array $payload): array
    {
        return match ($type) {
            'single_choice', 'multiple_choice', 'true_false' => $this->choiceAnswer($question, $payload),
            'ordering' => $this->orderingAnswer($question, $payload),
            'matching' => $this->matchingAnswer($question, $payload),
            'short_answer', 'long_answer' => $this->textAnswer($payload),
            'numeric' => $this->numericAnswer($payload),
            default => throw ValidationException::withMessages([
                'answer' => 'Unsupported question type.',
            ]),
        };
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{0: array<string, mixed>, 1: array<int, string>}
     */
    private function choiceAnswer(mixed $question, array $payload): array
    {
        $optionIds = collect(
            $payload['option_ids']
                ?? $payload['selected_option_ids']
                ?? (isset($payload['selected_option_id']) ? [$payload['selected_option_id']] : [])
        )
            ->map(fn ($id) => (string) $id)
            ->unique()
            ->values()
            ->all();

        $questionOptionIds = $question->options
            ->pluck('id')
            ->map(fn ($id) => (string) $id)
            ->all();

        foreach ($optionIds as $optionId) {
            abort_unless(
                in_array($optionId, $questionOptionIds, true),
                422,
                'Invalid option submitted for question.',
            );
        }

        if ($question->type?->value === 'single_choice' && count($optionIds) > 1) {
            throw ValidationException::withMessages([
                'answer' => 'This question accepts a single option.',
            ]);
        }

        return [
            ['selected_option_ids' => $optionIds],
            $optionIds,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{0: array<string, mixed>, 1: array<int, string>}
     */
    private function orderingAnswer(mixed $question, array $payload): array
    {
        $ordered = $payload['ordered_ids']
            ?? $payload['option_ids']
            ?? $payload['selected_option_ids']
            ?? null;

        if (! is_array($ordered)) {
            throw ValidationException::withMessages([
                'answer' => 'An ordered list of options is required for this question.',
            ]);
        }

        $ordered = array_values(array_map(fn ($id) => (string) $id, $ordered));
        $questionOptionIds = $question->options
            ->pluck('id')
            ->map(fn ($id) => (string) $id)
            ->values()
            ->all();

        sort($questionOptionIds);
        $submitted = $ordered;
        sort($submitted);

        if ($submitted !== $questionOptionIds) {
            throw ValidationException::withMessages([
                'answer' => 'Ordering answers must contain every option exactly once.',
            ]);
        }

        return [
            ['ordered_ids' => $ordered],
            [],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{0: array<string, mixed>, 1: array<int, string>}
     */
    private function matchingAnswer(mixed $question, array $payload): array
    {
        $matches = $payload['matches'] ?? null;

        if (! is_array($matches)) {
            throw ValidationException::withMessages([
                'answer' => 'A set of matches is required for this question.',
            ]);
        }

        $answerKey = is_array($question->answer_key) ? $question->answer_key : [];
        $pairs = is_array($answerKey['pairs'] ?? null) ? $answerKey['pairs'] : [];

        $validLeft = array_values(array_map('strval', array_keys($pairs)));
        $validRight = array_values(array_unique(array_map('strval', array_values($pairs))));

        if (array_is_list($matches)) {
            $normalized = [];
            foreach ($matches as $pair) {
                if (! is_array($pair) || ! isset($pair['left'], $pair['right'])) {
                    throw ValidationException::withMessages([
                        'answer' => 'Each match must contain a left and a right value.',
                    ]);
                }

                $left = (string) $pair['left'];
                $right = (string) $pair['right'];

                if ($validLeft !== [] && ! in_array($left, $validLeft, true)) {
                    throw ValidationException::withMessages(['answer' => 'Unknown matching prompt.']);
                }

                if ($validRight !== [] && ! in_array($right, $validRight, true)) {
                    throw ValidationException::withMessages(['answer' => 'Unknown matching option.']);
                }

                $normalized[$left] = $right;
            }
        } else {
            $normalized = [];
            foreach ($matches as $left => $right) {
                if (! is_scalar($right)) {
                    throw ValidationException::withMessages([
                        'answer' => 'Each match must contain a left and a right value.',
                    ]);
                }

                $left = (string) $left;
                $right = (string) $right;

                if ($validLeft !== [] && ! in_array($left, $validLeft, true)) {
                    throw ValidationException::withMessages(['answer' => 'Unknown matching prompt.']);
                }

                if ($validRight !== [] && ! in_array($right, $validRight, true)) {
                    throw ValidationException::withMessages(['answer' => 'Unknown matching option.']);
                }

                $normalized[$left] = $right;
            }
        }

        return [
            ['matches' => $normalized],
            [],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{0: array<string, mixed>, 1: array<int, string>}
     */
    private function textAnswer(array $payload): array
    {
        $value = $payload['value']
            ?? $payload['text']
            ?? $payload['answer']
            ?? null;

        if (! is_scalar($value) && $value !== null) {
            throw ValidationException::withMessages([
                'answer' => 'A text answer is required for this question.',
            ]);
        }

        return [
            ['value' => $value === null ? null : trim((string) $value)],
            [],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{0: array<string, mixed>, 1: array<int, string>}
     */
    private function numericAnswer(array $payload): array
    {
        $value = $payload['value'] ?? $payload['answer'] ?? null;

        if ($value === null || $value === '' || ! is_numeric($value)) {
            throw ValidationException::withMessages([
                'answer' => 'A numeric answer is required for this question.',
            ]);
        }

        return [
            ['value' => (float) $value],
            [],
        ];
    }

    private function confidenceLevel(mixed $confidence): ?string
    {
        if (! is_string($confidence) || $confidence === '') {
            return null;
        }

        $allowed = ['guessing', 'somewhat_confident', 'confident', 'very_confident'];

        return in_array($confidence, $allowed, true) ? $confidence : null;
    }
}
