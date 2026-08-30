<?php

namespace App\Domains\Quizzes\Actions;

use App\Domains\Quizzes\Models\QuizQuestion;

final class DeleteQuizQuestionAction
{
    public function execute(QuizQuestion $question): void
    {
        $question->delete();
    }
}