<?php

namespace App\Domains\StudentAssessments\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AssessmentResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Handles both AssessmentResult and StudentAssessmentResult
        return [
            'id' => $this->id,
            'assessment_id' => $this->assessment_id,
            'assessment_attempt_id' => $this->assessment_attempt_id ?? $this->attempt_id ?? null,
            'attempt_id' => $this->attempt_id ?? $this->assessment_attempt_id ?? null,
            'student_id' => $this->student_id ?? $this->user_id ?? null,
            'user_id' => $this->user_id ?? $this->student_id ?? null,
            'score' => $this->score,
            'percentage' => $this->percentage ?? $this->score,
            'passed' => $this->passed,
            'proficiency_level' => $this->proficiency_level?->value ?? $this->proficiency_level ?? null,
            'knowledge_score' => $this->knowledge_score ?? null,
            'application_score' => $this->application_score ?? null,
            'decision_score' => $this->decision_score ?? null,
            'problem_solving_score' => $this->problem_solving_score ?? null,
            'confidence_score' => $this->confidence_score ?? null,
            'time_efficiency_score' => $this->time_efficiency_score ?? null,
            'attempt_number' => $this->attempt_number ?? null,
            'completed_at' => $this->completed_at,
            'generated_at' => $this->generated_at ?? $this->created_at,
            'evidence' => $this->evidence ?? null,
            'results' => $this->results ?? null,
            'result_status' => $this->result_status?->value ?? $this->result_status ?? null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
