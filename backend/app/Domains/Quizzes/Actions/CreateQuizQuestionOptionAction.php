<?php

namespace App\Domains\Quizzes\Actions;

use App\Domains\Quizzes\DTOs\CreateQuizQuestionOptionData;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use Illuminate\Support\Facades\DB;

final class CreateQuizQuestionOptionAction
{
    public function execute(
        CreateQuizQuestionOptionData $data,
        ?QuizQuestion $question = null,
    ): QuizQuestionOption {
        $question ??= QuizQuestion::findOrFail($data->questionId);

        return $question->options()->create([
            'option' => $data->option,
            'is_correct' => $data->isCorrect,
            'position' => $data->position,
        ]);
    }
}