<?php

namespace App\Domains\Quizzes\Actions;

use App\Domains\Quizzes\DTOs\UpdateQuizData;
use App\Domains\Quizzes\Models\Quiz;

final class UpdateQuizAction
{
    public function execute(
        Quiz $quiz,
        UpdateQuizData $data
    ): Quiz {
        $attributes = array_filter([
            'title' => $data->title,
            'slug' => $data->slug,
            'description' => $data->description,
            'position' => $data->position,
            'status' => $data->status,
            'pass_percentage' => $data->passPercentage,
            'max_attempts' => $data->maxAttempts,
            'time_limit' => $data->timeLimit,
        ], static fn ($value) => $value !== null);

        $quiz->update($attributes);

        return $quiz->refresh();
    }
}