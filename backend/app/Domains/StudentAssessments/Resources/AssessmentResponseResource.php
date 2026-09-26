<?php

namespace App\Domains\StudentAssessments\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AssessmentResponseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'attempt_id' => $this->attempt_id,
            'question_id' => $this->question_id,
            'response_type' => $this->response_type,
            'answer' => $this->answer,
            'answer_metadata' => $this->answer_metadata,
            'confidence_level' => $this->confidence_level?->value ?? $this->confidence_level,
            'is_flagged' => $this->is_flagged,
            'status' => $this->status?->value ?? $this->status,
            'points_awarded' => $this->points_awarded,
            'is_correct' => $this->is_correct,
            'evaluation_status' => $this->evaluation_status,
            'feedback' => $this->feedback,
            'time_spent_seconds' => $this->time_spent_seconds,
            'started_at' => $this->started_at,
            'answered_at' => $this->answered_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
