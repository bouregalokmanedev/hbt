<?php

namespace App\Domains\AI\DTOs;

final readonly class MentorPrompt
{
    public function __construct(
        public array $messages,
        public int $estimatedTokens,
    ) {
    }

    public function toArray(): array
    {
        return $this->messages;
    }
}