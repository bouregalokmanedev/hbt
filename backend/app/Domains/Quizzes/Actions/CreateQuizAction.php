<?php

namespace App\Domains\Quizzes\Actions;

use App\Domains\Quizzes\DTOs\CreateQuizData;
use App\Domains\Quizzes\Models\Quiz;

final class CreateQuizAction
{
    public function execute(CreateQuizData $data): Quiz
    {
        return Quiz::create([
            'section_id' => $data->sectionId,
            'title' => $data->title,
            'slug' => $data->slug,
            'description' => $data->description,
            'position' => $data->position,
            'status' => $data->status,
            'pass_percentage' => $data->passPercentage,
            'max_attempts' => $data->maxAttempts,
            'time_limit' => $data->timeLimit,
        ]);
    }
}