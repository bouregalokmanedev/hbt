<?php

namespace App\Domains\Instructor\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Domains\Quizzes\Models\Quiz */
final class InstructorQuizResource extends JsonResource
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
            'status' => $this->status->value,
            'pass_percentage' => $this->pass_percentage,
            'max_attempts' => $this->max_attempts,
            'time_limit' => $this->time_limit,
            'questions' => InstructorQuizQuestionResource::collection(
                $this->whenLoaded('questions')
            ),
        ];
    }
}
