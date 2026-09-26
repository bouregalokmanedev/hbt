<?php

namespace App\Domains\StudentAssessments\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AssessmentRecommendationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'attempt_id' => $this->attempt_id,
            'assessment_result_id' => $this->assessment_result_id,
            'competency_id' => $this->competency_id,
            'competency_name' => $this->competency_name,
            'course_id' => $this->course_id,
            'section_id' => $this->section_id,
            'lesson_id' => $this->lesson_id,
            'recommendation_type' => $this->recommendation_type,
            'title' => $this->title,
            'description' => $this->description,
            'priority' => $this->priority,
            'reason' => $this->reason,
            'status' => $this->status,
            'completed_at' => $this->completed_at,
            'course' => $this->whenLoaded('course', fn () => $this->course ? ['id' => $this->course->id, 'title' => $this->course->title] : null),
            'section' => $this->whenLoaded('section', fn () => $this->section ? ['id' => $this->section->id, 'title' => $this->section->title] : null),
            'lesson' => $this->whenLoaded('lesson', fn () => $this->lesson ? ['id' => $this->lesson->id, 'title' => $this->lesson->title] : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
