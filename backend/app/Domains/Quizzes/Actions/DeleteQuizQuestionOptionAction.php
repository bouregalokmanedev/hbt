<?php

namespace App\Domains\Quizzes\Actions;

use App\Domains\Quizzes\Models\QuizQuestionOption;

final class DeleteQuizQuestionOptionAction
{
    public function execute(
        QuizQuestionOption $option
    ): void {
        $option->delete();
    }
}