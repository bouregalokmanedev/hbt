<?php

namespace App\Domains\Quizzes\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuizQuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quiz_id' => $this->quiz_id,

            'question' => $this->question,
            'type' => $this->type?->value,

            'position' => $this->position,
            'points' => $this->points,
            'required' => $this->required,

            'options' => QuizQuestionOptionResource::collection(
                $this->whenLoaded('options')
            ),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}