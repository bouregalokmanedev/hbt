<?php

namespace App\Domains\Quizzes\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuizResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'section_id' => $this->section_id,

            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,

            'position' => $this->position,
            'status' => $this->status?->value,

            'pass_percentage' => $this->pass_percentage,
            'max_attempts' => $this->max_attempts,
            'time_limit' => $this->time_limit,
            'attempt_status' => $this->when($this->relationLoaded('attempts'), fn () => $this->attempts->first()?->status?->value),
            'passed' => $this->when($this->relationLoaded('attempts'), fn () => $this->attempts->first()?->passed),

            'questions' => QuizQuestionResource::collection(
                $this->whenLoaded('questions')
            ),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
