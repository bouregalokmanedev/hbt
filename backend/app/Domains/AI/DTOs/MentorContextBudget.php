<?php

namespace App\Domains\AI\DTOs;

final readonly class MentorContextBudget
{
    public function __construct(
        public int $maximumTokens = 6000,
        public int $systemTokens = 1200,
        public int $memoryTokens = 1000,
        public int $conversationTokens = 3000,
        public int $responseTokens = 1800,
    ) {
    }
}