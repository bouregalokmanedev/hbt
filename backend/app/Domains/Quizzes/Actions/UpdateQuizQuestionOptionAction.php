<?php

namespace App\Domains\Quizzes\Actions;

use App\Domains\Quizzes\DTOs\UpdateQuizQuestionOptionData;
use App\Domains\Quizzes\Models\QuizQuestionOption;

final class UpdateQuizQuestionOptionAction
{
    public function execute(
        QuizQuestionOption $option,
        UpdateQuizQuestionOptionData $data
    ): QuizQuestionOption {
        $option->update(
            array_filter([
                'option' => $data->option,
                'is_correct' => $data->isCorrect,
                'position' => $data->position,
            ], fn ($value) => $value !== null)
        );

        return $option->refresh();
    }
}