<?php

namespace App\Domains\Lessons\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class LessonProgressResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
    'id' => $this->id,
    'user_id' => $this->user_id,
    'lesson_id' => $this->lesson_id,
    'started_at' => $this->started_at?->toISOString(),
    'progress_percentage' => $this->progress_percentage,
    'time_spent' => $this->time_spent,
    'last_position' => $this->last_position,
    'video_position' => $this->video_position,
    'is_completed' =>$this->is_completed,
    'completed_at' => $this->completed_at?->toISOString(),
    'created_at' => $this->created_at?->toISOString(),
    'updated_at' => $this->updated_at?->toISOString(),
];
    }
}