<?php

namespace App\Domains\Payments\Enums;

enum PayoutStatus: string
{
    case PENDING = 'pending';
    case PAID = 'paid';
    case CANCELLED = 'cancelled';
}
