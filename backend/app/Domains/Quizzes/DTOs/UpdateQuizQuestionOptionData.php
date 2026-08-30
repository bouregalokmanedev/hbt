<?php

namespace App\Domains\Quizzes\DTOs;

final readonly class UpdateQuizQuestionOptionData
{
    public function __construct(
        public ?string $option = null,
        public ?bool $isCorrect = null,
        public ?int $position = null,
    ) {}
}