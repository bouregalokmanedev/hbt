<?php

namespace App\Domains\Quizzes\Actions;

use App\Domains\Quizzes\DTOs\CreateQuizQuestionData;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizQuestion;

final class CreateQuizQuestionAction
{
    public function execute(
        Quiz $quiz,
        CreateQuizQuestionData $data,
    ): QuizQuestion {
        return $quiz->questions()->create([
            'question' => $data->question,
            'type' => $data->type->value,
            'position' => $data->position,
            'points' => $data->points,
            'required' => $data->required,
        ]);
    }
}