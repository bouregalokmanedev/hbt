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
                'questions' => $this->assessment->questions->map(fn ($question) => [
                    'id' => $question->id,
                    'question' => $question->question,
                    'options' => $question->options->map(fn ($option) => ['id' => $option->id, 'option' => $option->option])->values()->all(),
                ])->values()->all(),
            ]),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
