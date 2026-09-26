<?php

namespace Tests\Unit\Security;

use PHPUnit\Framework\TestCase;

class RiskScoringTest extends TestCase
{
    public function test_score_is_probability_times_impact(): void
    {
        $cases = [
            [1, 1, 1, 'Low'],
            [2, 3, 6, 'Medium'],
            [3, 4, 12, 'High'],
            [5, 5, 25, 'Critical'],
        ];

        foreach ($cases as [$p, $i, $expectedScore, $level]) {
            $score = $p * $i;
            $this->assertSame($expectedScore, $score);
            $actualLevel = match (true) {
                $score <= 4 => 'Low',
                $score <= 9 => 'Medium',
                $score <= 16 => 'High',
                default => 'Critical',
            };
            $this->assertSame($level, $actualLevel);
        }
    }
}
