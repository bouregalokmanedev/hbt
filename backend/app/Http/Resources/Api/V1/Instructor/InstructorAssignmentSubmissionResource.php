<?php

namespace App\Http\Resources\Api\V1\Instructor;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Domains\Assignments\Models\AssignmentSubmission */
final class InstructorAssignmentSubmissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'assignment_id' => $this->assignment_id,
            'status' => $this->status?->value ?? $this->status,
            'content' => $this->content,
            'link_url' => $this->link_url,
            'grade' => $this->grade === null ? null : (float) $this->grade,
            'feedback' => $this->feedback,
            'submitted_at' => $this->submitted_at,
            'graded_at' => $this->graded_at,
            'is_late' => $this->submitted_at !== null
                && $this->assignment?->due_at !== null
                && $this->submitted_at->greaterThan($this->assignment->due_at),
            'student' => $this->whenLoaded('student', fn () => $this->student ? [
                'id' => $this->student->id,
                'first_name' => $this->student->first_name,
                'last_name' => $this->student->last_name,
                'email' => $this->student->email,
                'avatar' => $this->student->avatar,
            ] : null),
        ];
    }
}
