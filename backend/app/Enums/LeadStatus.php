<?php

namespace App\Enums;

enum LeadStatus: string
{
    case NEW = 'new';
    case CONTACTED = 'contacted';
    case QUALIFIED = 'qualified';
    case PROPOSAL = 'proposal';
    case WON = 'won';
    case LOST = 'lost';

    /**
     * Pipeline order for board columns and sorting.
     *
     * @return list<string>
     */
    public static function pipeline(): array
    {
        return [
            self::NEW->value,
            self::CONTACTED->value,
            self::QUALIFIED->value,
            self::PROPOSAL->value,
            self::WON->value,
            self::LOST->value,
        ];
    }

    public function isClosed(): bool
    {
        return in_array($this, [self::WON, self::LOST], true);
    }
}
