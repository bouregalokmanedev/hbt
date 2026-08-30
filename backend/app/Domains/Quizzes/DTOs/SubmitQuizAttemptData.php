<?php

namespace App\Domains\Quizzes\DTOs;

final readonly class SubmitQuizAttemptData
{
    /**
     * @param array<string, array<string>> $answers
     */
    public function __construct(
        public array $answers,
    ) {
    }
}