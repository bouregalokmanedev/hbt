<?php

namespace App\DTOs\Security;

use App\Enums\Security\RiskLevel;

class RiskAssessmentBuilder
{
    private int $score = 0;

    private array $reasons = [];

    public function add(int $points, string $reason): void
    {
        $this->score += $points;
        $this->reasons[] = $reason;
    }

    public function score(): int
    {
        return $this->score;
    }

    public function reasons(): array
    {
        return $this->reasons;
    }

    public function build(): RiskAssessment
    {
        $level = match (true) {
            $this->score >= 90 => RiskLevel::CRITICAL,
            $this->score >= 70 => RiskLevel::HIGH,
            $this->score >= 40 => RiskLevel::MEDIUM,
            default => RiskLevel::LOW,
        };

        return new RiskAssessment(
            score: $this->score,
            level: $level,
            allow: $level !== RiskLevel::CRITICAL,
            requireMfa: $level === RiskLevel::HIGH,
            block: $level === RiskLevel::CRITICAL,
            reasons: $this->reasons,
        );
    }
}