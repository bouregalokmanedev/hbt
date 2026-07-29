<?php

namespace App\DTOs\Security;

use App\Enums\Security\RiskLevel;

final readonly class RiskAssessment
{
    public function __construct(
        public int $score,
        public RiskLevel $level,
        public bool $allow,
        public bool $requireMfa,
        public bool $block,
        public array $reasons = [],
    ) {}
}