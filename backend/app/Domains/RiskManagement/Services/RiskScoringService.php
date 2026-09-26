<?php

namespace App\Domains\RiskManagement\Services;

use App\Domains\RiskManagement\Enums\RiskLevel;

class RiskScoringService
{
    public function score(int $probability, int $impact): int
    {
        return max(1, min(25, $probability * $impact));
    }

    public function level(int $score): RiskLevel
    {
        return RiskLevel::fromScore($score);
    }

    /**
     * @return array{score:int, level:RiskLevel}
     */
    public function assess(int $probability, int $impact): array
    {
        $score = $this->score($probability, $impact);
        return ['score' => $score, 'level' => $this->level($score)];
    }
}
