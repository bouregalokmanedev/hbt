<?php

namespace App\Domains\Simulator\DTOs;

class CompleteSimulatorSessionData
{
    public function __construct(
        public readonly int $userId,
        public readonly int $score,
        public readonly ?string $outcome = null,
        public readonly ?string $verdict = null,
        public readonly int $attempts = 1,
        public readonly int $hintsUsed = 0,
        public readonly ?int $durationSeconds = null,
        public readonly ?array $steps = null,
        public readonly ?array $metadata = null,
        public readonly ?string $scenarioKey = null,
    ) {
    }
}