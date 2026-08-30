<?php

namespace App\Http\Resources\Api\V1\Quizzes;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class QuizAttemptResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'quiz_id' => $this->quiz_id,

            'user_id' => $this->user_id,

            'attempt_number' => $this->attempt_number,

            'status' => $this->status?->value,

            'score' => $this->score,

            'total_points' => $this->total_points,

            'percentage' => $this->percentage,

            'passed' => $this->passed,

            'started_at' => $this->started_at?->toISOString(),

            'submitted_at' => $this->submitted_at?->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
            'timed_out_at' => $this->timed_out_at?->toISOString(),
            'tab_switch_count' => $this->tab_switch_count,
            'blocked_at' => $this->blocked_at?->toISOString(),

            'created_at' => $this->created_at?->toISOString(),

            'updated_at' => $this->updated_at?->toISOString(),

            'answers' => $this->whenLoaded('answers', function () {
                return $this->answers->map(
                    function ($answer) {
                        return [
                            'id' => $answer->id,

                            'question_id' => $answer->question_id,

                            'is_correct' => $answer->is_correct,

                            'points_earned' => $answer->points_earned,

                            'selected_options' => $answer->relationLoaded(
                                'selectedOptions'
                            )
                                ? $answer->selectedOptions->map(
                                    function ($selectedOption) {
                                        return [
                                            'id' => $selectedOption->id,

                                            'option_id' => $selectedOption->option_id,
                                        ];
                                    }
                                )->values()->all()
                                : [],
                        ];
                    }
                )->values()->all();
            }),

            'quiz' => $this->whenLoaded('quiz', function () {
                return [
                    'id' => $this->quiz->id,

                    'title' => $this->quiz->title,
                    'pass_percentage' => $this->quiz->pass_percentage,
                    'questions' => $this->quiz->relationLoaded('questions')
                        ? $this->quiz->questions->map(fn ($question) => [
                            'id' => $question->id,
                            'question' => $question->question,
                            'type' => $question->type->value,
                            'options' => $question->relationLoaded('options')
                                ? $question->options->map(fn ($option) => [
                                    'id' => $option->id,
                                    'option' => $option->option,
                                    'is_correct' => $this->status?->value === 'submitted' ? $option->is_correct : null,
                                ])->values()->all()
                                : [],
                        ])->values()->all()
                        : [],
                ];
            }),
        ];
    }
}
