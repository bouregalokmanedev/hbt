<?php

namespace App\Domains\Quizzes\DTOs;

final readonly class UpdateQuizData
{
    public function __construct(
        public ?string $title = null,
        public ?string $slug = null,
        public ?string $description = null,
        public ?int $position = null,
        public mixed $status = null,
        public ?int $passPercentage = null,
        public ?int $maxAttempts = null,
        public ?int $timeLimit = null,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            title: $data['title'] ?? null,
            slug: $data['slug'] ?? null,
            description: $data['description'] ?? null,
            position: $data['position'] ?? null,
            status: $data['status'] ?? null,
            passPercentage: $data['pass_percentage'] ?? null,
            maxAttempts: $data['max_attempts'] ?? null,
            timeLimit: $data['time_limit'] ?? null,
        );
    }
}