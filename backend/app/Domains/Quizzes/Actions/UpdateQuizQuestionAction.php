<?php

namespace App\Domains\Quizzes\Actions;

use App\Domains\Quizzes\DTOs\UpdateQuizQuestionData;
use App\Domains\Quizzes\Models\QuizQuestion;

final class UpdateQuizQuestionAction
{
    public function execute(
        QuizQuestion $question,
        UpdateQuizQuestionData $data
    ): QuizQuestion {
        $question->update(
            array_filter([
                'question' => $data->question,
                'type' => $data->type,
                'position' => $data->position,
                'points' => $data->points,
                'required' => $data->required,
            ], fn ($value) => $value !== null)
        );

        /*
         * Explanation is optional and clearable, so it sits outside the
         * null-filtered payload: an empty string wipes it, an absent key
         * leaves it untouched.
         */
        if ($data->explanation !== null) {
            $question->update([
                'explanation' => $data->explanation === ''
                    ? null
                    : $data->explanation,
            ]);
        }

        return $question->refresh();
    }
}