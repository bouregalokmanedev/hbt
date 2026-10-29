<?php

namespace App\Http\Resources\Api\V1\Instructor;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Domains\Assignments\Models\Assignment */
final class InstructorAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'course_id' => $this->course_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'instructions' => $this->instructions,
            'max_points' => $this->max_points,
            'allow_late_submissions' => $this->allow_late_submissions,
            'due_at' => $this->due_at,
            'status' => $this->status?->value ?? $this->status,
            'published_at' => $this->published_at,
            'submissions_count' => (int) ($this->submissions_count ?? 0),
            'graded_count' => (int) ($this->graded_count ?? 0),
            'pending_count' => (int) ($this->pending_count ?? 0),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
