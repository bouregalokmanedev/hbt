<?php

namespace App\Domains\StudentAssessments\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AssessmentAttemptResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isAssessmentAttempt = $this->resource instanceof \App\Domains\Assessments\Models\AssessmentAttempt;

        return [
            'id' => $this->id,
            'assessment_id' => $this->assessment_id,
            'user_id' => $this->user_id,
            'attempt_number' => $this->attempt_number,
            'status' => is_string($this->status) ? $this->status : $this->status->value,
            'score' => $this->score,
            'passed' => $this->passed,
            'started_at' => $this->started_at,
            'last_activity_at' => $this->last_activity_at ?? null,
            'submitted_at' => $this->submitted_at,
            'completed_at' => $this->completed_at,
            'expires_at' => $this->expires_at,
            'timed_out_at' => $this->timed_out_at ?? null,
            'progress_percentage' => $this->progress_percentage ?? 0,
            'time_spent_seconds' => $this->time_spent_seconds ?? 0,
            'current_question_id' => $this->current_question_id ?? null,
            'current_section_id' => $this->current_section_id ?? null,
            'tab_switch_count' => $this->tab_switch_count ?? 0,
            'blocked_at' => $this->blocked_at ?? null,
            'proficiency_level' => $this->proficiency_level?->value ?? $this->proficiency_level ?? null,
            'result' => $this->whenLoaded('result', fn () => $this->result ? new AssessmentResultResource($this->result) : null),
            'student_result' => $this->whenLoaded('studentResult', fn () => $this->studentResult ? new AssessmentResultResource($this->studentResult) : null),
            'assessment' => $this->whenLoaded('assessment', fn () => [
                'id' => $this->assessment->id,
                'title' => $this->assessment->title,
                'minimum_score' => $this->assessment->minimum_score,
                // Never expose correct answers during attempt
                'questions' => $this->assessment->questions?->map(fn ($q) => [
                    'id' => $q->id,
                    'question' => $q->question,
                    'type' => $q->type?->value ?? $q->type ?? null,
                    'options' => $q->options?->map(fn ($o) => ['id' => $o->id, 'option' => $o->option])->values()->all(),
                ])->values()->all(),
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
