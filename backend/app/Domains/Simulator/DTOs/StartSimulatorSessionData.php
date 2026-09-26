<?php

namespace App\Domains\Simulator\DTOs;

class StartSimulatorSessionData
{
    public function __construct(
        public readonly int $userId,
        public readonly string $vehicleKey,
        public readonly string $tool,
        public readonly ?string $scenarioKey = null,
    ) {
    }
}