<?php

namespace App\Domains\Instructor\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Domains\Quizzes\Models\QuizQuestionOption */
final class InstructorQuizQuestionOptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'question_id' => $this->quiz_question_id,
            'option' => $this->option,
            'is_correct' => $this->is_correct,
            'position' => $this->position,
        ];
    }
}
