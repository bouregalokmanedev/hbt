<?php

namespace App\Domains\Enrollments\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class EnrollmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'user_id' => $this->user_id,
            'course_id' => $this->course_id,

            'status' => $this->status->value,

            'enrolled_at' => $this->enrolled_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            'cancelled_at' => $this->cancelled_at?->toISOString(),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            'course' => $this->relationLoaded('course') && $this->course
                ? [
                    'id' => $this->course->id,
                    'title' => $this->course->title,
                    'thumbnail' => $this->course->thumbnail,
                ]
                : null,

            'progress' => $this->relationLoaded('progress') && $this->progress
                ? [
                    'progress_percentage' => $this->progress->progress_percentage,
                    'time_spent' => $this->progress->time_spent,
                    'completed_at' => $this->progress->completed_at?->toISOString(),
                ]
                : null,

            'completed_lessons' => $this->completed_lessons,
            'total_lessons' => $this->total_lessons,
        ];
    }
}
