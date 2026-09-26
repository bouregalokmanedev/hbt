<?php

namespace App\Domains\Support\Enums;

enum TicketPriority: string
{
    case LOW = 'low';
    case NORMAL = 'normal';
    case HIGH = 'high';
    case URGENT = 'urgent';

    public function slaHours(): int
    {
        return match ($this) {
            self::LOW => 168,
            self::NORMAL => 72,
            self::HIGH => 24,
            self::URGENT => 4,
        };
    }
}
