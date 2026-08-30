<?php

namespace App\Domains\Quizzes\DTOs;

use App\Domains\Quizzes\Enums\QuizQuestionType;

final readonly class UpdateQuizQuestionData
{
    public function __construct(
        public ?string $question = null,
        public ?QuizQuestionType $type = null,
        public ?int $position = null,
        public ?int $points = null,
        public ?bool $required = null,
    ) {}
}