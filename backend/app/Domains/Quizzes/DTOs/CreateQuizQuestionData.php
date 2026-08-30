<?php

namespace App\Domains\Quizzes\DTOs;

use App\Domains\Quizzes\Enums\QuizQuestionType;

final readonly class CreateQuizQuestionData
{
    public function __construct(
        public string $question,
        public QuizQuestionType $type,
        public int $position,
        public int $points,
        public bool $required,
        public array $options = [],
        public ?string $quizId = null,
    ) {
    }
}