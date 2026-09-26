<?php

namespace App\Domains\Payments\Enums;

enum PurchaseStatus: string
{
    case PENDING = 'pending';
    case COMPLETED = 'completed';
    case REFUNDED = 'refunded';
    case CANCELLED = 'cancelled';
}
