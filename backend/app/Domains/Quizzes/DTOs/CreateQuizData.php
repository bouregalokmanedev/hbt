<?php

namespace App\Domains\Quizzes\DTOs;

use App\Domains\Quizzes\Enums\QuizStatus;

final readonly class CreateQuizData
{
    public function __construct(
        public string $sectionId,
        public string $title,
        public ?string $slug = null,
        public ?string $description = null,
        public int $position = 1,
        public QuizStatus $status = QuizStatus::DRAFT,
        public int $passPercentage = 70,
        public ?int $maxAttempts = null,
        public ?int $timeLimit = null,
    ) {}
}