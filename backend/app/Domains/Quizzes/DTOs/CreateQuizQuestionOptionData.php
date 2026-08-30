<?php

namespace App\Domains\Quizzes\DTOs;

final readonly class CreateQuizQuestionOptionData
{
    public function __construct(
        public string $option,
        public bool $isCorrect,
        public int $position,
        public ?string $questionId = null,
    ) {
    }
}