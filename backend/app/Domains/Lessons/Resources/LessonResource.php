<?php

namespace App\Domains\Lessons\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Domains\Media\Resources\MediaResource;

final class LessonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'course_id' => $this->section?->course_id,
            'section_id' => $this->section_id,

            'course' => $this->whenLoaded(
                'section',
                fn () => $this->section?->course
                    ? [
                        'id' => $this->section->course->id,
                        'title' => $this->section->course->title,
                        'slug' => $this->section->course->slug,
                    ]
                    : null
            ),

            'title' => $this->title,
            'slug' => $this->slug,

            'description' => $this->description,
            'content' => $this->content,

            'position' => $this->position,
            'status' => $this->status->value,

            'duration_minutes' => $this->duration_minutes,
            'is_preview' => $this->is_preview,

            'media' => MediaResource::collection(
                $this->whenLoaded('media')
            ),

            'progress' => $this->whenLoaded(
                'progressForUser',
                fn () => $this->progressForUser
                    ? [
                        'id' => $this->progressForUser->id,

                        'progress_percentage' =>
                            $this->progressForUser->progress_percentage,

                        'time_spent' =>
                            $this->progressForUser->time_spent,

                        'started_at' =>
                            $this->progressForUser->started_at
                                ?->toISOString(),

                        'completed_at' =>
                            $this->progressForUser->completed_at
                                ?->toISOString(),

                        'is_completed' =>
                            $this->progressForUser->completed_at !== null,
                    ]
                    : null
            ),
        ];
    }
}
