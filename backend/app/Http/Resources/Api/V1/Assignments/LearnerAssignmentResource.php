<?php

namespace App\Http\Resources\Api\V1\Assignments;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Domains\Assignments\Models\Assignment */
final class LearnerAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $submission = $this->whenLoaded(
            'submissions',
            fn () => $this->submissions->first(),
        );

        $isLate = $submission instanceof \App\Domains\Assignments\Models\AssignmentSubmission
            && $submission->submitted_at !== null
            && $this->due_at !== null
            && $submission->submitted_at->greaterThan($this->due_at);

        return [
            'id' => $this->id,
            'course_id' => $this->course_id,
            'course_title' => $this->whenLoaded(
                'course',
                fn () => $this->course?->title,
            ),
            'title' => $this->title,
            'slug' => $this->slug,
            'instructions' => $this->instructions,
            'max_points' => $this->max_points,
            'due_at' => $this->due_at,
            'allow_late_submissions' => $this->allow_late_submissions,
            'is_overdue' => $this->due_at !== null
                && $this->due_at->isPast()
                && $submission === null,
            'is_late' => $isLate,
            'submission' => $submission instanceof \App\Domains\Assignments\Models\AssignmentSubmission
                ? new LearnerSubmissionResource($submission)
                : null,
        ];
    }
}
