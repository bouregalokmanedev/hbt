<?php

namespace App\Domains\Instructor\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Domains\Quizzes\Models\QuizQuestion */
final class InstructorQuizQuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quiz_id' => $this->quiz_id,
            'question' => $this->question,
            'type' => $this->type->value,
            'position' => $this->position,
            'points' => $this->points,
            'required' => $this->required,
            'options' => InstructorQuizQuestionOptionResource::collection(
                $this->whenLoaded('options')
            ),
        ];
    }
}
