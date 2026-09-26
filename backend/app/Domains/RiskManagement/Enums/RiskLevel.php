<?php

namespace App\Domains\RiskManagement\Enums;

enum RiskLevel: string
{
    case LOW = 'low';
    case MEDIUM = 'medium';
    case HIGH = 'high';
    case CRITICAL = 'critical';

    public static function fromScore(int $score): self
    {
        return match (true) {
            $score <= 4 => self::LOW,
            $score <= 9 => self::MEDIUM,
            $score <= 16 => self::HIGH,
            default => self::CRITICAL,
        };
    }
}
