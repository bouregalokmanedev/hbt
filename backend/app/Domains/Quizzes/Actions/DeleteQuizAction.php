<?php

namespace App\Domains\Quizzes\Actions;

use App\Domains\Quizzes\Models\Quiz;

final class DeleteQuizAction
{
    public function execute(Quiz $quiz): void
    {
        $quiz->delete();
    }
}