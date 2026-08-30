<?php

namespace App\Domains\Quizzes\Actions;

use App\Domains\Quizzes\Enums\QuizStatus;
use App\Domains\Quizzes\Models\Quiz;

final class PublishQuizAction
{
    public function execute(Quiz $quiz): Quiz
    {
        $quiz->update([
            'status' => QuizStatus::PUBLISHED,
        ]);

        return $quiz->refresh();
    }
}