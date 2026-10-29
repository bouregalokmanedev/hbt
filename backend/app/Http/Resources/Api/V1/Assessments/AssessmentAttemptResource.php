<?php

namespace App\Http\Resources\Api\V1\Assessments;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AssessmentAttemptResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'assessment_id' => $this->assessment_id,
            'user_id' => $this->user_id,

            'attempt_number' => $this->attempt_number,

            'status' => $this->status->value,

            'score' => $this->score,
            'passed' => $this->passed,

            'started_at' => $this->started_at,
            'submitted_at' => $this->submitted_at,
            'completed_at' => $this->completed_at,
            'expires_at' => $this->expires_at,
            'timed_out_at' => $this->timed_out_at,
            'tab_switch_count' => $this->tab_switch_count,
            'blocked_at' => $this->blocked_at,

            'answers' => $this->whenLoaded(
                'answers',
                fn () => $this->answers->map(fn ($answer) => [
                    'question_id' => $answer->question_id,
                    'answer' => $answer->answer,
                    'selected_option_ids' => $answer->relationLoaded('selectedOptions')
                        ? $answer->selectedOptions->pluck('option_id')->values()->all()
                        : [],
                    'confidence_level' => $answer->confidence_level,
                    'is_correct' => $answer->is_correct,
                    'points_earned' => $answer->points_earned,
                ])->values()->all(),
            ),

            'result' => $this->whenLoaded(
                'result',
                fn () => new AssessmentResultResource(
                    $this->result
                )
            ),
            'assessment' => $this->whenLoaded('assessment', fn () => [
                'id' => $this->assessment->id,
                'title' => $this->assessment->title,
                'minimum_score' => $this->assessment->minimum_score,
                'time_limit_minutes' => $this->assessment->time_limit_minutes,
                'questions' => $this->assessment->questions->map(function ($question) {
                    $type = $question->type?->value ?? (string) $question->type;

                    return [
                        'id' => $question->id,
                        'question' => $question->question,
                        'type' => $type,
                        'points' => (int) ($question->pivot->points ?? $question->points ?? 1),
                        'required' => (bool) ($question->required ?? true),
                        'options' => $this->hostedOptions($question, $type),
                        'matching' => $this->matchingPrompts($question, $type),
                    ];
                })->values()->all(),
            ]),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * Return the option list in the order it should be shown.
     *
     * Ordering questions must not arrive pre-sorted by the answer key, so
     * their options are deterministically shuffled. A stable shuffle keeps
     * the same order when the attempt is resumed.
     *
     * @return array<int, array{id: string, option: string}>
     */
    private function hostedOptions(mixed $question, string $type): array
    {
        $options = $question->options
            ->map(fn ($option) => [
                'id' => (string) $option->id,
                'option' => (string) $option->option,
            ])
            ->values()
            ->all();

        if ($type === 'ordering') {
            usort($options, fn (array $a, array $b) => strcmp(
                md5($question->id.':'.$a['id']),
                md5($question->id.':'.$b['id']),
            ));
        }

        return $options;
    }

    /**
     * Matching questions store their answer key as a left => right map.
     * Expose the two columns separately so the pairing is not leaked.
     *
     * @return array{left: array<int, string>, right: array<int, string>}|null
     */
    private function matchingPrompts(mixed $question, string $type): ?array
    {
        if ($type !== 'matching') {
            return null;
        }

        $answerKey = is_array($question->answer_key) ? $question->answer_key : [];
        $pairs = is_array($answerKey['pairs'] ?? null) ? $answerKey['pairs'] : [];

        $left = array_values(array_map('strval', array_keys($pairs)));
        $right = array_values(array_unique(array_map('strval', array_values($pairs))));

        usort($left, fn (string $a, string $b) => strcmp(
            md5($question->id.':left:'.$a),
            md5($question->id.':left:'.$b),
        ));

        usort($right, fn (string $a, string $b) => strcmp(
            md5($question->id.':right:'.$a),
            md5($question->id.':right:'.$b),
        ));

        return ['left' => $left, 'right' => $right];
    }
}
