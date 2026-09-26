<?php

namespace App\Domains\StudentAssessments\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class StudentAssessmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $assessment = $this['assessment'] ?? $this->resource;
        $eligibility = $this['eligibility'] ?? null;

        if (is_array($assessment)) {
            return $assessment;
        }

        return [
            'id' => $assessment->id,
            'title' => $assessment->title,
            'description' => $assessment->description,
            'course' => $assessment->course ? ['id' => $assessment->course->id, 'title' => $assessment->course->title] : null,
            'scope' => $assessment->scope(),
            'section' => $assessment->section ? ['id' => $assessment->section->id, 'title' => $assessment->section->title] : null,
            'lesson' => $assessment->lesson ? ['id' => $assessment->lesson->id, 'title' => $assessment->lesson->title] : null,
            'minimum_score' => $assessment->minimum_score,
            'max_attempts' => $assessment->max_attempts,
            'status' => $assessment->status->value ?? $assessment->status,
            'questions_count' => $assessment->questions_count ?? $assessment->questions?->count(),
            'eligibility' => $eligibility,
            'created_at' => $assessment->created_at,
            'updated_at' => $assessment->updated_at,
        ];
    }
}
